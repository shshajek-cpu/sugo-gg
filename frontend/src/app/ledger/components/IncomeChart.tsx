'use client'

import { useState, useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { LedgerCharacter } from '@/types/ledger'
import styles from './IncomeChart.module.css'

interface DailyIncome {
  date: string
  characterId: string
  characterName: string
  income: number
}

interface IncomeChartProps {
  characters: LedgerCharacter[]
  dailyIncomes: DailyIncome[]
  isLoading?: boolean
}

type PeriodType = 'daily' | 'weekly' | 'monthly'

// 차트 데이터 타입
interface ChartDataPoint {
  label: string
  total: number
  trend: number
  [key: string]: string | number
}

export default function IncomeChart({ characters, dailyIncomes, isLoading }: IncomeChartProps) {
  const [period, setPeriod] = useState<PeriodType>('daily')

  // 기간에 따른 데이터 변환
  const chartData = useMemo((): ChartDataPoint[] => {
    if (!dailyIncomes || dailyIncomes.length === 0) return []

    const now = new Date()
    let startDate: Date
    let dateFormat: (date: Date) => string

    switch (period) {
      case 'daily':
        // 최근 7일
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 6)
        dateFormat = (d) => `${d.getMonth() + 1}/${d.getDate()}`
        break
      case 'weekly':
        // 최근 4주
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 27)
        dateFormat = (d) => `${d.getMonth() + 1}/${d.getDate()}`
        break
      case 'monthly':
        // 최근 3개월
        startDate = new Date(now)
        startDate.setMonth(startDate.getMonth() - 2)
        startDate.setDate(1)
        dateFormat = (d) => `${d.getMonth() + 1}월`
        break
    }

    // 날짜 범위 생성
    const dates: string[] = []
    const current = new Date(startDate)

    if (period === 'monthly') {
      // 월별 데이터
      while (current <= now) {
        dates.push(current.toISOString().split('T')[0].substring(0, 7)) // YYYY-MM
        current.setMonth(current.getMonth() + 1)
      }
    } else {
      // 일별 데이터
      while (current <= now) {
        dates.push(current.toISOString().split('T')[0])
        current.setDate(current.getDate() + 1)
      }
    }

    // 캐릭터별 수입 집계
    const dataMap = new Map<string, ChartDataPoint>()

    dates.forEach(date => {
      const record: ChartDataPoint = { label: '', total: 0, trend: 0 }
      characters.forEach(char => {
        record[char.id] = 0
      })
      dataMap.set(date, record)
    })

    dailyIncomes.forEach(income => {
      const dateKey = period === 'monthly'
        ? income.date.substring(0, 7)
        : income.date

      if (dataMap.has(dateKey)) {
        const record = dataMap.get(dateKey)!
        record[income.characterId] = (Number(record[income.characterId]) || 0) + income.income
        record.total = (record.total || 0) + income.income
      }
    })

    // 주간 데이터로 그룹화 (주간 모드인 경우)
    if (period === 'weekly') {
      const weeklyData: ChartDataPoint[] = []
      let weekStart = new Date(startDate)

      while (weekStart <= now) {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)

        const weekRecord: ChartDataPoint = { label: '', total: 0, trend: 0 }
        characters.forEach(char => {
          weekRecord[char.id] = 0
        })

        // 해당 주의 데이터 합산
        dataMap.forEach((record, dateStr) => {
          const recordDate = new Date(dateStr)
          if (recordDate >= weekStart && recordDate <= weekEnd) {
            characters.forEach(char => {
              weekRecord[char.id] = (Number(weekRecord[char.id]) || 0) + (Number(record[char.id]) || 0)
            })
            weekRecord.total = (weekRecord.total || 0) + (record.total || 0)
          }
        })

        weekRecord.label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`
        weeklyData.push(weekRecord)

        weekStart.setDate(weekStart.getDate() + 7)
      }

      // 주간 데이터 추세선 계산
      const windowSize = Math.min(2, weeklyData.length)
      for (let i = 0; i < weeklyData.length; i++) {
        let sum = 0
        let count = 0
        for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
          sum += weeklyData[j].total
          count++
        }
        weeklyData[i].trend = Math.round(sum / count)
      }

      return weeklyData
    }

    // 일별/월별 데이터 변환
    const result = Array.from(dataMap.entries()).map(([date, record]) => {
      const d = new Date(period === 'monthly' ? date + '-01' : date)
      return {
        ...record,
        label: dateFormat(d),
        trend: 0
      }
    })

    // 이동 평균 추세선 계산 (3일 평균)
    const windowSize = Math.min(3, result.length)
    for (let i = 0; i < result.length; i++) {
      let sum = 0
      let count = 0
      for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
        sum += result[j].total
        count++
      }
      result[i].trend = Math.round(sum / count)
    }

    return result
  }, [dailyIncomes, characters, period])

  // 총 수입 계산
  const totalIncome = useMemo(() => {
    return chartData.reduce((sum, d) => sum + (d.total || 0), 0)
  }, [chartData])

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const totalEntry = payload.find((p: any) => p.dataKey === 'total')
      const trendEntry = payload.find((p: any) => p.dataKey === 'trend')
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          {totalEntry && (
            <p className={styles.tooltipValue} style={{ color: '#fbdb51' }}>
              수익: {totalEntry.value.toLocaleString('ko-KR')} 키나
            </p>
          )}
          {trendEntry && (
            <p className={styles.tooltipValue} style={{ color: '#60A5FA' }}>
              평균: {trendEntry.value.toLocaleString('ko-KR')} 키나
            </p>
          )}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <section className={styles.section}>
        <div className={styles.loading}>로딩 중...</div>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <TrendingUp size={18} />
          수익 그래프
        </h2>
        <div className={styles.periodSelector}>
          <button
            className={`${styles.periodBtn} ${period === 'daily' ? styles.periodBtnActive : ''}`}
            onClick={() => setPeriod('daily')}
          >
            일간
          </button>
          <button
            className={`${styles.periodBtn} ${period === 'weekly' ? styles.periodBtnActive : ''}`}
            onClick={() => setPeriod('weekly')}
          >
            주간
          </button>
          <button
            className={`${styles.periodBtn} ${period === 'monthly' ? styles.periodBtnActive : ''}`}
            onClick={() => setPeriod('monthly')}
          >
            월간
          </button>
        </div>
      </div>

      <div className={styles.chartContainer}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#a5a8b4', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#a5a8b4', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                  return value
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="total"
                fill="#fbdb51"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#60A5FA"
                strokeWidth={2}
                dot={{ r: 3, fill: '#60A5FA' }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.emptyChart}>
            <p>데이터가 없습니다</p>
          </div>
        )}
      </div>

      <div className={styles.summary}>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendBar}></span>
            일별 수익
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendLine}></span>
            평균 추세
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>
            {period === 'daily' ? '7일' : period === 'weekly' ? '4주' : '3개월'} 총 수익
          </span>
          <span className={styles.summaryValue}>
            {totalIncome.toLocaleString('ko-KR')} 키나
          </span>
        </div>
      </div>
    </section>
  )
}
