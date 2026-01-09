'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Sword, Zap, Bus, Coins, Package, Plus, Minus, Save, X } from 'lucide-react'
import { LedgerCharacter, LedgerDailyRecord } from '@/types/ledger'
import { formatKina, parseKina, getDeviceId, getTodayString } from '@/lib/ledgerUtils'

interface Props {
    character: LedgerCharacter
    initialRecord?: LedgerDailyRecord | null
}

export default function LedgerCharacterCard({ character, initialRecord }: Props) {
    const [record, setRecord] = useState<Partial<LedgerDailyRecord>>({
        count_expedition: 0,
        count_transcend: 0,
        count_bus: 0,
        kina_income: 0,
        items: [],
        ...(initialRecord || {})
    })
    const [isSaving, setIsSaving] = useState(false)
    const [kinaInput, setKinaInput] = useState('')
    const [showItemInput, setShowItemInput] = useState(false)
    const [newItemName, setNewItemName] = useState('')

    // Initialize Kina Input
    useEffect(() => {
        setKinaInput(record.kina_income ? (record.kina_income / 10000).toString() : '')
    }, [record.kina_income])

    const saveRecord = useCallback(async (updates: Partial<LedgerDailyRecord>) => {
        setIsSaving(true)
        const deviceId = getDeviceId()
        const today = getTodayString()

        try {
            const res = await fetch('/api/ledger/records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-device-id': deviceId
                },
                body: JSON.stringify({
                    character_id: character.id,
                    date: today,
                    updates: updates // Items handling needs refinement in real API
                })
            })
            if (!res.ok) throw new Error('Failed to save')
            // Success feedback?
        } catch (e) {
            console.error(e)
        } finally {
            setIsSaving(false)
        }
    }, [character.id])

    const handleCountChange = (field: 'count_expedition' | 'count_transcend' | 'count_bus', delta: number) => {
        const current = record[field] || 0
        const newVal = Math.max(0, current + delta)
        const updated = { ...record, [field]: newVal }
        setRecord(updated)

        // Debounce or immediate? Immediate for simple counters usually fine if not spamming.
        // Let's fire save immediately for better UX sync, optimistic UI is already set.
        saveRecord({ [field]: newVal })
    }

    const handleKinaBlur = () => {
        // Convert "120" -> 1,200,000
        const val = parseFloat(kinaInput.replace(/,/g, '')) || 0
        const realWebKina = val * 10000 // Input is in 'Man' unit

        if (realWebKina !== record.kina_income) {
            const updated = { ...record, kina_income: realWebKina }
            setRecord(updated)
            saveRecord({ kina_income: realWebKina })
        }
    }

    const handleKinaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only numbers
        const val = e.target.value
        setKinaInput(val)
    }

    const addItem = async () => {
        if (!newItemName.trim()) return

        setIsSaving(true)
        const deviceId = getDeviceId()
        const today = getTodayString()

        try {
            const res = await fetch('/api/ledger/records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-device-id': deviceId
                },
                body: JSON.stringify({
                    character_id: character.id,
                    date: today,
                    updates: {}, // No scalar updates
                    newItem: {
                        item_name: newItemName,
                        count: 1
                    }
                })
            })

            if (!res.ok) throw new Error('Failed to add item')

            // Optimistic update or refetch? 
            // Ideally refetch to get the ID, but for now simple append
            const addedItem = { item_name: newItemName, count: 1, record_id: 'temp', id: 'temp-' + Date.now() }
            setRecord(prev => ({
                ...prev,
                items: [...(prev.items || []), addedItem]
            }))

            setNewItemName('')
            setShowItemInput(false)
        } catch (e) {
            console.error(e)
            alert('아이템 저장 실패')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="bg-[#1a1a24] border border-gray-800 rounded-xl p-4 flex flex-col gap-4 relative">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${character.class_name === '검성' ? 'bg-red-900/50 text-red-200' : 'bg-blue-900/50 text-blue-200'}`}>
                        {character.class_name}
                    </span>
                    <h3 className="font-bold text-gray-100">{character.name}</h3>
                    {character.is_main && <span className="text-yellow-500 text-xs">⭐</span>}
                </div>
                {isSaving && <LoaderIcon />}
            </div>

            {/* Activities */}
            <div className="space-y-3">
                <ActivityRow
                    label="원정"
                    icon={<Sword size={16} className="text-red-400" />}
                    count={record.count_expedition || 0}
                    max={21} // Weekly max? 
                    onChange={(d) => handleCountChange('count_expedition', d)}
                />
                <ActivityRow
                    label="초월"
                    icon={<Zap size={16} className="text-purple-400" />}
                    count={record.count_transcend || 0}
                    max={14}
                    onChange={(d) => handleCountChange('count_transcend', d)}
                />
                <ActivityRow
                    label="버스"
                    icon={<Bus size={16} className="text-yellow-400" />}
                    count={record.count_bus || 0}
                    onChange={(d) => handleCountChange('count_bus', d)}
                />
            </div>

            {/* Income */}
            <div className="bg-black/30 p-3 rounded-lg border border-gray-700/50 mt-1">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                    <Coins size={14} className="text-yellow-500" />
                    <span>오늘 수입 (단위: 만)</span>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={kinaInput}
                        onChange={handleKinaChange}
                        onBlur={handleKinaBlur}
                        placeholder="0"
                        className="bg-transparent text-xl font-bold text-white w-full outline-none text-right"
                    />
                    <span className="text-gray-500 text-sm whitespace-nowrap">만 키나</span>
                </div>
                <div className="text-right text-xs text-gray-500 mt-1">
                    {formatKina((parseFloat(kinaInput) || 0) * 10000)} 키나
                </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                        <Package size={14} />
                        <span>획득 아이템</span>
                    </div>
                    <button onClick={() => setShowItemInput(!showItemInput)} className="hover:text-white">
                        <Plus size={14} />
                    </button>
                </div>

                {showItemInput && (
                    <div className="flex gap-2">
                        <input
                            className="bg-gray-800 text-xs text-white p-1 rounded flex-1"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="아이템명"
                            autoFocus
                        />
                        <button onClick={addItem} className="text-xs bg-primary px-2 rounded">Add</button>
                    </div>
                )}

                {/* Item List Mock */}
                {record.items && record.items.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {record.items.map((item, idx) => (
                            <span key={idx} className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300 border border-gray-700">
                                {item.item_name} x{item.count}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="text-xs text-gray-600 italic">기록된 아이템 없음</div>
                )}
            </div>
        </div>
    )
}

function ActivityRow({ label, icon, count, max, onChange }: {
    label: string, icon: React.ReactNode, count: number, max?: number, onChange: (delta: number) => void
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 w-20">
                {icon}
                <span className="text-sm font-medium text-gray-300">{label}</span>
            </div>
            <div className="flex items-center gap-3 bg-black/20 rounded-lg p-1">
                <button
                    onClick={() => onChange(-1)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <Minus size={14} />
                </button>
                <div className="font-mono font-bold text-white w-4 text-center">{count}</div>
                <button
                    onClick={() => onChange(1)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <Plus size={14} />
                </button>
            </div>
        </div>
    )
}

function LoaderIcon() {
    return (
        <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    )
}
