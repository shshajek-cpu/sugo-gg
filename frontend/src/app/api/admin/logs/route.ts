import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        const searchParams = request.nextUrl.searchParams
        const type = searchParams.get('type')

        // 1. 최근 로그 조회 (50개)
        let logQuery = supabase
            .from('collector_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        if (type && type !== 'all') {
            logQuery = logQuery.eq('type', type)
        }

        const { data: recentLogs, error: logError } = await logQuery

        if (logError) throw logError

        // 2. 일별 통계 (최근 7일)
        // GroupBy는 Supabase JS 클라이언트에서 직접 지원하지 않으므로, raw query나 rpc를 써야 하지만,
        // 여기서는 간단히 데이터를 가져와서 JS로 가공합니다. (데이터 양이 아직 적으므로)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        let statsQuery = supabase
            .from('collector_logs')
            .select('created_at, collected_count')
            .gte('created_at', sevenDaysAgo.toISOString())

        if (type && type !== 'all') {
            statsQuery = statsQuery.eq('type', type)
        }

        const { data: statsData, error: statsError } = await statsQuery

        if (statsError) throw statsError

        // 날짜별 집계
        const dailyStats: Record<string, number> = {}
        const today = new Date().toISOString().split('T')[0]
        let todayCount = 0

        statsData.forEach((log: any) => {
            const date = log.created_at.split('T')[0]
            dailyStats[date] = (dailyStats[date] || 0) + log.collected_count
            if (date === today) {
                todayCount += log.collected_count
            }
        })

        // 배열로 변환
        const dailyChart = Object.entries(dailyStats)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => ({ date, count }))

        return NextResponse.json({
            recentLogs,
            dailyStats: dailyChart,
            todayCount
        })

    } catch (err: any) {
        console.error('[Admin Logs Error]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
