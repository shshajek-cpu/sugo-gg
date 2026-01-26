'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import useSWRInfinite from 'swr/infinite'
import styles from './RankingMobile.module.css'
import { SERVER_MAP } from '../../constants/servers'
import { getValidScore } from '../../utils/ranking'
import { RankingCharacter } from '../../../types/character'

interface RankingMobileProps {
    type: 'combat' | 'content' | 'hiton' | 'cp' // hiton, cp는 하위 호환
}

// SWR fetcher
const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('API Error')
    const json = await res.json()
    if (json.error) throw new Error(json.error)
    return json
}

export default function RankingMobile({ type }: RankingMobileProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // 타입 정규화
    const normalizedType = (type === 'hiton' || type === 'cp') ? 'combat' : type

    // 필터 상태
    const [selectedServer, setSelectedServer] = useState('all')
    const [selectedRace, setSelectedRace] = useState('all')
    const [activeType, setActiveType] = useState<'combat' | 'content'>(normalizedType)

    // URL params에서 sort 값 읽기 (새로고침/공유 시 유지)
    const sortFromUrl = searchParams.get('sort') as 'pve' | 'pvp' | null
    const [sortBy, setSortBy] = useState<'pve' | 'pvp'>(sortFromUrl || 'pvp')

    // URL params 변경 시 sortBy 동기화
    useEffect(() => {
        const urlSort = searchParams.get('sort') as 'pve' | 'pvp' | null
        if (urlSort && urlSort !== sortBy) {
            setSortBy(urlSort)
        }
    }, [searchParams])

    // sortBy 변경 시 URL 업데이트
    const handleSortChange = (newSort: 'pve' | 'pvp') => {
        setSortBy(newSort)
        const params = new URLSearchParams(searchParams.toString())
        params.set('sort', newSort)
        router.push(`?${params.toString()}`, { scroll: false })
    }

    const servers = [
        { id: 'all', name: '전체 서버' },
        { id: '1', name: '지켈' },
        { id: '2', name: '이스라펠' },
        { id: '3', name: '아트레이아' },
    ]

    const races = [
        { id: 'all', name: '전체' },
        { id: 'Elyos', name: '천족' },
        { id: 'Asmodian', name: '마족' },
    ]

    // SWR Infinite로 페이지네이션 + 캐싱
    const getKey = (pageIndex: number, previousPageData: any) => {
        if (previousPageData && !previousPageData.data?.length) return null

        const params = new URLSearchParams()
        params.set('type', activeType)
        params.set('page', (pageIndex + 1).toString())
        params.set('limit', '30')

        if (activeType === 'combat') {
            params.set('sort', sortBy)
        }
        if (selectedServer !== 'all') {
            params.set('server', selectedServer)
        }
        if (selectedRace !== 'all') {
            params.set('race', selectedRace)
        }

        return `/api/ranking?${params.toString()}`
    }

    const {
        data: pages,
        error,
        size,
        setSize,
        isLoading,
        isValidating
    } = useSWRInfinite(getKey, fetcher, {
        revalidateFirstPage: false,
        revalidateOnFocus: false,
        dedupingInterval: 60000,
        keepPreviousData: true
    })

    // 모든 페이지의 데이터를 합침
    const data: RankingCharacter[] = pages?.flatMap(page => page.data || []) || []

    // 더보기 가능 여부
    const lastPage = pages?.[pages.length - 1]
    const totalPages = lastPage?.meta?.totalPages || 0
    const hasMore = size < totalPages

    // 더보기 로딩 중
    const isLoadingMore = isValidating && size > 1
    const loading = isLoading && data.length === 0

    const handleLoadMore = () => {
        setSize(size + 1)
    }

    const handleTypeChange = (newType: 'combat' | 'content') => {
        setActiveType(newType)
        if (newType === 'combat') {
            router.push('/ranking')
        } else {
            router.push('/ranking/content')
        }
    }

    return (
        <div className={styles.container}>
            {/* 랭킹 타입 탭 */}
            <div className={styles.typeTabs}>
                <button
                    className={`${styles.typeTab} ${activeType === 'combat' ? styles.typeTabActive : ''}`}
                    onClick={() => handleTypeChange('combat')}
                >
                    전투력
                </button>
                <button
                    className={`${styles.typeTab} ${activeType === 'content' ? styles.typeTabActive : ''}`}
                    onClick={() => handleTypeChange('content')}
                >
                    컨텐츠
                </button>
            </div>

            {/* PVP 정렬 (전투력 탭에서만) */}
            {activeType === 'combat' && (
                <div className={styles.sortToggle}>
                    <button
                        className={`${styles.sortBtn} ${styles.sortBtnActive}`}
                    >
                        PVE/PVP
                    </button>
                </div>
            )}

            {/* 필터 */}
            <div className={styles.filterBar}>
                <select
                    value={selectedServer}
                    onChange={(e) => setSelectedServer(e.target.value)}
                    className={styles.filterSelect}
                >
                    {servers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <select
                    value={selectedRace}
                    onChange={(e) => setSelectedRace(e.target.value)}
                    className={styles.filterSelect}
                >
                    {races.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
            </div>

            {/* 랭킹 리스트 */}
            <div className={styles.rankingList}>
                {loading ? (
                    // 스켈레톤
                    [...Array(5)].map((_, i) => (
                        <div key={i} className={styles.rankingItem}>
                            <div className={styles.skeleton} style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                            <div style={{ flex: 1 }}>
                                <div className={styles.skeleton} style={{ width: '100px', height: '16px', marginBottom: '4px' }} />
                                <div className={styles.skeleton} style={{ width: '150px', height: '12px' }} />
                            </div>
                        </div>
                    ))
                ) : !isLoading && data.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>검색 결과가 없습니다</p>
                        <span>필터 설정을 변경해보세요</span>
                    </div>
                ) : (
                    data.map((char, idx) => {
                        const rank = idx + 1
                        const isElyos = char.race_name === 'Elyos'

                        return (
                            <Link
                                key={`${char.character_id}_${idx}`}
                                href={`/c/${encodeURIComponent(SERVER_MAP[char.server_id] || char.server_id)}/${encodeURIComponent(char.name)}`}
                                className={styles.rankingItem}
                            >
                                <div className={`${styles.rankBadge} ${rank <= 3 ? styles[`rank${rank}`] : ''}`}>
                                    {rank}
                                </div>
                                <div className={styles.charAvatar}>
                                    {char.profile_image ? (
                                        <Image
                                            src={char.profile_image}
                                            alt={char.name}
                                            width={44}
                                            height={44}
                                            unoptimized
                                        />
                                    ) : (
                                        <span>{char.name.charAt(0)}</span>
                                    )}
                                </div>
                                <div className={styles.charInfo}>
                                    <div className={styles.charName}>{char.name}</div>
                                    <div className={styles.charMeta}>
                                        <span>{SERVER_MAP[char.server_id] || char.server_id}</span>
                                        <span className={styles.dot}>·</span>
                                        <span className={isElyos ? styles.elyos : styles.asmodian}>
                                            {isElyos ? '천족' : '마족'}
                                        </span>
                                        <span className={styles.dot}>·</span>
                                        <span>{char.class_name}</span>
                                    </div>
                                </div>
                                <div className={styles.charScore}>
                                    {activeType === 'combat' ? (
                                        <>
                                            <div className={styles.scoreRow}>
                                                <span className={styles.scoreLabel}>PVE</span>
                                                <span
                                                    className={styles.scoreValue}
                                                    style={{ color: sortBy === 'pve' ? '#f59e0b' : '#4ade80' }}
                                                >
                                                    {(getValidScore(char, 'pve') || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className={styles.scoreRow}>
                                                <span className={styles.scoreLabel}>PVP</span>
                                                <span
                                                    className={styles.scoreValue}
                                                    style={{ color: sortBy === 'pvp' ? '#f59e0b' : '#f87171' }}
                                                >
                                                    {(getValidScore(char, 'pvp') || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className={styles.scoreRow}>
                                            <span className={styles.scoreLabel}>AP</span>
                                            <span className={styles.scoreValue}>
                                                {(char.ranking_ap || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        )
                    })
                )}
            </div>

            {/* 더보기 버튼 */}
            {hasMore && !loading && (
                <div className={styles.loadMoreWrapper}>
                    <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className={styles.loadMoreBtn}
                    >
                        {isLoadingMore ? '불러오는 중...' : '더보기'}
                    </button>
                </div>
            )}

            {/* 하단 여백 (광고 영역용) */}
            <div className={styles.bottomSpacer} />
        </div>
    )
}
