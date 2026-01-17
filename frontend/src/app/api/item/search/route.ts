import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SLOT_POS_MAP } from '@/types/item'

export const dynamic = 'force-dynamic'

// 공식 AION2 API 아이템 검색 시도 (추정 엔드포인트)
async function searchOfficialAPI(keyword: string, category?: string, grade?: string, page: number = 1) {
    const possibleEndpoints = [
        'https://aion2.plaync.com/api/info/item/search',
        'https://aion2.plaync.com/ko-kr/api/info/item/search',
        'https://aion2.plaync.com/api/item/search',
    ]

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://aion2.plaync.com/',
        'Accept': 'application/json'
    }

    for (const baseUrl of possibleEndpoints) {
        try {
            const url = new URL(baseUrl)
            if (keyword) url.searchParams.append('keyword', keyword)
            if (category) url.searchParams.append('category', category)
            if (grade) url.searchParams.append('grade', grade)
            url.searchParams.append('page', page.toString())
            url.searchParams.append('size', '20')
            url.searchParams.append('lang', 'ko')

            const response = await fetch(url.toString(), {
                headers,
                signal: AbortSignal.timeout(5000)
            })

            if (response.ok) {
                const data = await response.json()
                if (data && (data.list || data.items || data.data)) {
                    console.log('[Item Search] Official API success:', baseUrl)
                    return { success: true, data, endpoint: baseUrl }
                }
            }
        } catch (err) {
            // 다음 엔드포인트 시도
            continue
        }
    }

    return { success: false, data: null }
}

// 로컬 DB에서 아이템 검색
async function searchLocalDB(
    supabase: any,
    keyword: string,
    slotPos?: number,
    grade?: string,
    limit: number = 30
) {
    // items 테이블에서 검색
    let query = supabase
        .from('items')
        .select('*')

    if (keyword) {
        query = query.ilike('name', `%${keyword}%`)
    }

    if (slotPos) {
        query = query.eq('slot_pos', slotPos)
    }

    if (grade) {
        query = query.eq('grade', grade)
    }

    query = query.order('item_level', { ascending: false }).limit(limit)

    const { data, error } = await query

    if (error) {
        console.error('[Item Search] Local DB error:', error)
        return []
    }

    return (data || []).map((item: any) => {
        // DB에 100배로 저장된 경우 정규화 (예: 9800 → 98)
        const rawLevel = Number(item.item_level) || 0
        const itemLevel = rawLevel > 200 ? Math.floor(rawLevel / 100) : rawLevel

        return {
            itemId: item.item_id,
            name: item.name,
            categoryName: item.category_name,
            grade: item.grade,
            itemLevel,
            icon: item.icon,
            slotPos: item.slot_pos,
            slotName: SLOT_POS_MAP[item.slot_pos] || '기타',
            attack: item.attack || 0,
            defense: item.defense || 0,
            hp: item.hp || 0,
        }
    })
}

// 캐릭터 장비에서 아이템 검색 (items 테이블이 비어있을 경우)
async function searchFromEquipment(
    supabase: any,
    keyword: string,
    slotPos?: number,
    limit: number = 30
) {
    try {
        // characters 테이블에서 장비 JSON 추출 (최근 100개만 - 속도 개선)
        const { data: characters, error } = await supabase
            .from('characters')
            .select('equipment')
            .not('equipment', 'is', null)
            .order('scraped_at', { ascending: false })
            .limit(100)

        if (error || !characters) {
            console.error('[searchFromEquipment] DB error:', error)
            return []
        }

        // 중복 제거를 위한 Map
        const itemMap = new Map<string, any>()

        for (const char of characters as any[]) {
            const equipmentList = char.equipment?.equipmentList || []

            for (const item of equipmentList) {
                if (!item.id || !item.name) continue

                // 키워드 필터
                if (keyword && !item.name.toLowerCase().includes(keyword.toLowerCase())) continue

                // 슬롯 필터
                if (slotPos && item.slotPos !== slotPos) continue

                // 중복 체크
                if (!itemMap.has(item.id)) {
                    // 아이템레벨: detail._raw.level에서 추출 (아이템 상세 API 응답)
                    let rawItemLevel = Number(item.detail?._raw?.level) || Number(item.itemLevel) || 0
                    // DB에 100배로 저장된 경우 정규화 (예: 9800 → 98)
                    const itemLevel = rawItemLevel > 200 ? Math.floor(rawItemLevel / 100) : rawItemLevel
                    // 착용 가능 레벨: detail._raw.equipLevel에서 추출
                    const equipLevel = item.detail?._raw?.equipLevel || item.equipLevel || 0

                    // 옵션에서 (+XXX) 돌파 보너스 제거
                    const cleanOptions = (opts: any[]) => (opts || []).map((opt: any) => ({
                        name: opt.name,
                        value: String(opt.value || '').replace(/\s*\(\+[^)]*\)/g, '').trim()
                    }))

                    itemMap.set(item.id, {
                        itemId: item.id,
                        name: item.name,
                        categoryName: item.categoryName || item.detail?._raw?.categoryName,
                        grade: item.grade || 'Common',
                        itemLevel,
                        equipLevel,
                        icon: item.icon || '',
                        slotPos: item.slotPos,
                        slotName: SLOT_POS_MAP[item.slotPos] || '기타',
                        attack: item.attack || 0,
                        defense: item.defense || 0,
                        hp: item.hp || 0,
                        // 상세 옵션 정보 추가 (돌파 보너스 제거)
                        options: cleanOptions(item.detail?.options),
                        randomOptions: cleanOptions(item.detail?.randomOptions),
                        soulImprints: item.detail?.soulImprints || [],
                    })
                }
            }
        }

        // 아이템 레벨 내림차순 정렬 후 제한
        return Array.from(itemMap.values())
            .sort((a, b) => b.itemLevel - a.itemLevel)
            .slice(0, limit)
    } catch (err) {
        console.error('[searchFromEquipment] Error:', err)
        return []
    }
}

export async function GET(request: NextRequest) {
    const startTime = Date.now()
    const searchParams = request.nextUrl.searchParams

    const keyword = searchParams.get('keyword') || searchParams.get('q') || ''
    const category = searchParams.get('category')
    const slotPos = searchParams.get('slot')
    const grade = searchParams.get('grade')
    const page = parseInt(searchParams.get('page') || '1')
    // 기본값을 'local'로 변경 - 로컬 DB 우선 검색 (속도 향상)
    const source = searchParams.get('source') || 'local'

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        let results: any[] = []

        // 시뮬레이터용: 캐릭터 장비에서 검색 (옵션 정보 포함)
        if (source === 'local' || source === 'all') {
            // 캐릭터 장비에서 먼저 검색 (상세 옵션 정보 포함)
            results = await searchFromEquipment(
                supabase,
                keyword,
                slotPos ? parseInt(slotPos) : undefined
            )

            // 결과가 부족하면 items 테이블에서 추가 검색
            if (results.length < 10) {
                const dbResults = await searchLocalDB(
                    supabase,
                    keyword,
                    slotPos ? parseInt(slotPos) : undefined,
                    grade || undefined
                )
                // 중복 제거하면서 합치기
                const existingIds = new Set(results.map(r => r.itemId))
                for (const item of dbResults) {
                    if (!existingIds.has(item.itemId)) {
                        results.push(item)
                    }
                }
            }
        }

        // 공식 API는 명시적으로 요청한 경우에만 (source='official')
        if (source === 'official' && results.length === 0) {
            const officialResult = await searchOfficialAPI(keyword, category ?? undefined, grade ?? undefined, page)
            if (officialResult.success && officialResult.data) {
                const rawItems = officialResult.data.list || officialResult.data.items || officialResult.data.data || []
                results = rawItems.map((item: any) => ({
                    itemId: item.id || item.itemId,
                    name: item.name,
                    categoryName: item.categoryName || item.category,
                    grade: item.grade,
                    itemLevel: item.itemLevel || item.level,
                    icon: item.icon || item.image,
                    slotPos: item.slotPos,
                    slotName: item.slotPos ? (SLOT_POS_MAP[item.slotPos] || '기타') : ''
                }))
            }
        }

        const elapsed = Date.now() - startTime

        return NextResponse.json({
            data: results,
            meta: {
                keyword,
                category,
                slotPos,
                grade,
                page,
                total: results.length,
                source,
                elapsed: `${elapsed}ms`
            }
        })

    } catch (err: any) {
        console.error('[Item Search API Error]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
