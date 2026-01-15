import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mnbngmdjiszyowfvnzhk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uYm5nbWRqaXN6eW93ZnZuemhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5OTY0ODAsImV4cCI6MjA4MjU3MjQ4MH0.AIvvGxd_iQKpQDbmOBoe4yAmii1IpB92Pp7Scs8Lz7U'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
  return createClient(supabaseUrl, supabaseKey)
}

// 유저 조회 또는 자동 생성 (device_id용)
async function getOrCreateUserByDeviceId(device_id: string) {
  const supabase = getSupabase()
  const { data: existingUser } = await supabase
    .from('ledger_users')
    .select('id')
    .eq('device_id', device_id)
    .single()

  if (existingUser) return existingUser

  const { data: newUser, error } = await supabase
    .from('ledger_users')
    .insert({ device_id })
    .select('id')
    .single()

  if (error) {
    console.error('[API] Failed to create user:', error)
    return null
  }

  return newUser
}

// 인증된 유저 또는 device_id 유저 조회
async function getUserFromRequest(request: Request) {
  const supabase = getSupabase()

  // 1. device_id 우선 사용
  const device_id = request.headers.get('x-device-id')
  if (device_id) {
    return getOrCreateUserByDeviceId(device_id)
  }

  // 2. Bearer 토큰으로 인증 확인 (폴백)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (user && !error) {
      let { data: ledgerUser } = await supabase
        .from('ledger_users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!ledgerUser) {
        const { data: newLedgerUser } = await supabase
          .from('ledger_users')
          .insert({
            auth_user_id: user.id,
            created_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString()
          })
          .select('id')
          .single()

        ledgerUser = newLedgerUser
      }

      if (ledgerUser) return ledgerUser
    }
  }

  return null
}

// GET: 주간 컨텐츠 데이터 조회
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const characterId = searchParams.get('characterId')
  const weekKey = searchParams.get('weekKey')
  const gameDate = searchParams.get('gameDate') // 사명용 (일일)

  if (!characterId) {
    return NextResponse.json({ error: 'Missing characterId' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()

    // 캐릭터가 현재 유저 소유인지 확인
    const { data: character } = await supabase
      .from('ledger_characters')
      .select('id')
      .eq('id', characterId)
      .eq('user_id', user.id)
      .single()

    if (!character) {
      return NextResponse.json({ error: 'Character not found or access denied' }, { status: 403 })
    }

    // 주간 데이터 조회
    let weeklyData = null
    if (weekKey) {
      const { data } = await supabase
        .from('ledger_weekly_content')
        .select('*')
        .eq('character_id', characterId)
        .eq('week_key', weekKey)
        .single()
      weeklyData = data
    }

    // 일일 사명 데이터 조회 (ledger_daily_mission 테이블에서)
    let missionData = null
    if (gameDate) {
      const { data } = await supabase
        .from('ledger_daily_mission')
        .select('mission_count')
        .eq('character_id', characterId)
        .eq('game_date', gameDate)
        .single()
      missionData = data
    }

    return NextResponse.json({
      weekly: weeklyData ? {
        weeklyOrderCount: weeklyData.weekly_order_count || 0,
        abyssOrderCount: weeklyData.abyss_order_count || 0,
        shugoTickets: {
          base: weeklyData.shugo_base || 14,
          bonus: weeklyData.shugo_bonus || 0,
          lastChargeTime: weeklyData.shugo_last_charge_time || ''
        },
        abyssRegions: weeklyData.abyss_regions || [
          { id: 'ereshrantas_root', name: '에렌슈란타의 뿌리', enabled: false },
          { id: 'siels_wing', name: '시엘의 날개군도', enabled: false },
          { id: 'sulfur_tree', name: '유황나무섬', enabled: false }
        ]
      } : null,
      mission: missionData ? {
        count: missionData.mission_count || 0
      } : null
    })
  } catch (e: any) {
    console.error('[Weekly Content] Get error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST: 주간 컨텐츠 데이터 저장
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const {
      characterId,
      weekKey,
      gameDate,
      weeklyOrderCount,
      abyssOrderCount,
      shugoTickets,
      abyssRegions,
      missionCount
    } = body

    if (!characterId) {
      return NextResponse.json({ error: 'Missing characterId' }, { status: 400 })
    }

    const supabase = getSupabase()

    // 캐릭터가 현재 유저 소유인지 확인
    const { data: character } = await supabase
      .from('ledger_characters')
      .select('id')
      .eq('id', characterId)
      .eq('user_id', user.id)
      .single()

    if (!character) {
      return NextResponse.json({ error: 'Character not found or access denied' }, { status: 403 })
    }

    // 주간 데이터 저장 (weekKey가 있는 경우)
    if (weekKey) {
      const { error } = await supabase
        .from('ledger_weekly_content')
        .upsert({
          character_id: characterId,
          week_key: weekKey,
          weekly_order_count: weeklyOrderCount ?? 0,
          abyss_order_count: abyssOrderCount ?? 0,
          shugo_base: shugoTickets?.base ?? 14,
          shugo_bonus: shugoTickets?.bonus ?? 0,
          shugo_last_charge_time: shugoTickets?.lastChargeTime || null,
          abyss_regions: abyssRegions || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'character_id,week_key'
        })

      if (error) throw error
    }

    // 일일 사명 데이터 저장 (gameDate가 있는 경우)
    if (gameDate && missionCount !== undefined) {
      const { error } = await supabase
        .from('ledger_daily_mission')
        .upsert({
          character_id: characterId,
          game_date: gameDate,
          mission_count: missionCount,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'character_id,game_date'
        })

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[Weekly Content] Save error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
