import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const MAX_SUB_CHARACTERS = 10

// GET - 서브 캐릭터 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get ledger_users id
    const { data: ledgerUser } = await supabase
      .from('ledger_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!ledgerUser) {
      return NextResponse.json({ subCharacters: [] })
    }

    // Get sub characters from party_user_characters
    const { data: subCharacters, error } = await supabase
      .from('party_user_characters')
      .select('*')
      .eq('user_id', ledgerUser.id)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[Sub Characters API] Fetch error:', error)
      throw error
    }

    return NextResponse.json({
      subCharacters: (subCharacters || []).map(char => ({
        id: char.id,
        characterId: char.character_id,
        server: char.character_server_id,
        name: char.character_name,
        className: char.character_class,
        level: char.character_level,
        itemLevel: char.character_item_level,
        pveScore: char.character_pve_score,
        pvpScore: char.character_pvp_score,
        imageUrl: char.profile_image,
        displayOrder: char.display_order
      }))
    })
  } catch (error: any) {
    console.error('[Sub Characters API] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - 서브 캐릭터 추가
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { characterId, server, name, className, level, itemLevel, pveScore, pvpScore, imageUrl } = body

    // Get or create ledger_users
    let { data: ledgerUser } = await supabase
      .from('ledger_users')
      .select('id, main_character_server, main_character_name')
      .eq('auth_user_id', user.id)
      .single()

    if (!ledgerUser) {
      const { data: newUser, error: createError } = await supabase
        .from('ledger_users')
        .insert({
          auth_user_id: user.id,
          google_user_id: user.id,
          google_email: user.email,
          created_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString()
        })
        .select('id, main_character_server, main_character_name')
        .single()

      if (createError) {
        console.error('[Sub Characters API] Create user error:', createError)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }
      ledgerUser = newUser
    }

    // Check if already at max
    const { count } = await supabase
      .from('party_user_characters')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', ledgerUser.id)

    if (count && count >= MAX_SUB_CHARACTERS) {
      return NextResponse.json({
        error: `서브 캐릭터는 최대 ${MAX_SUB_CHARACTERS}개까지 등록할 수 있습니다.`
      }, { status: 400 })
    }

    // Check if duplicate with main character
    if (ledgerUser.main_character_server && ledgerUser.main_character_name) {
      const mainServerStr = String(ledgerUser.main_character_server)
      const serverStr = String(server)
      if (mainServerStr === serverStr && ledgerUser.main_character_name === name) {
        return NextResponse.json({
          error: '대표 캐릭터와 동일한 캐릭터는 서브로 등록할 수 없습니다.'
        }, { status: 400 })
      }
    }

    // Check if already exists
    const { data: existing } = await supabase
      .from('party_user_characters')
      .select('id')
      .eq('user_id', ledgerUser.id)
      .eq('character_name', name)
      .eq('character_server_id', server)
      .single()

    if (existing) {
      return NextResponse.json({
        error: '이미 등록된 서브 캐릭터입니다.'
      }, { status: 400 })
    }

    // Get next display order
    const { data: lastChar } = await supabase
      .from('party_user_characters')
      .select('display_order')
      .eq('user_id', ledgerUser.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (lastChar?.display_order ?? -1) + 1

    // Insert new sub character
    const { data: newChar, error: insertError } = await supabase
      .from('party_user_characters')
      .insert({
        user_id: ledgerUser.id,
        character_id: characterId,
        character_name: name,
        character_class: className,
        character_server_id: server,
        character_level: level,
        character_item_level: itemLevel,
        character_pve_score: pveScore,
        character_pvp_score: pvpScore,
        profile_image: imageUrl,
        display_order: nextOrder,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Sub Characters API] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to add character' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      subCharacter: {
        id: newChar.id,
        characterId: newChar.character_id,
        server: newChar.character_server_id,
        name: newChar.character_name,
        className: newChar.character_class,
        level: newChar.character_level,
        itemLevel: newChar.character_item_level,
        pveScore: newChar.character_pve_score,
        pvpScore: newChar.character_pvp_score,
        imageUrl: newChar.profile_image,
        displayOrder: newChar.display_order
      }
    })
  } catch (error: any) {
    console.error('[Sub Characters API] POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - 서브 캐릭터 삭제
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subCharId = searchParams.get('id')

    if (!subCharId) {
      return NextResponse.json({ error: 'Missing character id' }, { status: 400 })
    }

    // Get ledger_users id
    const { data: ledgerUser } = await supabase
      .from('ledger_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!ledgerUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete sub character (only if owned by user)
    const { error: deleteError } = await supabase
      .from('party_user_characters')
      .delete()
      .eq('id', subCharId)
      .eq('user_id', ledgerUser.id)

    if (deleteError) {
      console.error('[Sub Characters API] Delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Sub Characters API] DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
