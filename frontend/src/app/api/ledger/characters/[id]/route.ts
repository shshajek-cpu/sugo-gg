import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://edwtbiujwjprydmahwhh.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_FFVKMVuYjOUr-iKWBaGrlA_CmdUv6RI'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
  return createClient(supabaseUrl, supabaseKey)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const device_id = request.headers.get('x-device-id')
  if (!device_id) return NextResponse.json({ error: 'Missing Device ID' }, { status: 401 })

  const supabase = getSupabase()

  const { data: user } = await supabase.from('ledger_users').select('id').eq('device_id', device_id).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { error } = await supabase
    .from('ledger_characters')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
