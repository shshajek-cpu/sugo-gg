'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
// import { supabaseApi, CharacterSearchResult } from '../../../lib/supabaseApi'
// import SearchAutocomplete from '../SearchAutocomplete'
import styles from './HomeMobile.module.css'

export default function HomeMobile() {
    const router = useRouter()

    // --- State ---
    const [recentCharacters, setRecentCharacters] = useState<any[]>([])
    const [mainCharacter, setMainCharacter] = useState<any>(null)
    // Search State - Removed
    // const [searchValue, setSearchValue] = useState('')
    // const [results, setResults] = useState<CharacterSearchResult[]>([])
    // const [isSearching, setIsSearching] = useState(false)
    // const [showResults, setShowResults] = useState(false)
    // const [searchWarning, setSearchWarning] = useState<string | undefined>(undefined)

    // --- Effects ---
    useEffect(() => {
        const recent = localStorage.getItem('recent_characters')
        if (recent) setRecentCharacters(JSON.parse(recent))

        const main = localStorage.getItem('main_character')
        if (main) setMainCharacter(JSON.parse(main))
    }, [])

    // Debounce Search - Removed
    // useEffect(() => { ... }, [searchValue])

    // const performSearch = async (term: string) => {
    //     setIsSearching(true)
    //     setShowResults(true)
    //     setSearchWarning(undefined)

    //     try {
    //         const res = await supabaseApi.searchCharacter(term)
    //         setResults(res.list)
    //         if (res.warning) setSearchWarning(res.warning)
    //     } catch (e) {
    //         console.error("Search failed", e)
    //     } finally {
    //         setIsSearching(false)
    //     }
    // }

    // const handleSearch = (term: string) => {
    //     if (!term.trim()) return
    //     router.push(`/c/all/${encodeURIComponent(term)}`)
    // }

    // const handleResultSelect = (char: CharacterSearchResult) => {
    //     setShowResults(false)
    //     const raceVal = (char.race === 'Elyos' || char.race === '천족') ? 'elyos' : 'asmodian'
    //     router.push(`/c/${char.server}/${char.name}?race=${raceVal}`)
    // }

    return (
        <div className={styles.container}>
            {/* Header & Menu Tabs -> Removed (Moved to Global Layout) */}

            {/* 대표 캐릭터 카드 */}
            <section className={styles.mainCharSection}>
                {mainCharacter ? (
                    <div
                        className={styles.mainCharCard}
                        onClick={() => router.push(`/c/${mainCharacter.server}/${mainCharacter.name}`)}
                    >
                        <div className={styles.mainCharInfo}>
                            <span className={styles.mainCharServer}>{mainCharacter.server}</span>
                            <h2 className={styles.mainCharName}>{mainCharacter.name}</h2>
                            <div className={styles.mainCharBadges}>
                                <span className={styles.badge}>Lv.{mainCharacter.level}</span>
                                <span className={styles.badgeHighlight}>{mainCharacter.className}</span>
                            </div>
                        </div>
                        <div className={styles.mainCharStats}>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>PVE</span>
                                <span className={styles.statValue}>{mainCharacter.pve_score?.toLocaleString() || '-'}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>PVP</span>
                                <span className={styles.statValue}>{mainCharacter.pvp_score?.toLocaleString() || '-'}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.mainCharEmpty}>
                        <p>대표 캐릭터를 설정해보세요</p>
                        <span>캐릭터 검색 후 별 아이콘을 눌러 등록</span>
                    </div>
                )}
            </section>

            {/* 최근 검색 캐릭터 */}
            {recentCharacters.length > 0 && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>최근 검색</h3>
                        <button
                            className={styles.clearBtn}
                            onClick={() => {
                                setRecentCharacters([])
                                localStorage.removeItem('recent_characters')
                            }}
                        >
                            전체 삭제
                        </button>
                    </div>
                    <div className={styles.recentList}>
                        {recentCharacters.slice(0, 5).map((char: any, i: number) => (
                            <div
                                key={i}
                                className={styles.recentItem}
                                onClick={() => router.push(`/c/${char.server}/${char.name}`)}
                            >
                                <div className={styles.recentAvatar}>
                                    {char.name?.charAt(0) || '?'}
                                </div>
                                <div className={styles.recentInfo}>
                                    <span className={styles.recentName}>{char.name}</span>
                                    <span className={styles.recentMeta}>{char.server} · Lv.{char.level}</span>
                                </div>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-disabled)" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 실시간 랭킹 */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>실시간 랭킹</h3>
                    <Link href="/ranking" className={styles.moreLink}>전체보기</Link>
                </div>
                <div className={styles.rankingList}>
                    {[1, 2, 3].map(rank => (
                        <div key={rank} className={styles.rankingItem}>
                            <div className={`${styles.rankBadge} ${rank === 1 ? styles.rankFirst : ''}`}>
                                {rank}
                            </div>
                            <div className={styles.rankingInfo}>
                                <span className={styles.rankingName}>캐릭터명</span>
                                <span className={styles.rankingMeta}>지켈 · 포식자</span>
                            </div>
                            <div className={styles.rankingScore}>
                                <span className={styles.scoreLabel}>PVE</span>
                                <span className={styles.scoreNum}>5,420</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 서버 현황 */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>서버 현황</h3>
                </div>
                <div className={styles.serverGrid}>
                    <div className={`${styles.serverCard} ${styles.serverElyos}`}>
                        <span className={styles.serverLabel}>천족 우세</span>
                        <span className={styles.serverName}>이스라펠</span>
                        <span className={styles.serverTax}>세금 2.4%</span>
                    </div>
                    <div className={`${styles.serverCard} ${styles.serverAsmo}`}>
                        <span className={styles.serverLabel}>마족 우세</span>
                        <span className={styles.serverName}>지켈</span>
                        <span className={styles.serverTax}>세금 5.0%</span>
                    </div>
                </div>
            </section>

            {/* 공지사항 */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>공식 공지</h3>
                </div>
                <div className={styles.noticeList}>
                    {['[점검] 1월 22일 정기 점검 안내', '[이벤트] 오픈 기념 쿠폰 지급', '[공지] 서버 안정화 작업'].map((notice, i) => (
                        <div key={i} className={styles.noticeItem}>
                            <span className={`${styles.noticeDot} ${i === 0 ? styles.noticeDotNew : ''}`} />
                            <span className={styles.noticeText}>{notice}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* 하단 여백 (광고 영역용) */}
            <div className={styles.bottomSpacer} />
        </div>
    )
}
