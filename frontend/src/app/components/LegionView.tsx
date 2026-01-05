'use client'
import { useState, useMemo } from 'react'

interface LegionMember {
    rank: number
    name: string
    level: number
    class: string
    position: string // 군단장, 부군단장, 백부장, 일반
    contribution: number
    joinDate: string
}

export default function LegionView() {
    const [searchQuery, setSearchQuery] = useState('')

    // 더미 데이터
    const members: LegionMember[] = [
        { rank: 1, name: '이계의지배자', level: 90, class: '집행자', position: '군단장', contribution: 1542000, joinDate: '2024-01-15' },
        { rank: 2, name: '검은그림자', level: 89, class: '살성', position: '부군단장', contribution: 1250000, joinDate: '2024-02-01' },
        { rank: 3, name: '치유의손길', level: 88, class: '치유성', position: '백부장', contribution: 980000, joinDate: '2024-03-10' },
        { rank: 4, name: '파괴의신', level: 90, class: '마도성', position: '백부장', contribution: 950000, joinDate: '2024-01-20' },
        { rank: 5, name: '철벽방어', level: 87, class: '수호성', position: '일반', contribution: 850000, joinDate: '2024-04-05' },
        { rank: 6, name: '바람의화살', level: 86, class: '궁성', position: '일반', contribution: 720000, joinDate: '2024-05-12' },
        { rank: 7, name: '어둠의검', level: 85, class: '검성', position: '일반', contribution: 650000, joinDate: '2024-06-01' },
        { rank: 8, name: '영원의노래', level: 85, class: '음유성', position: '일반', contribution: 600000, joinDate: '2024-06-15' },
        { rank: 9, name: '기갑탑승', level: 84, class: '기갑성', position: '일반', contribution: 550000, joinDate: '2024-07-01' },
        { rank: 10, name: '정령의벗', level: 84, class: '정령성', position: '일반', contribution: 500000, joinDate: '2024-07-20' },
    ]

    const filteredMembers = useMemo(() => {
        return members.filter(member =>
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.class.includes(searchQuery) ||
            member.position.includes(searchQuery)
        )
    }, [searchQuery])

    return (
        <div>
            {/* 상단 정보 & 검색 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <div style={{ fontSize: '0.9rem', color: '#E5E7EB' }}>
                    총원: <span style={{ fontWeight: 'bold', color: '#3B82F6' }}>{members.length}</span>명
                </div>

                <div style={{ position: 'relative', width: '250px' }}>
                    <input
                        type="text"
                        placeholder="캐릭터명, 직업, 직위 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            background: '#0B0D12',
                            border: '1px solid #1F2433',
                            borderRadius: '6px',
                            padding: '0.5rem 0.75rem',
                            color: '#F3F4F6',
                            fontSize: '0.85rem',
                            outline: 'none'
                        }}
                    />
                    <span style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '0.8rem'
                    }}>
                        🔍
                    </span>
                </div>
            </div>

            {/* 멤버 리스트 테이블 */}
            <div style={{
                background: '#0B0D12',
                border: '1px solid #1F2433',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ background: '#111318', borderBottom: '1px solid #1F2433', color: '#9CA3AF' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'center', width: '60px' }}>순위</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>캐릭터명</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center', width: '80px' }}>직위</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center', width: '60px' }}>레벨</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center', width: '80px' }}>직업</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', width: '100px' }}>공헌도</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', width: '100px' }}>가입일</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMembers.length > 0 ? (
                            filteredMembers.map((member) => (
                                <tr key={member.rank} style={{ borderBottom: '1px solid #1F2433' }}>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#6B7280' }}>
                                        {member.rank}
                                    </td>
                                    <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#E5E7EB' }}>
                                        {member.name}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <PositionBadge position={member.position} />
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#9CA3AF' }}>
                                        {member.level}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#9CA3AF' }}>
                                        {member.class}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#10B981' }}>
                                        {member.contribution.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6B7280' }}>
                                        {member.joinDate}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
                                    검색 결과가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function PositionBadge({ position }: { position: string }) {
    let color = '#6B7280'
    let bg = '#1F2937'

    switch (position) {
        case '군단장':
            color = '#FCD34D' // Yellow
            bg = 'rgba(251, 191, 36, 0.1)'
            break
        case '부군단장':
            color = '#60A5FA' // Blue
            bg = 'rgba(59, 130, 246, 0.1)'
            break
        case '백부장':
            color = '#34D399' // Green
            bg = 'rgba(16, 185, 129, 0.1)'
            break
        default:
            break
    }

    return (
        <span style={{
            color,
            background: bg,
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
        }}>
            {position}
        </span>
    )
}
