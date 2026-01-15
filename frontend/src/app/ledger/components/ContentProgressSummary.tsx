'use client'

import { Swords, Sun } from 'lucide-react'
import styles from './ContentProgressSummary.module.css'

interface ContentProgress {
  id: string
  name: string
  current: number
  max: number
}

interface ContentProgressSummaryProps {
  weeklyContents: ContentProgress[]
  dailyContents: ContentProgress[]
  characterCount: number
}

function ProgressRow({ content }: { content: ContentProgress }) {
  const percentage = content.max > 0 ? (content.current / content.max) * 100 : 0
  const isComplete = content.current >= content.max

  return (
    <div className={styles.progressRow}>
      <div className={styles.progressInfo}>
        <span className={styles.progressName}>{content.name}</span>
        <span className={`${styles.progressCount} ${isComplete ? styles.progressComplete : ''}`}>
          {content.current}/{content.max}
          {isComplete && ' ✓'}
        </span>
      </div>
      <div className={styles.progressBarContainer}>
        <div
          className={`${styles.progressBar} ${isComplete ? styles.progressBarComplete : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`${styles.progressPercent} ${isComplete ? styles.progressComplete : ''}`}>
        {Math.round(percentage)}%
      </span>
    </div>
  )
}

export default function ContentProgressSummary({
  weeklyContents,
  dailyContents,
  characterCount
}: ContentProgressSummaryProps) {
  // 전체 진행률 계산
  const weeklyTotal = weeklyContents.reduce((acc, c) => ({
    current: acc.current + c.current,
    max: acc.max + c.max
  }), { current: 0, max: 0 })

  const dailyTotal = dailyContents.reduce((acc, c) => ({
    current: acc.current + c.current,
    max: acc.max + c.max
  }), { current: 0, max: 0 })

  const weeklyPercent = weeklyTotal.max > 0 ? Math.round((weeklyTotal.current / weeklyTotal.max) * 100) : 0
  const dailyPercent = dailyTotal.max > 0 ? Math.round((dailyTotal.current / dailyTotal.max) * 100) : 0

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Swords size={18} />
          컨텐츠 진행 현황
        </h2>
        <span className={styles.subtitle}>
          캐릭터 {characterCount}명 기준
        </span>
      </div>

      {/* 주간 컨텐츠 */}
      <div className={styles.contentGroup}>
        <div className={styles.groupHeader}>
          <Swords size={16} className={styles.groupIcon} />
          <h3 className={styles.groupTitle}>주간 컨텐츠</h3>
          <span className={styles.groupSummary}>
            {weeklyTotal.current}/{weeklyTotal.max} ({weeklyPercent}%)
          </span>
        </div>
        <div className={styles.progressList}>
          {weeklyContents.map(content => (
            <ProgressRow key={content.id} content={content} />
          ))}
        </div>
      </div>

      {/* 일일 컨텐츠 */}
      <div className={styles.contentGroup}>
        <div className={styles.groupHeader}>
          <Sun size={16} className={styles.groupIcon} />
          <h3 className={styles.groupTitle}>일일 컨텐츠</h3>
          <span className={styles.groupSummary}>
            {dailyTotal.current}/{dailyTotal.max} ({dailyPercent}%)
          </span>
        </div>
        <div className={styles.progressList}>
          {dailyContents.map(content => (
            <ProgressRow key={content.id} content={content} />
          ))}
        </div>
      </div>
    </section>
  )
}
