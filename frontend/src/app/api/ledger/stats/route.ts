import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// GET: 통계 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const characterId = searchParams.get('characterId')
  const type = searchParams.get('type') // 'daily', 'weekly', 'summary'
  const date = searchParams.get('date') // 기준 날짜

  if (!characterId) {
    return NextResponse.json({ error: 'Missing characterId' }, { status: 400 })
  }

  const today = date || new Date().toISOString().split('T')[0]

  try {
    if (type === 'daily') {
      return await getDailyStats(characterId, today)
    } else if (type === 'weekly') {
      return await getWeeklyStats(characterId, today)
    } else {
      return await getSummaryStats(characterId, today)
    }
  } catch (e: any) {
    console.error('Get stats error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function getDailyStats(characterId: string, date: string) {
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

async function getSummaryStats(characterId: string, today: string) {
  // 오늘 수입
  const dailyResult = await getDailyStats(characterId, today)
  const dailyData = await dailyResult.json()

  // 주간 수입
  const weeklyResult = await getWeeklyStats(characterId, today)
  const weeklyData = await weeklyResult.json()

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
    unsoldItemCount: unsoldItems?.length || 0,
    unsoldItemsByGrade
  })
}
