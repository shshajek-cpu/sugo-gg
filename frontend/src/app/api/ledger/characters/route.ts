import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET: List characters for a user
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const device_id = request.headers.get('x-device-id')

    if (!device_id) {
        return NextResponse.json({ error: 'Device ID header required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user_id from device_id
    const { data: user } = await supabase
        .from('ledger_users')
        .select('id')
        .eq('device_id', device_id)
        .single()

    if (!user) {
        return NextResponse.json([]) // No user implies no characters
    }

    const { data: characters, error } = await supabase
        .from('ledger_characters')
        .select('*')
        .eq('user_id', user.id)
        .order('is_main', { ascending: false })
        .order('created_at', { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(characters)
}

// POST: Add a character
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { device_id, name, class_name, server_name, is_main } = body

        if (!device_id || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Get user_id
        const { data: user } = await supabase
            .from('ledger_users')
            .select('id')
            .eq('device_id', device_id)
            .single()

        let userId = user?.id

        // If no user found (should call /user first, but handle safety here)
        if (!userId) {
            const { data: newUser } = await supabase
                .from('ledger_users')
                .insert({ device_id })
                .select('id')
                .single()
            userId = newUser?.id
        }

        if (!userId) {
            return NextResponse.json({ error: 'User creation failed' }, { status: 500 })
        }

        // Insert Character
        const { data: char, error } = await supabase
            .from('ledger_characters')
            .insert({
                user_id: userId,
                name,
                class_name,
                server_name,
                is_main: is_main || false
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // If set as main, unset others? (logic can be added)

        return NextResponse.json(char)

    } catch (e) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}

// DELETE: Remove character
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const device_id = request.headers.get('x-device-id')

    if (!id || !device_id) return NextResponse.json({ error: 'Invalid Request' }, { status: 400 })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Validate ownership
    const { data: user } = await supabase.from('ledger_users').select('id').eq('device_id', device_id).single()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 403 })

    // Check if char belongs to user
    const { data: char } = await supabase.from('ledger_characters').select('id').eq('id', id).eq('user_id', user.id).single()
    if (!char) return NextResponse.json({ error: 'Character not found or access denied' }, { status: 404 })

    const { error } = await supabase.from('ledger_characters').delete().eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}
