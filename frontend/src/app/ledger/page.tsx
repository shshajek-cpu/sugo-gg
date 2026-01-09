'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getDeviceId, getTodayString } from '@/lib/ledgerUtils'
import { LedgerCharacter, LedgerDailyRecord } from '@/types/ledger'
import LedgerCharacterCard from '@/app/components/ledger/LedgerCharacterCard'
import WeeklyChart from '@/app/components/ledger/WeeklyChart'
import { PlusCircle, Wallet, Calendar } from 'lucide-react'

export default function LedgerPage() {
    const [characters, setCharacters] = useState<LedgerCharacter[]>([])
    const [records, setRecords] = useState<LedgerDailyRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const init = async () => {
            try {
                const deviceId = getDeviceId()

                // 1. Ensure user exists
                const userRes = await fetch('/api/ledger/user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ device_id: deviceId })
                })

                if (!userRes.ok) {
                    throw new Error('User initialization failed')
                }

                // 2. Fetch Characters
                const charRes = await fetch('/api/ledger/characters', {
                    headers: { 'x-device-id': deviceId }
                })

                if (charRes.ok) {
                    const charsData = await charRes.json()
                    // Ensure it is an array
                    if (Array.isArray(charsData)) {
                        setCharacters(charsData)
                    } else {
                        setCharacters([])
                    }
                }

                // 3. Fetch Today's Records
                const today = getTodayString() // YYYY-MM-DD
                const recRes = await fetch(`/api/ledger/records?date=${today}`, {
                    headers: { 'x-device-id': deviceId }
                })
                if (recRes.ok) {
                    const recData = await recRes.json()
                    if (Array.isArray(recData)) {
                        setRecords(recData)
                    }
                }

            } catch (e) {
                console.error('Ledger init error:', e)
            } finally {
                setIsLoading(false)
            }
        }

        init()
    }, [])

    const getRecordForChar = (charId: string) => {
        return records.find(r => r.character_id === charId) || null
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Wallet className="text-primary" />
                        나의 가계부
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">오늘의 게임 활동과 수입을 쉽고 빠르게 기록하세요.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-gray-800 rounded-lg flex items-center gap-2 text-sm text-gray-300">
                        <Calendar size={16} />
                        {new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-gray-500">
                    로딩중...
                </div>
            ) : characters.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-gray-800 rounded-xl">
                    <div className="text-gray-400 mb-4">등록된 캐릭터가 없습니다.</div>
                    <Link
                        href="/ledger/characters"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-amber-600 transition-colors"
                    >
                        <PlusCircle size={20} />
                        캐릭터 등록하기
                    </Link>
                </div>
            ) : (
                <>
                    {/* Dashboard Summary Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Today Summary */}
                        <div className="md:col-span-1 bg-gradient-to-br from-[#1a1a24] to-[#121215] p-6 rounded-2xl border border-gray-800 flex flex-col justify-between">
                            <div>
                                <h2 className="text-gray-400 font-bold mb-2">오늘 총 수입</h2>
                                <div className="text-4xl font-bold text-white tracking-tight">
                                    {Math.round(records.reduce((acc, curr) => acc + (curr.kina_income || 0), 0) / 10000).toLocaleString()}
                                    <span className="text-xl text-primary font-normal ml-1">만</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    ≈ {(records.reduce((acc, curr) => acc + (curr.kina_income || 0), 0) / 100000000).toFixed(2)} 억 키나
                                </div>
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                실시간 집계 중
                            </div>
                        </div>

                        {/* Weekly Chart */}
                        <div className="md:col-span-2">
                            <WeeklyChart />
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-white">캐릭터별 기록</h2>
                        <Link
                            href="/ledger/characters"
                            className="text-sm text-gray-400 hover:text-white flex items-center gap-1 bg-[#1a1a24] px-3 py-1.5 rounded-lg border border-gray-800 transition-colors"
                        >
                            + 캐릭터 관리
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {characters.map(char => (
                            <LedgerCharacterCard
                                key={char.id}
                                character={char}
                                initialRecord={getRecordForChar(char.id)}
                            />
                        ))}
                        {/* Card to add new character quickly */}
                        <Link
                            href="/ledger/characters"
                            className="border border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center gap-2 min-h-[300px] text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-all cursor-pointer group bg-[#1a1a24]/30"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                                <PlusCircle size={24} />
                            </div>
                            <span className="font-medium">캐릭터 추가</span>
                        </Link>
                    </div>
                </>
            )}
        </div>
    )
}
