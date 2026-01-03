import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Transform detail data from AION2 API to standardized format
 * Actual API response structure: { mainStats, subStats, magicStoneStat, godStoneStat, sources }
 */
function transformDetailData(detailData: any) {
    if (!detailData) return null

    const result: any = {
        options: [],
        randomOptions: [],
        manastones: [],
        godstones: [],
        arcanas: [],
        setEffects: [],
        source: null,
        _raw: detailData
    }

    // 1. Main Stats (기본 옵션) - 공격력, 명중, 치명타 등
    if (detailData.mainStats && Array.isArray(detailData.mainStats)) {
        result.options = detailData.mainStats.map((stat: any) => ({
            name: stat.name,
            value: stat.value + (stat.extra && stat.extra !== '0' ? ` (+${stat.extra})` : '')
        }))
    }

    // 2. Sub Stats (랜덤 옵션) - 전투 속도, 무기 피해 증폭 등
    if (detailData.subStats && Array.isArray(detailData.subStats)) {
        result.randomOptions = detailData.subStats.map((stat: any) => ({
            name: stat.name,
            value: stat.value
        }))
    }

    // 3. Magic Stones (마석)
    if (detailData.magicStoneStat && Array.isArray(detailData.magicStoneStat)) {
        result.manastones = detailData.magicStoneStat.map((stone: any) => ({
            type: stone.name,
            value: stone.value,
            grade: stone.grade,
            icon: stone.icon
        }))
    }

    // 4. God Stones (신석)
    if (detailData.godStoneStat && Array.isArray(detailData.godStoneStat)) {
        result.godstones = detailData.godStoneStat.map((stone: any) => ({
            name: stone.name,
            desc: stone.desc,
            grade: stone.grade,
            icon: stone.icon
        }))
    }

    // 5. Arcanas (아르카나) - subSkills에서 가져옴
    if (detailData.subSkills && Array.isArray(detailData.subSkills)) {
        console.log('[API] 📦 Processing subSkills (arcana skills):', detailData.subSkills)
        result.arcanas = detailData.subSkills.map((skill: any) => ({
            id: skill.id,
            name: skill.name,
            level: skill.level,
            icon: skill.icon,
            _raw: skill
        }))
    }

    // Also check arcanaStat (for equipment with arcana stones)
    if (detailData.arcanaStat && Array.isArray(detailData.arcanaStat)) {
        console.log('[API] 📦 Processing arcanaStat:', detailData.arcanaStat)
        if (!result.arcanas) result.arcanas = []
        result.arcanas.push(...detailData.arcanaStat.map((arcana: any) => ({
            name: arcana.name,
            desc: arcana.desc,
            grade: arcana.grade,
            icon: arcana.icon,
            value: arcana.value,
            ...arcana
        })))
    }

    // 6. Sources (획득처)
    if (detailData.sources && Array.isArray(detailData.sources)) {
        result.source = detailData.sources.join(', ')
    }

    // 7. Set Effects (세트 효과)
    if (detailData.set && detailData.set.bonuses) {
        result.setEffects = [{
            name: detailData.set.name || '세트 효과',
            equippedCount: detailData.set.equippedCount,
            bonuses: detailData.set.bonuses,
            items: detailData.set.items
        }]
    } else if (detailData.setEffects && Array.isArray(detailData.setEffects)) {
        result.setEffects = detailData.setEffects
    }

    return result
}

function calculateNoaScore(stats: any, className: string) {
    if (!stats) return 0;

    // Basic mapping - logic can be refined based on class
    // Currently using the general formula provided
    const attack = stats.attack_phy || stats.attack || 0;
    const magicBoost = stats.boost_mag || stats.magicBoost || 0;
    const crit = stats.crit_phy || stats.crit || 0;
    const accuracy = stats.accuracy_phy || stats.accuracy || 0;
    const magicAccuracy = stats.accuracy_mag || 0;

    // differentiate slightly by class type if needed, but for now using unified weighted sum
    // prioritizing primary stats
    let score = 0;

    // Physical classes
    if (['Gladiator', 'Templar', 'Ranger', 'Assassin', 'Chanter'].includes(className)) {
        score = (attack * 1.5) + (crit * 1.0) + (accuracy * 0.8) + (magicBoost * 0.2);
    }
    // Magical classes
    else if (['Sorcerer', 'Spiritmaster', 'Cleric'].includes(className)) {
        score = (magicBoost * 1.4) + (magicAccuracy * 1.0) + (crit * 0.5) + (attack * 0.2);
    }
    // Fallback / Hybrid
    else {
        score = (attack * 1.0) + (magicBoost * 1.0) + (crit * 0.8) + (accuracy * 0.8);
    }

    return Math.floor(score);
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const characterId = searchParams.get('id')
    const serverId = searchParams.get('server')

    if (!characterId || !serverId) {
        return NextResponse.json({ error: 'Missing characterId or serverId' }, { status: 400 })
    }

    try {
        console.log(`[API] Fetching data for ${characterId} / ${serverId}`)

        // Common headers to look like a browser
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://aion2.plaync.com/',
            'Accept': 'application/json'
        }

        // 1. Fetch Basic Info & Equipment List in Parallel
        const infoUrl = `https://aion2.plaync.com/api/character/info?lang=ko&characterId=${encodeURIComponent(characterId)}&serverId=${serverId}`
        const equipUrl = `https://aion2.plaync.com/api/character/equipment?lang=ko&characterId=${encodeURIComponent(characterId)}&serverId=${serverId}`

        const [infoRes, equipRes] = await Promise.all([
            fetch(infoUrl, { headers }),
            fetch(equipUrl, { headers })
        ])

        if (!infoRes.ok || !equipRes.ok) {
            console.error(`[API] Basic fetch failed. Info: ${infoRes.status}, Equip: ${equipRes.status}`)
            throw new Error('Failed to fetch from AION API')
        }

        const infoData = await infoRes.json()
        const equipData = await equipRes.json()

        // 2. Fetch Detailed Info for EACH item in parallel
        let enrichedEquipmentList: any[] = []

        if (equipData.equipment && equipData.equipment.equipmentList) {
            // Check if equipment data already contains detailed info
            const firstItem = equipData.equipment.equipmentList[0]
            if (firstItem) {
                // console.log('[API] Available fields in item:', Object.keys(firstItem))
            }

            // Fetch detail for each item using the correct /item endpoint
            console.log(`[API] Fetching details for ${equipData.equipment.equipmentList.length} items using /item endpoint...`)

            enrichedEquipmentList = await Promise.all(
                equipData.equipment.equipmentList.map(async (item: any) => {
                    try {
                        // Use the correct endpoint: /api/character/equipment/item
                        const itemId = item.id || item.itemId
                        if (!itemId) {
                            console.warn('[API] Item ID missing for slot', item.slotPos)
                            return { ...item, detail: null }
                        }

                        // Correct endpoint and parameters
                        const detailUrl = `https://aion2.plaync.com/api/character/equipment/item?id=${encodeURIComponent(itemId)}&enchantLevel=${item.enchantLevel || 0}&characterId=${encodeURIComponent(characterId)}&serverId=${serverId}&slotPos=${item.slotPos}&lang=ko`

                        const detailRes = await fetch(detailUrl, { headers })

                        if (!detailRes.ok) {
                            console.warn(`[API] Detail fetch failed for item ${itemId}: ${detailRes.status}`)
                            return { ...item, detail: null }
                        }

                        const detailData = await detailRes.json()

                        // Log first item for debugging
                        if (item.slotPos === 1) {
                            console.log('[API] ✅ Sample Detail Response:', JSON.stringify(detailData, null, 2))
                        }

                        // Log arcana items (slotPos 41-45)
                        if (item.slotPos >= 41 && item.slotPos <= 45) {
                            console.log(`[API] 🔮 Arcana Detail (slotPos ${item.slotPos}):`, JSON.stringify(detailData, null, 2))
                        }

                        // Transform detail to standardized format
                        const transformedDetail = transformDetailData(detailData)

                        return { ...item, detail: transformedDetail }
                    } catch (e) {
                        console.error(`[API] Error fetching detail for item ${item.id}:`, e)
                        return { ...item, detail: null }
                    }
                })
            )
        }

        // Calculate NOA Score
        const noaScore = calculateNoaScore(infoData.stat, infoData.profile.className);

        // 3. Construct Final Response
        const finalData = {
            profile: { ...infoData.profile, noa_score: noaScore }, // Inject score into profile for frontend convenience
            stats: infoData.stat,
            titles: infoData.title,
            rankings: infoData.ranking,
            daevanion: infoData.daevanion,
            equipment: {
                ...equipData.equipment,
                equipmentList: enrichedEquipmentList
            },
            skill: equipData.skill,
            petwing: equipData.petwing,
            scraped_at: new Date().toISOString()
        }

        // 4. DB Upsert (Synchronizing with Supabase)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey)

            const dbCharacter = {
                character_id: infoData.profile.characterId,
                server_id: parseInt(infoData.profile.serverId || '0'),
                name: infoData.profile.characterName,
                level: infoData.profile.characterLevel,
                item_level: infoData.profile.jobLevel || 0,
                class_name: infoData.profile.className,
                race_name: infoData.profile.raceName,
                combat_power: infoData.stat?.combat_power || 0, // Ensure this maps correctly
                noa_score: noaScore,
                ranking_ap: 0, // Placeholder, need to map from infoData if available
                ranking_gp: 0, // Placeholder
                profile_image: infoData.profile.profileImage,

                profile: infoData.profile,
                stats: infoData.stat,
                titles: infoData.title,
                rankings: infoData.ranking,
                daevanion: infoData.daevanion,
                equipment: finalData.equipment,
                skills: equipData.skill,
                pet_wing: equipData.petwing,

                scraped_at: new Date().toISOString()
            }

            const { error: upsertError } = await supabase
                .from('characters')
                .upsert(dbCharacter, { onConflict: 'character_id' })

            if (upsertError) {
                console.error('[Supabase] Upsert error:', upsertError)
            } else {
                console.log(`[Supabase] Successfully saved character ${infoData.profile.characterName}`)
            }
        } else {
            // console.warn('[Supabase] Credentials missing, skipping DB save')
        }

        return NextResponse.json(finalData)

    } catch (err: any) {
        console.error('[API Error]', err)
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
    }
}
