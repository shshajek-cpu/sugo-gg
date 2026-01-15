import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 주의: mnbngmdjiszyowfvnzhk 프로젝트만 사용
const SUPABASE_URL = 'https://mnbngmdjiszyowfvnzhk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uYm5nbWRqaXN6eW93ZnZuemhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5OTY0ODAsImV4cCI6MjA4MjU3MjQ4MH0.AIvvGxd_iQKpQDbmOBoe4yAmii1IpB92Pp7Scs8Lz7U'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
  return createClient(supabaseUrl, supabaseKey)
}

// 인증된 유저 또는 device_id 유저 조회
// 주의: Google 로그인은 현재 비활성화 - device_id 우선 사용
async function getUserFromRequest(request: Request) {
  const supabase = getSupabase()

  // 1. device_id로 먼저 조회 (우선순위)
  const device_id = request.headers.get('X-Device-ID') || request.headers.get('x-device-id')
  if (device_id) {
    const { data: existingUser } = await supabase
      .from('ledger_users')
      .select('id')
      .eq('device_id', device_id)
      .single()
    return existingUser
  }

  // 2. Bearer 토큰으로 인증 확인 (폴백)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (user && !error) {
      // auth_user_id로 ledger_users 조회
      let { data: ledgerUser } = await supabase
        .from('ledger_users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      // ledger_users 레코드가 없으면 자동 생성
      if (!ledgerUser) {
        const { data: newLedgerUser } = await supabase
          .from('ledger_users')
          .insert({
            auth_user_id: user.id,
            created_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString()
          })
          .select('id')
          .single()

        ledgerUser = newLedgerUser
      }

      if (ledgerUser) return ledgerUser
    }
  }

  return null
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabase()

  const { error } = await supabase
    .from('ledger_characters')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[API] Delete character error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
