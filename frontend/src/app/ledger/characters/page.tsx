'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, CheckCircle, Shield, Backpack, User, Sparkles } from 'lucide-react'
import { getDeviceId } from '@/lib/ledgerUtils'
import { LedgerCharacter } from '@/types/ledger'

export default function LedgerCharactersPage() {
    const router = useRouter()
    const [characters, setCharacters] = useState<LedgerCharacter[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Form state
    const [name, setName] = useState('')
    const [className, setClassName] = useState('검성')
    const [isMain, setIsMain] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchChars = async () => {
        const deviceId = getDeviceId()
        const res = await fetch('/api/ledger/characters', {
            headers: { 'x-device-id': deviceId }
        })
        if (res.ok) {
            setCharacters(await res.json())
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchChars()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsSubmitting(true)
        const deviceId = getDeviceId()

        try {
            const res = await fetch('/api/ledger/characters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-device-id': deviceId // pass header if needed by middleware, but also in body if used like that
                },
                body: JSON.stringify({
                    device_id: deviceId, // API expects this in body
                    name,
                    class_name: className,
                    server_name: 'Israphel', // Default or selector
                    is_main: isMain
                })
            })

            if (res.ok) {
                setName('')
                setIsMain(false)
                fetchChars()
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return
        const deviceId = getDeviceId()
        await fetch(`/api/ledger/characters?id=${id}`, {
            method: 'DELETE',
            headers: { 'x-device-id': deviceId }
        })
        fetchChars()
    }

    const classes = ['검성', '수호성', '살성', '궁성', '마도성', '정령성', '치유성', '호법성']

    return (
        <div className="max-w-4xl mx-auto py-10">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
                <ArrowLeft size={18} /> 돌아가기
            </button>

            <h1 className="text-3xl font-bold mb-8">캐릭터 관리</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form */}
                <div className="md:col-span-1">
                    <div className="bg-[#1a1a24] p-6 rounded-2xl border border-gray-800 sticky top-4">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Plus size={20} className="text-primary" />
                            새 캐릭터 등록
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">캐릭터명</label>
                                <input
                                    className="w-full bg-black/30 border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-primary"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="예: 사나운뿔앙굴"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">직업</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {classes.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setClassName(c)}
                                            className={`text-xs py-2 rounded border transition-colors ${className === c
                                                    ? 'bg-primary/20 border-primary text-primary font-bold'
                                                    : 'bg-black/20 border-gray-700 text-gray-400 hover:bg-gray-800'
                                                }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isMain}
                                    onChange={e => setIsMain(e.target.checked)}
                                    className="accent-primary"
                                />
                                <span className="text-sm text-gray-300">대표 캐릭터로 설정</span>
                            </label>

                            <button
                                type="submit"
                                disabled={isSubmitting || !name}
                                className="w-full bg-primary text-black font-bold py-3 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                            >
                                {isSubmitting ? '저장 중...' : '등록하기'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* List */}
                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold">등록된 캐릭터 목록 ({characters.length})</h2>

                    {isLoading ? (
                        <div className="text-gray-500 py-10">로딩 중...</div>
                    ) : characters.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
                            등록된 캐릭터가 없습니다.
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {characters.map(char => (
                                <div key={char.id} className="bg-[#15151e] p-4 rounded-xl border border-gray-800 flex items-center justify-between group hover:border-gray-700 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${char.is_main ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-800 text-gray-400'}`}>
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-200">{char.name}</span>
                                                {char.is_main && <span className="text-xs bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded">대표</span>}
                                            </div>
                                            <div className="text-sm text-gray-500">{char.class_name} · {char.server_name || 'Israphel'}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(char.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-900/30 text-gray-600 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
