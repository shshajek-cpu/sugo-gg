'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import ProgressBar from './ProgressBar'
import ShugoFestaCard from './ShugoFestaCard'
import AbyssHallwayCard from './AbyssHallwayCard'
import { getWeekKey, getGameDate, isEditable } from '../utils/dateUtils'
import { useDeviceId } from '../hooks'
import styles from './WeeklyContentSection.module.css'

interface WeeklyContentSectionProps {
  characterId: string | null
  selectedDate: string
  onDebugLog?: (type: 'load' | 'save' | 'error' | 'info', message: string, data?: any) => void
  shugoInitialSync?: number // 초기설정에서 전달된 슈고페스타 횟수
  onShugoSyncComplete?: () => void // 동기화 완료 콜백
  shugoBonusCharge?: number // 이용권 충전에서 전달된 보너스 충전 횟수
  onShugoBonusChargeComplete?: () => void // 보너스 충전 완료 콜백
}

const DEFAULT_ABYSS_REGIONS = [
  { id: 'ereshrantas_root', name: '에렌슈란타의 뿌리', enabled: false },
  { id: 'siels_wing', name: '시엘의 날개군도', enabled: false },
  { id: 'sulfur_tree', name: '유황나무섬', enabled: false }
]

export default function WeeklyContentSection({ characterId, selectedDate, onDebugLog, shugoInitialSync, onShugoSyncComplete, shugoBonusCharge, onShugoBonusChargeComplete }: WeeklyContentSectionProps) {
  const { getAuthHeader } = useDeviceId()

  const log = (type: 'load' | 'save' | 'error' | 'info', message: string, data?: any) => {
    console.log(`[WeeklyContent] ${message}`, data || '')
    onDebugLog?.(type, `[주간] ${message}`, data)
  }

  // 로딩 상태 (로딩 중에는 저장 안 함)
  const isLoadingRef = useRef(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 주간 키 계산 (수요일 5시 기준)
  const weekKey = useMemo(() => getWeekKey(new Date(selectedDate)), [selectedDate])

  // 수정 가능 여부 (당일만)
  const canEdit = useMemo(() => isEditable(selectedDate), [selectedDate])

  // 게임 날짜 (새벽 5시 기준) - 사명용
  const gameDate = useMemo(() => {
    return getGameDate(new Date(selectedDate))
  }, [selectedDate])

  // 사명 상태 (매일 5:30 리셋)
  const [missionCount, setMissionCount] = useState(0)

  // 주간 지령서 상태 (수요일 5시 리셋)
  const [weeklyOrderCount, setWeeklyOrderCount] = useState(0)
  const [abyssOrderCount, setAbyssOrderCount] = useState(0)

  // 슈고 페스타 상태 (02:00 기준 3시간마다 1회 충전, 최대 14회)
  const [shugoTickets, setShugoTickets] = useState({ base: 14, bonus: 0, lastChargeTime: '' })

  // 어비스 회랑 상태 (주간)
  const [abyssRegions, setAbyssRegions] = useState(DEFAULT_ABYSS_REGIONS)

  // 슈고 페스타 충전 시간 계산 (02:00 기준 3시간마다: 2, 5, 8, 11, 14, 17, 20, 23시)
  const getShugoChargeHours = () => [2, 5, 8, 11, 14, 17, 20, 23]

  // 마지막 충전 시간 이후 충전 횟수 계산
  const calculateShugoCharges = (lastChargeTime: string | null): number => {
    const chargeHours = getShugoChargeHours()
    const now = new Date()

    if (!lastChargeTime) {
      return 0
    }

    const lastCharge = new Date(lastChargeTime)
    let charges = 0

    const current = new Date(lastCharge)
    current.setMinutes(0, 0, 0)

    while (current <= now) {
      const hour = current.getHours()
      if (chargeHours.includes(hour) && current > lastCharge) {
        charges++
      }
      current.setHours(current.getHours() + 1)
    }

    return charges
  }

  // DB에서 주간 데이터 로드
  const loadFromDatabase = useCallback(async () => {
    if (!characterId) return null

    try {
      const res = await fetch(
        `/api/ledger/weekly-content?characterId=${characterId}&weekKey=${weekKey}&gameDate=${gameDate}`,
        { headers: getAuthHeader() }
      )

      if (!res.ok) {
        if (res.status === 404) return null
        throw new Error('Failed to load weekly content')
      }

      return await res.json()
    } catch (err) {
      console.error('Failed to load weekly content from DB:', err)
      return null
    }
  }, [characterId, weekKey, gameDate, getAuthHeader])

  // DB에 주간 데이터 저장
  const saveToDatabase = useCallback(async () => {
    if (!characterId || isLoadingRef.current) return

    try {
      await fetch('/api/ledger/weekly-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          characterId,
          weekKey,
          gameDate,
          weeklyOrderCount,
          abyssOrderCount,
          shugoTickets,
          abyssRegions,
          missionCount
        })
      })
      log('save', 'DB 저장 완료')
    } catch (err) {
      log('error', 'DB 저장 실패', err)
    }
  }, [characterId, weekKey, gameDate, weeklyOrderCount, abyssOrderCount, shugoTickets, abyssRegions, missionCount, getAuthHeader])

  // 디바운스된 저장
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveToDatabase()
    }, 500)
  }, [saveToDatabase])

  // 데이터 로드 (캐릭터/주간 변경 시)
  useEffect(() => {
    log('load', `캐릭터/주간 변경: ${characterId}, ${weekKey}`)
    isLoadingRef.current = true

    if (!characterId) {
      setMissionCount(0)
      setWeeklyOrderCount(0)
      setAbyssOrderCount(0)
      setShugoTickets({ base: 14, bonus: 0, lastChargeTime: '' })
      setAbyssRegions(DEFAULT_ABYSS_REGIONS)
      isLoadingRef.current = false
      return
    }

    const loadData = async () => {
      const data = await loadFromDatabase()

      if (data?.weekly) {
        log('load', '주간 데이터 로드 성공', data.weekly)
        setWeeklyOrderCount(data.weekly.weeklyOrderCount ?? 0)
        setAbyssOrderCount(data.weekly.abyssOrderCount ?? 0)

        // 슈고페스타 자동 충전 계산
        const savedShugo = data.weekly.shugoTickets ?? { base: 14, bonus: 0, lastChargeTime: '' }
        const charges = calculateShugoCharges(savedShugo.lastChargeTime)
        const newBase = Math.min(14, savedShugo.base + charges)
        setShugoTickets({
          ...savedShugo,
          base: newBase,
          lastChargeTime: charges > 0 ? new Date().toISOString() : savedShugo.lastChargeTime
        })

        setAbyssRegions(data.weekly.abyssRegions ?? DEFAULT_ABYSS_REGIONS)
      } else {
        log('info', '저장된 주간 데이터 없음, 초기화')
        setWeeklyOrderCount(0)
        setAbyssOrderCount(0)
        setShugoTickets({ base: 14, bonus: 0, lastChargeTime: new Date().toISOString() })
        setAbyssRegions(DEFAULT_ABYSS_REGIONS)
      }

      if (data?.mission) {
        setMissionCount(data.mission.count ?? 0)
      } else {
        setMissionCount(0)
      }

      setTimeout(() => {
        isLoadingRef.current = false
        log('info', '로딩 완료')
      }, 100)
    }

    loadData()
  }, [characterId, weekKey, loadFromDatabase])

  // 슈고 페스타 초기설정 동기화
  useEffect(() => {
    if (shugoInitialSync !== undefined && characterId) {
      log('info', `슈고페스타 초기설정 동기화: ${shugoInitialSync}회`)
      setShugoTickets({
        base: shugoInitialSync,
        bonus: 0,
        lastChargeTime: new Date().toISOString()
      })
      onShugoSyncComplete?.()
    }
  }, [shugoInitialSync, characterId])

  // 슈고 페스타 보너스 충전 (이용권 충전에서)
  useEffect(() => {
    if (shugoBonusCharge !== undefined && shugoBonusCharge > 0 && characterId) {
      log('info', `슈고페스타 보너스 충전: +${shugoBonusCharge}회`)
      setShugoTickets(prev => ({
        ...prev,
        bonus: prev.bonus + shugoBonusCharge
      }))
      onShugoBonusChargeComplete?.()
    }
  }, [shugoBonusCharge, characterId])

  // 슈고 페스타 자동 충전 체크 (1분마다)
  useEffect(() => {
    if (!characterId) return

    const checkAutoCharge = () => {
      setShugoTickets(prev => {
        if (prev.base >= 14) return prev

        const charges = calculateShugoCharges(prev.lastChargeTime)
        if (charges > 0) {
          const newBase = Math.min(14, prev.base + charges)
          log('info', `슈고 페스타 자동 충전: +${charges} (${prev.base} -> ${newBase})`)
          return {
            ...prev,
            base: newBase,
            lastChargeTime: new Date().toISOString()
          }
        }
        return prev
      })
    }

    const interval = setInterval(checkAutoCharge, 60000)

    return () => clearInterval(interval)
  }, [characterId])

  // 데이터 변경 시 DB 저장 (디바운스)
  useEffect(() => {
    if (!characterId || isLoadingRef.current) return
    debouncedSave()
  }, [characterId, weeklyOrderCount, abyssOrderCount, shugoTickets, abyssRegions, missionCount, debouncedSave])

  // 컴포넌트 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

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
            resetType="daily"
            onIncrement={() => setMissionCount(prev => Math.min(5, prev + 1))}
            onDecrement={() => setMissionCount(prev => Math.max(0, prev - 1))}
            onComplete={() => setMissionCount(5)}
            readOnly={!canEdit}
          />

          <ProgressBar
            id="weekly_order"
            name="주간 지령서"
            icon="📋"
            currentCount={weeklyOrderCount}
            maxCount={12}
            resetType="weekly"
            onIncrement={() => setWeeklyOrderCount(prev => Math.min(12, prev + 1))}
            onDecrement={() => setWeeklyOrderCount(prev => Math.max(0, prev - 1))}
            onComplete={() => setWeeklyOrderCount(12)}
            readOnly={!canEdit}
          />

          <ProgressBar
            id="abyss_order"
            name="어비스 주간 지령서"
            icon="🔥"
            currentCount={abyssOrderCount}
            maxCount={20}
            resetType="weekly"
            onIncrement={() => setAbyssOrderCount(prev => Math.min(20, prev + 1))}
            onDecrement={() => setAbyssOrderCount(prev => Math.max(0, prev - 1))}
            onComplete={() => setAbyssOrderCount(20)}
            readOnly={!canEdit}
          />
        </div>

        {/* 오른쪽 35%: 슈고 페스타 & 어비스 회랑 */}
        <div className={styles.rightColumn}>
          <ShugoFestaCard
            currentTickets={shugoTickets.base}
            maxTickets={14}
            bonusTickets={shugoTickets.bonus}
            onTicketUse={() => {
              setShugoTickets(prev => {
                if (prev.bonus > 0) {
                  return {
                    ...prev,
                    bonus: prev.bonus - 1
                  }
                } else {
                  return {
                    ...prev,
                    base: Math.max(0, prev.base - 1),
                    lastChargeTime: prev.lastChargeTime || new Date().toISOString()
                  }
                }
              })
            }}
            onTicketRefund={() => {
              setShugoTickets(prev => ({
                ...prev,
                base: Math.min(14, prev.base + 1)
              }))
            }}
            readOnly={!canEdit}
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
            readOnly={!canEdit}
          />
        </div>
      </div>
    </section>
  )
}
