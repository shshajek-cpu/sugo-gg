'use client'

interface TitleCategory {
    name: string
    icon: React.ReactNode
    total: number
    owned: number
    representativeTitle?: {
        name: string
        effects: string[]
    }
}

// SVG 아이콘 컴포넌트들
const AttackIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2L4 12l3 3 10-10-3-3z" fill="currentColor" opacity="0.3" />
        <path d="M14 2L4 12l3 3 10-10-3-3z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M4 12l3 3-5 5 2 2 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
)

const DefenseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 6v6c0 5.5 3.5 10 8 11 4.5-1 8-5.5 8-11V6l-8-4z" fill="currentColor" opacity="0.3" />
        <path d="M12 2L4 6v6c0 5.5 3.5 10 8 11 4.5-1 8-5.5 8-11V6l-8-4z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
)

const OtherIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.3" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="8" r="1.5" fill="currentColor" />
        <circle cx="8" cy="14" r="1.5" fill="currentColor" />
        <circle cx="16" cy="14" r="1.5" fill="currentColor" />
    </svg>
)

export default function TitleCard({ titles }: { titles: any }) {
    if (!titles) return null

    const totalCount = titles.totalCount || 0
    const ownedCount = titles.ownedCount || 0
    const titleList = titles.titleList || []

    // 카테고리별 분류
    const categorizeTitle = (title: any): string => {
        const equipCategory = title.equipCategory || ''

        // API uses: "Defense", "Attack", "Etc"
        if (equipCategory === 'Attack') return 'attack'
        if (equipCategory === 'Defense') return 'defense'
        if (equipCategory === 'Etc') return 'other'

        return 'other'
    }

    // 효과 파싱
    const parseEffects = (title: any): string[] => {
        // API uses equipStatList array with desc field
        if (title.equipStatList && Array.isArray(title.equipStatList)) {
            return title.equipStatList.map((stat: any) => stat.desc).filter(Boolean)
        }
        if (title.statList && Array.isArray(title.statList)) {
            return title.statList.map((stat: any) => stat.desc).filter(Boolean)
        }
        return []
    }

    // 카테고리별 데이터 집계
    const attackTitles = titleList.filter((t: any) => categorizeTitle(t) === 'attack')
    const defenseTitles = titleList.filter((t: any) => categorizeTitle(t) === 'defense')
    const otherTitles = titleList.filter((t: any) => categorizeTitle(t) === 'other')

    // 대표 타이틀 선택 (첫 번째 또는 owned인 것)
    const getRepresentative = (list: any[]) => {
        const owned = list.find((t: any) => t.owned || t.isOwned)
        return owned || list[0]
    }

    const categories: TitleCategory[] = [
        {
            name: '공격계열',
            icon: <AttackIcon />,
            total: Math.round(totalCount * 0.34) || attackTitles.length,
            owned: attackTitles.filter((t: any) => t.owned || t.isOwned).length,
            representativeTitle: getRepresentative(attackTitles) ? {
                name: getRepresentative(attackTitles)?.name,
                effects: parseEffects(getRepresentative(attackTitles))
            } : undefined
        },
        {
            name: '방어계열',
            icon: <DefenseIcon />,
            total: Math.round(totalCount * 0.33) || defenseTitles.length,
            owned: defenseTitles.filter((t: any) => t.owned || t.isOwned).length,
            representativeTitle: getRepresentative(defenseTitles) ? {
                name: getRepresentative(defenseTitles)?.name,
                effects: parseEffects(getRepresentative(defenseTitles))
            } : undefined
        },
        {
            name: '기타계열',
            icon: <OtherIcon />,
            total: Math.round(totalCount * 0.33) || otherTitles.length,
            owned: otherTitles.filter((t: any) => t.owned || t.isOwned).length,
            representativeTitle: getRepresentative(otherTitles) ? {
                name: getRepresentative(otherTitles)?.name,
                effects: parseEffects(getRepresentative(otherTitles))
            } : undefined
        }
    ]

    // Only use accent color for high progress (75%+)
    const isHighProgress = totalCount > 0 && (ownedCount / totalCount) >= 0.75

    return (
        <div style={{
            background: '#111318',
            border: '1px solid #1F2433',
            borderRadius: '12px',
            padding: '1rem',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
                flexShrink: 0
            }}>
                <h3 style={{
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    color: '#E5E7EB',
                    margin: 0
                }}>
                    타이틀
                </h3>
                <div style={{
                    padding: '0.2rem 0.5rem',
                    background: '#0B0D12',
                    border: '1px solid #1F2433',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                }}>
                    <span style={{ color: isHighProgress ? '#FACC15' : '#E5E7EB' }}>
                        {ownedCount}
                    </span>
                    <span style={{ color: '#9CA3AF' }}>/{totalCount}</span>
                </div>
            </div>

            {/* 3-Column Category Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.6rem'
            }}>
                {categories.map((category, idx) => (
                    <div
                        key={idx}
                        style={{
                            background: '#0B0D12',
                            border: '1px solid #1F2433',
                            borderRadius: '8px',
                            padding: '0.8rem',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: '180px'
                        }}
                        className="category-card-hover"
                    >
                        {/* Category Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            marginBottom: '0.4rem'
                        }}>
                            <span style={{ color: '#9CA3AF', flexShrink: 0 }}>
                                {category.icon}
                            </span>
                            <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                color: '#E5E7EB'
                            }}>
                                {category.name}
                            </span>
                        </div>

                        {/* Count */}
                        <div style={{
                            fontSize: '0.75rem',
                            marginBottom: '0.4rem'
                        }}>
                            <span style={{ color: '#E5E7EB', fontWeight: 'bold' }}>
                                {category.owned}
                            </span>
                            <span style={{ color: '#9CA3AF' }}>/{category.total}</span>
                        </div>

                        {/* Representative Title Name */}
                        {category.representativeTitle && (
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#FACC15',
                                fontWeight: 'bold',
                                marginBottom: '0.4rem',
                                lineHeight: '1.4'
                            }}>
                                {category.representativeTitle.name}
                            </div>
                        )}

                        {/* All Effects */}
                        {category.representativeTitle && category.representativeTitle.effects.length > 0 && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem'
                            }}>
                                {category.representativeTitle.effects.map((effect, effectIdx) => (
                                    <div key={effectIdx} style={{
                                        fontSize: '0.7rem',
                                        color: '#60A5FA',
                                        lineHeight: '1.4',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        • {effect}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <style jsx>{`
                .category-card-hover:hover {
                    border-color: #FACC15;
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    )
}
