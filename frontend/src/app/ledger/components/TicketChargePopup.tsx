'use client'

import { useState } from 'react'
import Image from 'next/image'
import styles from './TicketChargePopup.module.css'

interface TicketType {
  id: string
  name: string
  icon: string
  maxBase: number
}

const TICKET_TYPES: TicketType[] = [
  { id: 'transcend', name: '초월', icon: '🔥', maxBase: 14 },
  { id: 'expedition', name: '원정', icon: '⚔️', maxBase: 21 },
  { id: 'sanctuary', name: '성역', icon: '🏛️', maxBase: 4 },
  { id: 'daily_dungeon', name: '일일던전', icon: '🏰', maxBase: 6 },
  { id: 'awakening', name: '각성전', icon: '⭐', maxBase: 6 },
  { id: 'nightmare', name: '악몽', icon: '👻', maxBase: 6 },
  { id: 'dimension', name: '차원침공', icon: '🌀', maxBase: 6 },
  { id: 'subjugation', name: '토벌전', icon: '⚡', maxBase: 6 }
]

interface TicketChargePopupProps {
  isOpen: boolean
  onClose: () => void
  onCharge: (charges: Record<string, number>) => void
  currentTickets?: Record<string, { base: number; bonus: number }>
  odEnergy?: {
    timeEnergy: number
    ticketEnergy: number
  }
  onOdEnergyCharge?: (amount: number) => void
  onInitialSync?: (settings: {
    odTimeEnergy: number
    odTicketEnergy: number
    tickets: Record<string, number>
  }) => void
}

export default function TicketChargePopup({
  isOpen,
  onClose,
  onCharge,
  currentTickets = {},
  odEnergy = { timeEnergy: 0, ticketEnergy: 0 },
  onOdEnergyCharge,
  onInitialSync
}: TicketChargePopupProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'charge'>('charge')
  const [charges, setCharges] = useState<Record<string, number>>({})
  const [odEnergyCharge, setOdEnergyCharge] = useState(0)

  // 초기설정 입력 상태
  const [initialSettings, setInitialSettings] = useState({
    odTimeEnergy: 840,
    odTicketEnergy: 0,
    transcend: 14,
    expedition: 21,
    sanctuary: 4,
    daily_dungeon: 6,
    awakening: 6,
    nightmare: 6,
    dimension: 6,
    subjugation: 6
  })

  if (!isOpen) return null

  const handleIncrement = (ticketId: string) => {
    setCharges(prev => ({
      ...prev,
      [ticketId]: (prev[ticketId] || 0) + 1
    }))
  }

  const handleDecrement = (ticketId: string) => {
    setCharges(prev => {
      const current = prev[ticketId] || 0
      if (current <= 0) return prev
      return {
        ...prev,
        [ticketId]: current - 1
      }
    })
  }

  const handleConfirm = () => {
    // 충전할 티켓이 있는지 확인
    const hasTicketCharges = Object.values(charges).some(count => count > 0)
    const hasOdEnergyCharge = odEnergyCharge > 0

    if (!hasTicketCharges && !hasOdEnergyCharge) {
      alert('충전할 항목을 선택해주세요.')
      return
    }

    // 충전 내역 요약
    let chargeList = ''

    // 오드 에너지 충전 내역
    if (hasOdEnergyCharge) {
      chargeList += `⚡ 오드 에너지: +${odEnergyCharge}\n`
    }

    // 티켓 충전 내역
    if (hasTicketCharges) {
      const ticketList = TICKET_TYPES
        .filter(ticket => charges[ticket.id] > 0)
        .map(ticket => `${ticket.icon} ${ticket.name}: +${charges[ticket.id]}`)
        .join('\n')
      chargeList += ticketList
    }

    const confirmed = window.confirm(
      `다음 항목을 충전하시겠습니까?\n\n${chargeList}\n\n※ 충전 후에는 취소할 수 없습니다.`
    )

    if (confirmed) {
      // 오드 에너지 충전
      if (hasOdEnergyCharge && onOdEnergyCharge) {
        onOdEnergyCharge(odEnergyCharge)
      }

      // 티켓 충전
      if (hasTicketCharges) {
        onCharge(charges)
      }

      setCharges({})
      setOdEnergyCharge(0)
      onClose()
    }
  }

  const handleCancel = () => {
    setCharges({})
    setOdEnergyCharge(0)
    onClose()
  }

  const handleOdEnergyIncrement = (amount: number) => {
    const maxAllowed = 2000 - odEnergy.ticketEnergy
    const newTotal = odEnergyCharge + amount
    if (newTotal <= maxAllowed) {
      setOdEnergyCharge(newTotal)
    } else {
      alert(`최대 ${maxAllowed}까지만 충전할 수 있습니다.`)
    }
  }

  const handleOdEnergyDecrement = (amount: number) => {
    setOdEnergyCharge(prev => Math.max(0, prev - amount))
  }

  // 초기설정 입력 핸들러
  const handleInitialSettingChange = (key: string, value: string) => {
    const numValue = parseInt(value) || 0
    setInitialSettings(prev => ({
      ...prev,
      [key]: numValue
    }))
  }

  // 초기설정 적용
  const handleApplyInitialSettings = () => {
    const confirmed = window.confirm(
      '현재 입력한 이용권 상태로 가계부를 동기화하시겠습니까?\n\n이 작업은 취소할 수 없습니다.'
    )

    if (confirmed && onInitialSync) {
      // 티켓 데이터 구성
      const tickets: Record<string, number> = {}
      TICKET_TYPES.forEach(ticket => {
        tickets[ticket.id] = initialSettings[ticket.id as keyof typeof initialSettings] as number
      })

      // 초기설정 동기화
      onInitialSync({
        odTimeEnergy: initialSettings.odTimeEnergy,
        odTicketEnergy: initialSettings.odTicketEnergy,
        tickets
      })

      alert('가계부가 인게임 상태로 동기화되었습니다!')
      setActiveTab('charge')
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        {/* 말풍선 꼬리 */}
        <div className={styles.tail} />

        {/* 헤더 */}
        <div className={styles.header}>
          <h3 className={styles.title}>⚡ 설정 & 충전</h3>
          <button className={styles.closeBtn} onClick={handleCancel}>
            ✕
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className={styles.tabMenu}>
          <button
            className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            초기설정
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'charge' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('charge')}
          >
            이용권충전
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'settings' && (
          <div className={styles.tabContent}>
            {/* 초기설정 내용 */}
            <div className={styles.settingsContent}>
              <p className={styles.settingsDescription}>
                인게임에서 현재 남아있는 이용권 횟수를 입력하세요.
              </p>

              {/* 오드 에너지 */}
              <div className={styles.settingSection}>
                <h4 className={styles.sectionTitle}>
                  <Image src="/메달/오드.png" alt="오드 에너지" width={20} height={20} />
                  오드 에너지
                </h4>
                <div className={styles.settingRow}>
                  <label className={styles.settingLabel}>시간 충전</label>
                  <input
                    type="number"
                    className={styles.settingInput}
                    value={initialSettings.odTimeEnergy}
                    onChange={(e) => handleInitialSettingChange('odTimeEnergy', e.target.value)}
                    min={0}
                    max={840}
                  />
                  <span className={styles.maxLabel}>/ 840</span>
                </div>
                <div className={styles.settingRow}>
                  <label className={styles.settingLabel}>충전권</label>
                  <input
                    type="number"
                    className={styles.settingInput}
                    value={initialSettings.odTicketEnergy}
                    onChange={(e) => handleInitialSettingChange('odTicketEnergy', e.target.value)}
                    min={0}
                    max={2000}
                  />
                  <span className={styles.maxLabel}>/ 2,000</span>
                </div>
              </div>

              {/* 티켓 이용권 */}
              <div className={styles.settingSection}>
                <h4 className={styles.sectionTitle}>⚡ 컨텐츠 이용권</h4>
                {TICKET_TYPES.map(ticket => (
                  <div key={ticket.id} className={styles.settingRow}>
                    <label className={styles.settingLabel}>
                      <span className={styles.ticketIcon}>{ticket.icon}</span>
                      {ticket.name}
                    </label>
                    <input
                      type="number"
                      className={styles.settingInput}
                      value={initialSettings[ticket.id as keyof typeof initialSettings] as number}
                      onChange={(e) => handleInitialSettingChange(ticket.id, e.target.value)}
                      min={0}
                      max={ticket.maxBase}
                    />
                    <span className={styles.maxLabel}>/ {ticket.maxBase}</span>
                  </div>
                ))}
              </div>

              {/* 적용 버튼 */}
              <div className={styles.settingsFooter}>
                <button className={styles.applyBtn} onClick={handleApplyInitialSettings}>
                  가계부에 적용하기
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'charge' && (
          <>
            {/* 오드 에너지 섹션 */}
        <div className={styles.odEnergySection}>
          <div className={styles.odEnergyHeader}>
            <Image
              src="/메달/오드.png"
              alt="오드 에너지"
              width={24}
              height={24}
            />
            <span className={styles.odEnergyTitle}>오드 에너지</span>
          </div>

          <div className={styles.odEnergyStatus}>
            <div className={styles.odEnergyInfo}>
              <span>시간충전: {odEnergy.timeEnergy}/840</span>
              <span>충전권: {odEnergy.ticketEnergy}/2,000</span>
            </div>
          </div>

          <div className={styles.odEnergyInputRow}>
            <label className={styles.odInputLabel}>충전할 양:</label>
            <input
              type="number"
              className={styles.odInput}
              value={odEnergyCharge}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0
                const maxAllowed = 2000 - odEnergy.ticketEnergy
                if (value <= maxAllowed) {
                  setOdEnergyCharge(value)
                } else {
                  setOdEnergyCharge(maxAllowed)
                }
              }}
              min={0}
              max={2000 - odEnergy.ticketEnergy}
              placeholder="0"
            />
            <button
              className={styles.odResetBtn}
              onClick={() => setOdEnergyCharge(0)}
              disabled={odEnergyCharge === 0}
            >
              초기화
            </button>
          </div>

          {odEnergyCharge > 0 && (
            <div className={styles.odEnergyPreview}>
              충전 예정: +{odEnergyCharge} → 총 {odEnergy.ticketEnergy + odEnergyCharge}/2,000
            </div>
          )}
        </div>

        <div className={styles.divider} />

        {/* 티켓 리스트 */}
        <div className={styles.ticketList}>
          {TICKET_TYPES.map(ticket => {
            const current = currentTickets[ticket.id]
            const chargeCount = charges[ticket.id] || 0

            return (
              <div key={ticket.id} className={styles.ticketRow}>
                {/* 티켓 이름 */}
                <div className={styles.ticketName}>
                  <span className={styles.ticketIcon}>{ticket.icon}</span>
                  <span>{ticket.name}</span>
                </div>

                {/* 현재 상태 */}
                <div className={styles.ticketStatus}>
                  <span className={styles.current}>
                    {current?.base || 0}/{ticket.maxBase}
                  </span>
                  {(current?.bonus || 0) > 0 && (
                    <span className={styles.bonus}>(+{current.bonus})</span>
                  )}
                </div>

                {/* 충전 컨트롤 */}
                <div className={styles.controls}>
                  <button
                    className={styles.decrementBtn}
                    onClick={() => handleDecrement(ticket.id)}
                    disabled={chargeCount === 0}
                  >
                    −
                  </button>
                  <span className={styles.chargeCount}>{chargeCount}</span>
                  <button
                    className={styles.incrementBtn}
                    onClick={() => handleIncrement(ticket.id)}
                  >
                    +
                  </button>
                </div>
              </div>
            )
          })}
        </div>

            {/* 푸터 */}
            <div className={styles.footer}>
              <button className={styles.confirmBtn} onClick={handleConfirm}>
                충전하기
              </button>
              <button className={styles.cancelBtn} onClick={handleCancel}>
                취소
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
