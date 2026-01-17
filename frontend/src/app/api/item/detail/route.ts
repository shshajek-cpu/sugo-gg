import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * 아이템 상세 정보 API
 * 공식 AION2 API에서 아이템의 기본옵션, 랜덤옵션 정보를 가져옴
 */

interface ItemDetailResponse {
    itemId: string
    name: string
    grade: string
    itemLevel: number
    icon: string
    options: { name: string; value: string }[]         // 기본 옵션
    randomOptions: { name: string; value: string }[]   // 랜덤 옵션
    manastoneSlots: number                              // 마석 슬롯 개수
    hasGodstoneSlot: boolean                            // 신석 슬롯 유무
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const itemId = searchParams.get('id')
    const enchantLevel = parseInt(searchParams.get('enchantLevel') || '0')
    const exceedLevel = parseInt(searchParams.get('exceedLevel') || '0')

    if (!itemId) {
        return NextResponse.json({ error: 'Missing item id' }, { status: 400 })
    }

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://aion2.plaync.com/',
        'Accept': 'application/json'
    }

    try {
        // 공식 API 엔드포인트 (아이템 상세 정보)
        // 형식: item_{아이템ID}_{강화}_{돌파}
        const detailId = `item_${itemId}_${enchantLevel}_${exceedLevel}`

        // 여러 엔드포인트 시도
        const endpoints = [
            `https://aion2.plaync.com/api/info/item?detail=${detailId}&lang=ko`,
            `https://aion2.plaync.com/api/info/item/detail?id=${itemId}&enchantLevel=${enchantLevel}&exceedLevel=${exceedLevel}&lang=ko`,
            `https://aion2.plaync.com/api/item?id=${itemId}&enchant=${enchantLevel}&exceed=${exceedLevel}&lang=ko`,
        ]

        for (const url of endpoints) {
            try {
                console.log(`[Item Detail] Trying: ${url}`)
                const response = await fetch(url, {
                    headers,
                    signal: AbortSignal.timeout(5000)
                })

                if (response.ok) {
                    const data = await response.json()
                    console.log('[Item Detail] Success:', url)

                    // 응답 데이터 변환
                    const result = transformItemDetail(data, itemId)
                    if (result) {
                        return NextResponse.json(result)
                    }
                }
            } catch (err) {
                console.log(`[Item Detail] Failed: ${url}`)
                continue
            }
        }

        // 모든 엔드포인트 실패 시 기본 응답
        return NextResponse.json({
            itemId,
            name: '',
            grade: '',
            itemLevel: 0,
            icon: '',
            options: [],
            randomOptions: [],
            manastoneSlots: getDefaultManastoneSlots(itemId),
            hasGodstoneSlot: isWeapon(itemId),
        })

    } catch (err: any) {
        console.error('[Item Detail API Error]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// API 응답을 표준 형식으로 변환
function transformItemDetail(data: any, itemId: string): ItemDetailResponse | null {
    try {
        const options: { name: string; value: string }[] = []
        const randomOptions: { name: string; value: string }[] = []

        // mainStats (기본 옵션)
        if (data.mainStats && Array.isArray(data.mainStats)) {
            for (const stat of data.mainStats) {
                options.push({
                    name: stat.name,
                    value: stat.extra && stat.extra !== '0'
                        ? `${stat.value} (+${stat.extra})`
                        : String(stat.value)
                })
            }
        }

        // subStats (랜덤 옵션)
        if (data.subStats && Array.isArray(data.subStats)) {
            for (const stat of data.subStats) {
                randomOptions.push({
                    name: stat.name,
                    value: String(stat.value)
                })
            }
        }

        // 마석 슬롯 개수 추정
        let manastoneSlots = 0
        if (data.magicStoneStat && Array.isArray(data.magicStoneStat)) {
            // 장착된 마석 기반으로 슬롯 개수 추정
            manastoneSlots = data.magicStoneStat.length
        } else {
            manastoneSlots = getDefaultManastoneSlots(itemId)
        }

        // 신석 슬롯 유무
        const hasGodstoneSlot = data.godStoneStat && Array.isArray(data.godStoneStat) && data.godStoneStat.length > 0

        return {
            itemId,
            name: data.name || '',
            grade: data.grade || '',
            itemLevel: data.itemLevel || 0,
            icon: data.icon || '',
            options,
            randomOptions,
            manastoneSlots: Math.max(manastoneSlots, getDefaultManastoneSlots(itemId)),
            hasGodstoneSlot: hasGodstoneSlot || isWeapon(itemId),
        }
    } catch (err) {
        console.error('[transformItemDetail] Error:', err)
        return null
    }
}

// 아이템 ID로 기본 마석 슬롯 개수 추정
function getDefaultManastoneSlots(itemId: string): number {
    // 일반적으로 장비는 6개, 장신구는 2-3개
    // 아이템 ID 패턴으로 추정
    const idNum = parseInt(itemId.replace(/\D/g, ''))

    // 무기 (10XXXXXX) - 6슬롯
    if (idNum >= 100000000 && idNum < 120000000) return 6
    // 방어구 (12XXXXXX ~ 18XXXXXX) - 6슬롯
    if (idNum >= 120000000 && idNum < 190000000) return 6
    // 장신구 - 2슬롯
    return 2
}

// 무기 여부 확인 (신석 장착 가능)
function isWeapon(itemId: string): boolean {
    const idNum = parseInt(itemId.replace(/\D/g, ''))
    // 무기 ID 범위 (추정)
    return idNum >= 100000000 && idNum < 120000000
}
