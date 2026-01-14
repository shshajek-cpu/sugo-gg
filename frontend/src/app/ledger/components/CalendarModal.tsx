'use client'

import { useState, useEffect, useMemo } from 'react'
import { getWeekKey, getGameDate } from '../utils/dateUtils'
import styles from './CalendarModal.module.css'

interface CalendarModalProps {
  isOpen: boolean
  currentDate: string
  characterId: string | null
  onClose: () => void
  onSelectDate: (date: string) => void
}

export default function CalendarModal({
  isOpen,
  currentDate,
  characterId,
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
                {hasRecord && <span className={styles.recordDot} />}
              </button>
            )
          })}
        </div>

        {/* 선택된 날짜 표시 */}
        <div className={styles.selectedInfo}>
          선택: {selectedDate}
          {hasRecordForDate(selectedDate) && (
            <span className={styles.hasRecordBadge}>기록 있음</span>
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
