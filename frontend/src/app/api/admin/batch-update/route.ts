import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Vercel serverless timeout (최대 60초)

const BATCH_SIZE = 5 // 한 번에 조회할 캐릭터 수
const DELAY_MS = 3000 // 조회 간격 (3초)

export async function GET(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        // item_level이 0이거나 null인 캐릭터 조회
        const { data: characters, error } = await supabase
            .from('characters')
            .select('character_id, server_id, name')
            .or('item_level.is.null,item_level.eq.0')
            .limit(BATCH_SIZE)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!characters || characters.length === 0) {
            return NextResponse.json({
                message: 'No characters to update',
                remaining: 0
            })
        }

        const results: { name: string; success: boolean; item_level?: number }[] = []

        // 순차적으로 상세 조회
        for (const char of characters) {
            try {
                // 외부 API에서 상세 정보 조회
                const infoUrl = `https://aion2.plaync.com/api/character/info?lang=ko&characterId=${encodeURIComponent(char.character_id)}&serverId=${char.server_id}`

                const res = await fetch(infoUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0'
                    }
                })

                if (!res.ok) {
                    results.push({ name: char.name, success: false })
                    continue
                }

                const infoData = await res.json()

                // item_level 추출
                const statList = infoData.stat?.statList || []
                const itemLevelStat = statList.find((s: any) =>
                    s.name === '아이템레벨' || s.type === 'ItemLevel'
                )
                const itemLevel = itemLevelStat?.value || 0

                // combat_power (전투력) 추출
                const combatPowerStat = statList.find((s: any) =>
                    s.name === '전투력' || s.type === 'CombatPower'
                )
                const combatPower = combatPowerStat?.value || 0

                // noa_score 계산 (HITON 전투력)
                const noaScore = Math.round(combatPower * 0.8 + itemLevel * 100)

                // DB 업데이트
                const { error: updateError } = await supabase
                    .from('characters')
                    .update({
                        item_level: itemLevel,
                        combat_power: combatPower,
                        noa_score: noaScore,
                        scraped_at: new Date().toISOString()
                    })
                    .eq('character_id', char.character_id)

                if (updateError) {
                    results.push({ name: char.name, success: false })
                } else {
                    results.push({ name: char.name, success: true, item_level: itemLevel })
                    console.log(`[Batch] Updated ${char.name}: IL=${itemLevel}, NOA=${noaScore}`)
                }

            } catch (e) {
                results.push({ name: char.name, success: false })
            }

            // Rate Limit 방지 딜레이
            await new Promise(resolve => setTimeout(resolve, DELAY_MS))
        }

        // 남은 캐릭터 수 확인
        const { count } = await supabase
            .from('characters')
            .select('*', { count: 'exact', head: true })
            .or('item_level.is.null,item_level.eq.0')

        return NextResponse.json({
            message: `Updated ${results.filter(r => r.success).length}/${characters.length} characters`,
            results,
            remaining: count || 0
        })

    } catch (err: any) {
        console.error('[Batch Error]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
