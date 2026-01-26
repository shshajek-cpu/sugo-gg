'use client'

import useSWR from 'swr'
import { useCallback, useMemo } from 'react'

interface DashboardStats {
  totalTodayIncome: number
  unsoldItemCount: number
  unsoldItemsByGrade: {
    common: number
    rare: number
    heroic: number
    legendary: number
    ultimate: number
  }
}

interface UseDashboardStatsProps {
  getAuthHeader: () => Record<string, string>
  characterIds: string[]
  isReady: boolean
}

export function useDashboardStats({ getAuthHeader, characterIds, isReady }: UseDashboardStatsProps) {
  // SWR fetcher
  const fetcher = useCallback(async (url: string) => {
    const authHeaders = getAuthHeader()
    const res = await fetch(url, {
      headers: authHeaders
    })
    if (!res.ok) {
      throw new Error('Failed to fetch dashboard stats')
    }
    return res.json()
  }, [getAuthHeader])

  // SWR key
  const swrKey = useMemo(() => {
    if (!isReady || characterIds.length === 0) return null
    return `/api/ledger/dashboard?characterIds=${characterIds.join(',')}`
  }, [isReady, characterIds])

  // SWR hook
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000  // 1분 캐시 (기존과 동일)
    }
  )

  // 데이터 포맷팅
  const stats: DashboardStats = useMemo(() => {
    if (!data) {
      return {
        totalTodayIncome: 0,
        unsoldItemCount: 0,
        unsoldItemsByGrade: {
          common: 0,
          rare: 0,
          heroic: 0,
          legendary: 0,
          ultimate: 0
        }
      }
    }

    return {
      totalTodayIncome: data.totals?.todayIncome || 0,
      unsoldItemCount: data.totals?.unsoldItemCount || 0,
      unsoldItemsByGrade: data.totals?.unsoldItemsByGrade || {
        common: 0,
        rare: 0,
        heroic: 0,
        legendary: 0,
        ultimate: 0
      }
    }
  }, [data])

  return {
    stats,
    isLoading,
    error: error?.message || null,
    refetch: mutate
  }
}
