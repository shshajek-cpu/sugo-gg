import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 기본 설정값
const DEFAULT_SETTINGS = {
    auto_recalc_enabled: false,
    auto_recalc_interval: 'daily',  // 'hourly', 'daily', 'weekly'
    auto_recalc_batch_size: 50,
    auto_recalc_time: '03:00',      // 실행 시간 (daily/weekly용)
    last_auto_recalc: null,
    last_auto_recalc_count: 0,
    cron_secret: ''                  // Cron 호출용 비밀키
}

export async function GET(request: NextRequest) {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        // settings 테이블에서 설정 가져오기
        const { data, error } = await supabase
            .from('settings')
            .select('key, value')
            .in('key', Object.keys(DEFAULT_SETTINGS))

        if (error) {
            // 테이블이 없거나 에러면 기본값 반환
            console.error('[Settings] Fetch error:', error)
            return NextResponse.json({ settings: DEFAULT_SETTINGS })
        }

        // DB 값과 기본값 병합
        const settings = { ...DEFAULT_SETTINGS }
        if (data) {
            data.forEach((row: { key: string, value: any }) => {
                if (row.key in settings) {
                    (settings as any)[row.key] = row.value
                }
            })
        }

        return NextResponse.json({ settings })

    } catch (err: any) {
        console.error('[Settings] Error:', err)
        return NextResponse.json({ settings: DEFAULT_SETTINGS })
    }
}

export async function POST(request: NextRequest) {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        const body = await request.json()
        const { settings } = body

        if (!settings || typeof settings !== 'object') {
            return NextResponse.json({ error: 'Invalid settings object' }, { status: 400 })
        }

        // 각 설정을 upsert
        const upsertPromises = Object.entries(settings).map(async ([key, value]) => {
            // 유효한 키만 저장
            if (!(key in DEFAULT_SETTINGS)) return null

            const { error } = await supabase
                .from('settings')
                .upsert(
                    { key, value, updated_at: new Date().toISOString() },
                    { onConflict: 'key' }
                )

            if (error) {
                console.error(`[Settings] Upsert error for ${key}:`, error)
                return { key, error: error.message }
            }
            return { key, success: true }
        })

        const results = await Promise.all(upsertPromises)
        const errors = results.filter(r => r && 'error' in r)

        if (errors.length > 0) {
            return NextResponse.json({
                success: false,
                message: 'Some settings failed to save',
                errors
            }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Settings saved' })

    } catch (err: any) {
        console.error('[Settings] Save error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
