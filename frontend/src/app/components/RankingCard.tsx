'use client'
import RankingIcon from './RankingIcon'

interface RankingItem {
    name: string
    rank: number
    value?: string | number
    extra?: string // Tier or Win Rate
}

interface RankingCardProps {
    rankings: {
        rankingList: any[]
    }
    isEmbedded?: boolean
}

export default function RankingCard({ rankings, isEmbedded = false }: RankingCardProps) {
    // Debug: Check the actual data structure
    // console.log('Ranking Data:', rankings)

    const list = rankings?.rankingList || []

    // Helper to find ranking by keywords
    const getRanking = (keywords: string[]): RankingItem | null => {
        const found = list.find(item => {
            // Check rankingContentsName as well
            const name = (item.rankingContentsName || item.categoryName || item.name || '').replace(/\s+/g, '')
            return keywords.some(k => name.includes(k))
        })

        if (!found) return null

        const rank = found.rank || found.myRanking || 0

        // Point / Score
        let value = found.point || found.score || found.value
        if (typeof value === 'number') value = value.toLocaleString()

        // Construct extra info (Tier or Win Rate)
        let extra = ''
        if (found.gradeName || found.tier || found.grade) {
            extra = found.gradeName || found.tier || found.grade
        } else if (found.winCount !== undefined && found.playCount) {
            const rate = ((found.winCount / found.playCount) * 100).toFixed(1)
            extra = `${rate}%`
        }

        return {
            // Prefer API name if available
            name: found.rankingContentsName || found.categoryName || found.name || keywords[0],
            rank,
            value,
            extra
        }
    }

    // Define the 7 requested rankings
    const rankingDefinitions = [
        { key: 'abyss', keywords: ['어비스', 'Abyss'], label: '어비스 포인트', iconColor: '#EF4444' },
        { key: 'transcendence', keywords: ['초월', 'Transcen'], label: '초월', iconColor: '#8B5CF6' },
        { key: 'nightmare', keywords: ['악몽', 'Nightmare'], label: '악몽', iconColor: '#6366F1' },
        { key: 'solitude', keywords: ['고독', 'Solitude'], label: '고독의 투기장', iconColor: '#F59E0B' },
        { key: 'cooperation', keywords: ['협력', 'Cooperation'], label: '협력의 투기장', iconColor: '#10B981' },
        { key: 'conquest', keywords: ['토벌', 'Conquest'], label: '토벌전', iconColor: '#EF4444' },
        { key: 'awakening', keywords: ['각성', 'Awaken'], label: '각성전', iconColor: '#3B82F6' },
    ]

    const dataToShow = rankingDefinitions.map(def => {
        const info = getRanking(def.keywords)
        return {
            ...def,
            info // can be null
        }
    })

    return (
        <div style={{
            background: '#111318',
            border: '1px solid #1F2433',
            borderRadius: '12px',
            padding: '1.25rem',
            width: '100%'
        }}>
            {/* 타이틀 */}
            <h3 style={{
                fontSize: '0.95rem',
                fontWeight: 'bold',
                color: '#E5E7EB',
                margin: 0,
                marginBottom: '1rem'
            }}>
                랭킹 정보
            </h3>

            {/* 7열 그리드 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.75rem'
            }}>
                {dataToShow.map(item => (
                    <div key={item.key} style={{
                        background: '#0B0D12',
                        border: '1px solid #1F2433',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        textAlign: 'center'
                    }}>
                        {/* 메달 이미지 */}
                        <div style={{
                            width: '83px',
                            height: '83px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <img
                                src={item.key === 'abyss' ? '/메달/1.png' : '/메달/2.png'}
                                alt={item.label}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>

                        {/* 라벨 */}
                        <span style={{
                            fontSize: '0.75rem',
                            color: '#9CA3AF',
                            lineHeight: '1.2',
                            minHeight: '2.4em',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            {item.label}
                        </span>

                        {/* 순위 */}
                        {item.info ? (
                            <>
                                <div style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    color: '#E5E7EB'
                                }}>
                                    {item.info.rank > 0 ? `${item.info.rank}위` : '-'}
                                </div>

                                {/* 값/티어 */}
                                {item.info.extra && (
                                    <span style={{
                                        fontSize: '0.7rem',
                                        color: item.iconColor,
                                        fontWeight: '500'
                                    }}>
                                        {item.info.extra}
                                    </span>
                                )}
                            </>
                        ) : (
                            <span style={{ color: '#4B5563', fontSize: '0.8rem' }}>-</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
