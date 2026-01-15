import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('Supabase configuration missing')
    }
    supabase = createClient(url, key)
  }
  return supabase
}

// 사용자 인증 헬퍼 함수
// 주의: Google 로그인은 현재 비활성화 - device_id 우선 사용
async function getUserFromRequest(request: Request) {
  const db = getSupabase()
  const deviceIdHeader = request.headers.get('x-device-id') || request.headers.get('X-Device-ID')
  const authHeader = request.headers.get('authorization')

  // 1. device_id 우선 사용
  if (deviceIdHeader) {
    const { data } = await db
      .from('ledger_users')
      .select('id')
      .eq('device_id', deviceIdHeader)
      .single()
    return data
  }

  // 2. Bearer 토큰 폴백
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const { data: { user }, error } = await db.auth.getUser(token)
    if (user && !error) {
      const { data } = await db
        .from('ledger_users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      return data
    }
  }

  return null
}

// GET: 캐릭터의 현재 상태 조회
export async function GET(request: NextRequest) {
  try {
    const db = getSupabase()
    const { searchParams } = new URL(request.url)
    const characterId = searchParams.get('characterId')

    const userData = await getUserFromRequest(request)
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
    const userData = await getUserFromRequest(request)
    if (!userData?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      characterId,
      baseTickets,
      bonusTickets,
      odEnergy,
      lastChargeTime,
      lastSanctuaryChargeTime
    } = body

    if (!characterId) {
      return NextResponse.json({ error: 'Character ID is required' }, { status: 400 })
    }

    // UPSERT (있으면 업데이트, 없으면 생성)
    const { data, error } = await db
      .from('ledger_character_state')
      .upsert({
        user_id: userData.id,
        character_id: characterId,
        base_tickets: baseTickets,
        bonus_tickets: bonusTickets,
        od_time_energy: odEnergy.timeEnergy,
        od_ticket_energy: odEnergy.ticketEnergy,
        od_last_charge_time: odEnergy.lastChargeTime,
        last_charge_time: lastChargeTime,
        last_sanctuary_charge_time: lastSanctuaryChargeTime
      }, {
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
