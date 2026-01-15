'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RankingWidget from './components/home/ranking/RankingWidget'
import CompareQuickBar from './components/home/compare/CompareQuickBar'
import LiveUpdateFeed from './components/home/feed/LiveUpdateFeed'
import ServerStatsDashboard from './components/home/stats/ServerStatsDashboard'
import RecentCharacterCard from './components/RecentCharacterCard'
import LiveStreamContainer from './components/live/LiveStreamContainer'
import OfficialNewsFeed from './components/home/news/OfficialNewsFeed'
import { RecentCharacter } from '../types/character'

export default function Home() {
    const router = useRouter()
    const [recentCharacters, setRecentCharacters] = useState<RecentCharacter[]>([])

    // Load recent characters from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('recent_characters')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                // Sort by timestamp (newest first)
                setRecentCharacters(parsed.sort((a: any, b: any) => b.timestamp - a.timestamp))
            } catch (e) {
                console.error('Failed to parse recent characters', e)
            }
        }
    }, [])

    // 백그라운드에서 item_level이 0인 캐릭터 자동 조회
    useEffect(() => {
        let isMounted = true
        let intervalId: NodeJS.Timeout

        const runBatchUpdate = async () => {
            try {
                const res = await fetch('/api/admin/batch-update')
                const data = await res.json()
                console.log('[Auto Batch] Updated:', data.message, '| Remaining:', data.remaining)

                // 남은 캐릭터가 없으면 중지
                if (data.remaining === 0 && isMounted) {
                    clearInterval(intervalId)
                    console.log('[Auto Batch] Complete! All characters updated.')
                }
            } catch (e) {
                console.error('[Auto Batch] Error:', e)
            }
        }

        const runCollector = async () => {
            try {
                const res = await fetch('/api/admin/collector')
                const data = await res.json()
                console.log(`[Auto Collector] ${data.server} - "${data.keyword}": ${data.message} (Total: ${data.totalCharacters})`)
            } catch (e) {
                console.error('[Auto Collector] Error:', e)
            }
        }

        // 배치 업데이트: 10초 후 시작, 30초마다 반복
        const startTimeout = setTimeout(() => {
            if (isMounted) {
                runBatchUpdate()
                intervalId = setInterval(runBatchUpdate, 30000)
            }
        }, 10000)

        // 자동 수집: 15초 후 시작, 40초마다 반복 (새 캐릭터 발견)
        const collectorTimeout = setTimeout(() => {
            if (isMounted) {
                runCollector()
                // 수집은 조금 더 천천히 진행
                setInterval(runCollector, 40000)
            }
        }, 15000)

        return () => {
            isMounted = false
            clearTimeout(startTimeout)
            clearTimeout(collectorTimeout)
            if (intervalId) clearInterval(intervalId)
        }
    }, [])

    const handleCharacterClick = (char: RecentCharacter) => {
        router.push(`/c/${encodeURIComponent(char.server)}/${encodeURIComponent(char.name)}`)
    }

    const handleRemoveRecent = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const updated = recentCharacters.filter(c => c.id !== id)
        setRecentCharacters(updated)
        localStorage.setItem('recent_characters', JSON.stringify(updated))
    }

    return (
        <main style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '2rem 1rem'
        }}>
            {/* Main Content Info Grid */}
            <style>{`
                .home-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                @media (min-width: 1024px) {
                    .home-grid {
                        grid-template-columns: 2.2fr 1fr;
                    }
                }
            `}</style>

            {/* Live Stream Section */}
            <div style={{ marginBottom: '2rem' }}>
                <LiveStreamContainer />
            </div>

            <div className="home-grid">
                {/* Phase 2: Ranking - Main Column */}
                <div>
                    <RankingWidget />
                    <OfficialNewsFeed />
                </div>

                {/* Phase 4 & 5: Side Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <ServerStatsDashboard />
                    <LiveUpdateFeed />
                </div>
            </div>



            {/* Phase 3: Floating Compare Bar */}
            <CompareQuickBar />

            {/* Recent Characters Section */}
            {recentCharacters.length > 0 && (
                <div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem',
                        padding: '0 4px'
                    }}>
                        <h3 style={{
                            fontSize: 'calc(0.9rem + 2px)',
                            fontWeight: 'bold',
                            color: '#9CA3AF',
                            margin: 0
                        }}>
                            최근 검색한 캐릭터
                        </h3>
                        <button
                            onClick={() => {
                                setRecentCharacters([])
                                localStorage.removeItem('recent_characters')
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#6B7280',
                                fontSize: 'calc(0.8rem + 2px)',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            전체 삭제
                        </button>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        background: 'rgba(255, 255, 255, 0.02)'
                    }}>
                        {recentCharacters.slice(0, 5).map((char) => (
                            <RecentCharacterCard
                                key={char.id}
                                character={char}
                                onClick={handleCharacterClick}
                                onRemove={handleRemoveRecent}
                            />
                        ))}
                    </div>
                </div>
            )}

            {recentCharacters.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 0',
                    color: '#6B7280'
                }}>
                    <p style={{ fontSize: 'calc(1.1rem + 2px)', marginBottom: '0.5rem' }}>
                        검색한 캐릭터가 없습니다
                    </p>
                    <p style={{ fontSize: 'calc(0.9rem + 2px)' }}>
                        위 검색창에서 캐릭터를 검색해보세요!
                    </p>
                </div>
            )}
        </main >
    )
}