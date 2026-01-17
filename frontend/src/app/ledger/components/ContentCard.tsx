'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import styles from './ContentCard.module.css'

interface ContentRecord {
  id: string
  bossName: string
  tier?: number
  category?: string
  count: number
  kina: number
  usedFromBonus?: number  // 충전권에서 사용한 횟수
}

interface ContentCardProps {
  contentType: 'transcend' | 'expedition' | 'sanctuary'
  title: string
  maxTickets: number
  currentTickets: number
  bonusTickets: number
  onTicketsChange: (base: number, bonus: number) => void
  bossOptions: Array<{ id: string; name: string; imageUrl: string }>
  tierOptions?: Array<{ tier: number; kina: number }>
  categoryOptions?: Array<{ id: string; name: string }>
  isDoubleReward: boolean
  onDoubleToggle: () => void
  records: ContentRecord[]
  onAddRecord: (record: Omit<ContentRecord, 'id'>) => void
  onDeleteRecord: (recordId: string, count: number) => void
  selectedBoss?: string
  selectedTier?: number
  selectedCategory?: string
  onBossChange: (bossId: string) => void
  onTierChange?: (tier: number) => void
  onCategoryChange?: (category: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  onOdEnergyDeduct?: (amount: number) => boolean
  onOdEnergyRestore?: (amount: number) => void
  readOnly?: boolean
}

export default function ContentCard({
  contentType,
  title,
  maxTickets,
  currentTickets,
  bonusTickets,
  onTicketsChange,
  bossOptions,
  tierOptions,
  categoryOptions,
  isDoubleReward,
  onDoubleToggle,
  records,
  onAddRecord,
  onDeleteRecord,
  selectedBoss,
  selectedTier,
  selectedCategory,
  onBossChange,
  onTierChange,
  onCategoryChange,
  collapsed = false,
  onToggleCollapse,
  onOdEnergyDeduct,
  onOdEnergyRestore,
  readOnly = false,
}: ContentCardProps) {
  const [completionCount, setCompletionCount] = useState(1)
  const [isExpanded, setIsExpanded] = useState(false)
  const [timeUntilCharge, setTimeUntilCharge] = useState('')
  const [isShaking, setIsShaking] = useState(true) // 흔들림 상태

  // 선택된 보스 정보
  const currentBoss = bossOptions.find(b => b.id === selectedBoss) || bossOptions[0]

  // 다음 충전까지 시간 계산 (contentType에 따라 다름)
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const currentHour = now.getHours()
      const currentDay = now.getDay() // 0 (일요일) ~ 6 (토요일)
      let nextCharge = new Date(now)

      if (contentType === 'sanctuary') {
        // 성역: 매주 수요일 5시
        const daysUntilWednesday = (3 - currentDay + 7) % 7

        if (currentDay === 3 && currentHour < 5) {
          // 오늘이 수요일이고 5시 이전
          nextCharge.setHours(5, 0, 0, 0)
        } else if (currentDay === 3 && currentHour >= 5) {
          // 오늘이 수요일이고 5시 이후 -> 다음주 수요일
          nextCharge.setDate(nextCharge.getDate() + 7)
          nextCharge.setHours(5, 0, 0, 0)
        } else if (daysUntilWednesday === 0) {
          // 다음주 수요일
          nextCharge.setDate(nextCharge.getDate() + 7)
          nextCharge.setHours(5, 0, 0, 0)
        } else {
          // 이번주 수요일
          nextCharge.setDate(nextCharge.getDate() + daysUntilWednesday)
          nextCharge.setHours(5, 0, 0, 0)
        }
      } else {
        // 초월/원정: 21:00 기준 8시간마다 (21, 5, 13)
        const chargeHours = [21, 5, 13].sort((a, b) => a - b)
        let nextChargeHour = chargeHours.find(h => h > currentHour)

        if (nextChargeHour === undefined) {
          // 오늘의 모든 충전 시간이 지났으면 내일 5시 (첫 충전)
          nextCharge.setDate(nextCharge.getDate() + 1)
          nextCharge.setHours(5, 0, 0, 0)
        } else {
          nextCharge.setHours(nextChargeHour, 0, 0, 0)
        }
      }

      const diff = nextCharge.getTime() - now.getTime()
      const totalHours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)

      // 24시간 이상이면 일수로 표시
      if (totalHours >= 24) {
        const days = Math.floor(totalHours / 24)
        const hours = totalHours % 24
        setTimeUntilCharge(
          `${days}일 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        )
      } else {
        setTimeUntilCharge(
          `${totalHours.toString().padStart(1, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        )
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [contentType])

  // 현재 키나 계산
  const getCurrentKina = () => {
    // 성역: 주당 2회만 키나 보상
    if (contentType === 'sanctuary') {
      const totalCompletedCount = records.reduce((sum, record) => sum + record.count, 0)
      if (totalCompletedCount >= 2) {
        return 0 // 이미 2회 이상 진행했으면 키나 없음
      }
      const boss = bossOptions.find(b => b.id === selectedBoss)
      return (boss as any)?.kina || 0
    }

    if (contentType === 'transcend' && tierOptions && selectedTier) {
      const tier = tierOptions.find(t => t.tier === selectedTier)
      return tier ? tier.kina : 0
    }
    // 원정의 경우 보스별 키나
    const boss = bossOptions.find(b => b.id === selectedBoss)
    return (boss as any)?.kina || 0
  }

  // 기록 추가
  const handleAddRecord = () => {
    if (!selectedBoss) return

    // 잔여 횟수 확인 (기본 + 보너스)
    const totalAvailable = currentTickets + bonusTickets
    if (totalAvailable < completionCount) {
      alert(`잔여 횟수가 부족합니다!\n현재 잔여: ${totalAvailable}회\n필요 횟수: ${completionCount}회`)
      return  // 진행 중단
    }

    // 오드 에너지 총 차감량 계산 (1회당 40)
    const totalOdCost = completionCount * 40

    // 오드 에너지 차감 시도
    if (onOdEnergyDeduct) {
      const success = onOdEnergyDeduct(totalOdCost)
      if (!success) {
        alert(`오드 에너지가 부족합니다!\n필요한 에너지: ${totalOdCost} (${completionCount}회 × 40)`)
        return  // 진행 중단
      }
    }

    // 성역의 경우 키나 보상 계산을 다르게 처리
    let totalKina = 0
    if (contentType === 'sanctuary') {
      const totalCompletedCount = records.reduce((sum, record) => sum + record.count, 0)
      const boss = bossOptions.find(b => b.id === selectedBoss)
      const baseKina = (boss as any)?.kina || 0

      // 주당 2회까지만 키나 보상
      const remainingRewardCount = Math.max(0, 2 - totalCompletedCount)
      const rewardableCount = Math.min(completionCount, remainingRewardCount)
      totalKina = baseKina * rewardableCount * (isDoubleReward ? 2 : 1)
    } else {
      const baseKina = getCurrentKina()
      totalKina = baseKina * completionCount * (isDoubleReward ? 2 : 1)
    }

    // 잔여 횟수 차감 계산
    let remaining = completionCount
    let newBonus = bonusTickets
    let newBase = currentTickets
    let usedFromBonus = 0  // 충전권에서 사용한 횟수

    // 1순위: 기본 티켓 차감 (0이 될 때까지)
    if (newBase >= remaining) {
      newBase -= remaining
      remaining = 0
    } else {
      remaining -= newBase
      newBase = 0
    }

    // 2순위: 보너스 티켓 차감 (기본이 0이 된 후에만)
    if (remaining > 0) {
      usedFromBonus = Math.min(remaining, newBonus)  // 실제 충전권에서 사용한 횟수
      newBonus = Math.max(0, newBonus - remaining)
    }

    const newRecord: Omit<ContentRecord, 'id'> = {
      bossName: currentBoss.name,
      tier: selectedTier,
      category: selectedCategory,
      count: completionCount,
      kina: totalKina,
      usedFromBonus  // 충전권 사용량 저장
    }

    onAddRecord(newRecord)
    onTicketsChange(newBase, newBonus)
    setCompletionCount(1)
  }

  // 기록 삭제
  const handleDeleteRecord = (recordId: string, count: number, usedFromBonus: number = 0) => {
    // 횟수 복구 (사용한 곳으로 각각 복구)
    const usedFromBase = count - usedFromBonus  // 기본에서 사용한 횟수

    // 기본 티켓 복구 (최대치까지만)
    const newBase = Math.min(maxTickets, currentTickets + usedFromBase)
    // 충전권 복구
    const newBonus = bonusTickets + usedFromBonus

    onTicketsChange(newBase, newBonus)

    // 오드 에너지 복구 (1회당 40)
    if (onOdEnergyRestore) {
      onOdEnergyRestore(count * 40)
    }
    onDeleteRecord(recordId, count)
  }

  // 오드 토글 (애니메이션 제어)
  const handleDoubleToggle = () => {
    if (!isDoubleReward) {
      // 활성화되면 애니메이션 멈춤
      setIsShaking(false)
    } else {
      // 비활성화되면 애니메이션 재개
      setIsShaking(true)
    }
    onDoubleToggle()
  }

  // 보이는 기록 (펼침 여부에 따라) - 펼쳤을 때 6개까지만
  const visibleRecords = isExpanded ? records.slice(0, 6) : records.slice(0, 3)
  const totalKina = records.reduce((sum, r) => sum + r.kina, 0)

  return (
    <div className={`${styles.card} ${collapsed ? styles.cardCollapsed : ''}`}>
      {/* 좌측 이미지 영역 */}
      <div className={styles.imageSection}>
        {currentBoss?.imageUrl && (
          <div className={styles.imageContainer}>
            <Image
              src={currentBoss.imageUrl}
              alt={currentBoss.name}
              fill
              className={styles.image}
            />
            <div className={styles.imageOverlay} />
            <div className={styles.imageGradient} />

            {/* 보스 이름 (좌상단) */}
            <div className={styles.bossName}>{currentBoss.name}</div>

            {/* 타이머 (좌하단) */}
            {!collapsed && (
              <div className={styles.timerInfo}>
                <div className={styles.timerLabel}>이용권 충전</div>
                <div className={styles.timerLabel}>남은시간</div>
                <div className={styles.timerText}>{timeUntilCharge}</div>
              </div>
            )}

            {/* 잔여 횟수 (우하단) */}
            <div className={styles.remainingCount}>
              <span className={styles.countCurrent}>{currentTickets || 0}</span>
              <span className={styles.countMax}>/{maxTickets || 0}</span>
              {bonusTickets > 0 && (
                <span className={styles.countBonus}>(+{bonusTickets})</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 우측 컨텐츠 영역 */}
      {!collapsed && (
        <div className={styles.contentSection}>
          {/* 접기 버튼 (우측 상단) */}
          {onToggleCollapse && (
            <button className={styles.collapseBtn} onClick={onToggleCollapse}>
              ▲
            </button>
          )}

          {/* 컨트롤 영역 */}
          <div className={styles.controls}>
            <span className={styles.contentTitle}>{title}</span>

            {/* 오드 에너지 토글 */}
            <button
              className={`${styles.oddToggle} ${isDoubleReward ? styles.oddToggleActive : ''} ${isShaking && !isDoubleReward ? styles.oddShake : ''}`}
              onClick={handleDoubleToggle}
            >
              <Image src="/메달/오드.png" alt="오드" width={21} height={21} />
              <span>오드에너지 <span style={{ color: '#f59e0b' }}>2</span>배 사용</span>
            </button>

            {/* 카테고리 선택 (원정만) */}
            {categoryOptions && onCategoryChange && (
              <select
                className={styles.select}
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
              >
                {categoryOptions.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}

            {/* 보스 선택 */}
            <select
              className={styles.select}
              value={selectedBoss}
              onChange={(e) => onBossChange(e.target.value)}
            >
              {bossOptions.map(boss => (
                <option key={boss.id} value={boss.id}>{boss.name}</option>
              ))}
            </select>

            {/* 단계 선택 (초월만) */}
            {tierOptions && onTierChange && (
              <select
                className={styles.select}
                value={selectedTier}
                onChange={(e) => onTierChange(Number(e.target.value))}
              >
                {tierOptions.map(tier => (
                  <option key={tier.tier} value={tier.tier}>{tier.tier}단계</option>
                ))}
              </select>
            )}

            {/* 완료 횟수 */}
            <span className={styles.countLabel}>완료횟수:</span>
            <div className={styles.countControl}>
              <button
                className={styles.countBtn}
                onClick={() => setCompletionCount(Math.max(1, completionCount - 1))}
                disabled={readOnly}
              >
                −
              </button>
              <span className={styles.countValue}>{completionCount}</span>
              <button
                className={styles.countBtn}
                onClick={() => setCompletionCount(completionCount + 1)}
                disabled={readOnly}
              >
                +
              </button>
            </div>

            {/* 진행 완료 버튼 */}
            <button
              className={styles.addBtn}
              onClick={handleAddRecord}
              disabled={readOnly}
              title={readOnly ? '과거 기록은 수정할 수 없습니다' : undefined}
            >
              {readOnly ? '열람 전용' : '진행 완료'}
            </button>
          </div>

          {/* 기록 영역 */}
          <div className={styles.recordsSection}>
            <div className={styles.recordsHeader}>
              <span>📋 오늘 기록: ({records.length}개)</span>
              {records.length > 3 && (
                <button
                  className={styles.expandBtn}
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? '접기▲' : '펼치기▼'}
                </button>
              )}
            </div>

            <div className={`${styles.recordsList} ${isExpanded ? styles.recordsListExpanded : ''}`}>
              {visibleRecords.length === 0 ? (
                <div className={styles.noRecords}>기록이 없습니다</div>
              ) : (
                visibleRecords.map(record => (
                  <div key={record.id} className={styles.recordItem}>
                    <span className={styles.recordInfo}>
                      ✅ {record.bossName}
                      {record.tier && `-${record.tier}단계`}
                      {record.category && ` [${record.category}]`}
                    </span>
                    <span className={styles.recordCount}>{record.count}회</span>
                    <span className={styles.recordKina}>{record.kina.toLocaleString()}</span>
                    {!readOnly && (
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteRecord(record.id, record.count, record.usedFromBonus || 0)}
                        title="기록 삭제"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {records.length > 0 && (
              <div className={styles.totalKina}>
                💰 합계: {totalKina.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 접힌 상태일 때 제목 영역 */}
      {collapsed && onToggleCollapse && (
        <div className={styles.collapsedContent}>
          <span className={styles.collapsedTitle}>{title}</span>
          <button className={styles.collapsedExpandBtn} onClick={onToggleCollapse}>
            ▼
          </button>
        </div>
      )}
    </div>
  )
}
