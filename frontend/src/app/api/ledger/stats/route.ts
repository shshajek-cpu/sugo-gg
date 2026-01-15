import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 생성
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
    console.error('[Stats API] Failed to create user:', error)
    return null
  }

  return newUser
}

// 인증된 유저 또는 device_id 유저 조회
async function getUserFromRequest(request: NextRequest) {
  const supabase = getSupabase()

  // 1. device_id로 먼저 조회 (우선순위)
  const device_id = request.headers.get('X-Device-ID') || request.headers.get('x-device-id')
  if (device_id) {
    return getOrCreateUserByDeviceId(device_id)
  }

  // 2. Bearer 토큰으로 인증 확인 (폴백)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (user && !error) {
      const { data: ledgerUser } = await supabase
        .from('ledger_users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (ledgerUser) return ledgerUser
    }
  }

  return null
}

// 캐릭터 소유권 검증
async function verifyCharacterOwnership(characterId: string, userId: string): Promise<boolean> {
  const supabase = getSupabase()
  const { data: character } = await supabase
    .from('ledger_characters')
    .select('user_id')
    .eq('id', characterId)
    .single()

  if (!character) return false
  return character.user_id === userId
}

// GET: 통계 조회
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const characterId = searchParams.get('characterId')
  const type = searchParams.get('type') // 'daily', 'weekly', 'monthly', 'summary'
  const date = searchParams.get('date') // 기준 날짜

  if (!characterId) {
    return NextResponse.json({ error: 'Missing characterId' }, { status: 400 })
  }

  // 캐릭터 소유권 검증
  const isOwner = await verifyCharacterOwnership(characterId, user.id)
  if (!isOwner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const today = date || new Date().toISOString().split('T')[0]

  try {
    if (type === 'daily') {
      return await getDailyStats(characterId, today)
    } else if (type === 'weekly') {
      return await getWeeklyStats(characterId, today)
    } else if (type === 'monthly') {
      return await getMonthlyStats(characterId, today)
    } else {
      return await getSummaryStats(characterId, today)
    }
  } catch (e: any) {
    console.error('Get stats error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function getDailyStats(characterId: string, date: string) {
  const supabase = getSupabase()

  // 컨텐츠 수입
  const { data: contentRecords } = await supabase
    .from('ledger_content_records')
    .select('total_kina')
    .eq('ledger_character_id', characterId)
    .eq('record_date', date)

  const contentIncome = contentRecords?.reduce((sum, r) => sum + (r.total_kina || 0), 0) || 0

  // 아이템 판매 수입 (해당 날짜에 판매된 것)
  const { data: soldItems } = await supabase
    .from('ledger_items')
    .select('sold_price')
    .eq('ledger_character_id', characterId)
    .not('sold_price', 'is', null)
    .gte('updated_at', `${date}T00:00:00`)
    .lt('updated_at', `${date}T23:59:59`)

  const itemIncome = soldItems?.reduce((sum, i) => sum + (i.sold_price || 0), 0) || 0

  return NextResponse.json({
    date,
    contentIncome,
    itemIncome,
    totalIncome: contentIncome + itemIncome
  })
}

async function getWeeklyStats(characterId: string, date: string) {
  const supabase = getSupabase()

  // 주의 시작일 계산 (월요일 기준)
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 월요일로 조정
  const startDate = new Date(d.setDate(diff)).toISOString().split('T')[0]
  const endDate = new Date(d.setDate(d.getDate() + 6)).toISOString().split('T')[0]

  // 주간 컨텐츠 수입
  const { data: contentRecords } = await supabase
    .from('ledger_content_records')
    .select('record_date, total_kina')
    .eq('ledger_character_id', characterId)
    .gte('record_date', startDate)
    .lte('record_date', endDate)

  // 주간 아이템 판매 수입
  const { data: soldItems } = await supabase
    .from('ledger_items')
    .select('sold_price, updated_at')
    .eq('ledger_character_id', characterId)
    .not('sold_price', 'is', null)
    .gte('updated_at', `${startDate}T00:00:00`)
    .lte('updated_at', `${endDate}T23:59:59`)

  // 일별 데이터 집계
  const dailyMap = new Map<string, { contentIncome: number; itemIncome: number }>()

  // 7일간의 빈 데이터 초기화
  for (let i = 0; i < 7; i++) {
    const dateKey = new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]
    dailyMap.set(dateKey, { contentIncome: 0, itemIncome: 0 })
  }

  // 컨텐츠 수입 집계
  contentRecords?.forEach(r => {
    const existing = dailyMap.get(r.record_date)
    if (existing) {
      existing.contentIncome += r.total_kina || 0
    }
  })

  // 아이템 판매 수입 집계
  soldItems?.forEach(i => {
    const itemDate = i.updated_at.split('T')[0]
    const existing = dailyMap.get(itemDate)
    if (existing) {
      existing.itemIncome += i.sold_price || 0
    }
  })

  // 결과 정리
  const dailyData = Array.from(dailyMap.entries()).map(([dateKey, data]) => ({
    date: dateKey,
    contentIncome: data.contentIncome,
    itemIncome: data.itemIncome,
    totalIncome: data.contentIncome + data.itemIncome
  }))

  const totalIncome = dailyData.reduce((sum, d) => sum + d.totalIncome, 0)
  const averageIncome = Math.round(totalIncome / 7)
  const bestDay = dailyData.reduce((best, d) =>
    d.totalIncome > best.income ? { date: d.date, income: d.totalIncome } : best
  , { date: '', income: 0 })

  return NextResponse.json({
    startDate,
    endDate,
    dailyData,
    totalIncome,
    averageIncome,
    bestDay
  })
}

async function getMonthlyStats(characterId: string, date: string) {
  const supabase = getSupabase()

  // 이번 달 시작일과 끝일 계산
  const d = new Date(date)
  const startDate = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]

  // 월간 컨텐츠 수입
  const { data: contentRecords } = await supabase
    .from('ledger_content_records')
    .select('record_date, total_kina')
    .eq('ledger_character_id', characterId)
    .gte('record_date', startDate)
    .lte('record_date', endDate)

  // 월간 아이템 판매 수입
  const { data: soldItems } = await supabase
    .from('ledger_items')
    .select('sold_price, updated_at')
    .eq('ledger_character_id', characterId)
    .not('sold_price', 'is', null)
    .gte('updated_at', `${startDate}T00:00:00`)
    .lte('updated_at', `${endDate}T23:59:59`)

  // 일별 데이터 집계
  const dailyMap = new Map<string, { contentIncome: number; itemIncome: number }>()

  // 해당 월의 모든 날짜 초기화
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  for (let i = 1; i <= daysInMonth; i++) {
    const dateKey = new Date(d.getFullYear(), d.getMonth(), i).toISOString().split('T')[0]
    dailyMap.set(dateKey, { contentIncome: 0, itemIncome: 0 })
  }

  // 컨텐츠 수입 집계
  contentRecords?.forEach(r => {
    const existing = dailyMap.get(r.record_date)
    if (existing) {
      existing.contentIncome += r.total_kina || 0
    }
  })

  // 아이템 판매 수입 집계
  soldItems?.forEach(i => {
    const itemDate = i.updated_at.split('T')[0]
    const existing = dailyMap.get(itemDate)
    if (existing) {
      existing.itemIncome += i.sold_price || 0
    }
  })

  // 결과 정리
  const dailyData = Array.from(dailyMap.entries()).map(([dateKey, data]) => ({
    date: dateKey,
    contentIncome: data.contentIncome,
    itemIncome: data.itemIncome,
    totalIncome: data.contentIncome + data.itemIncome
  }))

  const totalIncome = dailyData.reduce((sum, d) => sum + d.totalIncome, 0)
  const activeDays = dailyData.filter(d => d.totalIncome > 0).length
  const averageIncome = activeDays > 0 ? Math.round(totalIncome / activeDays) : 0
  const bestDay = dailyData.reduce((best, d) =>
    d.totalIncome > best.income ? { date: d.date, income: d.totalIncome } : best
  , { date: '', income: 0 })

  return NextResponse.json({
    startDate,
    endDate,
    dailyData,
    totalIncome,
    averageIncome,
    activeDays,
    bestDay
  })
}

async function getSummaryStats(characterId: string, today: string) {
  const supabase = getSupabase()

  // 오늘 수입
  const dailyResult = await getDailyStats(characterId, today)
  const dailyData = await dailyResult.json()

  // 주간 수입
  const weeklyResult = await getWeeklyStats(characterId, today)
  const weeklyData = await weeklyResult.json()

  // 월간 수입
  const monthlyResult = await getMonthlyStats(characterId, today)
  const monthlyData = await monthlyResult.json()

  // 미판매 아이템 수
  const { data: unsoldItems } = await supabase
    .from('ledger_items')
    .select('item_grade')
    .eq('ledger_character_id', characterId)
    .is('sold_price', null)

  const unsoldItemsByGrade = {
    common: 0,
    rare: 0,
    heroic: 0,
    legendary: 0,
    ultimate: 0
  }

  unsoldItems?.forEach(item => {
    const grade = item.item_grade as keyof typeof unsoldItemsByGrade
    if (grade in unsoldItemsByGrade) {
      unsoldItemsByGrade[grade]++
    }
  })

  return NextResponse.json({
    todayIncome: dailyData.totalIncome,
    weeklyIncome: weeklyData.totalIncome,
    monthlyIncome: monthlyData.totalIncome,
    unsoldItemCount: unsoldItems?.length || 0,
    unsoldItemsByGrade
  })
}
