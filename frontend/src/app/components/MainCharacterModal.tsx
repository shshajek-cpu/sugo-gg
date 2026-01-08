'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, ChevronDown } from 'lucide-react'
import { supabaseApi, CharacterSearchResult, SERVER_NAME_TO_ID } from '../../lib/supabaseApi'
import { MainCharacter, MAIN_CHARACTER_KEY } from './SearchBar'

interface MainCharacterModalProps {
    isOpen: boolean
    onClose: () => void
}

const ELYOS_SERVERS = [
    '시엘', '네자칸', '바이젤', '카이시넬', '유스티엘', '아리엘', '프레기온',
    '메스람타에다', '히타니에', '나니아', '타하바타', '루터스', '페르노스',
    '다미누', '카사카', '바카르마', '챈가룽', '코치룽', '이슈타르', '티아마트', '포에타'
]

const ASMODIAN_SERVERS = [
    '지켈', '트리니엘', '루미엘', '마르쿠탄', '아스펠', '에레슈키갈', '브리트라',
    '네몬', '하달', '루드라', '울고른', '무닌', '오다르', '젠카카', '크로메데',
    '콰이링', '바바룽', '파프니르', '인드나흐', '이스할겐'
]

export default function MainCharacterModal({ isOpen, onClose }: MainCharacterModalProps) {
    const [race, setRace] = useState<'elyos' | 'asmodian'>('elyos')
    const [server, setServer] = useState('')
    const [name, setName] = useState('')
    const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [results, setResults] = useState<CharacterSearchResult[]>([])
    const [showResults, setShowResults] = useState(false)

    const modalRef = useRef<HTMLDivElement>(null)
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const servers = race === 'elyos' ? ELYOS_SERVERS : ASMODIAN_SERVERS

    // 모달 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, onClose])

    // ESC 키로 닫기
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEsc)
        }

        return () => {
            document.removeEventListener('keydown', handleEsc)
        }
    }, [isOpen, onClose])

    // 종족 변경 시 서버 초기화
    useEffect(() => {
        setServer('')
    }, [race])

    // 검색
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        if (name.trim().length < 2) {
            setResults([])
            setShowResults(false)
            return
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true)
            try {
                const serverId = server ? SERVER_NAME_TO_ID[server] : undefined
                const raceId = race === 'elyos' ? 1 : 2

                // 로컬 DB 검색
                const localResults = await supabaseApi.searchLocalCharacter(name.trim())

                // 라이브 API 검색
                const liveResults = await supabaseApi.searchCharacter(name.trim(), serverId, race, 1)

                // 병합 및 중복 제거
                const allResults = [...localResults]
                const existingIds = new Set(localResults.map(r => r.characterId))

                for (const result of liveResults) {
                    if (!existingIds.has(result.characterId)) {
                        allResults.push(result)
                    }
                }

                // noa_score 기준 정렬
                allResults.sort((a, b) => (b.noa_score ?? 0) - (a.noa_score ?? 0))

                setResults(allResults.slice(0, 10))
                setShowResults(true)
            } catch (e) {
                console.error('Search failed', e)
            } finally {
                setIsSearching(false)
            }
        }, 300)

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [name, server, race])

    // 캐릭터 선택
    const handleSelect = async (char: CharacterSearchResult) => {
        // noa_score 가져오기
        let hitScore = char.noa_score
        let itemLevel = char.item_level

        if (!hitScore && char.characterId) {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/characters?character_id=eq.${encodeURIComponent(char.characterId)}&select=noa_score,item_level`,
                    {
                        headers: {
                            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                            'Content-Type': 'application/json'
                        }
                    }
                )
                if (res.ok) {
                    const dbData = await res.json()
                    if (dbData && dbData.length > 0) {
                        hitScore = dbData[0].noa_score
                        if (!itemLevel) itemLevel = dbData[0].item_level
                    }
                }
            } catch (e) {
                console.error('Failed to fetch hit_score', e)
            }
        }

        const mainChar: MainCharacter = {
            characterId: char.characterId,
            name: char.name.replace(/<\/?[^>]+(>|$)/g, ''),
            server: char.server,
            server_id: char.server_id,
            race: char.race,
            className: char.job || char.className,
            level: char.level,
            hit_score: hitScore,
            item_level: itemLevel,
            imageUrl: char.imageUrl || char.profileImage,
            setAt: Date.now()
        }

        try {
            localStorage.setItem(MAIN_CHARACTER_KEY, JSON.stringify(mainChar))
            window.dispatchEvent(new Event('mainCharacterChanged'))
            onClose()
        } catch (e) {
            console.error('Failed to set main character', e)
            alert('대표 캐릭터 설정에 실패했습니다.')
        }
    }

    if (!isOpen) return null

    return (
        <div
            ref={modalRef}
            style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '300px',
                background: 'var(--bg-secondary, #1f2937)',
                borderRadius: '12px',
                padding: '1rem',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                border: '1px solid var(--border, #374151)',
                zIndex: 99999
            }}
        >
            {/* 말풍선 화살표 */}
            <div style={{
                position: 'absolute',
                top: '-8px',
                right: '24px',
                width: '14px',
                height: '14px',
                background: 'var(--bg-secondary, #1f2937)',
                border: '1px solid var(--border, #374151)',
                borderRight: 'none',
                borderBottom: 'none',
                transform: 'rotate(45deg)'
            }} />
                {/* 헤더 */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem'
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: '#FACC15'
                    }}>
                        대표 캐릭터 설정
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            color: 'var(--text-secondary)'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 종족 선택 */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.5rem',
                        display: 'block'
                    }}>
                        종족
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setRace('elyos')}
                            style={{
                                flex: 1,
                                padding: '0.6rem',
                                borderRadius: '8px',
                                border: race === 'elyos' ? '2px solid #FACC15' : '1px solid var(--border)',
                                background: race === 'elyos' ? 'rgba(250, 204, 21, 0.1)' : 'var(--bg-hover)',
                                color: race === 'elyos' ? '#FACC15' : 'var(--text-main)',
                                fontWeight: race === 'elyos' ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            천족
                        </button>
                        <button
                            onClick={() => setRace('asmodian')}
                            style={{
                                flex: 1,
                                padding: '0.6rem',
                                borderRadius: '8px',
                                border: race === 'asmodian' ? '2px solid #FACC15' : '1px solid var(--border)',
                                background: race === 'asmodian' ? 'rgba(250, 204, 21, 0.1)' : 'var(--bg-hover)',
                                color: race === 'asmodian' ? '#FACC15' : 'var(--text-main)',
                                fontWeight: race === 'asmodian' ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            마족
                        </button>
                    </div>
                </div>

                {/* 서버 선택 */}
                <div style={{ marginBottom: '1rem', position: 'relative' }}>
                    <label style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.5rem',
                        display: 'block'
                    }}>
                        서버 (선택사항)
                    </label>
                    <button
                        onClick={() => setIsServerDropdownOpen(!isServerDropdownOpen)}
                        style={{
                            width: '100%',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-hover)',
                            color: server ? 'var(--text-main)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.9rem'
                        }}
                    >
                        {server || '전체 서버'}
                        <ChevronDown size={16} style={{
                            transform: isServerDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 0.2s'
                        }} />
                    </button>

                    {isServerDropdownOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            marginTop: '4px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 10
                        }}>
                            <div
                                onClick={() => {
                                    setServer('')
                                    setIsServerDropdownOpen(false)
                                }}
                                style={{
                                    padding: '0.6rem 0.75rem',
                                    cursor: 'pointer',
                                    background: !server ? 'rgba(250, 204, 21, 0.1)' : 'transparent',
                                    color: !server ? '#FACC15' : 'var(--text-main)',
                                    fontSize: '0.85rem'
                                }}
                            >
                                전체 서버
                            </div>
                            {servers.map(s => (
                                <div
                                    key={s}
                                    onClick={() => {
                                        setServer(s)
                                        setIsServerDropdownOpen(false)
                                    }}
                                    style={{
                                        padding: '0.6rem 0.75rem',
                                        cursor: 'pointer',
                                        background: server === s ? 'rgba(250, 204, 21, 0.1)' : 'transparent',
                                        color: server === s ? '#FACC15' : 'var(--text-main)',
                                        fontSize: '0.85rem'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (server !== s) e.currentTarget.style.background = 'var(--bg-hover)'
                                    }}
                                    onMouseLeave={(e) => {
                                        if (server !== s) e.currentTarget.style.background = 'transparent'
                                    }}
                                >
                                    {s}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 캐릭터명 입력 */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.5rem',
                        display: 'block'
                    }}>
                        캐릭터명
                    </label>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--bg-hover)',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        padding: '0 0.75rem'
                    }}>
                        <Search size={16} style={{ color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="캐릭터명을 입력하세요"
                            style={{
                                flex: 1,
                                padding: '0.6rem 0.5rem',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-main)',
                                fontSize: '0.9rem',
                                outline: 'none'
                            }}
                        />
                        {isSearching && (
                            <div style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid var(--text-secondary)',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                        )}
                    </div>
                </div>

                {/* 검색 결과 */}
                {showResults && results.length > 0 && (
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        background: 'var(--bg-main)'
                    }}>
                        {results.map((char) => (
                            <div
                                key={char.characterId}
                                onClick={() => handleSelect(char)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--border)',
                                    transition: 'background 0.15s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                {/* 프로필 이미지 */}
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    background: '#374151',
                                    flexShrink: 0
                                }}>
                                    {char.imageUrl ? (
                                        <img
                                            src={char.imageUrl}
                                            alt={char.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.8rem',
                                            color: '#9ca3af'
                                        }}>
                                            {char.name.replace(/<\/?[^>]+(>|$)/g, '').charAt(0)}
                                        </div>
                                    )}
                                </div>

                                {/* 캐릭터 정보 */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: 'var(--text-main)',
                                        marginBottom: '2px'
                                    }}
                                        dangerouslySetInnerHTML={{ __html: char.name }}
                                    />
                                    <div style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        {char.server} · {char.job || char.className} · Lv.{char.level}
                                        {char.item_level ? ` · IL ${char.item_level}` : ''}
                                    </div>
                                </div>

                                {/* 전투력 */}
                                {char.noa_score && char.noa_score > 0 && (
                                    <div style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        color: 'var(--brand-red-main, #D92B4B)'
                                    }}>
                                        {char.noa_score.toLocaleString()}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* 검색 결과 없음 */}
                {showResults && results.length === 0 && name.trim().length >= 2 && !isSearching && (
                    <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem'
                    }}>
                        검색 결과가 없습니다
                    </div>
                )}

                {/* 안내 문구 */}
                {!showResults && (
                    <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem'
                    }}>
                        캐릭터명을 2글자 이상 입력하세요
                    </div>
                )}

                <style jsx>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    )
}
