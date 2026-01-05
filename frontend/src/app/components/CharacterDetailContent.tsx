'use client'
import { useState, useEffect } from 'react'
import CharacterHeader from './CharacterHeader'
import PowerDisplay from './PowerDisplay'
import EquipmentGrid from './EquipmentGrid'
import StatCard from './StatCard'
import SkillSection from './SkillSection'
import { useSkillProcessing } from '../hooks/useSkillProcessing'
import { useCharacterData } from '../hooks/useCharacterData'
import styles from './CharacterDetailContent.module.css'

interface CharacterDetailContentProps {
    server: string
    name: string
    onBack: () => void
}

export default function CharacterDetailContent({ server, name, onBack }: CharacterDetailContentProps) {
    const [activeTab, setActiveTab] = useState('basic')

    // Processed Data State
    const [gear, setGear] = useState<any[]>([])
    const [accessories, setAccessories] = useState<any[]>([])
    const [statList, setStatList] = useState<any[]>([])

    // Fetch character data using custom hook
    const { data, loading, error, refetch } = useCharacterData(server, name)

    // Process skills using custom hook
    const { processedSkills, stats: skillStats } = useSkillProcessing(
        data?.skills || [],
        data?.stigma || []
    )

    // Process equipment and stats when data changes
    useEffect(() => {
        if (data) {
            // Process Equipment
            const gearSlots = ['주무기', '보조무기', '투구', '견갑', '흉갑', '허리띠', '각반', '장갑', '망토', '장화']
            const accSlots = ['귀걸이1', '귀걸이2', '목걸이', '아뮬렛', '반지1', '반지2', '팔찌1', '팔찌2', '룬1', '룬2']

            const gears = (data.equipment || []).filter(item => gearSlots.includes(item.slot))
            const accs = (data.equipment || []).filter(item => accSlots.includes(item.slot))

            setGear(gears)
            setAccessories(accs)

            // Process Stats
            const primary = data.stats?.primary || {}
            const detailed = data.stats?.detailed || {}
            const list: any[] = []

            Object.entries(primary).forEach(([key, value]) => {
                list.push({ name: key, value: value, type: 'primary' })
            })

            Object.entries(detailed).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    list.push({ name: key, value: (value as any).total || value, ...value, type: 'detailed' })
                } else {
                    list.push({ name: key, value: value, type: 'detailed' })
                }
            })

            setStatList(list)
        }
    }, [data])

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <div className={styles.loadingText}>캐릭터 정보를 분석 중입니다...</div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={styles.container}>
                <button onClick={onBack} className={styles.backButton}>
                    ← 뒤로가기
                </button>
                <div className={styles.errorContainer}>
                    ❌ {error}
                </div>
                <button onClick={() => window.location.reload()} className={styles.retryButton}>
                    다시 시도
                </button>
            </div>
        )
    }

    if (!data) return null

    const headerData = {
        ...data.profile,
        power_index: data.power.combat_score,
        tier_rank: data.power.tier_rank,
        percentile: data.power.percentile,
        updated_at: new Date().toISOString()
    }

    const tabs = [
        { id: 'basic', label: '기본 정보' },
        { id: 'stats', label: '스탯' },
        { id: 'ranking', label: '랭킹' },
        { id: 'skills', label: '스킬' },
        { id: 'titles', label: '칭호' },
    ]

    return (
        <div className={styles.container}>
            {/* Back Button */}
            <button onClick={onBack} className={styles.backButton}>
                ← 뒤로가기
            </button>

            {/* Manual Refresh Button */}
            <button
                onClick={refetch}
                disabled={loading}
                className={styles.refreshButton}
                title="데이터 강제 갱신"
                aria-label="캐릭터 데이터 강제 갱신"
            >
                🔄
            </button>

            {/* Character Header */}
            <CharacterHeader data={headerData} />

            {/* Power Display */}
            {data.power.combat_score && (
                <div className={styles.section}>
                    <PowerDisplay
                        combatScore={data.power.combat_score}
                        itemLevel={data.power.item_level}
                        tier={data.power.tier_rank}
                        percentile={data.power.percentile}
                    />
                </div>
            )}

            {/* Tabs */}
            <div className={styles.section}>
                <div className={styles.tabBar}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabActive : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className={styles.tabContent}>
                    {/* Basic Info Tab */}
                    {activeTab === 'basic' && (
                        <div className={styles.basicContent}>
                            {/* Profile Info */}
                            <div className={styles.profileInfo}>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>종족</span>
                                    <span className={styles.infoValue}>{data.profile.race || '정보 없음'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>군단</span>
                                    <span className={styles.infoValue}>{data.profile.legion || '무소속'}</span>
                                </div>
                            </div>

                            {/* Equipment */}
                            <EquipmentGrid equipment={gear} accessories={accessories} />

                            {/* Pet & Wings */}
                            {data.pet_wings && data.pet_wings.length > 0 && (
                                <div className={styles.sectionBlock}>
                                    <h3 className={styles.sectionTitle}>🐾 펫/날개</h3>
                                    <div className={styles.itemGrid}>
                                        {data.pet_wings.map((item, idx) => (
                                            <div key={idx} className={styles.itemCard}>
                                                <span className={styles.itemName}>{item.name || `아이템 ${idx + 1}`}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stigma */}
                            {data.stigma && data.stigma.length > 0 && (
                                <div className={styles.sectionBlock}>
                                    <h3 className={styles.sectionTitle}>✨ 스티그마</h3>
                                    <div className={styles.itemGrid}>
                                        {data.stigma.map((item, idx) => (
                                            <div key={idx} className={styles.stigmaCard}>
                                                <span className={styles.stigmaName}>{item.name || `스티그마 ${idx + 1}`}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Devanion */}
                            {data.devanion && Object.keys(data.devanion).length > 0 && (
                                <div className={styles.sectionBlock}>
                                    <h3 className={styles.sectionTitle}>⚔️ 데바니온</h3>
                                    <div className={styles.devanionGrid}>
                                        {Object.entries(data.devanion).map(([god, value], idx) => (
                                            <div key={idx} className={styles.devanionCard}>
                                                <span className={styles.godName}>{god}</span>
                                                <span className={styles.godValue}>{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Arcana */}
                            {data.arcana && data.arcana.length > 0 && (
                                <div className={styles.sectionBlock}>
                                    <h3 className={styles.sectionTitle}>🔮 아르카나</h3>
                                    <div className={styles.itemGrid}>
                                        {data.arcana.map((item, idx) => (
                                            <div key={idx} className={styles.arcanaCard}>
                                                <span className={styles.arcanaName}>{item.name || `아르카나 ${idx + 1}`}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stats Tab */}
                    {activeTab === 'stats' && (
                        <div className={styles.statsContent}>
                            {statList.length > 0 ? (
                                <>
                                    <h3 className={styles.sectionTitle}>📊 주요 스탯</h3>
                                    <div className={styles.statGrid}>
                                        {statList.filter(s => s.type === 'primary').map((stat, idx) => (
                                            <div key={idx} className={styles.statItem}>
                                                <span className={styles.statName}>{stat.name}</span>
                                                <span className={styles.statValue}>{stat.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <h3 className={styles.sectionTitle}>📈 상세 스탯</h3>
                                    <div className={styles.statGrid}>
                                        {statList.filter(s => s.type === 'detailed').map((stat, idx) => (
                                            <StatCard
                                                key={idx}
                                                statName={stat.name}
                                                value={stat.value}
                                                percentile={stat.percentile}
                                                contribution={stat.contribution}
                                                breakdown={stat.breakdown}
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className={styles.emptyState}>
                                    📊 스탯 정보가 없습니다
                                </div>
                            )}
                        </div>
                    )}

                    {/* Ranking Tab */}
                    {activeTab === 'ranking' && (
                        <div className={styles.rankingContent}>
                            <h3 className={styles.sectionTitle}>🏆 랭킹 정보</h3>
                            {data.ranking && data.ranking.length > 0 ? (
                                <div className={styles.rankingGrid}>
                                    {data.ranking.map((rank, idx) => (
                                        <div key={idx} className={styles.rankingCard}>
                                            <div className={styles.rankingType}>{rank.type || '랭킹'}</div>
                                            <div className={styles.rankingRank}>
                                                {rank.rank ? `#${rank.rank}` : '-'}
                                            </div>
                                            <div className={styles.rankingPoints}>
                                                {rank.points ? `${rank.points.toLocaleString()}점` : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    🏆 랭킹 정보가 없습니다
                                </div>
                            )}
                        </div>
                    )}

                    {/* Skills Tab */}
                    {activeTab === 'skills' && (
                        <div className={styles.skillsContent}>
                            {processedSkills.length === 0 ? (
                                <div className={styles.emptyState}>
                                    ⚡ 스킬 정보가 없습니다
                                </div>
                            ) : (
                                <>
                                    {/* Debug Info Panel - 개발 환경에서만 표시 */}
                                    {process.env.NODE_ENV === 'development' && (
                                        <div style={{
                                            background: '#1a1d24',
                                            border: '1px solid #2d3748',
                                            borderRadius: '8px',
                                            padding: '1rem',
                                            marginBottom: '1rem',
                                            fontFamily: 'monospace',
                                            fontSize: '0.875rem'
                                        }}>
                                            <div style={{
                                                color: '#FCD34D',
                                                fontWeight: 'bold',
                                                marginBottom: '0.5rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                🐛 디버그 정보
                                            </div>
                                            <div style={{ color: '#E5E7EB', lineHeight: '1.8' }}>
                                                <div>📊 전체 스킬: <strong style={{ color: '#60A5FA' }}>{skillStats.total}개</strong></div>
                                                <div>⚡ 액티브 스킬 (1-12번): <strong style={{ color: skillStats.activeCount === 12 ? '#10B981' : '#EF4444' }}>{skillStats.activeCount}개</strong> {skillStats.activeCount !== 12 && '❌'}</div>
                                                <div>🎯 패시브 스킬 (13-22번): <strong style={{ color: skillStats.passiveCount === 10 ? '#10B981' : '#EF4444' }}>{skillStats.passiveCount}개</strong> {skillStats.passiveCount !== 10 && '❌'}</div>
                                                <div>✨ 스티그마 (23-33번): <strong style={{ color: skillStats.stigmaCount > 0 ? '#10B981' : '#EF4444' }}>{skillStats.stigmaCount}개</strong> {skillStats.stigmaCount === 0 && '❌'}</div>
                                                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9CA3AF' }}>
                                                    {data.skills?.length && `• API skills: ${data.skills.length}개`}
                                                    {data.stigma?.length && ` • API stigma: ${data.stigma.length}개`}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <SkillSection skills={{ skillList: processedSkills }} />
                                </>
                            )}
                        </div>
                    )}

                    {/* Titles Tab */}
                    {activeTab === 'titles' && (
                        <div className={styles.titlesContent}>
                            <h3 className={styles.sectionTitle}>🎖️ 칭호</h3>
                            {data.titles && data.titles.length > 0 ? (
                                <div className={styles.titleGrid}>
                                    {data.titles.map((title, idx) => (
                                        <div key={idx} className={styles.titleCard}>
                                            <span className={styles.titleName}>
                                                {title.name || title.count || `칭호 ${idx + 1}`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    🎖️ 칭호 정보가 없습니다
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
