import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * 실제 게임 데이터에서 마석/신석 목록을 수집하는 API
 * Supabase characters 테이블의 장비 데이터에서 추출
 */

interface ManastoneData {
  type: string
  values: number[]
  count: number
}

interface GodstoneData {
  name: string
  desc?: string
  grade?: string
  icon?: string
  count: number
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 최근 수집된 캐릭터 데이터에서 마석/신석 정보 추출 (100개로 제한하여 속도 개선)
    const { data: characters, error } = await supabase
      .from('characters')
      .select('equipment')
      .not('equipment', 'is', null)
      .order('scraped_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[Stones API] DB error:', error)
      throw error
    }

    // 마석 데이터 수집
    const manastoneMap = new Map<string, Set<number>>()
    const manastoneCount = new Map<string, number>()

    // 신석 데이터 수집
    const godstoneMap = new Map<string, GodstoneData>()

    for (const char of characters || []) {
      const equipmentList = char.equipment?.equipmentList || []

      for (const item of equipmentList) {
        // 마석 추출 (detail.manastones 또는 detail._raw.magicStoneStat)
        const manastones = item.detail?.manastones || []
        const rawManastones = item.detail?._raw?.magicStoneStat || []

        // 변환된 마석
        for (const stone of manastones) {
          const type = stone.type || stone.name
          if (!type) continue

          const value = typeof stone.value === 'string'
            ? parseInt(stone.value.replace(/[^0-9-]/g, ''))
            : stone.value

          if (!manastoneMap.has(type)) {
            manastoneMap.set(type, new Set())
            manastoneCount.set(type, 0)
          }
          if (value && !isNaN(value)) {
            manastoneMap.get(type)!.add(Math.abs(value))
          }
          manastoneCount.set(type, (manastoneCount.get(type) || 0) + 1)
        }

        // 원본 마석
        for (const stone of rawManastones) {
          const type = stone.name || stone.type
          if (!type) continue

          const value = typeof stone.value === 'string'
            ? parseInt(stone.value.replace(/[^0-9-]/g, ''))
            : stone.value

          if (!manastoneMap.has(type)) {
            manastoneMap.set(type, new Set())
            manastoneCount.set(type, 0)
          }
          if (value && !isNaN(value)) {
            manastoneMap.get(type)!.add(Math.abs(value))
          }
          manastoneCount.set(type, (manastoneCount.get(type) || 0) + 1)
        }

        // 신석 추출 (무기만 - slotPos 1, 2)
        if (item.slotPos === 1 || item.slotPos === 2) {
          const godstones = item.detail?.godstones || []
          const rawGodstones = item.detail?._raw?.godStoneStat || []

          for (const stone of [...godstones, ...rawGodstones]) {
            if (!stone.name) continue

            if (!godstoneMap.has(stone.name)) {
              godstoneMap.set(stone.name, {
                name: stone.name,
                desc: stone.desc,
                grade: stone.grade,
                icon: stone.icon,
                count: 0
              })
            }
            const existing = godstoneMap.get(stone.name)!
            existing.count++
            // 추가 정보 업데이트
            if (stone.desc && !existing.desc) existing.desc = stone.desc
            if (stone.grade && !existing.grade) existing.grade = stone.grade
            if (stone.icon && !existing.icon) existing.icon = stone.icon
          }
        }
      }
    }

    // 마석 데이터 정리 (사용 빈도순 정렬)
    const manastones: ManastoneData[] = Array.from(manastoneMap.entries())
      .map(([type, values]) => ({
        type,
        values: Array.from(values).sort((a, b) => a - b),
        count: manastoneCount.get(type) || 0
      }))
      .sort((a, b) => b.count - a.count)

    // 신석 데이터 정리 (사용 빈도순 정렬)
    const godstones: GodstoneData[] = Array.from(godstoneMap.values())
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      manastones,
      godstones,
      meta: {
        totalCharacters: characters?.length || 0,
        manastoneTypes: manastones.length,
        godstoneTypes: godstones.length
      }
    })

  } catch (err: any) {
    console.error('[Stones API Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
