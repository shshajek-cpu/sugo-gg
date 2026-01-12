'use client'

import { Minus, Plus } from 'lucide-react'
import { DungeonTier } from '@/types/ledger'
import styles from '../ledger.module.css'

interface ContentIncomeRowProps {
  contentId: string
  contentName: string
  icon: React.ReactNode
  tiers: DungeonTier[]
  selectedTierId: string
  maxCount: number
  completionCount: number
  isDouble: boolean
  baseKina: number
  totalKina: number
  onIncrement: () => void
  onDecrement: () => void
  onToggleDouble: () => void
  onChangeTier: (tierId: string) => void
  onChangeMaxCount: (count: number) => void
}

export default function ContentIncomeRow({
  contentId,
  contentName,
  icon,
  tiers,
  selectedTierId,
  maxCount,
  completionCount,
  isDouble,
  baseKina,
  totalKina,
  onIncrement,
  onDecrement,
  onToggleDouble,
  onChangeTier,
  onChangeMaxCount
}: ContentIncomeRowProps) {
  // 뱃지 렌더링
  const renderBadges = () => {
    const badges = []
    for (let i = 0; i < maxCount; i++) {
      badges.push(
        <div
          key={i}
          className={`${styles.badge} ${i < completionCount ? styles.badgeCompleted : ''}`}
        />
      )
    }
    return badges
  }

  // 남은 횟수 입력 핸들러
  const handleMaxCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0 && value <= 10) {
      onChangeMaxCount(value)
    }
  }

  // 표시 금액 계산
  const displayKina = completionCount * baseKina * (isDouble ? 2 : 1)

  return (
    <div className={styles.contentRow}>
      {/* 아이콘 */}
      <div className={styles.contentIcon}>
        {icon}
      </div>

      {/* 컨텐츠명 */}
      <span className={styles.contentName}>{contentName}</span>

      {/* 남은 횟수 입력 */}
      <input
        type="number"
        className={styles.contentCountInput}
        value={maxCount}
        onChange={handleMaxCountChange}
        min={0}
        max={10}
        title="남은 횟수"
      />

      {/* 던전 종류 선택 */}
      <select
        className={styles.tierSelect}
        value={selectedTierId}
        onChange={(e) => onChangeTier(e.target.value)}
      >
        {tiers.map((tier) => (
          <option key={tier.id} value={tier.id}>
            {tier.name}
          </option>
        ))}
      </select>

      {/* +/- 버튼과 뱃지 */}
      <div className={styles.counterGroup}>
        <button
          className={styles.counterBtn}
          onClick={onDecrement}
          disabled={completionCount <= 0}
          title="완료 취소"
        >
          <Minus size={14} />
        </button>

        <div className={styles.badges}>
          {renderBadges()}
        </div>

        <button
          className={styles.counterBtn}
          onClick={onIncrement}
          disabled={completionCount >= maxCount}
          title="완료"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* x2 토글 */}
      <button
        className={`${styles.doubleBtn} ${isDouble ? styles.doubleBtnActive : ''}`}
        onClick={onToggleDouble}
        title="2배 보상"
      >
        x2
      </button>

      {/* 획득 금액 */}
      <span className={styles.contentKina}>
        {displayKina.toLocaleString('ko-KR')} 키나
      </span>
    </div>
  )
}
