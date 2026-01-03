import React from 'react';

interface Skill {
    name: string;
    icon?: string;
    image?: string;
    level?: number;
    description?: string;
    [key: string]: any;
}

interface SkillSectionProps {
    skills: {
        skillList?: Skill[];
        [key: string]: any;
    } | null;
}

const SkillSection: React.FC<SkillSectionProps> = ({ skills }) => {
    const skillList = skills?.skillList || [];

    if (!skillList || skillList.length === 0) {
        return null;
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
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                borderBottom: '1px solid #1F2433',
                paddingBottom: '0.75rem'
            }}>
                <h2 style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: '#E5E7EB',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{ color: '#FCD34D' }}>✦</span>
                    스킬 & 스티그마
                </h2>
                <span style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>
                    총 {skillList.length}개
                </span>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '0.75rem'
            }}>
                {skillList.map((skill, index) => {
                    // Image fallback logic
                    const iconUrl = skill.icon || skill.image || skill.skillIcon || '';
                    const finalIconUrl = iconUrl.startsWith('http')
                        ? iconUrl
                        : iconUrl ? `https://cms-static.plaync.com${iconUrl}` : '';

                    // Skill name with fallbacks
                    const skillName = skill.name || skill.skillName || skill.itemName || '알 수 없는 스킬';

                    // Skill level with fallbacks - check multiple possible field names
                    const skillLevel = skill.level || skill.skillLevel || skill.lv || skill.lvl || null;

                    return (
                        <div key={`${skillName}-${index}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '0.75rem',
                            background: '#1a1d24',
                            borderRadius: '8px',
                            border: '1px solid #2d3748',
                            transition: 'all 0.2s ease'

                        }}>
                            {/* Icon */}
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                background: '#000',
                                border: '1px solid #4B5563',
                                flexShrink: 0,
                                position: 'relative'
                            }}>
                                {finalIconUrl ? (
                                    <img
                                        src={finalIconUrl}
                                        alt={skillName}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23374151"%3E%3Crect width="24" height="24" /%3E%3C/svg%3E';
                                        }}
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: '#374151' }} />
                                )}
                                {/* Level badge on icon */}
                                {skillLevel && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '2px',
                                        right: '2px',
                                        background: 'rgba(0, 0, 0, 0.85)',
                                        color: '#FCD34D',
                                        fontSize: '0.65rem',
                                        fontWeight: 'bold',
                                        padding: '1px 4px',
                                        borderRadius: '3px',
                                        border: '1px solid #FCD34D',
                                        lineHeight: '1'
                                    }}>
                                        {skillLevel}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                <span style={{
                                    color: '#F3F4F6',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {skillName}
                                </span>
                                {skillLevel && (
                                    <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                                        Lv. {skillLevel}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SkillSection;
