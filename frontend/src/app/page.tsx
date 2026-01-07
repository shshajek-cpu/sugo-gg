'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RecentCharacterCard from './components/RecentCharacterCard'
import LiveStreamContainer from './components/live/LiveStreamContainer'
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
            maxWidth: '800px',
            margin: '0 auto',
            padding: '0 2rem'
        }}>
            {/* Live Stream Section */}
            <LiveStreamContainer />

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
                            fontSize: '0.9rem',
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
                                fontSize: '0.8rem',
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
                    <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                        검색한 캐릭터가 없습니다
                    </p>
                    <p style={{ fontSize: '0.9rem' }}>
                        위 검색창에서 캐릭터를 검색해보세요!
                    </p>
                </div>
            )}
        </main>
    )
}
