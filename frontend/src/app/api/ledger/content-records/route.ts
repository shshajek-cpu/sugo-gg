import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// GET: 특정 캐릭터의 특정 날짜 컨텐츠 기록 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const characterId = searchParams.get('characterId')
  const date = searchParams.get('date')

  if (!characterId || !date) {
    return NextResponse.json({ error: 'Missing characterId or date' }, { status: 400 })
  }

  try {
    const { data: records, error } = await supabase
      .from('ledger_content_records')
      .select('*')
      .eq('ledger_character_id', characterId)
      .eq('record_date', date)

    if (error) {
      // 테이블이 없으면 빈 배열 반환
      if (error.code === '42P01') {
        return NextResponse.json([])
      }
      throw error
    }

    return NextResponse.json(records || [])
  } catch (e: any) {
    console.error('Get content records error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST: 컨텐츠 기록 생성 또는 업데이트
export async function POST(request: Request) {
  const device_id = request.headers.get('x-device-id')
  if (!device_id) return NextResponse.json({ error: 'Missing Device ID' }, { status: 401 })

  try {
    const body = await request.json()
    const {
      characterId,
      date,
      content_type,
      dungeon_tier,
      max_count,
      completion_count,
      is_double,
      base_kina
    } = body

    if (!characterId || !date || !content_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 총 금액 계산
    const total_kina = completion_count * base_kina * (is_double ? 2 : 1)

    // Upsert: 기존 기록이 있으면 업데이트, 없으면 생성
    const { data: existing } = await supabase
      .from('ledger_content_records')
      .select('id')
      .eq('ledger_character_id', characterId)
      .eq('record_date', date)
      .eq('content_type', content_type)
      .single()

    let result
    if (existing) {
      // 업데이트
      const { data, error } = await supabase
        .from('ledger_content_records')
        .update({
          dungeon_tier,
          max_count,
          completion_count,
          is_double,
          base_kina,
          total_kina,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // 생성
      const { data, error } = await supabase
        .from('ledger_content_records')
        .insert({
          ledger_character_id: characterId,
          record_date: date,
          content_type,
          dungeon_tier,
          max_count,
          completion_count,
          is_double,
          base_kina,
          total_kina
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json(result)
  } catch (e: any) {
    console.error('Save content record error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE: 컨텐츠 기록 삭제
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  try {
    const { error } = await supabase
      .from('ledger_content_records')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
