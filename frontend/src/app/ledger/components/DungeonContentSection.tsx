'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import ContentCard from './ContentCard'
import OdEnergyBar from './OdEnergyBar'
import { getWeekKey, isEditable } from '../utils/dateUtils'
import styles from './DungeonContentSection.module.css'

interface Boss {
  id: string
  name: string
  imageUrl: string
  kina?: number
}

interface Tier {
  tier: number
  kina: number
}

interface Category {
  id: string
  name: string
  bosses: Boss[]
}

interface DungeonData {
  transcend: {
    maxTickets: number
    bosses: Boss[]
    tiers: Tier[]
  }
  expedition: {
    maxTickets: number
    categories: Category[]
  }
  sanctuary: {
    maxTickets: number
    categories: Category[]
  }
}

interface ContentRecord {
  id: string
  bossName: string
  tier?: number
  category?: string
  count: number
  kina: number
}

interface DungeonContentSectionProps {
  characterId: string | null
  selectedDate: string
  baseTickets?: {
    transcend: number
    expedition: number
    sanctuary: number
  }
  bonusTickets?: {
    transcend: number
    expedition: number
    sanctuary: number
  }
  onBaseTicketsChange?: (updates: Record<string, number>) => void
  onBonusTicketsChange?: (updates: Record<string, number>) => void
  odEnergy?: {
    timeEnergy: number
    ticketEnergy: number
    nextChargeIn: number
  }
  onOdEnergyDeduct?: (amount: number) => boolean
  onOdEnergyRestore?: (amount: number) => void
  onTotalKinaChange?: (totalKina: number) => void
}

export default function DungeonContentSection({
  characterId,
  selectedDate,
  baseTickets = { transcend: 14, expedition: 21, sanctuary: 4 },
  bonusTickets = { transcend: 0, expedition: 0, sanctuary: 0 },
  onBaseTicketsChange,
  onBonusTicketsChange,
  odEnergy = { timeEnergy: 840, ticketEnergy: 0, nextChargeIn: 30 },
  onOdEnergyDeduct,
  onOdEnergyRestore,
  onTotalKinaChange
}: DungeonContentSectionProps) {
  // 로딩 상태 (로딩 중에는 저장 안 함)
  const isLoadingRef = useRef(false)

  // 주간 키 계산 (수요일 5시 기준)
  const weekKey = useMemo(() => getWeekKey(new Date(selectedDate)), [selectedDate])

  // 수정 가능 여부 (이틀 전까지만)
  const canEdit = useMemo(() => isEditable(selectedDate), [selectedDate])

  const [dungeonData, setDungeonData] = useState<DungeonData | null>(null)

  // 접기/펼치기 상태 (localStorage에서 불러오기)
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dungeonCardsCollapsed')
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  // 초월 상태 (props 우선, 없으면 기본값)
  const [transcendTickets, setTranscendTickets] = useState({ base: baseTickets.transcend || 14, bonus: 0 })
  const [transcendDouble, setTranscendDouble] = useState(false)
  const [transcendBoss, setTranscendBoss] = useState('')
  const [transcendTier, setTranscendTier] = useState(1)
  const [transcendRecords, setTranscendRecords] = useState<ContentRecord[]>([])

  // 원정 상태 (props 우선, 없으면 기본값)
  const [expeditionTickets, setExpeditionTickets] = useState({ base: baseTickets.expedition || 21, bonus: 0 })
  const [expeditionDouble, setExpeditionDouble] = useState(false)
  const [expeditionCategory, setExpeditionCategory] = useState('')
  const [expeditionBoss, setExpeditionBoss] = useState('')
  const [expeditionRecords, setExpeditionRecords] = useState<ContentRecord[]>([])

  // 성역 상태 (props 우선, 없으면 기본값)
  const [sanctuaryTickets, setSanctuaryTickets] = useState({ base: baseTickets.sanctuary || 4, bonus: 0 })
  const [sanctuaryDouble, setSanctuaryDouble] = useState(false)
  const [sanctuaryBoss, setSanctuaryBoss] = useState('')
  const [sanctuaryRecords, setSanctuaryRecords] = useState<ContentRecord[]>([])

  // 티켓 불러오기 (주간 기준 - 수요일 5시 리셋)
  useEffect(() => {
    if (!characterId) {
      setTranscendTickets({ base: dungeonData?.transcend?.maxTickets || 14, bonus: 0 })
      setExpeditionTickets({ base: dungeonData?.expedition?.maxTickets || 21, bonus: 0 })
      setSanctuaryTickets({ base: dungeonData?.sanctuary?.maxTickets || 4, bonus: 0 })
      return
    }

    const ticketKey = `dungeonTickets_${characterId}_${weekKey}`
    const savedTickets = localStorage.getItem(ticketKey)
    if (savedTickets) {
      try {
        const parsed = JSON.parse(savedTickets)
        if (parsed.transcendTickets) setTranscendTickets(parsed.transcendTickets)
        if (parsed.expeditionTickets) setExpeditionTickets(parsed.expeditionTickets)
        if (parsed.sanctuaryTickets) setSanctuaryTickets(parsed.sanctuaryTickets)
      } catch (e) {
        console.error('Failed to parse dungeon tickets:', e)
        setTranscendTickets({ base: dungeonData?.transcend?.maxTickets || 14, bonus: 0 })
        setExpeditionTickets({ base: dungeonData?.expedition?.maxTickets || 21, bonus: 0 })
        setSanctuaryTickets({ base: dungeonData?.sanctuary?.maxTickets || 4, bonus: 0 })
      }
    } else {
      setTranscendTickets({ base: dungeonData?.transcend?.maxTickets || 14, bonus: 0 })
      setExpeditionTickets({ base: dungeonData?.expedition?.maxTickets || 21, bonus: 0 })
      setSanctuaryTickets({ base: dungeonData?.sanctuary?.maxTickets || 4, bonus: 0 })
    }
  }, [characterId, weekKey, dungeonData])

  // 티켓 저장 (주간 기준)
  useEffect(() => {
    if (!characterId || isLoadingRef.current || !canEdit) return

    const ticketData = {
      transcendTickets,
      expeditionTickets,
      sanctuaryTickets
    }
    const ticketKey = `dungeonTickets_${characterId}_${weekKey}`
    localStorage.setItem(ticketKey, JSON.stringify(ticketData))
  }, [characterId, weekKey, canEdit, transcendTickets, expeditionTickets, sanctuaryTickets])

  // 기록 불러오기 (일별 기준 - 당일만 표시)
  useEffect(() => {
    isLoadingRef.current = true

    if (!characterId) {
      setTranscendRecords([])
      setExpeditionRecords([])
      setSanctuaryRecords([])
      setTranscendDouble(false)
      setExpeditionDouble(false)
      setSanctuaryDouble(false)
      isLoadingRef.current = false
      return
    }

    // 기록 초기화
    setTranscendRecords([])
    setExpeditionRecords([])
    setSanctuaryRecords([])
    setTranscendDouble(false)
    setExpeditionDouble(false)
    setSanctuaryDouble(false)

    // localStorage에서 캐릭터+날짜별 기록 불러오기
    const recordKey = `dungeonRecords_${characterId}_${selectedDate}`
    const savedRecords = localStorage.getItem(recordKey)
    if (savedRecords) {
      try {
        const parsed = JSON.parse(savedRecords)
        if (parsed.transcend) setTranscendRecords(parsed.transcend)
        if (parsed.expedition) setExpeditionRecords(parsed.expedition)
        if (parsed.sanctuary) setSanctuaryRecords(parsed.sanctuary)
        if (parsed.transcendDouble !== undefined) setTranscendDouble(parsed.transcendDouble)
        if (parsed.expeditionDouble !== undefined) setExpeditionDouble(parsed.expeditionDouble)
        if (parsed.sanctuaryDouble !== undefined) setSanctuaryDouble(parsed.sanctuaryDouble)
      } catch (e) {
        console.error('Failed to parse dungeon records:', e)
      }
    }

    setTimeout(() => {
      isLoadingRef.current = false
    }, 100)
  }, [characterId, selectedDate])

  // 기록 저장 (일별 기준)
  useEffect(() => {
    if (!characterId || isLoadingRef.current || !canEdit) return

    const recordData = {
      transcend: transcendRecords,
      expedition: expeditionRecords,
      sanctuary: sanctuaryRecords,
      transcendDouble,
      expeditionDouble,
      sanctuaryDouble
    }
    const recordKey = `dungeonRecords_${characterId}_${selectedDate}`
    localStorage.setItem(recordKey, JSON.stringify(recordData))
  }, [characterId, selectedDate, canEdit, transcendRecords, expeditionRecords, sanctuaryRecords, transcendDouble, expeditionDouble, sanctuaryDouble])

  // 총 키나 변경 시 부모에게 알림
  useEffect(() => {
    if (onTotalKinaChange) {
      const totalKina =
        transcendRecords.reduce((sum, r) => sum + (r.kina || 0), 0) +
        expeditionRecords.reduce((sum, r) => sum + (r.kina || 0), 0) +
        sanctuaryRecords.reduce((sum, r) => sum + (r.kina || 0), 0)
      onTotalKinaChange(totalKina)
    }
  }, [transcendRecords, expeditionRecords, sanctuaryRecords, onTotalKinaChange])

  // 던전 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/ledger/dungeon-data')
        const data = await res.json()

        // 초월 데이터 변환
        const transcendData = {
          maxTickets: data.transcend.maxTickets,
          bosses: data.transcend.bosses,
          tiers: data.transcend.bosses[0].tiers
        }

        // 원정 데이터 변환
        const expeditionData = {
          maxTickets: data.expedition.maxTickets,
          categories: data.expedition.categories
        }

        // 성역 데이터 변환
        const sanctuaryData = {
          maxTickets: data.sanctuary.maxTickets,
          categories: data.sanctuary.categories
        }

        setDungeonData({
          transcend: transcendData,
          expedition: expeditionData,
          sanctuary: sanctuaryData
        })

        // 초기 선택값 설정
        if (transcendData.bosses.length > 0) {
          setTranscendBoss(transcendData.bosses[0].id)
        }
        if (expeditionData.categories.length > 0) {
          setExpeditionCategory(expeditionData.categories[0].id)
          if (expeditionData.categories[0].bosses.length > 0) {
            setExpeditionBoss(expeditionData.categories[0].bosses[0].id)
          }
        }
        if (sanctuaryData.categories.length > 0 && sanctuaryData.categories[0].bosses.length > 0) {
          setSanctuaryBoss(sanctuaryData.categories[0].bosses[0].id)
        }
      } catch (error) {
        console.error('Failed to load dungeon data:', error)
      }
    }

    fetchData()
  }, [])

  // 초월 기록 추가
  const handleAddTranscendRecord = (record: Omit<ContentRecord, 'id'>) => {
    setTranscendRecords(prev => {
      // 같은 조합 찾기
      const existing = prev.find(
        r => r.bossName === record.bossName && r.tier === record.tier
      )

      if (existing) {
        // 누적
        return prev.map(r =>
          r.id === existing.id
            ? { ...r, count: r.count + record.count, kina: r.kina + record.kina }
            : r
        )
      } else {
        // 새로 추가
        return [...prev, { ...record, id: Date.now().toString() }]
      }
    })
  }

  // 초월 기록 삭제
  const handleDeleteTranscendRecord = (recordId: string, count: number) => {
    setTranscendRecords(prev => prev.filter(r => r.id !== recordId))
  }

  // 원정 기록 추가
  const handleAddExpeditionRecord = (record: Omit<ContentRecord, 'id'>) => {
    setExpeditionRecords(prev => {
      // 같은 조합 찾기
      const existing = prev.find(
        r => r.bossName === record.bossName && r.category === record.category
      )

      if (existing) {
        // 누적
        return prev.map(r =>
          r.id === existing.id
            ? { ...r, count: r.count + record.count, kina: r.kina + record.kina }
            : r
        )
      } else {
        // 새로 추가
        return [...prev, { ...record, id: Date.now().toString() }]
      }
    })
  }

  // 원정 기록 삭제
  const handleDeleteExpeditionRecord = (recordId: string, count: number) => {
    setExpeditionRecords(prev => prev.filter(r => r.id !== recordId))
  }

  // 카테고리 변경 시 보스 초기화
  const handleExpeditionCategoryChange = (categoryId: string) => {
    setExpeditionCategory(categoryId)
    const category = dungeonData?.expedition.categories.find(c => c.id === categoryId)
    if (category && category.bosses.length > 0) {
      setExpeditionBoss(category.bosses[0].id)
    }
  }

  // 성역 기록 추가
  const handleAddSanctuaryRecord = (record: Omit<ContentRecord, 'id'>) => {
    setSanctuaryRecords(prev => {
      // 같은 조합 찾기
      const existing = prev.find(r => r.bossName === record.bossName)

      if (existing) {
        // 누적
        return prev.map(r =>
          r.id === existing.id
            ? { ...r, count: r.count + record.count, kina: r.kina + record.kina }
            : r
        )
      } else {
        // 새로 추가
        return [...prev, { ...record, id: Date.now().toString() }]
      }
    })
  }

  // 성역 기록 삭제
  const handleDeleteSanctuaryRecord = (recordId: string, count: number) => {
    setSanctuaryRecords(prev => prev.filter(r => r.id !== recordId))
  }

  // 카드 접기/펼치기 토글
  const toggleCardCollapse = (cardId: string) => {
    setCollapsedCards(prev => {
      const newState = {
        ...prev,
        [cardId]: !prev[cardId]
      }
      // localStorage에 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('dungeonCardsCollapsed', JSON.stringify(newState))
      }
      return newState
    })
  }

  if (!dungeonData) {
    return <div className={styles.loading}>던전 데이터를 불러오는 중...</div>
  }

  // 현재 선택된 카테고리의 보스 목록
  const currentExpeditionBosses = dungeonData.expedition.categories.find(
    c => c.id === expeditionCategory
  )?.bosses || []

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>초월/원정/성역</h2>
        <OdEnergyBar
          timeEnergy={odEnergy.timeEnergy}
          ticketEnergy={odEnergy.ticketEnergy}
          maxTimeEnergy={840}
          maxTicketEnergy={2000}
          nextChargeIn={odEnergy.nextChargeIn}
        />
      </div>

      {/* 초월 카드 */}
      <ContentCard
        contentType="transcend"
        title="초월"
        maxTickets={dungeonData.transcend.maxTickets}
        currentTickets={transcendTickets.base}
        bonusTickets={bonusTickets.transcend}
        onTicketsChange={(base, bonus) => {
          setTranscendTickets({ base, bonus })
          if (onBaseTicketsChange) {
            onBaseTicketsChange({ transcend: base })
          }
          if (onBonusTicketsChange) {
            onBonusTicketsChange({ transcend: bonus })
          }
        }}
        bossOptions={dungeonData.transcend.bosses}
        tierOptions={dungeonData.transcend.tiers}
        isDoubleReward={transcendDouble}
        onDoubleToggle={() => setTranscendDouble(!transcendDouble)}
        records={transcendRecords}
        onAddRecord={handleAddTranscendRecord}
        onDeleteRecord={handleDeleteTranscendRecord}
        selectedBoss={transcendBoss}
        selectedTier={transcendTier}
        onBossChange={setTranscendBoss}
        onTierChange={setTranscendTier}
        collapsed={collapsedCards['transcend']}
        onToggleCollapse={() => toggleCardCollapse('transcend')}
        onOdEnergyDeduct={onOdEnergyDeduct}
        onOdEnergyRestore={onOdEnergyRestore}
        readOnly={!canEdit}
      />

      {/* 원정 카드 */}
      <ContentCard
        contentType="expedition"
        title="원정"
        maxTickets={dungeonData.expedition.maxTickets}
        currentTickets={expeditionTickets.base}
        bonusTickets={bonusTickets.expedition}
        onTicketsChange={(base, bonus) => {
          setExpeditionTickets({ base, bonus })
          if (onBaseTicketsChange) {
            onBaseTicketsChange({ expedition: base })
          }
          if (onBonusTicketsChange) {
            onBonusTicketsChange({ expedition: bonus })
          }
        }}
        bossOptions={currentExpeditionBosses}
        categoryOptions={dungeonData.expedition.categories}
        isDoubleReward={expeditionDouble}
        onDoubleToggle={() => setExpeditionDouble(!expeditionDouble)}
        records={expeditionRecords}
        onAddRecord={handleAddExpeditionRecord}
        onDeleteRecord={handleDeleteExpeditionRecord}
        selectedBoss={expeditionBoss}
        selectedCategory={expeditionCategory}
        onBossChange={setExpeditionBoss}
        onCategoryChange={handleExpeditionCategoryChange}
        collapsed={collapsedCards['expedition']}
        onToggleCollapse={() => toggleCardCollapse('expedition')}
        onOdEnergyDeduct={onOdEnergyDeduct}
        onOdEnergyRestore={onOdEnergyRestore}
        readOnly={!canEdit}
      />

      {/* 성역 카드 (심연의 재련: 루드라) */}
      <ContentCard
        contentType="sanctuary"
        title="심연의 재련: 루드라"
        maxTickets={dungeonData.sanctuary.maxTickets}
        currentTickets={sanctuaryTickets.base}
        bonusTickets={bonusTickets.sanctuary}
        onTicketsChange={(base, bonus) => {
          setSanctuaryTickets({ base, bonus })
          if (onBaseTicketsChange) {
            onBaseTicketsChange({ sanctuary: base })
          }
          if (onBonusTicketsChange) {
            onBonusTicketsChange({ sanctuary: bonus })
          }
        }}
        bossOptions={dungeonData.sanctuary.categories[0].bosses}
        categoryOptions={dungeonData.sanctuary.categories}
        isDoubleReward={sanctuaryDouble}
        onDoubleToggle={() => setSanctuaryDouble(!sanctuaryDouble)}
        records={sanctuaryRecords}
        onAddRecord={handleAddSanctuaryRecord}
        onDeleteRecord={handleDeleteSanctuaryRecord}
        selectedBoss={sanctuaryBoss}
        onBossChange={setSanctuaryBoss}
        collapsed={collapsedCards['sanctuary']}
        onToggleCollapse={() => toggleCardCollapse('sanctuary')}
        onOdEnergyDeduct={onOdEnergyDeduct}
        onOdEnergyRestore={onOdEnergyRestore}
        readOnly={!canEdit}
      />
    </section>
  )
}
