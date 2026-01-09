import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
    try {
        const { device_id } = await request.json()
        if (!device_id) {
            return NextResponse.json({ error: 'Device ID required' }, { status: 400 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Check if user exists
        const { data: existingUser, error: fetchError } = await supabase
            .from('ledger_users')
            .select('id')
            .eq('device_id', device_id)
            .single()

        if (existingUser) {
            // Update last seen
            await supabase
                .from('ledger_users')
                .update({ last_seen_at: new Date().toISOString() })
                .eq('id', existingUser.id)

            return NextResponse.json({ user_id: existingUser.id })
        }

        // Create new user
        const { data: newUser, error: createError } = await supabase
            .from('ledger_users')
            .insert({ device_id })
            .select('id')
            .single()

        if (createError) {
            console.error('Error creating user:', createError)
            return NextResponse.json({ error: createError.message }, { status: 500 })
        }

        return NextResponse.json({ user_id: newUser.id })
    } catch (e) {
        console.error('Internal Error:', e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
