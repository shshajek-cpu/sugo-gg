'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { DailyContent } from '../components/DailyContentCard'
import { getWeekKey } from '../utils/dateUtils'

// Temporary image URL (same as Shugo Festa)
const TEMP_IMAGE_URL = 'https://fizz-download.playnccdn.com/download/v2/buckets/guidebook/files/19a69c5377f-d2502cef-9d59-4336-8a55-9de857b08544'

// 주간 리셋 컨텐츠 (수요일 5시 리셋)
const WEEKLY_RESET_CONTENTS = ['daily_dungeon', 'awakening_battle', 'subjugation']

// Default daily content definitions
const DEFAULT_DAILY_CONTENTS: Omit<DailyContent, 'completionCount'>[] = [
  {
    id: 'daily_dungeon',
    name: '일일던전',
    icon: '',
    maxCount: 7,  // 수요일 리셋, 주 7회
    baseReward: 20000,
    color: '#facc15',
    colorLight: '#fde047',
    colorDark: '#eab308',
    colorGlow: 'rgba(250, 204, 21, 0.5)',
    imageUrl: '/메달/주간컨텐츠/일일던전.png'
  },
  {
    id: 'awakening_battle',
    name: '각성전',
    icon: '',
    maxCount: 3,  // 수요일 리셋, 주 3회
    baseReward: 40000,
    color: '#3b82f6',
    colorLight: '#60a5fa',
    colorDark: '#2563eb',
    colorGlow: 'rgba(59, 130, 246, 0.5)',
    imageUrl: '/메달/주간컨텐츠/각성전.png'
  },
  {
    id: 'subjugation',
    name: '토벌전',
    icon: '',
    maxCount: 3,  // 수요일 리셋, 주 3회
    baseReward: 80000,
    color: '#10b981',
    colorLight: '#34d399',
    colorDark: '#059669',
    colorGlow: 'rgba(16, 185, 129, 0.5)',
    imageUrl: '/메달/주간컨텐츠/토벌전.png'
  },
  {
    id: 'nightmare',
    name: '악몽',
    icon: '',
    maxCount: 3,
    baseReward: 50000,
    color: '#9333ea',
    colorLight: '#a855f7',
    colorDark: '#7e22ce',
    colorGlow: 'rgba(147, 51, 234, 0.5)',
    imageUrl: '/메달/주간컨텐츠/악몽.png'
  },
  {
    id: 'dimension_invasion',
    name: '차원침공',
    icon: '',
    maxCount: 5,
    baseReward: 30000,
    color: '#ef4444',
    colorLight: '#f87171',
    colorDark: '#dc2626',
    colorGlow: 'rgba(239, 68, 68, 0.5)',
    imageUrl: TEMP_IMAGE_URL
  }
]

export function useDailyContent(
  characterId: string | null,
  date: string,
  getAuthHeader: () => Record<string, string>
) {
  const [contents, setContents] = useState<DailyContent[]>(
    DEFAULT_DAILY_CONTENTS.map(c => ({ ...c, completionCount: 0 }))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isLoadingRef = useRef(false)

  // 주간 키 계산 (수요일 5시 기준)
  const weekKey = useMemo(() => getWeekKey(new Date(date)), [date])

  // localStorage 키 생성 (컨텐츠별로 다른 키 사용)
  const getStorageKey = useCallback((contentId: string) => {
    // 주간 리셋 컨텐츠는 주간 키 사용
    if (WEEKLY_RESET_CONTENTS.includes(contentId)) {
      return `weeklyContent_${characterId}_${weekKey}_${contentId}`
    }
    // 일일 리셋 컨텐츠는 날짜 키 사용
    return `dailyContent_${characterId}_${date}_${contentId}`
  }, [characterId, date, weekKey])

  // Load daily content data from localStorage
  const loadData = useCallback(() => {
    isLoadingRef.current = true

    if (!characterId) {
      setContents(DEFAULT_DAILY_CONTENTS.map(c => ({ ...c, completionCount: 0 })))
      isLoadingRef.current = false
      return
    }

    // 즉시 초기화
    setContents(DEFAULT_DAILY_CONTENTS.map(c => ({ ...c, completionCount: 0 })))
    setLoading(true)

    try {
      // 각 컨텐츠별로 저장소에서 불러오기
      const mergedContents = DEFAULT_DAILY_CONTENTS.map(defaultContent => {
        const storageKey = getStorageKey(defaultContent.id)
        const savedData = localStorage.getItem(storageKey)
        const completionCount = savedData ? parseInt(savedData, 10) || 0 : 0
        return {
          ...defaultContent,
          completionCount
        }
      })
      setContents(mergedContents)
    } catch (err) {
      console.error('Failed to load daily content:', err)
    } finally {
      setLoading(false)
      setTimeout(() => {
        isLoadingRef.current = false
      }, 100)
    }
  }, [characterId, date, weekKey, getStorageKey])

  // Save daily content update to localStorage
  const saveContent = useCallback((contentId: string, newCount: number) => {
    if (!characterId || isLoadingRef.current) return

    try {
      const storageKey = getStorageKey(contentId)
      localStorage.setItem(storageKey, newCount.toString())
    } catch (err) {
      console.error('Failed to save daily content:', err)
    }
  }, [characterId, getStorageKey])

  // Increment completion count
  const handleIncrement = useCallback((id: string) => {
    setContents(prev => {
      const newContents = prev.map(content => {
        if (content.id === id && content.completionCount < content.maxCount) {
          const newCount = content.completionCount + 1
          saveContent(id, newCount)
          return { ...content, completionCount: newCount }
        }
        return content
      })
      return newContents
    })
  }, [saveContent])

  // Decrement completion count
  const handleDecrement = useCallback((id: string) => {
    setContents(prev => {
      const newContents = prev.map(content => {
        if (content.id === id && content.completionCount > 0) {
          const newCount = content.completionCount - 1
          saveContent(id, newCount)
          return { ...content, completionCount: newCount }
        }
        return content
      })
      return newContents
    })
  }, [saveContent])

  // Load data when character or date changes
  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    contents,
    loading,
    error,
    handleIncrement,
    handleDecrement,
    refresh: loadData
  }
}
