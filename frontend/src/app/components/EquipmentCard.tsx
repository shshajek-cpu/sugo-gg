import { useState } from 'react'
import EquipmentTooltip from './EquipmentTooltip'

interface EquipmentCardProps {
    slot: string
    item?: {
        name: string
        enhancement: string  // "+15"
        tier: number
        itemLevel?: number  // 아이템 레벨
        grade?: string  // "Legendary", "Mythic", etc.
        image?: string
        category?: string
        breakthrough?: number  // 돌파 횟수
        soulEngraving?: {
            grade: string  // "S", "A", "B"
            percentage: number  // 98.5
        }
        manastones?: Array<{
            type: string
            value: number
        }>
        raw?: any // Full item data for tooltip
    }
    onClick?: (item: any) => void
}

// Tier color - only high tier (4+) uses accent yellow
const getTierColor = (tier: number): string => {
    if (tier >= 5) return '#FACC15'  // Accent yellow for top tier only
    if (tier >= 4) return '#FBBF24'  // Secondary accent for high tier
    return '#9CA3AF'  // Sub text color for normal tiers
}

// Enhancement color - only high enhancement (+10+) uses accent
const getEnhancementColor = (enhancement: string): string => {
    const level = parseInt(enhancement.replace('+', ''))
    if (level >= 15) return '#FACC15'  // Top enhancement
    if (level >= 10) return '#FBBF24'  // High enhancement
    return '#E5E7EB'  // Normal text
}

// Item name color based on grade (공식 사이트 색상)
const getItemNameColor = (grade: string): string => {
    const gradeColors: Record<string, string> = {
        'Mythic': '#09CE9F',      // 청록색 (격돌의 룬)
        'Legendary': '#FB9800',   // 주황색 (명룡왕의 활)
        'Unique': '#FFB84D',      // 옅은 주황색 (해방자의 팔찌 등)
        'Epic': '#7E3DCF',        // 보라색 
        'Fabled': '#EE6C2A',      // 진한 주황색 (고대 정령 시리즈)
        'Rare': '#FFFFFF',        // 흰색
        'Common': '#9CA3AF'       // 회색
    }
    return gradeColors[grade] || '#FFFFFF'
}

export default function EquipmentCard({ slot, item, onClick }: EquipmentCardProps) {
    const [isHovered, setIsHovered] = useState(false)

    // Unified render to ensure consistent size
    // If no item, we just render placeholders
    const isEmpty = !item

    // Default colors for empty state
    const displayTierColor = isEmpty ? '#1F2433' : getTierColor(item.tier)
    const displayEnhancementColor = isEmpty ? '#E5E7EB' : getEnhancementColor(item.enhancement)
    const isDisplayHighTier = !isEmpty && item.tier >= 4

    return (
        <div style={{
            padding: '0.35rem',
            background: '#111318',
            border: '1px solid #1F2433',
            borderRadius: '6px',
            position: 'relative',
            cursor: isEmpty ? 'default' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            gap: '0.35rem',
            alignItems: 'center',
            width: '100%',
            height: '46px', // Slightly more compact height
            boxSizing: 'border-box',
            zIndex: isHovered && !isEmpty ? 9999 : 1,
            // opacity: isEmpty ? 1 : 1 // Removing opacity change for uniformity
        }}
            className={isEmpty ? '' : "equipment-card-hover"}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => !isEmpty && item && onClick?.(item)}
        >
            {/* Tooltip */}
            {!isEmpty && isHovered && item && <EquipmentTooltip item={item} />}

            {/* Breakthrough Badge (Placeholder if empty) */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '20px',
                height: '32px',
                flexShrink: 0,
                marginRight: '3px',
                visibility: !isEmpty && item.breakthrough != null && item.breakthrough > 0 ? 'visible' : 'hidden'
            }}>
                {!isEmpty && item.breakthrough != null && item.breakthrough > 0 && (
                    <div style={{
                        position: 'relative',
                        width: '16px',
                        height: '16px',
                        transform: 'rotate(45deg)',
                        background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 40%, #2563EB 60%, #1D4ED8 100%)',
                        border: '1.5px solid #93C5FD',
                        borderRadius: '2px',
                        boxShadow: `
                            0 0 6px rgba(59, 130, 246, 0.8),
                            0 0 12px rgba(96, 165, 250, 0.4),
                            inset 0 -2px 3px rgba(0, 0, 0, 0.4),
                            inset 2px 2px 4px rgba(147, 197, 253, 0.6),
                            inset -1px -1px 2px rgba(29, 78, 216, 0.6)
                        `,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'gemSparkle 2s ease-in-out infinite'
                    }}>
                        <span style={{
                            transform: 'rotate(-45deg)',
                            fontWeight: '900',
                            fontSize: '0.6rem',
                            color: '#FFFFFF',
                            textShadow: `
                                0 1px 2px rgba(0, 0, 0, 0.8),
                                0 0 3px rgba(147, 197, 253, 0.8)
                            `,
                            lineHeight: '1',
                            letterSpacing: '-0.5px'
                        }}>
                            {item.breakthrough}
                        </span>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes gemSparkle {
                    0%, 100% {
                        filter: brightness(1);
                    }
                    50% {
                        filter: brightness(1.15);
                    }
                }
            `}</style>

            {/* Item Image */}
            <div style={{
                width: '32px',
                height: '32px',
                background: '#0B0D12',
                borderRadius: '4px',
                border: `1px solid ${isDisplayHighTier ? displayTierColor + '60' : '#1F2433'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative'
            }}>
                {!isEmpty && item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ fontSize: '0.5rem', color: '#374151', textAlign: 'center' }}>Empty</div>
                )}

                {/* Enhancement Badge (Overlay on Image) */}
                {!isEmpty && item.enhancement && (
                    <div style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        background: 'rgba(11,13,18,0.95)',
                        color: displayEnhancementColor,
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        padding: '0 2px',
                        borderTopLeftRadius: '2px',
                        lineHeight: '1'
                    }}>
                        {item.enhancement}
                    </div>
                )}
            </div>

            {/* Info Column */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {/* Slot Name */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>{slot}</span>
                </div>

                {/* Item Name */}
                <div style={{
                    fontSize: '0.75rem',
                    color: !isEmpty ? getItemNameColor(item.grade || '') : '#4B5563',
                    fontWeight: !isEmpty ? '500' : 'normal',
                    marginTop: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {!isEmpty ? item.name : '장착 없음'}
                </div>

                {/* Manastones (very compact) - Placeholder if empty to keep height? No, flex center handles vertical */}
                {!isEmpty && item.manastones && item.manastones.length > 0 && (
                    <div style={{
                        marginTop: '2px',
                        display: 'flex',
                        gap: '2px',
                        alignItems: 'center'
                    }}>
                        {item.manastones.slice(0, 4).map((stone, idx) => (
                            <div key={idx}
                                title={`${stone.type} +${stone.value}`}
                                style={{
                                    width: '5px',
                                    height: '5px',
                                    borderRadius: '50%',
                                    background: stone.type.includes('공격') ? '#EF4444' : stone.type.includes('치명') ? '#F59E0B' : '#3B82F6',
                                }} />
                        ))}
                        {item.manastones.length > 4 && (
                            <span style={{ fontSize: '0.55rem', color: '#9CA3AF' }}>+{item.manastones.length - 4}</span>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
        .equipment-card-hover:hover {
          border-color: #FACC15;
          transform: translateY(-1px);
        }
      `}</style>
        </div>
    )
}

