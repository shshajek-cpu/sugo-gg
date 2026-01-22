import { NextRequest, NextResponse } from 'next/server'
import { getSupabase, getUserFromRequestWithDevice } from '../../../../lib/auth'

// getSupabase의 로컬 별칭 (db로 사용)
const db = getSupabase()

// GET: 캐릭터의 현재 상태 조회
export async function GET(request: NextRequest) {
  try {
    const db = getSupabase()
    const { searchParams } = new URL(request.url)
    const characterId = searchParams.get('characterId')

    const userData = await getUserFromRequestWithDevice(request)
    if (!userData?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!characterId) {
      return NextResponse.json({ error: 'Character ID is required' }, { status: 400 })
    }

    const { data, error } = await db
      .from('ledger_character_state')
      .select('*')
      .eq('user_id', userData.id)
      .eq('character_id', characterId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (정상적인 경우)
      throw error
    }

    // 데이터가 없으면 기본값 반환
    if (!data) {
      return NextResponse.json({
        baseTickets: {
          transcend: 14,
          expedition: 21,
          sanctuary: 4,
          daily_dungeon: 7,
          awakening: 3,
          nightmare: 14,
          dimension: 14,
          subjugation: 3
        },
        bonusTickets: {
          transcend: 0,
          expedition: 0,
          sanctuary: 0,
          daily_dungeon: 0,
          awakening: 0,
          nightmare: 0,
          dimension: 0,
          subjugation: 0
        },
        chargeSettings: {
          transcend: 1,
          expedition: 1,
          nightmare: 2,
          dimension: 1,
          shugo: 2,
          od_energy: 15
        },
        odEnergy: {
          timeEnergy: 840,
          ticketEnergy: 0,
          lastChargeTime: new Date().toISOString()
        },
        lastChargeTime: new Date().toISOString(),
        lastSanctuaryChargeTime: new Date().toISOString()
      })
    }

    // 데이터 변환
    return NextResponse.json({
      baseTickets: data.base_tickets,
      bonusTickets: data.bonus_tickets,
      chargeSettings: data.charge_settings || {
        transcend: 1,
        expedition: 1,
        nightmare: 2,
        dimension: 1,
        shugo: 2,
        od_energy: 15
      },
      odEnergy: {
        timeEnergy: data.od_time_energy,
        ticketEnergy: data.od_ticket_energy,
        lastChargeTime: data.od_last_charge_time
      },
      lastChargeTime: data.last_charge_time,
      lastSanctuaryChargeTime: data.last_sanctuary_charge_time
    })
  } catch (error: any) {
    console.error('[Character State GET] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: 캐릭터 상태 업데이트
export async function POST(request: NextRequest) {
  try {
    const db = getSupabase()
    const userData = await getUserFromRequestWithDevice(request)
    if (!userData?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      characterId,
      baseTickets,
      bonusTickets,
      chargeSettings,
      odEnergy,
      lastChargeTime,
      lastSanctuaryChargeTime
    } = body

    if (!characterId) {
      return NextResponse.json({ error: 'Character ID is required' }, { status: 400 })
    }

    // UPSERT (있으면 업데이트, 없으면 생성)
    const upsertData: any = {
      user_id: userData.id,
      character_id: characterId,
      base_tickets: baseTickets,
      bonus_tickets: bonusTickets,
      od_time_energy: odEnergy.timeEnergy,
      od_ticket_energy: odEnergy.ticketEnergy,
      od_last_charge_time: odEnergy.lastChargeTime,
      last_charge_time: lastChargeTime,
      last_sanctuary_charge_time: lastSanctuaryChargeTime
    }

    // chargeSettings가 있으면 추가
    if (chargeSettings) {
      upsertData.charge_settings = chargeSettings
    }

    const { data, error } = await db
      .from('ledger_character_state')
      .upsert(upsertData, {
        onConflict: 'user_id,character_id'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('[Character State POST] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
