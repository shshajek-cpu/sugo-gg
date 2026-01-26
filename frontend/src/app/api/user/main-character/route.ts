import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 서버 이름 → ID 매핑
const SERVER_NAME_TO_ID: { [key: string]: number } = {
  "시엘": 1001, "네자칸": 1002, "바이젤": 1003, "카이시넬": 1004, "유스티엘": 1005,
  "아리엘": 1006, "프레기온": 1007, "메스람타에다": 1008, "히타니에": 1009, "나니아": 1010,
  "타하바타": 1011, "루터스": 1012, "페르노스": 1013, "다미누": 1014, "카사카": 1015,
  "바카르마": 1016, "챈가룽": 1017, "코치룽": 1018, "이슈타르": 1019, "티아마트": 1020,
  "포에타": 1021,
  "이스라펠": 2001, "지켈": 2002, "트리니엘": 2003, "루미엘": 2004, "마르쿠탄": 2005,
  "아스펠": 2006, "에레슈키갈": 2007, "브리트라": 2008, "네몬": 2009, "하달": 2010,
  "루드라": 2011, "울고른": 2012, "무닌": 2013, "오다르": 2014, "젠카카": 2015,
  "크로메데": 2016, "콰이링": 2017, "바바룽": 2018, "파프니르": 2019, "인드나흐": 2020,
  "이스할겐": 2021
}

// GET - 대표 캐릭터 조회
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

    // Get user's main character
    const { data: ledgerUser } = await supabase
      .from('ledger_users')
      .select('main_character_id, main_character_server, main_character_name, main_character_class, main_character_level, main_character_race, main_character_item_level, main_character_hit_score, main_character_pve_score, main_character_pvp_score, main_character_image_url')
      .eq('auth_user_id', user.id)
      .single()

    if (!ledgerUser || !ledgerUser.main_character_name) {
      return NextResponse.json({
        mainCharacter: null
      })
    }

    // 자동 보정: pve_score/pvp_score가 NULL이고 character_id가 있으면 characters 테이블에서 조회하여 업데이트
    if (ledgerUser.main_character_id &&
        (!ledgerUser.main_character_pve_score || !ledgerUser.main_character_pvp_score)) {
      const { data: charData } = await supabase
        .from('characters')
        .select('pve_score, pvp_score, item_level, profile_image')
        .eq('character_id', ledgerUser.main_character_id)
        .single()

      if (charData && (charData.pve_score || charData.pvp_score)) {
        // DB 업데이트
        await supabase.from('ledger_users').update({
          main_character_pve_score: charData.pve_score,
          main_character_pvp_score: charData.pvp_score,
          main_character_item_level: charData.item_level || ledgerUser.main_character_item_level,
          main_character_image_url: charData.profile_image || ledgerUser.main_character_image_url
        }).eq('auth_user_id', user.id)

        // 반환값 업데이트
        ledgerUser.main_character_pve_score = charData.pve_score
        ledgerUser.main_character_pvp_score = charData.pvp_score
        if (charData.item_level) ledgerUser.main_character_item_level = charData.item_level
        if (charData.profile_image) ledgerUser.main_character_image_url = charData.profile_image
      }
    }

    return NextResponse.json({
      mainCharacter: {
        characterId: ledgerUser.main_character_id,
        server: ledgerUser.main_character_server,
        name: ledgerUser.main_character_name,
        className: ledgerUser.main_character_class,
        level: ledgerUser.main_character_level,
        race: ledgerUser.main_character_race,
        item_level: ledgerUser.main_character_item_level,
        hit_score: ledgerUser.main_character_hit_score,
        pve_score: ledgerUser.main_character_pve_score,
        pvp_score: ledgerUser.main_character_pvp_score,
        imageUrl: ledgerUser.main_character_image_url
      }
    })
  } catch (error: any) {
    console.error('Get main character error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - 대표 캐릭터 설정
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

    const { characterId, server, name, className, level, race, item_level, hit_score, pve_score, pvp_score, imageUrl } = await request.json()

    console.log('[Main Character API] Saving:', { characterId, server, name, className, level, race, item_level, hit_score, pve_score, pvp_score, imageUrl })

    // Check if this character is already set as main character by another user
    if (server && name) {
      const { data: existingMainChar } = await supabase
        .from('ledger_users')
        .select('auth_user_id')
        .eq('main_character_server', server)
        .eq('main_character_name', name)
        .neq('auth_user_id', user.id)
        .single()

      if (existingMainChar) {
        return NextResponse.json({
          error: '이미 다른 사용자가 대표 캐릭터로 설정한 캐릭터입니다.'
        }, { status: 400 })
      }
    }

    // IMPORTANT: Ensure ledger_users record exists BEFORE updating
    console.log('[Main Character API] Ensuring ledger_users exists for auth_user_id:', user.id)
    let { data: ledgerUser } = await supabase
      .from('ledger_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!ledgerUser) {
      console.log('[Main Character API] Creating new ledger_users record')
      const { data: newLedgerUser, error: createError } = await supabase
        .from('ledger_users')
        .insert({
          auth_user_id: user.id,
          google_user_id: user.id,  // 제약 조건 충족을 위해 google_user_id도 설정
          google_email: user.email,
          created_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (createError) {
        console.error('[Main Character API] Failed to create ledger_users:', createError)
        return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 })
      }

      ledgerUser = newLedgerUser
      console.log('[Main Character API] Created ledger_users:', ledgerUser)
    }

    // Now update user's main character (null values will clear the character)
    const { error: updateError } = await supabase
      .from('ledger_users')
      .update({
        main_character_id: characterId ?? null,
        main_character_server: server ?? null,
        main_character_name: name ?? null,
        main_character_class: className ?? null,
        main_character_level: level ?? null,
        main_character_race: race ?? null,
        main_character_item_level: item_level ?? null,
        main_character_hit_score: hit_score ?? null,
        main_character_pve_score: pve_score ?? null,
        main_character_pvp_score: pvp_score ?? null,
        main_character_image_url: imageUrl ?? null,
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', user.id)

    if (updateError) {
      console.error('Update main character error:', updateError)

      // Check if it's a unique constraint violation
      if (updateError.code === '23505') {
        return NextResponse.json({
          error: '이미 다른 사용자가 대표 캐릭터로 설정한 캐릭터입니다.'
        }, { status: 400 })
      }

      return NextResponse.json({ error: 'Failed to update main character' }, { status: 500 })
    }

    // 대표 캐릭터가 설정되었을 때, 가계부 캐릭터 목록에 자동 추가 또는 업데이트
    console.log('[Main Character API] Auto-adding/updating character to ledger:', { server, name })
    if (server && name && ledgerUser) {
      // 이미 가계부에 등록된 캐릭터인지 확인
      console.log('[Main Character API] Checking for existing character in ledger_characters')
      const { data: existingChar } = await supabase
        .from('ledger_characters')
        .select('id')
        .eq('user_id', ledgerUser.id)
        .eq('server_name', server)
        .eq('name', name)
        .single()

      console.log('[Main Character API] Existing character check:', { existingChar })

      const characterData = {
        user_id: ledgerUser.id,
        server_name: server,
        name: name,
        class_name: className ?? null,
        level: level ?? null,
        item_level: item_level ?? null,
        profile_image: imageUrl ?? null,
        race: race ?? null
      }

      if (!existingChar) {
        // 새로 추가
        console.log('[Main Character API] Inserting new character to ledger_characters')
        const { data: insertedChar, error: insertError } = await supabase
          .from('ledger_characters')
          .insert({
            ...characterData,
            created_at: new Date().toISOString()
          })
          .select()

        if (insertError) {
          console.error('[Main Character API] Failed to add character to ledger:', insertError)
        } else {
          console.log('[Main Character API] Auto-added character to ledger:', insertedChar)
        }
      } else {
        // 기존 캐릭터 정보 업데이트
        console.log('[Main Character API] Updating existing character in ledger')
        const { data: updatedChar, error: updateError } = await supabase
          .from('ledger_characters')
          .update(characterData)
          .eq('id', existingChar.id)
          .select()

        if (updateError) {
          console.error('[Main Character API] Failed to update character in ledger:', updateError)
        } else {
          console.log('[Main Character API] Updated character in ledger:', updatedChar)
        }
      }
    } else {
      console.log('[Main Character API] Skipping ledger addition:', { hasServer: !!server, hasName: !!name, hasLedgerUser: !!ledgerUser })
    }

    // 파티모집 캐릭터에도 자동 등록
    if (server && name && className) {
      const serverId = SERVER_NAME_TO_ID[server]
      if (serverId) {
        console.log('[Main Character API] Auto-adding to party_user_characters:', { server, serverId, name })

        // 이미 파티모집에 등록된 캐릭터인지 확인
        const { data: existingPartyChar } = await supabase
          .from('party_user_characters')
          .select('id')
          .eq('user_id', user.id)
          .eq('character_name', name)
          .eq('character_server_id', serverId)
          .single()

        if (!existingPartyChar) {
          // 다른 유저가 등록했는지 확인
          const { data: otherUserChar } = await supabase
            .from('party_user_characters')
            .select('id')
            .eq('character_name', name)
            .eq('character_server_id', serverId)
            .neq('user_id', user.id)
            .single()

          if (!otherUserChar) {
            // 현재 등록된 캐릭터 수 확인
            const { data: existingChars } = await supabase
              .from('party_user_characters')
              .select('id')
              .eq('user_id', user.id)

            if (!existingChars || existingChars.length < 10) {
              const nextOrder = (existingChars?.length || 0) + 1

              const { error: partyInsertError } = await supabase
                .from('party_user_characters')
                .insert({
                  user_id: user.id,
                  character_id: characterId || null,
                  character_name: name,
                  character_class: className,
                  character_server_id: serverId,
                  character_level: level || null,
                  character_item_level: item_level || null,
                  character_pve_score: pve_score || null,
                  character_pvp_score: pvp_score || null,
                  profile_image: imageUrl || null,
                  display_order: nextOrder
                })

              if (partyInsertError) {
                console.error('[Main Character API] Failed to add to party_user_characters:', partyInsertError)
              } else {
                console.log('[Main Character API] Auto-added to party_user_characters')
              }
            } else {
              console.log('[Main Character API] Skipping party addition: max 10 characters reached')
            }
          } else {
            console.log('[Main Character API] Skipping party addition: character registered by another user')
          }
        } else {
          // 이미 등록된 경우 정보 업데이트
          console.log('[Main Character API] Updating existing party character')
          await supabase
            .from('party_user_characters')
            .update({
              character_level: level || null,
              character_item_level: item_level || null,
              character_pve_score: pve_score || null,
              character_pvp_score: pvp_score || null,
              profile_image: imageUrl || null
            })
            .eq('id', existingPartyChar.id)
        }
      } else {
        console.log('[Main Character API] Unknown server name:', server)
      }
    }

    return NextResponse.json({
      success: true,
      mainCharacter: server && name ? {
        characterId,
        server,
        name,
        className,
        level,
        race,
        item_level,
        hit_score,
        pve_score,
        pvp_score,
        imageUrl
      } : null
    })
  } catch (error: any) {
    console.error('Main character API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
