'use client'
import { useState } from 'react'

interface DaevanionBoardViewProps {
    // 나중에 실제 데이터가 연동되면 사용할 props
}

export default function DaevanionBoardView(props: DaevanionBoardViewProps) {
    const [activeGod, setActiveGod] = useState<string>('kaisinel')

    const gods = [
        { id: 'kaisinel', name: '카이시넬' },
        { id: 'marchutan', name: '마르쿠탄' },
        { id: 'eustatin', name: '유스티엘' },
        { id: 'lumiel', name: '루미엘' },
        { id: 'yustiel', name: '바이젤' }, // 이름 확인 필요, 일단 예시
        { id: 'triniel', name: '트리니엘' }
    ]

    return (
        <div>
            {/* 신 선택 탭 */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
            }}>
                {gods.map((god) => (
                    <button
                        key={god.id}
                        onClick={() => setActiveGod(god.id)}
                        style={{
                            background: activeGod === god.id ? '#1E3A8A' : '#0B0D12',
                            color: activeGod === god.id ? '#93C5FD' : '#6B7280',
                            border: `1px solid ${activeGod === god.id ? '#3B82F6' : '#1F2433'}`,
                            borderRadius: '6px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem',
                            fontWeight: activeGod === god.id ? 'bold' : 'normal',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {god.name}
                    </button>
                ))}
            </div>

            {/* 보드 영역 */}
            <div style={{
                background: '#0B0D12',
                border: '1px solid #1F2433',
                borderRadius: '8px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px'
            }}>
                <div style={{
                    marginBottom: '1rem',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: '#E5E7EB'
                }}>
                    {gods.find(g => g.id === activeGod)?.name}의 데바니온 보드
                </div>

                {/* 이미지 플레이스홀더 */}
                <div style={{
                    width: '100%',
                    maxWidth: '600px',
                    height: '300px',
                    background: '#111318',
                    border: '2px dashed #374151',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6B7280'
                }}>
                    보드 이미지 영역
                </div>

                <div style={{ marginTop: '1.5rem', color: '#9CA3AF', fontSize: '0.9rem' }}>
                    활성화된 노드 정보가 여기에 표시됩니다.
                </div>
            </div>
        </div>
    )
}
