'use client'

interface EquipmentItem {
    slot: string
    name?: string
    itemLevel?: number
    enhancement?: number
    tier?: number
    breakthrough?: number
    engraving?: { grade: string; value: number }
    manastones?: { name: string; value: string }[]
    grade?: string
}

interface EquipmentDetailViewProps {
    equipment?: EquipmentItem[]
    accessories?: EquipmentItem[]
    arcana?: EquipmentItem[]
}

export default function EquipmentDetailView({ equipment = [], accessories = [], arcana = [] }: EquipmentDetailViewProps) {
    // 더미 데이터
    const dummyEquipment: EquipmentItem[] = [
        {
            slot: '주무기',
            name: '영원의 검',
            itemLevel: 85,
            enhancement: 15,
            tier: 5,
            breakthrough: 3,
            engraving: { grade: 'S', value: 98.5 },
            manastones: [
                { name: '공격력', value: '+50' },
                { name: '치명타', value: '+30' },
                { name: 'HP', value: '+500' },
                { name: '방어력', value: '+25' }
            ],
            grade: 'Legendary'
        },
        {
            slot: '보조무기',
            name: '수호의 방패',
            itemLevel: 83,
            enhancement: 12,
            tier: 4,
            breakthrough: 2,
            engraving: { grade: 'A', value: 85.2 },
            manastones: [
                { name: '방어력', value: '+40' },
                { name: 'HP', value: '+600' }
            ],
            grade: 'Epic'
        },
        { slot: '투구', name: '용의 투구', itemLevel: 82, enhancement: 10, tier: 4, grade: 'Epic' },
        { slot: '견갑', name: '용의 견갑', itemLevel: 82, enhancement: 10, tier: 4, grade: 'Epic' },
        { slot: '상의', name: '용의 갑옷', itemLevel: 82, enhancement: 10, tier: 4, grade: 'Epic' },
        { slot: '하의', name: '용의 각반', itemLevel: 82, enhancement: 10, tier: 4, grade: 'Epic' },
        { slot: '장갑', name: '용의 장갑', itemLevel: 82, enhancement: 10, tier: 4, grade: 'Epic' },
        { slot: '신발', name: '용의 신발', itemLevel: 82, enhancement: 10, tier: 4, grade: 'Epic' },
        { slot: '벨트', name: '용의 벨트', itemLevel: 80, enhancement: 8, tier: 3, grade: 'Rare' },
        { slot: '망토', name: '용의 망토', itemLevel: 80, enhancement: 8, tier: 3, grade: 'Rare' }
    ]

    const dummyAccessories: EquipmentItem[] = [
        { slot: '귀걸이1', name: '빛나는 귀걸이', itemLevel: 81, enhancement: 9, tier: 4, grade: 'Epic' },
        { slot: '귀걸이2', name: '빛나는 귀걸이', itemLevel: 81, enhancement: 9, tier: 4, grade: 'Epic' },
        { slot: '목걸이', name: '빛나는 목걸이', itemLevel: 81, enhancement: 9, tier: 4, grade: 'Epic' },
        { slot: '반지1', name: '빛나는 반지', itemLevel: 81, enhancement: 9, tier: 4, grade: 'Epic' },
        { slot: '반지2', name: '빛나는 반지', itemLevel: 81, enhancement: 9, tier: 4, grade: 'Epic' },
        { slot: '팔찌', name: '빛나는 팔찌', itemLevel: 81, enhancement: 9, tier: 4, grade: 'Epic' },
        { slot: '룬1', name: '화염의 룬', itemLevel: 75, grade: 'Rare' },
        { slot: '룬2', name: '냉기의 룬', itemLevel: 75, grade: 'Rare' },
        { slot: '룬3', name: '번개의 룬', itemLevel: 75, grade: 'Rare' },
        { slot: '룬4', name: '대지의 룬', itemLevel: 75, grade: 'Rare' }
    ]

    const dummyArcana: EquipmentItem[] = [
        { slot: '아르카나 1', name: '불의 아르카나', itemLevel: 70, grade: 'Legendary' },
        { slot: '아르카나 2', name: '물의 아르카나', itemLevel: 70, grade: 'Epic' },
        { slot: '아르카나 3', name: '바람의 아르카나', itemLevel: 70, grade: 'Epic' },
        { slot: '아르카나 4', name: '땅의 아르카나', itemLevel: 70, grade: 'Rare' },
        { slot: '아르카나 5', name: '빛의 아르카나', itemLevel: 70, grade: 'Rare' }
    ]

    const equipmentData = equipment.length > 0 ? equipment : dummyEquipment
    const accessoriesData = accessories.length > 0 ? accessories : dummyAccessories
    const arcanaData = arcana.length > 0 ? arcana : dummyArcana

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {/* 무기/방어구 */}
            <div>
                <h4 style={{
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    color: '#E5E7EB',
                    marginBottom: '1rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid #1F2433'
                }}>
                    무기 & 방어구
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {equipmentData.map((item, index) => (
                        <ItemCard key={index} item={item} />
                    ))}
                </div>
            </div>

            {/* 장신구/룬 */}
            <div>
                <h4 style={{
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    color: '#E5E7EB',
                    marginBottom: '1rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid #1F2433'
                }}>
                    장신구 & 룬
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {accessoriesData.map((item, index) => (
                        <ItemCard key={index} item={item} />
                    ))}
                </div>
            </div>

            {/* 아르카나 */}
            <div>
                <h4 style={{
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    color: '#E5E7EB',
                    marginBottom: '1rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid #1F2433'
                }}>
                    아르카나
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {arcanaData.map((item, index) => (
                        <ItemCard key={index} item={item} />
                    ))}
                </div>
            </div>
        </div>
    )
}

interface ItemCardProps {
    item: EquipmentItem
}

function ItemCard({ item }: ItemCardProps) {
    const getGradeColor = (grade?: string) => {
        switch (grade) {
            case 'Legendary': return '#FF8C00'
            case 'Epic': return '#A855F7'
            case 'Rare': return '#3B82F6'
            case 'Uncommon': return '#10B981'
            default: return '#9CA3AF'
        }
    }

    return (
        <div style={{
            background: '#0B0D12',
            border: `1px solid ${item.name ? '#1F2433' : '#111318'}`,
            borderRadius: '8px',
            padding: '0.75rem',
            opacity: item.name ? 1 : 0.5
        }}>
            {/* 슬롯명 & 아이템명 */}
            <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                    {item.slot}
                </div>
                {item.name ? (
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: getGradeColor(item.grade) }}>
                        {item.name}
                    </div>
                ) : (
                    <div style={{ fontSize: '0.85rem', color: '#4B5563' }}>
                        (비어있음)
                    </div>
                )}
            </div>

            {item.name && (
                <>
                    {/* 아이템 레벨 */}
                    {item.itemLevel && (
                        <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.25rem' }}>
                            아이템 레벨: <span style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{item.itemLevel}</span>
                        </div>
                    )}

                    {/* 강화 & 티어 */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.25rem', fontSize: '0.75rem' }}>
                        {item.enhancement !== undefined && (
                            <div>
                                <span style={{ color: '#6B7280' }}>강화: </span>
                                <span style={{ color: '#10B981', fontWeight: 'bold' }}>+{item.enhancement}</span>
                            </div>
                        )}
                        {item.tier && (
                            <div>
                                <span style={{ color: '#6B7280' }}>티어: </span>
                                <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>{item.tier}</span>
                            </div>
                        )}
                    </div>

                    {/* 돌파 */}
                    {item.breakthrough !== undefined && item.breakthrough > 0 && (
                        <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: '#6B7280' }}>돌파: </span>
                            <span style={{ color: '#8B5CF6', fontWeight: 'bold' }}>{item.breakthrough}회</span>
                        </div>
                    )}

                    {/* 각인 */}
                    {item.engraving && (
                        <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: '#6B7280' }}>각인: </span>
                            <span style={{ color: '#3B82F6', fontWeight: 'bold' }}>
                                {item.engraving.grade}급 ({item.engraving.value}%)
                            </span>
                        </div>
                    )}

                    {/* 마나석 */}
                    {item.manastones && item.manastones.length > 0 && (
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #1F2433' }}>
                            <div style={{ fontSize: '0.7rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                                마나석 ({item.manastones.length}개)
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                {item.manastones.map((stone, idx) => (
                                    <div key={idx} style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                                        • {stone.name} {stone.value}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
