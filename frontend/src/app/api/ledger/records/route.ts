import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET: Fetch records for today (or specific date) for all user's characters
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const device_id = request.headers.get('x-device-id')

    if (!device_id || !date) {
        return NextResponse.json({ error: 'Missing date or device_id' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user
    const { data: user } = await supabase.from('ledger_users').select('id').eq('device_id', device_id).single()
    if (!user) return NextResponse.json([])

    // Get characters to filter records? 
    // Or just join? Supabase join syntax:
    // ledger_daily_records!inner(..., ledger_characters!inner(user_id))

    // Simpler: Get all characters of user, then get records for those characters
    const { data: characters } = await supabase.from('ledger_characters').select('id').eq('user_id', user.id)
    const charIds = characters?.map(c => c.id) || []

    if (charIds.length === 0) return NextResponse.json([])

    const { data: records, error } = await supabase
        .from('ledger_daily_records')
        .select(`
            *,
            items:ledger_record_items(*)
        `)
        .in('character_id', charIds)
        .eq('date', date)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(records)
}

// POST: Upsert a record
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { character_id, date, updates } = body // updates: { count_expedition: 5, kina_income: ... }

        if (!character_id || !date || !updates) {
            return NextResponse.json({ error: 'Missing params' }, { status: 400 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Check availability
        const { data: existing } = await supabase
            .from('ledger_daily_records')
            .select('id')
            .eq('character_id', character_id)
            .eq('date', date)
            .single()

        let recordId = existing?.id
        let error = null

        if (recordId) {
            // Update
            const { error: updateErr } = await supabase
                .from('ledger_daily_records')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', recordId)
            error = updateErr
        } else {
            // Insert
            const { data: newRecord, error: insertErr } = await supabase
                .from('ledger_daily_records')
                .insert({
                    character_id,
                    date,
                    ...updates
                })
                .select('id')
                .single()
            recordId = newRecord?.id
            error = insertErr
        }

        if (error) throw error

        // Handle Items if present in body (e.g., newItem: { item_name: '...', count: 1 })
        const { newItem } = body // Expecting specific action like 'addItem' or just list sync? 
        // Let's support adding a single item for now as the UI does one by one.
        if (newItem && recordId) {
            const { error: itemErr } = await supabase
                .from('ledger_record_items')
                .insert({
                    record_id: recordId,
                    item_name: newItem.item_name,
                    count: newItem.count || 1
                })
            if (itemErr) throw itemErr
        }

        return NextResponse.json({ id: recordId, success: true })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
