'use client'

import { useState, useEffect, useMemo } from 'react'
import { getWeekKey, getGameDate } from '../utils/dateUtils'
import styles from './CalendarModal.module.css'

// 아이템 타입 (판매 정보 포함)
interface LedgerItem {
  id: string
  sold_date?: string
  sold_price?: number | null
  total_price: number
  is_sold: boolean
}

interface CalendarModalProps {
  isOpen: boolean
  currentDate: string
  characterId: string | null
  items?: LedgerItem[]
  onClose: () => void
  onSelectDate: (date: string) => void
}

export default function CalendarModal({
  isOpen,
  currentDate,
  characterId,
  items = [],
  onClose,
  onSelectDate
}: CalendarModalProps) {
  // 게임 날짜 기준 (새벽 5시 기준으로 날짜 변경) - 오늘 하이라이트용
  const todayStr = getGameDate(new Date())
  const gameToday = new Date(todayStr)

  // 실제 오늘 날짜 (미래 날짜 차단용)
  const realToday = new Date()
  const realTodayStr = realToday.toISOString().split('T')[0]

  // 현재 보고 있는 월 (year, month)
  const [viewYear, setViewYear] = useState(gameToday.getFullYear())
  const [viewMonth, setViewMonth] = useState(gameToday.getMonth())

  // 선택된 날짜
  const [selectedDate, setSelectedDate] = useState(currentDate)

  // 기록이 있는 날짜 목록
  const [recordedDates, setRecordedDates] = useState<Set<string>>(new Set())

  // 모달이 열릴 때 현재 날짜 기준으로 초기화
  useEffect(() => {
    if (isOpen) {
      const date = new Date(currentDate)
      setViewYear(date.getFullYear())
      setViewMonth(date.getMonth())
      setSelectedDate(currentDate)
    }
  }, [isOpen, currentDate])

  // 캐릭터가 변경되거나 모달이 열릴 때 기록된 날짜 조회
  useEffect(() => {
    if (isOpen && characterId) {
      const dates = getRecordedDates(characterId)
      setRecordedDates(new Set(dates))
    }
  }, [isOpen, characterId])

  // localStorage에서 기록된 날짜 목록 추출
  const getRecordedDates = (charId: string): string[] => {
    const dateSet = new Set<string>()
    const weekKeysWithRecords = new Set<string>()

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue

      // dailyContent는 날짜별로 저장됨
      if (key.startsWith(`dailyContent_${charId}_`)) {
        const date = key.replace(`dailyContent_${charId}_`, '')
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dateSet.add(date)
        }
      }

      // dungeonRecords는 주간 키로 저장됨 (예: 2026-W03)
      if (key.startsWith(`dungeonRecords_${charId}_`)) {
        const weekKeyPart = key.replace(`dungeonRecords_${charId}_`, '')
        if (weekKeyPart.match(/^\d{4}-W\d{2}$/)) {
          weekKeysWithRecords.add(weekKeyPart)
        }
      }
    }

    // 현재 보이는 달의 각 날짜에 대해 주간 키 확인
    // (이 함수는 캘린더에서 표시할 날짜들에 대해 주간 기록 여부를 확인하기 위함)
    // 실제로는 캘린더 그리드에서 각 날짜의 weekKey를 확인

    return Array.from(dateSet)
  }

  // 특정 날짜에 기록이 있는지 확인 (dailyContent 또는 dungeonRecords)
  const hasRecordForDate = (dateStr: string): boolean => {
    if (!characterId) return false

    // dailyContent 확인
    const dailyKey = `dailyContent_${characterId}_${dateStr}`
    if (localStorage.getItem(dailyKey)) return true

    // dungeonRecords 확인 (일별 기록)
    const dungeonKey = `dungeonRecords_${characterId}_${dateStr}`
    if (localStorage.getItem(dungeonKey)) return true

    return false
  }

  // 날짜별 아이템 판매 수입 계산
  const getItemSalesIncomeForDate = (dateStr: string): number => {
    return items
      .filter(item => {
        if (!item.is_sold || !item.sold_date) return false
        const soldDateStr = item.sold_date.split('T')[0]
        return soldDateStr === dateStr
      })
      .reduce((sum, item) => sum + (item.sold_price || item.total_price || 0), 0)
  }

  // 날짜별 던전 컨텐츠 수입 계산 (localStorage에서)
  const getDungeonIncomeForDate = (dateStr: string): number => {
    if (!characterId) return 0

    const storageKey = `dungeonRecords_${characterId}_${dateStr}`
    const savedData = localStorage.getItem(storageKey)

    if (!savedData) return 0

    try {
      const parsed = JSON.parse(savedData)
      let totalKina = 0

      // 초월 기록 합산
      if (parsed.transcend && Array.isArray(parsed.transcend)) {
        totalKina += parsed.transcend.reduce((sum: number, r: any) => sum + (r.kina || 0), 0)
      }
      // 원정 기록 합산
      if (parsed.expedition && Array.isArray(parsed.expedition)) {
        totalKina += parsed.expedition.reduce((sum: number, r: any) => sum + (r.kina || 0), 0)
      }
      // 성역(루드라) 기록 합산
      if (parsed.sanctuary && Array.isArray(parsed.sanctuary)) {
        totalKina += parsed.sanctuary.reduce((sum: number, r: any) => sum + (r.kina || 0), 0)
      }

      return totalKina
    } catch (e) {
      return 0
    }
  }

  // 날짜별 일일 컨텐츠 수입 계산 (localStorage에서)
  const getDailyContentIncomeForDate = (dateStr: string): number => {
    if (!characterId) return 0

    const storageKey = `dailyContent_${characterId}_${dateStr}`
    const savedData = localStorage.getItem(storageKey)

    if (!savedData) return 0

    try {
      const parsed = JSON.parse(savedData)
      let totalKina = 0

      // 각 컨텐츠의 키나 합산
      Object.values(parsed).forEach((content: any) => {
        if (content && typeof content.earnedKina === 'number') {
          totalKina += content.earnedKina
        }
      })

      return totalKina
    } catch (e) {
      return 0
    }
  }

  // 날짜별 총 수입 계산
  const getTotalIncomeForDate = (dateStr: string): { contentIncome: number; itemIncome: number; total: number } => {
    const dungeonIncome = getDungeonIncomeForDate(dateStr)
    const dailyIncome = getDailyContentIncomeForDate(dateStr)
    const itemIncome = getItemSalesIncomeForDate(dateStr)

    return {
      contentIncome: dungeonIncome + dailyIncome,
      itemIncome,
      total: dungeonIncome + dailyIncome + itemIncome
    }
  }

  // 선택된 날짜의 수입 정보
  const selectedDateIncome = useMemo(() => {
    return getTotalIncomeForDate(selectedDate)
  }, [selectedDate, items, characterId])

  // 날짜에 아이템 판매가 있는지 확인
  const hasItemSalesForDate = (dateStr: string): boolean => {
    return items.some(item => {
      if (!item.is_sold || !item.sold_date) return false
      const soldDateStr = item.sold_date.split('T')[0]
      return soldDateStr === dateStr
    })
  }

  // 달력 데이터 생성
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const lastDay = new Date(viewYear, viewMonth + 1, 0)
    const startDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days: (number | null)[] = []

    // 이전 달 빈 칸
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }

    // 현재 달 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }, [viewYear, viewMonth])

  // 날짜 문자열 생성 (YYYY-MM-DD)
  const formatDateStr = (day: number): string => {
    const month = String(viewMonth + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    return `${viewYear}-${month}-${dayStr}`
  }

  // 이전 월로 이동
  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  // 다음 월로 이동
  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  // 오늘로 이동 (바로 적용하고 모달 닫기)
  const goToToday = () => {
    onSelectDate(todayStr)
    onClose()
  }

  // 날짜 선택 (바로 적용하고 모달 닫기)
  const handleDateClick = (day: number) => {
    const dateStr = formatDateStr(day)
    onSelectDate(dateStr)
    onClose()
  }

  // 확인 버튼
  const handleConfirm = () => {
    onSelectDate(selectedDate)
    onClose()
  }

  // 오버레이 클릭
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const weekdays = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        {/* 헤더 */}
        <div className={styles.header}>
          <button className={styles.navButton} onClick={goToPrevMonth}>
            ◀
          </button>
          <h2 className={styles.title}>
            {viewYear}년 {viewMonth + 1}월
          </h2>
          <button className={styles.navButton} onClick={goToNextMonth}>
            ▶
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className={styles.weekdayHeader}>
          {weekdays.map((day, index) => (
            <div
              key={day}
              className={`${styles.weekday} ${
                index === 0 ? styles.sunday : index === 6 ? styles.saturday : ''
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 달력 그리드 */}
        <div className={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className={styles.emptyCell} />
            }

            const dateStr = formatDateStr(day)
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            const hasRecord = hasRecordForDate(dateStr)
            const hasItemSales = hasItemSalesForDate(dateStr)
            const dayOfWeek = (index) % 7
            // 미래 날짜 체크 (실제 오늘 날짜 기준)
            const isFuture = dateStr > realTodayStr

            return (
              <button
                key={day}
                className={`${styles.dayCell} ${isToday ? styles.today : ''} ${
                  isSelected ? styles.selected : ''
                } ${dayOfWeek === 0 ? styles.sunday : dayOfWeek === 6 ? styles.saturday : ''} ${isFuture ? styles.disabled : ''}`}
                onClick={() => !isFuture && handleDateClick(day)}
                disabled={isFuture}
              >
                <span className={styles.dayNumber}>{day}</span>
                <div className={styles.dotContainer}>
                  {hasRecord && <span className={styles.recordDot} />}
                  {hasItemSales && <span className={styles.itemDot} />}
                </div>
              </button>
            )
          })}
        </div>

        {/* 선택된 날짜 수입 정보 */}
        <div className={styles.incomeInfo}>
          <div className={styles.incomeHeader}>
            <span className={styles.incomeDate}>{selectedDate}</span>
            {(hasRecordForDate(selectedDate) || hasItemSalesForDate(selectedDate)) && (
              <span className={styles.hasRecordBadge}>기록 있음</span>
            )}
          </div>
          {selectedDateIncome.total > 0 ? (
            <div className={styles.incomeDetails}>
              <div className={styles.incomeRow}>
                <span className={styles.incomeLabel}>컨텐츠 수입</span>
                <span className={styles.incomeValue}>
                  {selectedDateIncome.contentIncome.toLocaleString()} 키나
                </span>
              </div>
              <div className={styles.incomeRow}>
                <span className={styles.incomeLabel}>아이템 판매</span>
                <span className={styles.incomeValueItem}>
                  {selectedDateIncome.itemIncome.toLocaleString()} 키나
                </span>
              </div>
              <div className={styles.incomeTotal}>
                <span className={styles.incomeTotalLabel}>총 수입</span>
                <span className={styles.incomeTotalValue}>
                  {selectedDateIncome.total.toLocaleString()} 키나
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.noIncome}>수입 기록이 없습니다</div>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className={styles.actions}>
          <button className={styles.todayButton} onClick={goToToday}>
            오늘
          </button>
          <div className={styles.actionRight}>
            <button className={styles.cancelButton} onClick={onClose}>
              취소
            </button>
            <button className={styles.confirmButton} onClick={handleConfirm}>
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
