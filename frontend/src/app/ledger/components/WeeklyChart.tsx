'use client'

import { TrendingUp } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { WeeklyStats } from '@/types/ledger'
import styles from '../ledger.module.css'

interface WeeklyChartProps {
  stats: WeeklyStats | null
  isLoading: boolean
}

export default function WeeklyChart({ stats, isLoading }: WeeklyChartProps) {
  if (isLoading) {
    return (
      <section className={styles.section}>
        <div className={styles.loading}>로딩 중...</div>
      </section>
    )
  }

  if (!stats) {
    return null
  }

  // 차트 데이터 변환
  const chartData = stats.dailyData.map((d) => {
    const date = new Date(d.date)
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return {
      day: days[date.getDay()],
      date: d.date,
      income: d.totalIncome,
      contentIncome: d.contentIncome,
      itemIncome: d.itemIncome
    }
  })

  // 날짜 범위 포맷
  const formatDateRange = () => {
    const start = new Date(stats.startDate)
    const end = new Date(stats.endDate)
    return `${start.getMonth() + 1}/${start.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`
  }

  // 최고 수입일 포맷
  const formatBestDay = () => {
    if (!stats.bestDay.date) return '-'
    const date = new Date(stats.bestDay.date)
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return days[date.getDay()] + '요일'
  }

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div style={{
          background: '#27282e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          padding: 12
        }}>
          <p style={{ color: '#ffffff', fontWeight: 600, marginBottom: 8 }}>
            {label}요일
          </p>
          <p style={{ color: '#fbdb51', fontSize: 14 }}>
            총: {data.income.toLocaleString('ko-KR')} 키나
          </p>
          <p style={{ color: '#a5a8b4', fontSize: 12 }}>
            컨텐츠: {data.contentIncome.toLocaleString('ko-KR')}
          </p>
          <p style={{ color: '#a5a8b4', fontSize: 12 }}>
            아이템: {data.itemIncome.toLocaleString('ko-KR')}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <TrendingUp size={18} />
          주간 수입 추이
        </h2>
        <span className={styles.sectionDate}>{formatDateRange()}</span>
      </div>

      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="day"
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
            <Bar dataKey="income" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.date === stats.bestDay.date ? '#fbdb51' : '#4a4a4e'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.chartStats}>
        <div className={styles.chartStat}>
          <span className={styles.chartStatLabel}>이번주 총합</span>
          <span className={styles.chartStatValue}>
            {stats.totalIncome.toLocaleString('ko-KR')} 키나
          </span>
        </div>
        <div className={styles.chartStat}>
          <span className={styles.chartStatLabel}>일 평균</span>
          <span className={styles.chartStatValue}>
            {stats.averageIncome.toLocaleString('ko-KR')} 키나
          </span>
        </div>
        <div className={styles.chartStat}>
          <span className={styles.chartStatLabel}>최고 수입일</span>
          <span className={styles.chartStatValue}>
            {formatBestDay()} ({stats.bestDay.income.toLocaleString('ko-KR')})
          </span>
        </div>
      </div>
    </section>
  )
}
