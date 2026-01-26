'use client'

import { Calendar, TrendingUp, Target, Package, CalendarDays } from 'lucide-react'
import styles from '../ledger.module.css'

interface KinaOverviewProps {
  todayContentIncome: number
  todayItemIncome: number
  monthlyIncome?: number
}

export default function KinaOverview({
  todayContentIncome,
  todayItemIncome,
  monthlyIncome = 0
}: KinaOverviewProps) {
  const todayTotal = todayContentIncome + todayItemIncome

  const formatKina = (value: number) => value.toLocaleString('ko-KR')

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <TrendingUp size={18} />
          키나 수급 현황
        </h2>
      </div>

      <div className={styles.kinaGrid}>
        {/* 오늘 수입 */}
        <div className={styles.kinaCard}>
          <div className={styles.kinaLabel}>
            <Calendar size={14} />
            오늘 수입
          </div>
          <div className={styles.kinaValue}>{formatKina(todayTotal)} 키나</div>
          <div className={styles.kinaDetail}>
            <div className={styles.kinaDetailRow}>
              <span className={styles.kinaDetailLabel}>
                <Target size={12} style={{ marginRight: 4 }} />
                컨텐츠
              </span>
              <span className={styles.kinaDetailValue}>{formatKina(todayContentIncome)}</span>
            </div>
            <div className={styles.kinaDetailRow}>
              <span className={styles.kinaDetailLabel}>
                <Package size={12} style={{ marginRight: 4 }} />
                아이템
              </span>
              <span className={styles.kinaDetailValue}>{formatKina(todayItemIncome)}</span>
            </div>
          </div>
        </div>

        {/* 이번달 수입 */}
        <div className={styles.kinaCard}>
          <div className={styles.kinaLabel}>
            <CalendarDays size={14} />
            이번달 수입
          </div>
          <div className={styles.kinaValue}>{formatKina(monthlyIncome)} 키나</div>
        </div>
      </div>
    </section>
  )
}
