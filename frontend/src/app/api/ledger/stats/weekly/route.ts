import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: Request) {
    const device_id = request.headers.get('x-device-id')
    if (!device_id) return NextResponse.json({ error: 'Device ID required' }, { status: 400 })

    const { data: user } = await supabase.from('ledger_users').select('id').eq('device_id', device_id).single()
    if (!user) return NextResponse.json([])

    // Get last 7 days
    const today = new Date()
    const result: { date: string, dayName: string, totalKina: number }[] = []

    // We want Mon-Sun or just last 7 days from today? "Last 7 days" is usually easier
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const dayName = d.toLocaleDateString('ko-KR', { weekday: 'short' })

        result.push({ date: dateStr, dayName, totalKina: 0 })
    }

    // Get records
    const startDate = result[0].date
    const endDate = result[6].date

    // Get characters
    const { data: characters } = await supabase.from('ledger_characters').select('id').eq('user_id', user.id)
    const charIds = characters?.map(c => c.id) || []

    if (charIds.length > 0) {
        const { data: records } = await supabase
            .from('ledger_daily_records')
            .select('date, kina_income')
            .in('character_id', charIds)
            .gte('date', startDate)
            .lte('date', endDate)

        if (records) {
            records.forEach(r => {
                const target = result.find(item => item.date === r.date)
                if (target) {
                    target.totalKina += (r.kina_income || 0)
                }
            })
        }
    }

    // Convert to "Ok" (100,000,000) unit for display or keep details? 
    // Chart label says "단위: 억". 
    // 1 Kina = 1. 100,000,000 = 1 Ok.
    const finalData = result.map(r => ({
        ...r,
        totalKina: Math.round((r.totalKina / 100000000) * 100) / 100 // 소수점 2자리 억 단위
    }))

    return NextResponse.json(finalData)
}
