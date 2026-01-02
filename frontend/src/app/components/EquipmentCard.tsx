'use client'

interface EquipmentCardProps {
    slot: string
    item?: {
        name: string
        enhancement: string  // "+15"
        tier: number
        image?: string
        category?: string
        soulEngraving?: {
            grade: string  // "S", "A", "B"
            percentage: number  // 98.5
        }
        manastones?: Array<{
            type: string
            value: number
        }>
    }
}

const getTierColor = (tier: number): string => {
    const colors: Record<number, string> = {
        5: '#FACC15',
        4: '#FBBF24',
        3: '#94A3B8',
        2: '#9CA3AF',
        1: '#6B7280'
    }
    return colors[tier] || '#6B7280'
}

const getEnhancementColor = (enhancement: string): string => {
    const level = parseInt(enhancement.replace('+', ''))
    if (level >= 15) return '#FACC15'
    if (level >= 10) return '#FBBF24'
    if (level >= 5) return '#94A3B8'
    return '#9CA3AF'
}

export default function EquipmentCard({ slot, item }: EquipmentCardProps) {
    if (!item) {
        return (
            <div style={{
                padding: '1rem',
                background: '#1A1D29',
                border: '1px solid #2D3748',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#6B7280'
            }}>
                <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{slot}</div>
                <div style={{ fontSize: '0.75rem' }}>장착 없음</div>
            </div>
        )
    }

    const tierColor = getTierColor(item.tier)
    const enhancementColor = getEnhancementColor(item.enhancement)

    return (
        <div style={{
            padding: '0.75rem',
            background: '#1A1D29',
            border: `1px solid ${tierColor}40`,
            borderRadius: '8px',
            position: 'relative',
            transition: 'all 0.2s',
            cursor: 'pointer',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start'
        }}
            className="equipment-card-hover"
        >
            {/* Item Image */}
            <div style={{
                width: '48px',
                height: '48px',
                background: '#0B0D12',
                borderRadius: '6px',
                border: `1px solid ${tierColor}60`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative'
            }}>
                {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ fontSize: '0.5rem', color: '#4B5563', textAlign: 'center' }}>No IMG</div>
                )}

                {/* Enhancement Badge (Overlay on Image) */}
                {item.enhancement && (
                    <div style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        background: 'rgba(0,0,0,0.8)',
                        color: enhancementColor,
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        padding: '0 2px',
                        borderTopLeftRadius: '4px'
                    }}>
                        {item.enhancement}
                    </div>
                )}
            </div>

            {/* Info Column */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Slot & Tier Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{slot}</span>
                    <span style={{ fontSize: '0.65rem', color: tierColor, border: `1px solid ${tierColor}40`, padding: '0 4px', borderRadius: '3px' }}>
                        T{item.tier}
                    </span>
                </div>

                {/* Item Name */}
                <div style={{
                    fontSize: '0.85rem',
                    color: '#E5E7EB',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '0.5rem'
                }}>
                    {item.name}
                </div>

                {/* Soul Engraving */}
                {item.soulEngraving && (
                    <div style={{
                        fontSize: '0.7rem',
                        color: '#9CA3AF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '2px'
                    }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.soulEngraving.grade === 'S' ? '#FACC15' : '#94A3B8' }}></span>
                        <span>각인 {item.soulEngraving.grade} ({item.soulEngraving.percentage}%)</span>
                    </div>
                )}

                {/* Manastones (Collapsed view) */}
                {item.manastones && item.manastones.length > 0 && (
                    <div style={{
                        marginTop: '4px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '2px'
                    }}>
                        {item.manastones.slice(0, 3).map((stone, idx) => (
                            <div key={idx}
                                title={`${stone.type} +${stone.value}`}
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: stone.type.includes('공격') ? '#EF4444' : stone.type.includes('치명') ? '#F59E0B' : '#3B82F6',
                                }} />
                        ))}
                        {item.manastones.length > 3 && (
                            <span style={{ fontSize: '0.6rem', color: '#6B7280' }}>+{item.manastones.length - 3}</span>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
        .equipment-card-hover:hover {
          border-color: ${tierColor};
          box-shadow: 0 0 15px ${tierColor}20;
          transform: translateY(-1px);
        }
      `}</style>
        </div>
    )
}
