'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { TrendingUp, Calendar, CalendarDays } from 'lucide-react'
import { LedgerCharacter, ItemGrade } from '@/types/ledger'
import IncomeChart from './IncomeChart'
import CharacterStatusTable from './CharacterStatusTable'
import TotalItemsSummary from './TotalItemsSummary'
import ContentProgressSummary from './ContentProgressSummary'
import styles from '../ledger.module.css'

interface DailyIncome {
  date: string
  characterId: string
  characterName: string
  income: number
}

interface ItemByCharacter {
  characterId: string
  characterName: string
  quantity: number
  price: number
}

interface AggregatedItem {
  itemName: string
  itemGrade: ItemGrade
  iconUrl?: string
  totalQuantity: number
  totalPrice: number
  byCharacter: ItemByCharacter[]
}

interface ContentProgress {
  id: string
  name: string
  current: number
  max: number
}

interface CharacterStatus {
  character: LedgerCharacter
  todayIncome: number
  weeklyIncome: number
  sellingItemCount: number
  soldItemCount: number
  weeklyContents: ContentProgress[]
  dailyContents: ContentProgress[]
}

interface DashboardSummaryProps {
  characters: LedgerCharacter[]
  totalTodayIncome: number
  totalWeeklyIncome: number
  unsoldItemCount: number
  unsoldItemsByGrade: {
    legendary: number
    heroic: number
    rare: number
    common: number
    ultimate: number
  }
  onCharacterClick: (characterId: string) => void
  getAuthHeader?: () => Record<string, string>
}

// 주간 컨텐츠 기본 정의
const WEEKLY_CONTENT_DEFS = [
  { id: 'transcend', name: '초월', maxPerChar: 14 },
  { id: 'expedition', name: '원정', maxPerChar: 21 },
  { id: 'sanctuary', name: '성역', maxPerChar: 4 },
  { id: 'mission', name: '사명', maxPerChar: 5 },
  { id: 'weekly_order', name: '주간지령서', maxPerChar: 12 },
  { id: 'abyss_order', name: '어비스지령서', maxPerChar: 20 },
  { id: 'shugo', name: '슈고페스타', maxPerChar: 14 },
]

// 일일 컨텐츠 기본 정의
const DAILY_CONTENT_DEFS = [
  { id: 'daily_dungeon', name: '일일던전', maxPerChar: 6 },
  { id: 'subjugation', name: '토벌전', maxPerChar: 6 },
  { id: 'awakening', name: '각성전', maxPerChar: 6 },
  { id: 'nightmare', name: '악몽', maxPerChar: 6 },
  { id: 'dimension', name: '차원침공', maxPerChar: 6 },
  { id: 'abyss_hallway', name: '어비스회랑', maxPerChar: 3 },
]

export default function DashboardSummary({
  characters,
  totalTodayIncome,
  totalWeeklyIncome,
  unsoldItemCount,
  unsoldItemsByGrade,
  onCharacterClick,
  getAuthHeader
}: DashboardSummaryProps) {
  // 대시보드 데이터 상태
  const [dailyIncomes, setDailyIncomes] = useState<DailyIncome[]>([])
  const [characterStatuses, setCharacterStatuses] = useState<CharacterStatus[]>([])
  const [sellingItems, setSellingItems] = useState<AggregatedItem[]>([])
  const [soldItems, setSoldItems] = useState<AggregatedItem[]>([])
  const [totalSoldIncome, setTotalSoldIncome] = useState(0)
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // 주간/일일 컨텐츠 전체 진행률
  const [weeklyContents, setWeeklyContents] = useState<ContentProgress[]>([])
  const [dailyContents, setDailyContents] = useState<ContentProgress[]>([])

  const formatKina = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return value.toLocaleString('ko-KR')
  }

  // 대시보드 데이터 로드
  const loadDashboardData = useCallback(async () => {
    if (characters.length === 0) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const authHeaders = getAuthHeader?.() || {}
      const charStatuses: CharacterStatus[] = []
      const allDailyIncomes: DailyIncome[] = []
      const allItems: any[] = []
      let totalMonthlyIncome = 0

      // 캐릭터별 데이터 로드 (병렬 처리)
      const charDataPromises = characters.map(async (char) => {
        try {
          // 병렬로 데이터 요청
          const [itemsRes, statsRes, weeklyStatsRes] = await Promise.all([
            fetch(`/api/ledger/items?characterId=${char.id}`, { headers: authHeaders }),
            fetch(`/api/ledger/stats?characterId=${char.id}&type=summary`, { headers: authHeaders }),
            fetch(`/api/ledger/stats?characterId=${char.id}&type=weekly`, { headers: authHeaders })
          ])

          const itemsData = itemsRes.ok ? await itemsRes.json() : []
          const statsData = statsRes.ok ? await statsRes.json() : {}
          const weeklyStatsData = weeklyStatsRes.ok ? await weeklyStatsRes.json() : { dailyData: [] }

          return { char, itemsData, statsData, weeklyStatsData }
        } catch (e) {
          console.error('Error loading character data:', char.id, e)
          return { char, itemsData: [], statsData: {}, weeklyStatsData: { dailyData: [] } }
        }
      })

      const charDataResults = await Promise.all(charDataPromises)

      // 결과 처리
      for (const { char, itemsData, statsData, weeklyStatsData } of charDataResults) {
        // 아이템 데이터 수집
        allItems.push(...itemsData.map((item: any) => ({
          ...item,
          characterId: char.id,
          characterName: char.name
        })))

        // 월간 수입 합산
        totalMonthlyIncome += statsData.monthlyIncome || 0

        // 일별 수익 데이터 수집 (그래프용)
        if (weeklyStatsData.dailyData) {
          weeklyStatsData.dailyData.forEach((day: any) => {
            allDailyIncomes.push({
              date: day.date,
              characterId: char.id,
              characterName: char.name,
              income: day.totalIncome || 0
            })
          })
        }

        // 컨텐츠 진행률 계산
        const weeklyProgressForChar = WEEKLY_CONTENT_DEFS.map(def => {
          let current = 0
          // localStorage에서 주간 데이터 읽기
          if (typeof window !== 'undefined') {
            const weekKey = getWeekKey(new Date())
            const storageKey = `weeklyOrders_${char.id}_${weekKey}`
            const saved = localStorage.getItem(storageKey)
            if (saved) {
              try {
                const parsed = JSON.parse(saved)
                if (def.id === 'weekly_order') current = parsed.weeklyOrderCount || 0
                else if (def.id === 'abyss_order') current = parsed.abyssOrderCount || 0
                else if (def.id === 'shugo') current = 14 - (parsed.shugoTickets?.base || 14)
              } catch (e) {}
            }

            // 던전 기록에서 진행률 가져오기
            const dungeonKey = `dungeonRecords_${char.id}_${new Date().toISOString().split('T')[0]}`
            const dungeonSaved = localStorage.getItem(dungeonKey)
            if (dungeonSaved) {
              try {
                const parsed = JSON.parse(dungeonSaved)
                if (def.id === 'transcend') current = parsed.transcend?.length || 0
                else if (def.id === 'expedition') current = parsed.expedition?.length || 0
                else if (def.id === 'sanctuary') current = parsed.sanctuary?.length || 0
              } catch (e) {}
            }

            // 사명 데이터
            if (def.id === 'mission') {
              const missionKey = `mission_${char.id}_${getGameDate(new Date())}`
              const missionSaved = localStorage.getItem(missionKey)
              current = missionSaved ? parseInt(missionSaved, 10) || 0 : 0
            }
          }

          return { id: def.id, name: def.name, current, max: def.maxPerChar }
        })

        const dailyProgressForChar = DAILY_CONTENT_DEFS.map(def => {
          let current = 0
          if (typeof window !== 'undefined') {
            const dailyKey = `dailyContent_${char.id}_${new Date().toISOString().split('T')[0]}`
            const saved = localStorage.getItem(dailyKey)
            if (saved) {
              try {
                const parsed = JSON.parse(saved)
                const contentData = parsed[def.id]
                if (contentData) current = contentData.completionCount || 0
              } catch (e) {}
            }
          }
          return { id: def.id, name: def.name, current, max: def.maxPerChar }
        })

        const sellingCount = itemsData.filter((i: any) => i.sold_price === null).length
        const soldCount = itemsData.filter((i: any) => i.sold_price !== null).length

        charStatuses.push({
          character: char,
          todayIncome: statsData.todayIncome || char.todayIncome || 0,
          weeklyIncome: statsData.weeklyIncome || char.weeklyIncome || 0,
          sellingItemCount: sellingCount,
          soldItemCount: soldCount,
          weeklyContents: weeklyProgressForChar,
          dailyContents: dailyProgressForChar
        })
      }

      setCharacterStatuses(charStatuses)

      // 아이템 합산 처리
      const sellingItemsMap = new Map<string, AggregatedItem>()
      const soldItemsMap = new Map<string, AggregatedItem>()
      let soldIncomeTotal = 0

      allItems.forEach((item: any) => {
        const isSold = item.sold_price !== null
        const map = isSold ? soldItemsMap : sellingItemsMap
        const key = item.item_name
        const price = isSold ? (item.sold_price || 0) : (item.total_price || item.unit_price || 0)

        if (isSold) {
          soldIncomeTotal += item.sold_price || 0
        }

        if (map.has(key)) {
          const existing = map.get(key)!
          existing.totalQuantity += item.quantity || 1
          existing.totalPrice += price
          // iconUrl이 없으면 기존 아이템의 것 유지, 있으면 업데이트
          if (!existing.iconUrl && item.icon_url) {
            existing.iconUrl = item.icon_url
          }
          existing.byCharacter.push({
            characterId: item.characterId,
            characterName: item.characterName,
            quantity: item.quantity || 1,
            price: price
          })
        } else {
          map.set(key, {
            itemName: item.item_name,
            itemGrade: item.item_grade || 'common',
            iconUrl: item.icon_url,
            totalQuantity: item.quantity || 1,
            totalPrice: price,
            byCharacter: [{
              characterId: item.characterId,
              characterName: item.characterName,
              quantity: item.quantity || 1,
              price: price
            }]
          })
        }
      })

      setSellingItems(Array.from(sellingItemsMap.values()))
      setSoldItems(Array.from(soldItemsMap.values()))
      setTotalSoldIncome(soldIncomeTotal)

      // 전체 컨텐츠 진행률 합산
      const weeklyTotal = WEEKLY_CONTENT_DEFS.map(def => {
        const total = charStatuses.reduce((acc, cs) => {
          const content = cs.weeklyContents.find(c => c.id === def.id)
          return {
            current: acc.current + (content?.current || 0),
            max: acc.max + def.maxPerChar
          }
        }, { current: 0, max: 0 })
        return { id: def.id, name: def.name, current: total.current, max: total.max }
      })

      const dailyTotal = DAILY_CONTENT_DEFS.map(def => {
        const total = charStatuses.reduce((acc, cs) => {
          const content = cs.dailyContents.find(c => c.id === def.id)
          return {
            current: acc.current + (content?.current || 0),
            max: acc.max + def.maxPerChar
          }
        }, { current: 0, max: 0 })
        return { id: def.id, name: def.name, current: total.current, max: total.max }
      })

      setWeeklyContents(weeklyTotal)
      setDailyContents(dailyTotal)

      // 수익 그래프용 일별 데이터 설정
      setDailyIncomes(allDailyIncomes)
      setMonthlyIncome(totalMonthlyIncome)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [characters, getAuthHeader])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // 판매중/완료 아이템 총 개수
  const totalSellingCount = sellingItems.reduce((sum, item) => sum + item.totalQuantity, 0)
  const totalSoldCount = soldItems.reduce((sum, item) => sum + item.totalQuantity, 0)

  return (
    <>
      {/* 전체 수입 현황 */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <TrendingUp size={18} />
            전체 수입 현황
          </h2>
        </div>

        <div className={styles.kinaGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className={styles.kinaCard}>
            <div className={styles.kinaLabel}>
              <Calendar size={14} />
              오늘 총 수입
            </div>
            <div className={styles.kinaValue}>
              {formatKina(totalTodayIncome)} 키나
            </div>
          </div>

          <div className={styles.kinaCard}>
            <div className={styles.kinaLabel}>
              <TrendingUp size={14} />
              이번주 총 수입
            </div>
            <div className={styles.kinaValue}>
              {formatKina(totalWeeklyIncome)} 키나
            </div>
          </div>

          <div className={styles.kinaCard}>
            <div className={styles.kinaLabel}>
              <CalendarDays size={14} />
              이번달 총 수입
            </div>
            <div className={styles.kinaValue}>
              {formatKina(monthlyIncome)} 키나
            </div>
          </div>
        </div>
      </section>

      {/* 수익 그래프 */}
      <IncomeChart
        characters={characters}
        dailyIncomes={dailyIncomes}
        isLoading={isLoading}
      />

      {/* 캐릭터별 현황 */}
      <CharacterStatusTable
        characterStatuses={characterStatuses}
        onCharacterClick={onCharacterClick}
      />

      {/* 전체 아이템 현황 */}
      <TotalItemsSummary
        sellingItems={sellingItems}
        soldItems={soldItems}
        totalSellingCount={totalSellingCount}
        totalSoldCount={totalSoldCount}
        totalSoldIncome={totalSoldIncome}
      />

      {/* 컨텐츠 진행 현황 */}
      <ContentProgressSummary
        weeklyContents={weeklyContents}
        dailyContents={dailyContents}
        characterCount={characters.length}
      />
    </>
  )
}

// 유틸 함수들
function getWeekKey(date: Date): string {
  const d = new Date(date)
  const dayOfWeek = d.getDay()
  const hour = d.getHours()

  // 수요일 5시 기준으로 주간 계산
  if (dayOfWeek < 3 || (dayOfWeek === 3 && hour < 5)) {
    d.setDate(d.getDate() - ((dayOfWeek + 4) % 7))
  } else {
    d.setDate(d.getDate() - ((dayOfWeek - 3) % 7))
  }

  return d.toISOString().split('T')[0]
}

function getGameDate(date: Date): string {
  const d = new Date(date)
  const hour = d.getHours()

  // 새벽 5시 이전이면 전날로 처리
  if (hour < 5) {
    d.setDate(d.getDate() - 1)
  }

  return d.toISOString().split('T')[0]
}
