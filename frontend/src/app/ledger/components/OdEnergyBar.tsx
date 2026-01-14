'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import styles from './OdEnergyBar.module.css'

interface OdEnergyBarProps {
  timeEnergy: number         // 시간 충전량 (0~840)
  ticketEnergy: number       // 충전권 사용량 (0~2,000)
  maxTimeEnergy: number      // 시간 충전 최대치 (840)
  maxTicketEnergy: number    // 충전권 최대치 (2,000)
  nextChargeIn: number       // 다음 충전까지 남은 초
}

export default function OdEnergyBar({
  timeEnergy,
  ticketEnergy,
  maxTimeEnergy,
  maxTicketEnergy,
  nextChargeIn
}: OdEnergyBarProps) {
  const totalEnergy = timeEnergy + ticketEnergy
  const maxEnergy = maxTimeEnergy + maxTicketEnergy
  const percentage = (totalEnergy / maxEnergy) * 100

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
