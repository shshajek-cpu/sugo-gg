'use client'
import React, { useState } from 'react'
import SkillTooltip from './SkillTooltip'

interface Skill {
    name?: string
    skillName?: string
    itemName?: string
    icon?: string
    image?: string
    skillIcon?: string
    level?: number
    skillLevel?: number
    lv?: number
    lvl?: number
    description?: string
    type?: string
    category?: string
    [key: string]: any
}

interface SkillSectionProps {
    skills: {
        skillList?: Skill[]
        [key: string]: any
    } | null
}

const SkillSection: React.FC<SkillSectionProps> = ({ skills }) => {
    const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null)

    const skillList = skills?.skillList || []

    if (!skillList || skillList.length === 0) {
        return null
    }

    // Separate skills by skillCategory (based on sequence number)
    // If skillCategory exists, use it. Otherwise, fallback to old logic
    const activeSkills = skillList.filter(skill =>
        skill.skillCategory === 'active' ||
        (!skill.skillCategory && !skill.type?.toLowerCase().includes('stigma') && !skill.category?.toLowerCase().includes('stigma'))
    )
    const passiveSkills = skillList.filter(skill => skill.skillCategory === 'passive')
    const stigmaSkills = skillList.filter(skill =>
        skill.skillCategory === 'stigma' ||
        (!skill.skillCategory && (skill.type?.toLowerCase().includes('stigma') || skill.category?.toLowerCase().includes('stigma')))
    )

    const renderSkillGrid = (skills: Skill[], title: string) => {
        if (skills.length === 0) return null

        return (
            <div style={{ marginBottom: '2rem' }}>
                {/* Section Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    borderBottom: '1px solid #1F2433',
                    paddingBottom: '0.75rem'
                }}>
                    <h3 style={{
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        color: '#E5E7EB',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span style={{ color: '#FCD34D' }}>✦</span>
                        {title}
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                        총 {skills.length}개
                    </span>
                </div>

                {/* 5-Column Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '0.75rem'
                }}>
                    {skills.map((skill, index) => {
                        // Image URL logic
                        const iconUrl = skill.icon || skill.image || skill.skillIcon || ''
                        const finalIconUrl = iconUrl.startsWith('http')
                            ? iconUrl
                            : iconUrl ? `https://cms-static.plaync.com${iconUrl}` : ''

                        // Skill name with fallbacks
                        const skillName = skill.name || skill.skillName || skill.itemName || '알 수 없는 스킬'

                        // Skill level with fallbacks
                        const skillLevel = skill.level || skill.skillLevel || skill.lv || skill.lvl || null

                        const isHovered = hoveredSkill === skill

                        return (
                            <div
                                key={`${skillName}-${index}`}
                                onMouseEnter={() => setHoveredSkill(skill)}
                                onMouseLeave={() => setHoveredSkill(null)}
                                title={skillName} // Native tooltip fallback
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    background: '#1a1d24',
                                    border: '1px solid #2d3748',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'all 0.2s ease',
                                    boxSizing: 'border-box'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.1)'
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                                    e.currentTarget.style.borderColor = '#3B82F6'
                                    e.currentTarget.style.zIndex = '10'
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)'
                                    e.currentTarget.style.boxShadow = 'none'
                                    e.currentTarget.style.borderColor = '#2d3748'
                                    e.currentTarget.style.zIndex = '1'
                                }}
                            >
                                {/* Tooltip */}
                                {isHovered && <SkillTooltip skill={skill} />}

                                {/* Skill Icon */}
                                {finalIconUrl ? (
                                    <img
                                        src={finalIconUrl}
                                        alt={skillName}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23374151"%3E%3Crect width="24" height="24" /%3E%3C/svg%3E'
                                        }}
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: '#374151' }} />
                                )}

                                {/* Level Badge */}
                                {skillLevel && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '3px',
                                        right: '3px',
                                        background: 'rgba(0, 0, 0, 0.9)',
                                        color: '#FCD34D',
                                        fontSize: '0.65rem',
                                        fontWeight: 'bold',
                                        padding: '2px 4px',
                                        borderRadius: '3px',
                                        border: '1px solid #FCD34D',
                                        lineHeight: '1'
                                    }}>
                                        {skillLevel}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Responsive CSS for mobile */}
                <style jsx>{`
                    @media (max-width: 768px) {
                        div[style*="gridTemplateColumns"] {
                            grid-template-columns: repeat(3, 1fr) !important;
                        }
                    }
                `}</style>
            </div>
        )
    }

    return (
        <div style={{
            background: '#111318',
            border: '1px solid #1F2433',
            borderRadius: '12px',
            padding: '1.5rem',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            {/* Main Title */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                borderBottom: '2px solid #1F2433',
                paddingBottom: '0.75rem'
            }}>
                <h2 style={{
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    color: '#E5E7EB',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <span style={{ color: '#FCD34D' }}>✦</span>
                    스킬 & 스티그마
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                    총 {skillList.length}개
                </span>
            </div>

            {/* Active Skills Section */}
            {renderSkillGrid(activeSkills, '액티브 스킬')}

            {/* Passive Skills Section */}
            {renderSkillGrid(passiveSkills, '패시브 스킬')}

            {/* Stigma Skills Section */}
            {renderSkillGrid(stigmaSkills, '스티그마')}
        </div>
    )
}

export default SkillSection
