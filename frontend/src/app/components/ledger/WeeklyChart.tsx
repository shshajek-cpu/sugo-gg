'use client'

import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getDeviceId } from '@/lib/ledgerUtils'

interface WeeklyData {
    date: string
    dayName: string
    totalKina: number
}

export default function WeeklyChart() {
    const [data, setData] = useState<WeeklyData[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const deviceId = getDeviceId()
            // Only fetch last 7 days
            // We need a new API endpoint or use the records endpoint with range
            // For simplicity, let's use the records endpoint with a range param if we add it, 
            // or just a specialized stats endpoint.
            // Let's assume we create /api/ledger/stats/weekly

            try {
                const res = await fetch('/api/ledger/stats/weekly', {
                    headers: { 'x-device-id': deviceId }
                })
                if (res.ok) {
                    setData(await res.json())
                }
            } catch (e) {
                console.error(e)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    if (isLoading) return <div className="h-48 flex items-center justify-center text-gray-600 text-xs">Loading chart...</div>
    if (data.length === 0) return <div className="h-48 flex items-center justify-center text-gray-600 text-xs">No data for this week</div>

    return (
        <div className="bg-[#1a1a24] p-5 rounded-2xl border border-gray-800">
            <h3 className="text-gray-400 text-sm font-bold mb-4">최근 7일 수입 (단위: 억)</h3>
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="dayName"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                            formatter={(value: any) => [value ? `${(value).toLocaleString()} 억` : '0 억', '수입']}
                        />
                        <Bar dataKey="totalKina" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.date === new Date().toISOString().split('T')[0] ? '#F59E0B' : '#374151'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
