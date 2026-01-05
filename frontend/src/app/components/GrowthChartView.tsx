'use client'
import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface GrowthData {
    date: string
    itemLevel: number
    combatPower: number
}

interface GrowthChartViewProps {
    data?: GrowthData[]
}

export default function GrowthChartView({ data }: GrowthChartViewProps) {
    const [period, setPeriod] = useState<7 | 30 | 90 | 'all'>(30)
    const [showItemLevel, setShowItemLevel] = useState(true)
    const [showCombatPower, setShowCombatPower] = useState(true)

    // 더미 데이터 생성 (30일치)
    const dummyData: GrowthData[] = useMemo(() => {
        const today = new Date()
        const result: GrowthData[] = []

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)

            result.push({
                date: `${date.getMonth() + 1}/${date.getDate()}`,
                itemLevel: 70 + Math.floor((29 - i) * 0.5) + Math.floor(Math.random() * 2),
                combatPower: 3000 + Math.floor((29 - i) * 50) + Math.floor(Math.random() * 100)
            })
        }

        return result
    }, [])

    const chartData = data || dummyData

    // 필터링된 데이터
    const filteredData = useMemo(() => {
        if (period === 'all') return chartData
        return chartData.slice(-period)
    }, [chartData, period])

    // 통계 계산
    const stats = useMemo(() => {
        if (filteredData.length === 0) return { week: 0, month: 0, max: 0, growthRate: 0 }

        const latest = filteredData[filteredData.length - 1]
        const weekAgo = filteredData[Math.max(0, filteredData.length - 7)]
        const monthAgo = filteredData[0]

        const weekGrowth = latest.itemLevel - weekAgo.itemLevel
        const monthGrowth = latest.itemLevel - monthAgo.itemLevel
        const maxLevel = Math.max(...filteredData.map(d => d.itemLevel))
        const growthRate = monthAgo.itemLevel > 0
            ? ((latest.itemLevel - monthAgo.itemLevel) / monthAgo.itemLevel * 100)
            : 0

        return {
            week: weekGrowth,
            month: monthGrowth,
            max: maxLevel,
            growthRate: growthRate.toFixed(1)
        }
    }, [filteredData])

    // 예측 트렌드 라인 데이터
    const predictionData = useMemo(() => {
        if (filteredData.length < 2) return []

        const last = filteredData[filteredData.length - 1]
        const secondLast = filteredData[filteredData.length - 2]
        const trend = last.itemLevel - secondLast.itemLevel

        const predictions: GrowthData[] = []
        for (let i = 1; i <= 7; i++) {
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + i)
            predictions.push({
                date: `${futureDate.getMonth() + 1}/${futureDate.getDate()}`,
                itemLevel: last.itemLevel + (trend * i),
                combatPower: last.combatPower + (trend * i * 50)
            })
        }

        return [...filteredData, ...predictions]
    }, [filteredData])

    return (
        <div>
            {/* 기간별 성장률 표시 */}
            <div style={{
                padding: '1rem',
                background: '#0B0D12',
                borderRadius: '8px',
                border: '1px solid #1F2433',
                marginBottom: '1.5rem'
            }}>
                <div style={{ fontSize: '0.9rem', color: '#E5E7EB', marginBottom: '0.75rem', fontWeight: 'bold' }}>
                    📈 기간별 성장률
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>일평균</div>
                        <div style={{ fontSize: '1.25rem', color: '#10B981', fontWeight: 'bold' }}>
                            +{(stats.month / 30).toFixed(1)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>레벨/일</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>주평균</div>
                        <div style={{ fontSize: '1.25rem', color: '#3B82F6', fontWeight: 'bold' }}>
                            +{stats.week.toFixed(1)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>레벨/주</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>월평균</div>
                        <div style={{ fontSize: '1.25rem', color: '#8B5CF6', fontWeight: 'bold' }}>
                            +{stats.month}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>레벨/월</div>
                    </div>
                </div>
            </div>

            {/* 기간 선택 버튼 */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem',
                justifyContent: 'center'
            }}>
                <PeriodButton active={period === 7} onClick={() => setPeriod(7)}>7일</PeriodButton>
                <PeriodButton active={period === 30} onClick={() => setPeriod(30)}>30일</PeriodButton>
                <PeriodButton active={period === 90} onClick={() => setPeriod(90)}>90일</PeriodButton>
                <PeriodButton active={period === 'all'} onClick={() => setPeriod('all')}>전체</PeriodButton>
            </div>

            {/* 체크박스 컨트롤 */}
            <div style={{
                display: 'flex',
                gap: '1.5rem',
                marginBottom: '1.5rem',
                justifyContent: 'center'
            }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={showItemLevel}
                        onChange={(e) => setShowItemLevel(e.target.checked)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <span style={{ color: '#3B82F6', fontSize: '0.875rem', fontWeight: 'bold' }}>
                        아이템 레벨
                    </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={showCombatPower}
                        onChange={(e) => setShowCombatPower(e.target.checked)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <span style={{ color: '#10B981', fontSize: '0.875rem', fontWeight: 'bold' }}>
                        NOA 전투력
                    </span>
                </label>
            </div>

            {/* 통합 차트 (듀얼 Y축) */}
            <div>
                <h4 style={{
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    color: '#E5E7EB',
                    marginBottom: '1rem'
                }}>
                    성장 추이
                </h4>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={predictionData}>
                        <defs>
                            <linearGradient id="colorItemLevel" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorCombatPower" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1F2433" />
                        <XAxis
                            dataKey="date"
                            stroke="#6B7280"
                            style={{ fontSize: '0.75rem' }}
                        />
                        {/* 왼쪽 Y축 - 아이템 레벨 */}
                        <YAxis
                            yAxisId="left"
                            stroke="#3B82F6"
                            style={{ fontSize: '0.75rem' }}
                            label={{ value: '아이템 레벨', angle: -90, position: 'insideLeft', style: { fill: '#3B82F6' } }}
                        />
                        {/* 오른쪽 Y축 - NOA 전투력 */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#10B981"
                            style={{ fontSize: '0.75rem' }}
                            label={{ value: 'NOA 전투력', angle: 90, position: 'insideRight', style: { fill: '#10B981' } }}
                        />
                        <Tooltip
                            contentStyle={{
                                background: '#0B0D12',
                                border: '1px solid #1F2433',
                                borderRadius: '8px',
                                color: '#E5E7EB'
                            }}
                        />
                        <Legend />
                        {showItemLevel && (
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="itemLevel"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                dot={{ fill: '#3B82F6', r: 3 }}
                                activeDot={{ r: 5 }}
                                name="아이템 레벨"
                            />
                        )}
                        {showCombatPower && (
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="combatPower"
                                stroke="#10B981"
                                strokeWidth={2}
                                dot={{ fill: '#10B981', r: 3 }}
                                activeDot={{ r: 5 }}
                                name="NOA 전투력"
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>

        </div>
    )
}

interface StatCardProps {
    title: string
    value: string
    unit: string
    color: string
}

function StatCard({ title, value, unit, color }: StatCardProps) {
    return (
        <div style={{
            background: '#0B0D12',
            border: '1px solid #1F2433',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center'
        }}>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.5rem' }}>
                {title}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color, marginBottom: '0.25rem' }}>
                {value}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                {unit}
            </div>
        </div>
    )
}

interface PeriodButtonProps {
    active: boolean
    onClick: () => void
    children: React.ReactNode
}

function PeriodButton({ active, onClick, children }: PeriodButtonProps) {
    return (
        <button
            onClick={onClick}
            style={{
                background: active ? '#1F2433' : '#0B0D12',
                color: active ? '#3B82F6' : '#9CA3AF',
                border: `1px solid ${active ? '#3B82F6' : '#1F2433'}`,
                borderRadius: '6px',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                fontWeight: active ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
        >
            {children}
        </button>
    )
}
