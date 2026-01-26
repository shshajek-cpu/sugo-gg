'use client'

import useSWR from 'swr'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { PartyPost } from '@/types/party'

interface MyPartiesResponse {
  created: (PartyPost & { pending_count: number })[]
  joined: (PartyPost & { my_member: { id: string; slot_id: string; character_name: string; character_class: string; role: string } })[]
  pending: (PartyPost & { my_application: { id: string; slot_id: string; character_name: string; character_class: string; applied_at: string } })[]
  counts: {
    created: number
    joined: number
    pending: number
    total: number
  }
}

const emptyData: MyPartiesResponse = {
  created: [],
  joined: [],
  pending: [],
  counts: { created: 0, joined: 0, pending: 0, total: 0 }
}

// SWR fetcher - 세션 토큰 포함
const fetcher = async (url: string): Promise<MyPartiesResponse> => {
  const { data: { session } } = await supabase.auth.getSession()

  // 세션 없으면 빈 데이터 반환
  if (!session?.access_token) {
    return emptyData
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })

  if (!response.ok) {
    const res = await response.json()
    throw new Error(res.error || 'Failed to fetch my parties')
  }

  return response.json()
}

export function useMyParties() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  // 로그인 상태 확인
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.access_token)
    })
  }, [])

  // SWR hook - 로그인 시에만 fetch
  const { data, error, isLoading, mutate } = useSWR<MyPartiesResponse>(
    isLoggedIn ? '/api/party/my' : null,
    fetcher,
    {
      revalidateOnFocus: true,        // 탭 전환 시 자동 갱신
      revalidateOnReconnect: true,    // 네트워크 재연결 시 갱신
      refreshInterval: 30000,         // 30초마다 자동 갱신
      dedupingInterval: 5000,         // 5초 내 중복 요청 방지
      fallbackData: emptyData
    }
  )

  const refresh = useCallback(() => {
    mutate()
  }, [mutate])

  return {
    created: data?.created || [],
    joined: data?.joined || [],
    pending: data?.pending || [],
    counts: data?.counts || { created: 0, joined: 0, pending: 0, total: 0 },
    loading: isLoggedIn === null || isLoading,
    error: error?.message || null,
    refresh
  }
}
