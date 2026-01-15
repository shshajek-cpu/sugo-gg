'use client'

import { useRef, useState, useEffect } from 'react'
import styles from './DailyContentCard.module.css'

export interface DailyContent {
  id: string
  name: string
  icon: string
  maxCount: number
  completionCount: number
  bonusCount?: number
  baseReward: number
  color: string
  colorLight: string
  colorDark: string
  colorGlow: string
  imageUrl?: string
  resetType?: 'daily' | 'weekly' | 'charge3h' | 'charge24h'  // daily: 매일 5시, weekly: 수요일 5시, charge3h: 3시간마다 충전, charge24h: 24시간마다 충전
}

// 다음 리셋/충전 시간 계산
function getNextResetTime(resetType: 'daily' | 'weekly' | 'charge3h' | 'charge24h'): Date {
  const now = new Date()
  const reset = new Date(now)

  if (resetType === 'charge3h') {
    // 02:00 기준 3시간마다 충전 (02, 05, 08, 11, 14, 17, 20, 23)
    const currentHour = now.getHours()
    const currentMinutes = now.getMinutes()

    // 02시 기준으로 다음 충전 시간 계산
    // 충전 시간: 2, 5, 8, 11, 14, 17, 20, 23
    const chargeHours = [2, 5, 8, 11, 14, 17, 20, 23]

    // 다음 충전 시간 찾기
    let nextChargeHour = chargeHours.find(h => h > currentHour || (h === currentHour && currentMinutes === 0 && now.getSeconds() === 0))

    if (nextChargeHour === undefined) {
      // 오늘 남은 충전 시간 없음 -> 내일 02시
      reset.setDate(reset.getDate() + 1)
      nextChargeHour = 2
    }

    reset.setHours(nextChargeHour, 0, 0, 0)
  } else if (resetType === 'charge24h') {
    // 24시간마다 충전 - 다음 충전까지 24시간 표시
    reset.setTime(now.getTime() + 24 * 60 * 60 * 1000)
  } else if (resetType === 'daily') {
    // 매일 새벽 5시
    reset.setHours(5, 0, 0, 0)
    if (now >= reset) {
      reset.setDate(reset.getDate() + 1)
    }
  } else {
    // 수요일 새벽 5시
    reset.setHours(5, 0, 0, 0)
    const dayOfWeek = reset.getDay()
    let daysUntilWed = (3 - dayOfWeek + 7) % 7

    if (daysUntilWed === 0 && now >= reset) {
      daysUntilWed = 7
    }

    reset.setDate(reset.getDate() + daysUntilWed)
  }

  return reset
}

// 남은 시간 포맷팅
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '00:00:00'

  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days}일 ${remainingHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

interface DailyContentCardProps {
  content: DailyContent
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  readOnly?: boolean
}

export default function DailyContentCard({ content, onIncrement, onDecrement, readOnly = false }: DailyContentCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [timeUntilCharge, setTimeUntilCharge] = useState('')

  // 리셋 타입 결정
  // weekly: 일일던전, 각성전, 토벌전 (수요일 5시 리셋)
  // charge3h: 악몽, 차원침공 (02시 기준 3시간마다 1회 충전)
  const resetType: 'daily' | 'weekly' | 'charge3h' | 'charge24h' = content.resetType ||
    (['daily_dungeon', 'awakening_battle', 'subjugation'].includes(content.id) ? 'weekly' : 'charge3h')

  // 다음 리셋/충전까지 시간 계산
  useEffect(() => {
    const updateTimer = () => {
      const nextReset = getNextResetTime(resetType)
      const remaining = nextReset.getTime() - Date.now()
      setTimeUntilCharge(formatTimeRemaining(remaining))
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [resetType])

  const handleIncrement = () => {
    // 기본 잔여 + 보너스 잔여
    const baseRem = Math.max(0, content.maxCount - content.completionCount)
    const usedBonus = Math.max(0, content.completionCount - content.maxCount)
    const bonusRem = Math.max(0, (content.bonusCount || 0) - usedBonus)
    const totalRem = baseRem + bonusRem

    if (totalRem > 0) {
      onIncrement(content.id)
      createParticles()
    }
  }

  const handleDecrement = () => {
    if (content.completionCount > 0) {
      onDecrement(content.id)
    }
  }

  const createParticles = () => {
    if (!cardRef.current) return

    const particleContainer = cardRef.current.querySelector(`.${styles.particles}`)
    if (!particleContainer) return

    // Create 12 particles
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div')
      particle.className = styles.particle

      // Random position around center
      const angle = (Math.PI * 2 * i) / 12
      const distance = 28 + Math.random() * 21
      const x = 50 + Math.cos(angle) * distance
      const y = 50 + Math.sin(angle) * distance

      particle.style.left = `${x}%`
      particle.style.top = `${y}%`
      particle.style.animationDelay = `${i * 0.05}s`

      particleContainer.appendChild(particle)

      // Remove after animation
      setTimeout(() => {
        particle.remove()
      }, 1200)
    }
  }

  // 기본 잔여 횟수 계산 (기본 횟수에서 먼저 차감)
  const baseRemaining = Math.max(0, content.maxCount - content.completionCount)
  // 보너스 잔여 횟수 계산 (기본이 0이 된 후에만 차감)
  const usedFromBonus = Math.max(0, content.completionCount - content.maxCount)
  const bonusRemaining = Math.max(0, (content.bonusCount || 0) - usedFromBonus)
  // 총 잔여 횟수
  const totalRemaining = baseRemaining + bonusRemaining
  const isComplete = totalRemaining === 0

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${isComplete ? styles.cardCompleted : ''}`}
      style={{
        '--card-color': content.color,
        '--card-color-light': content.colorLight,
        '--card-color-dark': content.colorDark,
        '--card-color-glow': content.colorGlow,
      } as React.CSSProperties}
    >
      <div className={styles.particles} />

      {/* Image Container with All Content Overlayed */}
      <div className={styles.imageContainer}>
        {content.imageUrl ? (
          <img src={content.imageUrl} alt={content.name} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder}>
            {content.icon}
          </div>
        )}
        <div className={styles.overlay} />

        {/* Button Group (Top Right) */}
        <div className={styles.buttonGroupTop}>
          <button
            className={styles.btn}
            onClick={handleIncrement}
            disabled={readOnly || totalRemaining === 0}
            aria-label={`${content.name} 횟수 사용`}
            title={readOnly ? '과거 기록은 수정할 수 없습니다' : undefined}
          >
            +
          </button>
          <button
            className={`${styles.btn} ${styles.btnIncrement}`}
            onClick={handleDecrement}
            disabled={readOnly || content.completionCount === 0}
            aria-label={`${content.name} 횟수 복구`}
            title={readOnly ? '과거 기록은 수정할 수 없습니다' : undefined}
          >
            −
          </button>
        </div>

        {/* Title Area (Center) */}
        <div className={styles.titleArea}>
          <div className={styles.title}>{content.name}</div>
        </div>

        {/* Timer (Bottom Left) */}
        <div className={styles.timerInfo}>
          <div className={styles.timerLabel}>이용권 충전</div>
          <div className={styles.timerLabel}>남은시간</div>
          <div className={styles.timerText}>{timeUntilCharge}</div>
        </div>

        {/* Progress Info (Bottom Right) */}
        <div className={styles.progressInfo}>
          <div className={styles.progressLabel}>잔여 횟수</div>
          <div className={styles.progressText}>
            {baseRemaining}/{content.maxCount}
            {bonusRemaining > 0 && (
              <span className={styles.bonusCount}>(+{bonusRemaining})</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
