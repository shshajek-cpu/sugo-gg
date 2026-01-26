'use client'

import useSWR from 'swr'
import { useMemo, useCallback } from 'react'
import { WeeklyStats } from '@/types/ledger'

interface UseWeeklyStatsProps {
  getAuthHeader: () => Record<string, string>
  characterId: string | null
  date?: string
}

export function useWeeklyStats({ getAuthHeader, characterId, date }: UseWeeklyStatsProps) {
  // SWR fetcher
  const fetcher = useCallback(async (url: string) => {
    const authHeaders = getAuthHeader()
    const res = await fetch(url, {
      headers: authHeaders
    })
    if (!res.ok) {
      throw new Error('Failed to fetch weekly stats')
    }
    return res.json()
  }, [getAuthHeader])

  // SWR key
  const swrKey = useMemo(() => {
    if (!characterId) return null
    const params = new URLSearchParams({
      characterId,
      type: 'weekly'
    })
    if (date) {
      params.append('date', date)
    }
    return `/api/ledger/stats?${params}`
  }, [characterId, date])

  // SWR hook
  const { data: stats, error, isLoading, mutate } = useSWR<WeeklyStats>(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000  // 5초 캐시
    }
  )

  // 차트용 데이터 포맷
  const chartData = useMemo(() => {
    return stats?.dailyData.map(d => ({
      date: d.date,
      day: getDayName(d.date),
      income: d.totalIncome,
      contentIncome: d.contentIncome,
      itemIncome: d.itemIncome
    })) || []
  }, [stats])

  return {
    stats: stats || null,
    chartData,
    isLoading,
    error: error?.message || null,
    refetch: mutate
  }
}

function getDayName(dateStr: string): string {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const date = new Date(dateStr)
  return days[date.getDay()]
}
