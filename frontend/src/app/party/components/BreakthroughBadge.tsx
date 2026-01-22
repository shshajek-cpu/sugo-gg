'use client'

import styles from './BreakthroughBadge.module.css'

interface BreakthroughBadgeProps {
  value: number
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean  // "돌파" 라벨 표시 여부
}

/**
 * 돌파 횟수를 파란 마름모 아이콘으로 표시하는 공통 컴포넌트
 */
export default function BreakthroughBadge({
  value,
  size = 'medium',
  showLabel = false
}: BreakthroughBadgeProps) {
  if (!value || value <= 0) return null

  return (
    <span className={`${styles.badge} ${styles[size]}`}>
      <span className={styles.diamond}></span>
      <span className={styles.value}>{value}</span>
      {showLabel && <span className={styles.label}>돌파</span>}
    </span>
  )
}
