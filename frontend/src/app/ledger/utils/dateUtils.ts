/**
 * 게임 리셋 기준 날짜/주간 계산 유틸리티
 * - 일일 리셋: 매일 새벽 5시
 * - 주간 리셋: 수요일 새벽 5시
 */

/**
 * 현재 시간 기준 게임 날짜 계산 (새벽 5시 기준)
 * 예: 1월 15일 04:00 → 1월 14일로 계산
 *     1월 15일 06:00 → 1월 15일로 계산
 */
export function getGameDate(date: Date = new Date()): string {
  const adjusted = new Date(date)

  // 5시 이전이면 전날로 계산
  if (adjusted.getHours() < 5) {
    adjusted.setDate(adjusted.getDate() - 1)
  }

  return adjusted.toISOString().split('T')[0]
}

/**
 * 주간 키 계산 (수요일 새벽 5시 기준)
 * 같은 주 내에서는 같은 키 반환
 * 예: 2026-W03 (2026년 3번째 주간)
 */
export function getWeekKey(date: Date = new Date()): string {
  const adjusted = new Date(date)

  // 5시 이전이면 전날로 계산
  if (adjusted.getHours() < 5) {
    adjusted.setDate(adjusted.getDate() - 1)
  }

  // 수요일(3)을 주의 시작으로 계산
  // 현재 요일 (0=일, 1=월, ..., 6=토)
  const dayOfWeek = adjusted.getDay()

  // 수요일 기준으로 며칠이 지났는지 계산
  // 수(3)->0, 목(4)->1, 금(5)->2, 토(6)->3, 일(0)->4, 월(1)->5, 화(2)->6
  const daysSinceWednesday = (dayOfWeek + 4) % 7

  // 이번 주 수요일 찾기
  const weekStart = new Date(adjusted)
  weekStart.setDate(adjusted.getDate() - daysSinceWednesday)

  // 연도와 주차 계산
  const year = weekStart.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const daysSinceStart = Math.floor((weekStart.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.ceil((daysSinceStart + 1) / 7)

  return `${year}-W${String(weekNumber).padStart(2, '0')}`
}

/**
 * 특정 날짜가 수정 가능한지 확인 (이틀 전까지만 수정 가능)
 */
export function isEditable(targetDate: string): boolean {
  const today = new Date()
  const gameToday = getGameDate(today)

  const target = new Date(targetDate)
  const current = new Date(gameToday)

  // 날짜 차이 계산 (일 단위)
  const diffTime = current.getTime() - target.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  // 0 (오늘), 1 (어제), 2 (그저께)까지 수정 가능
  return diffDays <= 2
}

/**
 * 특정 날짜가 같은 주간에 속하는지 확인
 */
export function isSameWeek(date1: string, date2: string): boolean {
  return getWeekKey(new Date(date1)) === getWeekKey(new Date(date2))
}

/**
 * 주간 시작일 (수요일) 반환
 */
export function getWeekStartDate(date: Date = new Date()): string {
  const adjusted = new Date(date)

  if (adjusted.getHours() < 5) {
    adjusted.setDate(adjusted.getDate() - 1)
  }

  const dayOfWeek = adjusted.getDay()
  const daysSinceWednesday = (dayOfWeek + 4) % 7

  const weekStart = new Date(adjusted)
  weekStart.setDate(adjusted.getDate() - daysSinceWednesday)

  return weekStart.toISOString().split('T')[0]
}

/**
 * 주간 종료일 (다음 화요일) 반환
 */
export function getWeekEndDate(date: Date = new Date()): string {
  const weekStart = new Date(getWeekStartDate(date))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  return weekEnd.toISOString().split('T')[0]
}
