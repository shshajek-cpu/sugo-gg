'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy } from 'lucide-react'
import useSWRInfinite from 'swr/infinite'
import styles from './Ranking.module.css'
import { SERVER_MAP } from '../../constants/servers'
import { RankingCharacter } from '../../../types/character'
import { getValidScore } from '../../utils/ranking'

interface RankingTableProps {
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

const RankingSkeleton = () => (
    <div style={{ paddingBottom: '2rem' }}>
        <table className={styles.rankingTable}>
            <thead>
                <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>순위</th>
                    <th>캐릭터</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>서버/종족</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>아이템Lv</th>
                    <th style={{ width: '90px', textAlign: 'right' }}>PVE</th>
                    <th style={{ width: '90px', textAlign: 'right' }}>PVP</th>
                </tr>
            </thead>
            <tbody>
                {[...Array(10)].map((_, i) => (
                    <tr key={i}>
                        <td style={{ textAlign: 'center' }}>
                            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '20px', margin: '0 auto' }}></div>
                        </td>
                        <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div className={`${styles.skeleton} ${styles.skeletonCircle}`}></div>
                                <div style={{ flex: 1 }}>
                                    <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '120px' }}></div>
                                    <div className={`${styles.skeleton} ${styles.skeletonTextShort}`}></div>
                                </div>
                            </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '60px', margin: '0 auto' }}></div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '40px', margin: '0 auto' }}></div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '60px', marginLeft: 'auto' }}></div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '60px', marginLeft: 'auto' }}></div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)

export default function RankingTable({ type }: RankingTableProps) {
    const searchParams = useSearchParams()

    // 타입 정규화 (hiton, cp → combat)
    const normalizedType = (type === 'hiton' || type === 'cp') ? 'combat' : type
    const isCombatTab = normalizedType === 'combat'

    // searchParams를 문자열로 변환
    const searchParamsString = searchParams.toString()

    // SWR Infinite로 페이지네이션 + 캐싱
    const getKey = (pageIndex: number, previousPageData: any) => {
        // 이전 페이지가 마지막이면 null 반환 (더 이상 요청 안 함)
        if (previousPageData && !previousPageData.data?.length) return null

        const params = new URLSearchParams(searchParamsString)
        params.set('type', normalizedType)
        params.set('page', (pageIndex + 1).toString())
        params.set('limit', '50')

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
        revalidateFirstPage: false,  // 첫 페이지 재검증 안 함
        revalidateOnFocus: false,    // 포커스 시 재검증 안 함
        dedupingInterval: 60000,     // 1분간 중복 요청 방지
        keepPreviousData: true       // 필터 변경 시 이전 데이터 유지
    })

    // 모든 페이지의 데이터를 합침
    const data: RankingCharacter[] = pages?.flatMap(page => page.data || []) || []

    // 더보기 가능 여부
    const lastPage = pages?.[pages.length - 1]
    const totalPages = lastPage?.meta?.totalPages || 0
    const hasMore = size < totalPages

    // 더보기 로딩 중
    const isLoadingMore = isValidating && size > 1

    const handleLoadMore = () => {
        setSize(size + 1)
    }

    const getRankIcon = (index: number) => {
        const rank = index + 1
        if (rank === 1) return <Trophy className={`${styles.rankIcon} ${styles.rankIconGold}`} />
        if (rank === 2) return <Trophy className={`${styles.rankIcon} ${styles.rankIconSilver}`} />
        if (rank === 3) return <Trophy className={`${styles.rankIcon} ${styles.rankIconBronze}`} />
        return <span className={styles.rankNumber}>{rank}</span>
    }

    // 현재 정렬 기준 (RankingFilterBar와 동일하게 pvp 기본값)
    const currentSort = searchParams.get('sort') || 'pvp'

    // 첫 로딩 시에만 스켈레톤 표시 (캐시된 데이터 없을 때)
    if (isLoading && data.length === 0) {
        return <RankingSkeleton />
    }

    if (!isLoading && (!data || data.length === 0)) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#6B7280' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>검색 결과가 없습니다.</div>
                <div style={{ fontSize: '0.9rem' }}>필터 설정을 변경해보세요.</div>
            </div>
        )
    }

    return (
        <div style={{ paddingBottom: '2rem' }}>
            {/* Desktop Table: Hidden on Mobile via CSS */}
            <div style={{ overflowX: 'auto', marginBottom: '1rem' }} className={styles.rankingTableWrapper}>
                <table className={styles.rankingTable}>
                    <thead>
                        <tr>
                            <th style={{ width: '60px', textAlign: 'center' }}>순위</th>
                            <th>캐릭터</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>서버/종족</th>
                            {isCombatTab && <th style={{ width: '80px', textAlign: 'center' }}>아이템Lv</th>}
                            {isCombatTab && (
                                <>
                                    <th style={{ width: '90px', textAlign: 'right' }}>
                                        <span style={{ color: currentSort === 'pve' ? '#f59e0b' : undefined }}>PVE</span>
                                    </th>
                                    <th style={{ width: '90px', textAlign: 'right' }}>
                                        <span style={{ color: currentSort === 'pvp' ? '#f59e0b' : undefined }}>PVP</span>
                                    </th>
                                </>
                            )}
                            {!isCombatTab && <th style={{ textAlign: 'right' }}>어비스 포인트</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((char, idx) => {
                            return (
                                <tr
                                    key={`${char.character_id}_${idx}`}
                                    className={`
                                        ${idx === 0 ? styles.rankRow1 : ''}
                                        ${idx === 1 ? styles.rankRow2 : ''}
                                        ${idx === 2 ? styles.rankRow3 : ''}
                                    `}
                                >
                                    <td style={{ textAlign: 'center' }}>
                                        <div className={styles.rankCell}>
                                            {getRankIcon(idx)}
                                        </div>
                                    </td>
                                    <td>
                                        <Link
                                            href={`/c/${encodeURIComponent(SERVER_MAP[char.server_id] || char.server_id)}/${encodeURIComponent(char.name)}`}
                                            className={styles.charLink}
                                        >
                                            <div className={styles.charImageWrapper}>
                                                {char.profile_image ? (
                                                    <Image
                                                        src={char.profile_image}
                                                        alt={char.name}
                                                        width={48}
                                                        height={48}
                                                        className={styles.charImage}
                                                    />
                                                ) : (
                                                    <div className={styles.charImagePlaceholder}>
                                                        {char.name.substring(0, 1)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.charInfo}>
                                                <div className={styles.charName}>
                                                    {char.name}
                                                </div>
                                                <div className={styles.charDetail}>
                                                    Lv.{char.level} {char.class_name}
                                                </div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.9rem', color: '#E5E7EB' }}>
                                            {SERVER_MAP[char.server_id] || char.server_id}
                                        </div>
                                        <div
                                            className={`${styles.charDetail} ${char.race_name === 'Elyos' ? styles.elyos : styles.asmodian}`}
                                            style={{ justifyContent: 'center' }}
                                        >
                                            {char.race_name === 'Elyos' ? '천족' : '마족'}
                                        </div>
                                    </td>
                                    {isCombatTab && (
                                        <td style={{ textAlign: 'center' }}>
                                            <div className={styles.itemLevelValue}>
                                                {char.item_level ?? '-'}
                                            </div>
                                        </td>
                                    )}

                                    {isCombatTab ? (
                                        <>
                                            <td style={{ textAlign: 'right' }}>
                                                <div
                                                    className={styles.scoreValue}
                                                    style={{ color: currentSort === 'pve' ? '#f59e0b' : '#4ade80' }}
                                                >
                                                    {getValidScore(char, 'pve')?.toLocaleString() ?? '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div
                                                    className={styles.scoreValue}
                                                    style={{ color: currentSort === 'pvp' ? '#f59e0b' : '#f87171' }}
                                                >
                                                    {getValidScore(char, 'pvp')?.toLocaleString() ?? '-'}
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <td style={{ textAlign: 'right' }}>
                                            <div className={styles.scoreValue}>
                                                {char.ranking_ap?.toLocaleString() || 0}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile List: Hidden on Desktop via CSS */}
            <div className={styles.mobileRankingList}>
                {data.map((char, idx) => {
                    const currentRank = idx + 1
                    const rankClass = currentRank === 1 ? styles.rank1 : currentRank === 2 ? styles.rank2 : currentRank === 3 ? styles.rank3 : ''
                    const raceClass = char.race_name === 'Elyos' ? styles.elyos : styles.asmodian

                    return (
                        <div key={`m-${char.character_id}_${idx}`} className={styles.mobileRankingCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.rankBadge}>
                                    <span className={`${styles.rankNumberMobile} ${rankClass}`}>#{currentRank}</span>
                                </div>
                            </div>

                            <Link
                                href={`/c/${encodeURIComponent(SERVER_MAP[char.server_id] || char.server_id)}/${encodeURIComponent(char.name)}`}
                                className={styles.cardBody}
                            >
                                <div className={styles.avatarMobile}>
                                    {char.profile_image ? (
                                        <Image src={char.profile_image} alt={char.name} width={56} height={56} style={{ objectFit: 'cover' }} />
                                    ) : (
                                        <div className={styles.charImagePlaceholder} style={{ fontSize: '1.5rem' }}>
                                            {char.name.substring(0, 1)}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.infoMobile}>
                                    <div className={styles.nameMobile}>{char.name}</div>
                                    <div className={styles.metaMobile}>
                                        <span>{SERVER_MAP[char.server_id] || char.server_id}</span>
                                        <span className={styles.separator}>|</span>
                                        <span className={raceClass}>{char.race_name === 'Elyos' ? '천족' : '마족'}</span>
                                        <span className={styles.separator}>|</span>
                                        <span style={{ marginRight: '8px' }}>{char.class_name}</span>

                                        <div className={styles.inlineStats}>
                                            <span className={styles.statTag} style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                                                Lv.{char.item_level || '-'}
                                            </span>
                                            {isCombatTab ? (
                                                <>
                                                    <span className={styles.statTag} style={{
                                                        color: currentSort === 'pve' ? '#f59e0b' : '#4ade80',
                                                        background: currentSort === 'pve' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(74, 222, 128, 0.1)'
                                                    }}>
                                                        E {getValidScore(char, 'pve')?.toLocaleString() ?? '-'}
                                                    </span>
                                                    <span className={styles.statTag} style={{
                                                        color: currentSort === 'pvp' ? '#f59e0b' : '#f87171',
                                                        background: currentSort === 'pvp' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(248, 113, 113, 0.1)'
                                                    }}>
                                                        P {getValidScore(char, 'pvp')?.toLocaleString() ?? '-'}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className={styles.statTag} style={{ color: '#FACC15', background: 'rgba(250, 204, 21, 0.1)' }}>
                                                    AP {char.ranking_ap?.toLocaleString() || 0}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    )
                })}
            </div>

            {hasMore && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className={styles.loadMoreButton}
                    >
                        {isLoadingMore ? '불러오는 중...' : '더보기 (Next 50)'}
                    </button>
                </div>
            )}
        </div>
    )
}
