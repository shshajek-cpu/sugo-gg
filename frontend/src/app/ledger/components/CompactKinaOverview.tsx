'use client'

import styles from './CompactKinaOverview.module.css'

interface CompactKinaOverviewProps {
  todayContentIncome: number
  todayItemIncome: number
  monthlyIncome?: number
}

export default function CompactKinaOverview({
  todayContentIncome,
  todayItemIncome,
  monthlyIncome = 0
}: CompactKinaOverviewProps) {
  const todayTotal = todayContentIncome + todayItemIncome

  return (
    <div className={styles.container}>
      {/* 일일 수입 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.icon}>📊</span>
          <span className={styles.title}>일일 수입</span>
        </div>

        <div className={styles.totalAmount}>
          {todayTotal.toLocaleString()} 키나
        </div>

        <div className={styles.breakdown}>
          <span>컨텐츠 {todayContentIncome.toLocaleString()}</span>
          <span className={styles.separator}>·</span>
          <span>아이템 {todayItemIncome.toLocaleString()}</span>
        </div>
      </div>

      {/* 이번달 수입 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.icon}>📈</span>
          <span className={styles.title}>이번달 수입</span>
        </div>

        <div className={styles.totalAmount}>
          {monthlyIncome.toLocaleString()} 키나
        </div>
      </div>
    </div>
  )
}
