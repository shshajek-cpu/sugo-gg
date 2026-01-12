'use client'

import { useState, useEffect, useCallback } from 'react'
import { WeeklyStats, DailyStats } from '@/types/ledger'

interface UseWeeklyStatsProps {
  characterId: string | null
  date?: string
}

export function useWeeklyStats({ characterId, date }: UseWeeklyStatsProps) {
  const [stats, setStats] = useState<WeeklyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!characterId) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        characterId,
        type: 'weekly'
      })
      if (date) {
        params.append('date', date)
      }

      const res = await fetch(`/api/ledger/stats?${params}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [characterId, date])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // 차트용 데이터 포맷
  const chartData = stats?.dailyData.map(d => ({
    date: d.date,
    day: getDayName(d.date),
    income: d.totalIncome,
    contentIncome: d.contentIncome,
    itemIncome: d.itemIncome
  })) || []

  return {
    stats,
    chartData,
    isLoading,
    error,
    refetch: fetchStats
  }
}

function getDayName(dateStr: string): string {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const date = new Date(dateStr)
  return days[date.getDay()]
}
