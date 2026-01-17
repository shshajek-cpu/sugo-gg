'use client'

import { useState, useEffect, memo } from 'react'
import Image from 'next/image'
import styles from './OdEnergyBar.module.css'

interface OdEnergyBarProps {
  timeEnergy: number         // 시간 충전량 (0~840)
  ticketEnergy: number       // 충전권 사용량 (0~2,000)
  maxTimeEnergy: number      // 시간 충전 최대치 (840)
  maxTicketEnergy: number    // 충전권 최대치 (2,000)
}

function OdEnergyBar({
  timeEnergy,
  ticketEnergy,
  maxTimeEnergy,
  maxTicketEnergy
}: OdEnergyBarProps) {
  // 타이머 상태를 여기서 자체 관리 (부모 리렌더링 방지)
  const [nextChargeIn, setNextChargeIn] = useState(0)

  // 다음 충전 시간 계산 및 1초 타이머
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentSecond = now.getSeconds()

      // 충전 시간: 2, 5, 8, 11, 14, 17, 20, 23
      const chargeHours = [2, 5, 8, 11, 14, 17, 20, 23]

      // 다음 충전 시간 찾기
      let nextChargeHour = chargeHours.find(h => h > currentHour)

      if (nextChargeHour === undefined) {
        // 오늘의 모든 충전 시간이 지났으면 내일 2시
        nextChargeHour = 24 + 2 // 내일 2시
      }

      // 다음 충전까지 남은 시간 (초)
      const hoursUntil = nextChargeHour - currentHour
      const minutesUntil = 60 - currentMinute - 1
      const secondsUntil = 60 - currentSecond

      const totalSeconds = (hoursUntil - 1) * 3600 + minutesUntil * 60 + secondsUntil

      setNextChargeIn(totalSeconds)
    }

    updateTimer() // 즉시 한번 실행
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [])

  // 초를 시:분:초 형식으로 변환
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.container}>
      {/* 왼쪽: 아이콘 */}
      <div className={styles.icon}>
        <Image
          src="/메달/오드.png"
          alt="오드 에너지"
          width={36}
          height={36}
        />
      </div>

      {/* 오른쪽: 정보 */}
      <div className={styles.info}>
        <div className={styles.energyAmount}>
          {timeEnergy}
          {ticketEnergy > 0 && <span className={styles.bonus}>(+{ticketEnergy})</span>}
        </div>
        <div className={styles.chargeTime}>
          주기충전: {formatTime(nextChargeIn)}
        </div>
      </div>
    </div>
  )
}

// React.memo를 적용하여 props가 변경되지 않으면 리렌더링 방지
export default memo(OdEnergyBar)
