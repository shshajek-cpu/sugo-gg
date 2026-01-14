'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import ProgressBar from './ProgressBar'
import ShugoFestaCard from './ShugoFestaCard'
import AbyssHallwayCard from './AbyssHallwayCard'
import { getWeekKey, getGameDate } from '../utils/dateUtils'
import styles from './WeeklyContentSection.module.css'

interface WeeklyContentSectionProps {
  characterId: string | null
  selectedDate: string
  onDebugLog?: (type: 'load' | 'save' | 'error' | 'info', message: string, data?: any) => void
}

const DEFAULT_ABYSS_REGIONS = [
  { id: 'ereshrantas_root', name: '에렌슈란타의 뿌리', enabled: false },
  { id: 'siels_wing', name: '시엘의 날개군도', enabled: false },
  { id: 'sulfur_tree', name: '유황나무섬', enabled: false }
]

export default function WeeklyContentSection({ characterId, selectedDate, onDebugLog }: WeeklyContentSectionProps) {
  const log = (type: 'load' | 'save' | 'error' | 'info', message: string, data?: any) => {
    console.log(`[WeeklyContent] ${message}`, data || '')
    onDebugLog?.(type, `[주간] ${message}`, data)
  }
  // 로딩 상태 (로딩 중에는 저장 안 함)
  const isLoadingRef = useRef(false)

  // 주간 키 계산 (수요일 5시 기준)
  const weekKey = useMemo(() => getWeekKey(new Date(selectedDate)), [selectedDate])

  // 게임 날짜 (새벽 5시 기준) - 사명용
  const gameDate = useMemo(() => {
    // 5:30 기준이지만 5시로 근사
    return getGameDate(new Date(selectedDate))
  }, [selectedDate])

  // 사명 상태 (매일 5:30 리셋)
  const [missionCount, setMissionCount] = useState(0)

  // 주간 지령서 상태 (수요일 5시 리셋)
  const [weeklyOrderCount, setWeeklyOrderCount] = useState(0)
  const [abyssOrderCount, setAbyssOrderCount] = useState(0)

  // 슈고 페스타 상태 (주간)
  const [shugoTickets, setShugoTickets] = useState({ base: 14, bonus: 0 })

  // 어비스 회랑 상태 (주간)
  const [abyssRegions, setAbyssRegions] = useState(DEFAULT_ABYSS_REGIONS)

  // 사명 데이터 로드 (매일 리셋)
  useEffect(() => {
    if (!characterId) {
      setMissionCount(0)
      return
    }

    const missionKey = `mission_${characterId}_${gameDate}`
    const savedMission = localStorage.getItem(missionKey)
    setMissionCount(savedMission ? parseInt(savedMission, 10) || 0 : 0)
  }, [characterId, gameDate])

  // 사명 데이터 저장
  useEffect(() => {
    if (!characterId || isLoadingRef.current) return

    const missionKey = `mission_${characterId}_${gameDate}`
    localStorage.setItem(missionKey, missionCount.toString())
  }, [characterId, gameDate, missionCount])

  // 주간 데이터 로드 (수요일 5시 리셋)
  useEffect(() => {
    log('load', `캐릭터/주간 변경: ${characterId}, ${weekKey}`)
    isLoadingRef.current = true

    if (!characterId) {
      setWeeklyOrderCount(0)
      setAbyssOrderCount(0)
      setShugoTickets({ base: 14, bonus: 0 })
      setAbyssRegions(DEFAULT_ABYSS_REGIONS)
      isLoadingRef.current = false
      return
    }

    // localStorage에서 주간 데이터 불러오기
    const storageKey = `weeklyOrders_${characterId}_${weekKey}`
    const savedData = localStorage.getItem(storageKey)
    log('info', `localStorage 키: ${storageKey}`)

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        log('load', '주간 데이터 로드 성공', parsed)
        setWeeklyOrderCount(parsed.weeklyOrderCount ?? 0)
        setAbyssOrderCount(parsed.abyssOrderCount ?? 0)
        setShugoTickets(parsed.shugoTickets ?? { base: 14, bonus: 0 })
        setAbyssRegions(parsed.abyssRegions ?? DEFAULT_ABYSS_REGIONS)
      } catch (e) {
        log('error', '데이터 파싱 실패', { error: e })
        setWeeklyOrderCount(0)
        setAbyssOrderCount(0)
        setShugoTickets({ base: 14, bonus: 0 })
        setAbyssRegions(DEFAULT_ABYSS_REGIONS)
      }
    } else {
      log('info', '저장된 주간 데이터 없음, 초기화')
      setWeeklyOrderCount(0)
      setAbyssOrderCount(0)
      setShugoTickets({ base: 14, bonus: 0 })
      setAbyssRegions(DEFAULT_ABYSS_REGIONS)
    }

    setTimeout(() => {
      isLoadingRef.current = false
      log('info', '로딩 완료')
    }, 100)
  }, [characterId, weekKey])

  // 주간 데이터 저장 (로딩 중 아닐 때만)
  useEffect(() => {
    if (!characterId) {
      log('info', '저장 스킵: characterId 없음')
      return
    }
    if (isLoadingRef.current) {
      log('info', '저장 스킵: 로딩 중')
      return
    }

    const data = {
      weeklyOrderCount,
      abyssOrderCount,
      shugoTickets,
      abyssRegions
    }
    const storageKey = `weeklyOrders_${characterId}_${weekKey}`
    log('save', '주간 데이터 저장', data)
    localStorage.setItem(storageKey, JSON.stringify(data))
  }, [characterId, weekKey, weeklyOrderCount, abyssOrderCount, shugoTickets, abyssRegions])

  if (!characterId) {
    return (
      <section className={styles.section}>
        <div className={styles.placeholder}>
          캐릭터를 선택하면 주간 컨텐츠가 표시됩니다.
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>주간 지령서&슈고/회랑</h2>
      </div>

      <div className={styles.content}>
        {/* 왼쪽 65%: 진행도 바 3개 */}
        <div className={styles.leftColumn}>
          <ProgressBar
            id="mission"
            name="사명"
            icon="📜"
            currentCount={missionCount}
            maxCount={5}
            onIncrement={() => setMissionCount(prev => Math.min(5, prev + 1))}
            onDecrement={() => setMissionCount(prev => Math.max(0, prev - 1))}
            onComplete={() => setMissionCount(5)}
          />

          <ProgressBar
            id="weekly_order"
            name="주간 지령서"
            icon="📋"
            currentCount={weeklyOrderCount}
            maxCount={12}
            onIncrement={() => setWeeklyOrderCount(prev => Math.min(12, prev + 1))}
            onDecrement={() => setWeeklyOrderCount(prev => Math.max(0, prev - 1))}
            onComplete={() => setWeeklyOrderCount(12)}
          />

          <ProgressBar
            id="abyss_order"
            name="어비스 주간 지령서"
            icon="🔥"
            currentCount={abyssOrderCount}
            maxCount={20}
            onIncrement={() => setAbyssOrderCount(prev => Math.min(20, prev + 1))}
            onDecrement={() => setAbyssOrderCount(prev => Math.max(0, prev - 1))}
            onComplete={() => setAbyssOrderCount(20)}
          />
        </div>

        {/* 오른쪽 35%: 슈고 페스타 & 어비스 회랑 */}
        <div className={styles.rightColumn}>
          <ShugoFestaCard
            currentTickets={shugoTickets.base}
            maxTickets={14}
            bonusTickets={shugoTickets.bonus}
          />

          <AbyssHallwayCard
            regions={abyssRegions}
            onToggleRegion={(regionId) => {
              setAbyssRegions(prev =>
                prev.map(r =>
                  r.id === regionId ? { ...r, enabled: !r.enabled } : r
                )
              )
            }}
          />
        </div>
      </div>
    </section>
  )
}
