'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wallet } from 'lucide-react'
import {
  useDeviceId,
  useLedgerCharacters,
  useContentRecords,
  useLedgerItems,
  useWeeklyStats
} from './hooks'
import LedgerTabs from './components/LedgerTabs'
import DashboardSummary from './components/DashboardSummary'
import KinaOverview from './components/KinaOverview'
import ContentIncomeSection from './components/ContentIncomeSection'
import ItemSection from './components/ItemSection'
import WeeklyChart from './components/WeeklyChart'
import AddCharacterModal from './components/AddCharacterModal'
import AddItemModal from './components/AddItemModal'
import styles from './ledger.module.css'

export default function LedgerPage() {
  // 인증 (Google 또는 device_id)
  const { getAuthHeader, isLoading: isAuthLoading, isAuthenticated, deviceId } = useDeviceId()
  const isReady = !isAuthLoading && (isAuthenticated || !!deviceId)

  // 상태
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false)
  const [showAddItemModal, setShowAddItemModal] = useState(false)

  // 오늘 날짜
  const today = new Date().toISOString().split('T')[0]

  // 캐릭터 관리
  const {
    characters,
    isLoading: isCharactersLoading,
    addCharacter,
    removeCharacter,
    refetch: refetchCharacters
  } = useLedgerCharacters({ getAuthHeader, isReady })

  // 현재 선택된 캐릭터 ID
  const selectedCharacterId = activeTab !== 'dashboard' ? activeTab : characters[0]?.id || null

  // 컨텐츠 기록
  const {
    records,
    contentTypes,
    dungeonTiers,
    incrementCompletion,
    decrementCompletion,
    toggleDouble,
    changeDungeonTier,
    changeMaxCount,
    getTotalIncome: getContentTotalIncome
  } = useContentRecords({
    getAuthHeader,
    isReady,
    characterId: selectedCharacterId,
    date: today
  })

  // 아이템 관리
  const {
    items,
    filter,
    setFilter,
    addItem,
    sellItem,
    deleteItem,
    totalSoldIncome
  } = useLedgerItems({
    getAuthHeader,
    isReady,
    characterId: selectedCharacterId
  })

  // 주간 통계
  const {
    stats: weeklyStats,
    isLoading: isStatsLoading
  } = useWeeklyStats({
    characterId: selectedCharacterId
  })

  // 대시보드용 전체 통계 계산
  const [dashboardStats, setDashboardStats] = useState({
    totalTodayIncome: 0,
    totalWeeklyIncome: 0,
    unsoldItemCount: 0,
    unsoldItemsByGrade: {
      common: 0,
      rare: 0,
      heroic: 0,
      legendary: 0,
      ultimate: 0
    }
  })

  // 대시보드 통계 로드
  const loadDashboardStats = useCallback(async () => {
    if (!isReady || characters.length === 0) return

    let totalToday = 0
    let totalWeekly = 0
    let allUnsoldItems: any[] = []

    // 각 캐릭터별 통계 집계
    const authHeaders = getAuthHeader()
    for (const char of characters) {
      try {
        const res = await fetch(`/api/ledger/stats?characterId=${char.id}&type=summary`, {
          headers: authHeaders
        })
        if (res.ok) {
          const data = await res.json()
          totalToday += data.todayIncome || 0
          totalWeekly += data.weeklyIncome || 0
        }

        // 미판매 아이템 조회
        const itemsRes = await fetch(`/api/ledger/items?characterId=${char.id}&sold=false`, {
          headers: authHeaders
        })
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json()
          allUnsoldItems = [...allUnsoldItems, ...itemsData]
        }
      } catch (e) {
        console.error('Load stats error:', e)
      }
    }

    // 등급별 미판매 아이템 집계
    const unsoldByGrade = {
      common: 0,
      rare: 0,
      heroic: 0,
      legendary: 0,
      ultimate: 0
    }

    allUnsoldItems.forEach(item => {
      const grade = item.item_grade as keyof typeof unsoldByGrade
      if (grade in unsoldByGrade) {
        unsoldByGrade[grade]++
      }
    })

    setDashboardStats({
      totalTodayIncome: totalToday,
      totalWeeklyIncome: totalWeekly,
      unsoldItemCount: allUnsoldItems.length,
      unsoldItemsByGrade: unsoldByGrade
    })
  }, [isReady, getAuthHeader, characters])

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardStats()
    }
  }, [activeTab, loadDashboardStats])

  // 캐릭터 추가 핸들러
  const handleAddCharacter = async (charData: any) => {
    const result = await addCharacter(charData)
    if (result) {
      setActiveTab(result.id)
    }
  }

  // 아이템 추가 핸들러
  const handleAddItem = async (itemData: any) => {
    await addItem(itemData)
    setShowAddItemModal(false)
  }

  // 로딩 상태
  if (isAuthLoading || isCharactersLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          <Wallet size={24} style={{ marginRight: 8 }} />
          가계부
        </h1>
        <p className={styles.subtitle}>
          캐릭터별 수입을 관리하고 추적하세요
        </p>
      </header>

      {/* 탭 */}
      <LedgerTabs
        characters={characters}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddCharacter={() => setShowAddCharacterModal(true)}
        onDeleteCharacter={async (id) => {
          const success = await removeCharacter(id)
          if (success && activeTab === id) {
            setActiveTab('dashboard')
          }
        }}
      />

      {/* 대시보드 뷰 */}
      {activeTab === 'dashboard' && (
        <DashboardSummary
          characters={characters}
          totalTodayIncome={dashboardStats.totalTodayIncome}
          totalWeeklyIncome={dashboardStats.totalWeeklyIncome}
          unsoldItemCount={dashboardStats.unsoldItemCount}
          unsoldItemsByGrade={dashboardStats.unsoldItemsByGrade}
          onCharacterClick={setActiveTab}
        />
      )}

      {/* 캐릭터 상세 뷰 */}
      {activeTab !== 'dashboard' && selectedCharacterId && (
        <>
          {/* 키나 수급 현황 */}
          <KinaOverview
            todayContentIncome={getContentTotalIncome()}
            todayItemIncome={items.filter(i =>
              i.sold_price !== null &&
              i.updated_at?.startsWith(today)
            ).reduce((sum, i) => sum + (i.sold_price || 0), 0)}
            weeklyContentIncome={weeklyStats?.dailyData.reduce((sum, d) => sum + d.contentIncome, 0) || 0}
            weeklyItemIncome={weeklyStats?.dailyData.reduce((sum, d) => sum + d.itemIncome, 0) || 0}
          />

          {/* 컨텐츠별 수입 */}
          <ContentIncomeSection
            contentTypes={contentTypes}
            dungeonTiers={dungeonTiers}
            records={records}
            onIncrementCompletion={incrementCompletion}
            onDecrementCompletion={decrementCompletion}
            onToggleDouble={toggleDouble}
            onChangeTier={changeDungeonTier}
            onChangeMaxCount={changeMaxCount}
          />

          {/* 아이템 획득 목록 */}
          <ItemSection
            items={items}
            filter={filter}
            onFilterChange={setFilter}
            onSellItem={sellItem}
            onDeleteItem={deleteItem}
            onAddItem={() => setShowAddItemModal(true)}
          />

          {/* 주간 수입 그래프 */}
          <WeeklyChart
            stats={weeklyStats}
            isLoading={isStatsLoading}
          />
        </>
      )}

      {/* 캐릭터 등록 모달 */}
      <AddCharacterModal
        isOpen={showAddCharacterModal}
        onClose={() => setShowAddCharacterModal(false)}
        onAdd={handleAddCharacter}
      />

      {/* 아이템 등록 모달 */}
      <AddItemModal
        isOpen={showAddItemModal}
        contentTypes={contentTypes}
        onClose={() => setShowAddItemModal(false)}
        onAdd={handleAddItem}
      />
    </div>
  )
}
