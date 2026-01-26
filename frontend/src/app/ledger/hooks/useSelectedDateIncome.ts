'use client'

import useSWR from 'swr'
import { useCallback, useMemo } from 'react'
import { getAuthHeader } from './useDeviceId'

interface DateIncome {
  dailyIncome: number
  monthlyIncome: number
}

interface UseSelectedDateIncomeProps {
  characterId: string | null
  date: string
  isReady: boolean
  refreshKey?: number  // 외부에서 갱신 트리거용
}

export function useSelectedDateIncome({ characterId, date, isReady, refreshKey = 0 }: UseSelectedDateIncomeProps) {
  // SWR fetcher - 일일/월간 통계 병렬 조회
  const fetcher = useCallback(async (url: string) => {
    const authHeaders = getAuthHeader()
    const params = new URL(url, window.location.origin).searchParams
    const charId = params.get('characterId')
    const dateParam = params.get('date')

    const [dailyRes, monthlyRes] = await Promise.all([
      fetch(
        `/api/ledger/stats?characterId=${charId}&type=daily&date=${dateParam}`,
        { headers: authHeaders }
      ),
      fetch(
        `/api/ledger/stats?characterId=${charId}&type=monthly&date=${dateParam}`,
        { headers: authHeaders }
      )
    ])

    let dailyIncome = 0
    let monthlyIncome = 0

    if (dailyRes.ok) {
      const data = await dailyRes.json()
      dailyIncome = data.totalIncome || 0
    }

    if (monthlyRes.ok) {
      const data = await monthlyRes.json()
      monthlyIncome = data.totalIncome || 0
    }

    return { dailyIncome, monthlyIncome }
  }, [])

  // SWR key - refreshKey 포함하여 외부 트리거 가능
  const swrKey = useMemo(() => {
    if (!isReady || !characterId) return null
    return `/api/ledger/date-income?characterId=${characterId}&date=${date}&_refresh=${refreshKey}`
  }, [isReady, characterId, date, refreshKey])

  // SWR hook
  const { data, error, isLoading, mutate } = useSWR<DateIncome>(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000  // 5초 캐시
    }
  )

  const income: DateIncome = useMemo(() => {
    return data || { dailyIncome: 0, monthlyIncome: 0 }
  }, [data])

  return {
    dailyIncome: income.dailyIncome,
    monthlyIncome: income.monthlyIncome,
    isLoading,
    error: error?.message || null,
    refetch: mutate
  }
}
