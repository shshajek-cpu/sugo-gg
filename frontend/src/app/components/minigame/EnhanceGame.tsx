'use client'

import React, { useState, useEffect } from 'react'
import { X, Gem, Hammer, RefreshCw } from 'lucide-react'

export default function EnhanceGame() {
    const [stats, setStats] = useState({ success: 0, fail: 0 })
    const [history, setHistory] = useState<('success' | 'fail')[]>([])
    const [isAnimating, setIsAnimating] = useState(false)

    // Configuration
    const BASE_SUCCESS_RATE = 0.5 // 50% chance

    const handleEnhance = () => {
        if (isAnimating) return

        setIsAnimating(true)

        // Simple delay to simulate process
        setTimeout(() => {
            const isSuccess = Math.random() < BASE_SUCCESS_RATE

            setStats(prev => ({
                success: prev.success + (isSuccess ? 1 : 0),
                fail: prev.fail + (isSuccess ? 0 : 1)
            }))
            setHistory(prev => [...prev, isSuccess ? 'success' : 'fail'])
            setIsAnimating(false)
        }, 500)
    }

    const reset = () => {
        setStats({ success: 0, fail: 0 })
        setHistory([])
    }

    const total = stats.success + stats.fail
    const successPercent = total > 0 ? (stats.success / total) * 100 : 0
    const failPercent = total > 0 ? (stats.fail / total) * 100 : 0

    return (
        <div className="flex flex-col items-center gap-8 p-8">
            {/* Game Container - replicating the specific UI */}
            <div className="w-[400px] bg-[#2a2a2a]/90 backdrop-blur-md rounded-sm border border-gray-600/50 shadow-2xl relative overflow-hidden font-sans select-none">

                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-white/5 to-transparent border-b border-white/5">
                    <h3 className="text-gray-200 text-sm font-bold tracking-tight shadow-black drop-shadow-md">
                        중급 마석 (입문 LV 20)
                    </h3>
                    <button className="text-gray-400 hover:text-white transition-colors">
                        <X size={18} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 flex gap-4 items-center">
                    {/* Icon Box */}
                    <div className="w-12 h-12 bg-black/40 border border-gray-600 rounded flex items-center justify-center shrink-0 shadow-inner group relative">
                        {/* Glow effect on animate */}
                        <div className={`absolute inset-0 bg-blue-500/20 blur-md transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}></div>
                        <Gem className={`text-gray-400 ${isAnimating ? 'animate-pulse text-blue-300' : ''}`} size={24} />
                    </div>

                    {/* Bars Section */}
                    <div className="flex-1 space-y-3">
                        {/* Success Row */}
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-200">성공</span>
                                <span className="text-gray-400">{stats.success}회 ({successPercent.toFixed(1)}%)</span>
                            </div>
                            <div className="h-2.5 bg-black/50 border border-gray-700/50 relative overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full bg-[#3b82f6] transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    style={{ width: `${Math.min(100, (stats.success / (total || 1)) * 100)}%` }} // Relative to total attempts for visualization or just fill based on arbitrary goal?
                                // The image shows bars partially filled. Usually this means progress towards a goal OR simple visualization of ratio.
                                // Let's make it visualize the ratio vs total (or 50/50 split). 
                                // Actually in the image, Success is blue, Fail is orange. 
                                // If it's a history bar, maybe full width = 100%? 
                                // Let's assume width = percentage of total attempts.
                                ></div>
                            </div>
                        </div>

                        {/* Fail Row */}
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-200">실패</span>
                                <span className="text-gray-400">{stats.fail}회 ({failPercent.toFixed(1)}%)</span>
                            </div>
                            <div className="h-2.5 bg-black/50 border border-gray-700/50 relative overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full bg-[#f97316] transition-all duration-300 ease-out shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                                    style={{ width: `${Math.min(100, (stats.fail / (total || 1)) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4">
                <button
                    onClick={handleEnhance}
                    disabled={isAnimating}
                    className="flex items-center gap-2 px-8 py-3 bg-[#3b82f6] hover:bg-[#2563eb] active:bg-[#1d4ed8] text-white font-bold rounded-lg shadow-lg shadow-blue-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                >
                    <Hammer size={18} />
                    {isAnimating ? '강화 중...' : '강화 시도'}
                </button>

                <button
                    onClick={reset}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold rounded-lg transition-all"
                >
                    <RefreshCw size={18} />
                    초기화
                </button>
            </div>

            {/* Log / History text */}
            <div className="h-32 w-full max-w-md overflow-y-auto bg-black/20 rounded p-4 text-xs font-mono space-y-1">
                {history.map((res, idx) => (
                    <div key={idx} className={res === 'success' ? 'text-blue-400' : 'text-orange-400'}>
                        #{idx + 1}: {res === 'success' ? '성공했습니다!' : '실패했습니다.'}
                    </div>
                ))}
                {history.length === 0 && <div className="text-gray-600 text-center py-4">기록이 없습니다.</div>}
            </div>
        </div>
    )
}
