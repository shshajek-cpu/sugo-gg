import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Define the structure of incoming data
interface SyncCharacter {
    characterId: string
    name: string
    server_id: number
    level: number
    job: string // class_name
    race: string // race_name
    imageUrl?: string
}

export async function POST(request: NextRequest) {
    try {
        const characters: SyncCharacter[] = await request.json()

        if (!characters || characters.length === 0) {
            return NextResponse.json({ message: 'No data provided' }, { status: 200 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase Credentials')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Helper to remove HTML tags (like <strong>)
        const cleanName = (name: string) => name.replace(/<\/?[^>]+(>|$)/g, "");

        // Map frontend data to DB schema
        const rowsToUpsert = characters.map(char => ({
            character_id: char.characterId,
            server_id: char.server_id,
            name: cleanName(char.name),
            level: char.level,
            class_name: char.job,
            race_name: char.race, // Ensure 'Elyos' or 'Asmodian' is standard
            profile_image: char.imageUrl,
            updated_at: new Date().toISOString()
        }))

        // Perform Bulk Upsert
        // We use 'character_id' as the unique key to detect conflicts
        const { error } = await supabase
            .from('characters')
            .upsert(rowsToUpsert, {
                onConflict: 'character_id',
                ignoreDuplicates: true // Skip existing rows
            })

        if (error) {
            console.error('[Sync API] Upsert failed:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            count: rowsToUpsert.length,
            message: `Synced ${rowsToUpsert.length} characters`
        })

    } catch (err: any) {
        console.error('[Sync API] Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
