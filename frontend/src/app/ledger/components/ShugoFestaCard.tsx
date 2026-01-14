'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import styles from './ShugoFestaCard.module.css'

interface ShugoFestaCardProps {
  currentTickets: number
  maxTickets: number
  bonusTickets: number
}

export default function ShugoFestaCard({
  currentTickets,
  maxTickets,
  bonusTickets
}: ShugoFestaCardProps) {
  const [timeUntilEntry, setTimeUntilEntry] = useState('')
  const [isAlarmActive, setIsAlarmActive] = useState(false)
  const [showOpenMouth, setShowOpenMouth] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [timeUntilCharge, setTimeUntilCharge] = useState('')

  // 다음 입장 시간 계산 및 알람 로직 (매시간 15분, 45분)
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const currentMinute = now.getMinutes()
      const currentSecond = now.getSeconds()

      let nextEntryMinute: number
      if (currentMinute < 15) {
        nextEntryMinute = 15
      } else if (currentMinute < 45) {
        nextEntryMinute = 45
      } else {
        nextEntryMinute = 75 // 다음 시간의 15분 (60 + 15)
      }

      const totalSecondsUntilEntry = (nextEntryMinute - currentMinute) * 60 - currentSecond

      const minutes = Math.floor(totalSecondsUntilEntry / 60)
      const seconds = totalSecondsUntilEntry % 60

      // 알람 체크: 3초 전부터
      const isInAlarmWindow = totalSecondsUntilEntry <= 3 && totalSecondsUntilEntry > 0

      if (isInAlarmWindow && !isAlarmActive) {
        setIsAlarmActive(true)
      } else if (!isInAlarmWindow && isAlarmActive) {
        setIsAlarmActive(false)
      }

      setTimeUntilEntry(`00:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [isAlarmActive])

  // 알람 활성화 시 이미지 깜빡임 (0.5초마다 전환)
  useEffect(() => {
    if (!isAlarmActive) {
      setShowOpenMouth(false)
      return
    }

    const imageInterval = setInterval(() => {
      setShowOpenMouth(prev => !prev)
    }, 500)

    return () => clearInterval(imageInterval)
  }, [isAlarmActive])

  // 이용권 충전 시간 계산 (02:00 기준 3시간마다: 2, 5, 8, 11, 14, 17, 20, 23시)
  useEffect(() => {
    const updateChargeTimer = () => {
      const now = new Date()
      const currentHour = now.getHours()

      // 충전 시간: 2, 5, 8, 11, 14, 17, 20, 23
      const chargeHours = [2, 5, 8, 11, 14, 17, 20, 23]

      // 다음 충전 시간 찾기
      let nextChargeHour = chargeHours.find(h => h > currentHour)
      const nextCharge = new Date(now)

      if (nextChargeHour === undefined) {
        // 오늘의 모든 충전 시간이 지났으면 내일 2시
        nextCharge.setDate(nextCharge.getDate() + 1)
        nextCharge.setHours(2, 0, 0, 0)
      } else {
        nextCharge.setHours(nextChargeHour, 0, 0, 0)
      }

      const diff = nextCharge.getTime() - now.getTime()
      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)

      setTimeUntilCharge(
        `${hours.toString().padStart(1, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }

    updateChargeTimer()
    const interval = setInterval(updateChargeTimer, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={styles.cardWrapper}>
      <div className={styles.card} onClick={() => setShowModal(!showModal)}>
        {/* 제목 & 티켓 정보 */}
        <div className={styles.header}>
          <h3 className={styles.title}>슈고 페스타</h3>
          <div className={styles.ticketInfo}>
            <span className={styles.ticketCount}>
              {currentTickets}/{maxTickets}
            </span>
            {bonusTickets > 0 && (
              <span className={styles.bonusTicket}>
                +{bonusTickets}
              </span>
            )}
          </div>
        </div>

        {/* 이미지 */}
        <div className={styles.imageContainer}>
          <Image
            src={showOpenMouth
              ? '/메달/슈고어비스/입열린-Photoroom.png'
              : '/메달/슈고어비스/입닫힌-Photoroom.png'
            }
            alt="슈고 페스타"
            width={100}
            height={100}
            className={styles.image}
          />
        </div>

        {/* 노란 네온 타이머 */}
        <div className={styles.timer}>
          {timeUntilEntry}
        </div>

        {/* 드롭다운 화살표 */}
        <div className={styles.arrow}>
          {showModal ? '▲' : '▼'}
        </div>
      </div>

      {/* 충전 시간 정보 드롭다운 */}
      {showModal && (
        <div className={styles.dropdown}>
          <h3 className={styles.dropdownTitle}>이용권 충전 정보</h3>
          <div className={styles.chargeInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>오픈시간</span>
              <span className={`${styles.infoValue} ${styles.openTime}`}>
                매 시간 15분/45분 시작
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>다음 충전까지</span>
              <span className={styles.infoValue}>{timeUntilCharge}</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={(e) => {
            e.stopPropagation()
            setShowModal(false)
          }}>
            확인
          </button>
        </div>
      )}
    </div>
  )
}
