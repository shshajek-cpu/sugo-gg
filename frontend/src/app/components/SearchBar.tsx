'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronDown, Check } from 'lucide-react'
import SearchAutocomplete from './SearchAutocomplete'
import { supabaseApi, CharacterSearchResult, SERVER_NAME_TO_ID } from '../../lib/supabaseApi'
import { useSyncContext } from '../../context/SyncContext'

// Define servers
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

export default function SearchBar() {
    const router = useRouter()
    const { enqueueSync } = useSyncContext()

    // Search State
    const [race, setRace] = useState<'elyos' | 'asmodian'>('elyos')
    const [server, setServer] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // UI State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    // Autocomplete State
    const [showResults, setShowResults] = useState(false)
    const [results, setResults] = useState<CharacterSearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)

    const wrapperRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const suppressResultsRef = useRef(false)

    // Debounce Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (suppressResultsRef.current) {
                setResults([])
                setShowResults(false)
                return
            }
            if (name.trim().length >= 1) {
                performHybridSearch(name)
            } else {
                setResults([])
                setShowResults(false)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [name, race, server])

    // Outside Click Handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false)
                // Don't close server dropdown here if user clicked inside it
            }
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Dynamic Server List based on Race
    const currentServerList = race === 'elyos' ? ELYOS_SERVERS : ASMODIAN_SERVERS

    const effectiveRace = server ? race : undefined

    // Auto-select first server logic (Optional: Can keep empty to force selection)
    // Removed auto-select to let user choose explicitly or default to empty

    const performHybridSearch = async (searchTerm: string) => {
        setIsSearching(true)
        setShowResults(true)
        setResults([])

        const serverId = server ? SERVER_NAME_TO_ID[server] : undefined
        const raceFilter = effectiveRace

        const normalizeName = (value: string) => value.replace(/<\/?[^>]+(>|$)/g, '').trim().toLowerCase()
        const buildKey = (value: CharacterSearchResult) => {
            if (value.characterId) return `id:${value.characterId}`
            const serverKey = value.server_id ?? value.server
            return `sv:${serverKey}|name:${normalizeName(value.name)}`
        }

        const updateResults = (newResults: CharacterSearchResult[]) => {
            setResults(prev => {
                const combined = [...prev]
                const seen = new Set(prev.map(p => buildKey(p)))

                const filtered = newResults.filter(r => {
                    if (serverId && r.server_id !== serverId) return false
                    if (raceFilter) {
                        const rRace = r.race.toLowerCase()
                        const selectedRace = raceFilter.toLowerCase()
                        const isElyos = rRace === 'elyos' || rRace === '천족'
                        const isAsmodian = rRace === 'asmodian' || rRace === '마족'
                        if (selectedRace === 'elyos' && !isElyos) return false
                        if (selectedRace === 'asmodian' && !isAsmodian) return false
                    }
                    return true
                })

                // Use Global Context to sync
                enqueueSync(filtered)

                filtered.forEach(r => {
                    const key = buildKey(r)
                    if (!seen.has(key)) {
                        combined.push(r)
                        seen.add(key)
                    }
                })
                return combined
            })
        }

        supabaseApi.searchLocalCharacter(searchTerm, serverId, raceFilter)
            .then(res => updateResults(res))
            .catch(e => console.error("Local search err", e))

        supabaseApi.searchCharacter(searchTerm, serverId, raceFilter, 1)
            .then(res => {
                updateResults(res)
            })
            .catch(e => console.error("Live search err", e))
            .finally(() => setIsSearching(false))
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        suppressResultsRef.current = true
        setResults([])
        setShowResults(false)
        setIsDropdownOpen(false)
        if (!name.trim()) {
            setError('캐릭터명을 입력해주세요')
            return
        }

        // If server is selected, proceed as usual
        if (server) {
            setError('')
            setLoading(true)
            const query = race ? `?race=${race}` : ''
            setShowResults(false)
            router.push(`/c/${server}/${name}${query}`)
            setLoading(false)
            return
        }

        // If no server is selected (All Servers search)

        // 1. Check if we have results from the autocomplete
        if (results.length > 0) {
            const exactMatch = results.find(r => r.name === name) || results[0]
            setLoading(true)
            handleResultSelect(exactMatch)
            return
        }

        // 2. No results locally yet? Perform explicit global search
        setLoading(true)
        setError('')

        try {
            // Search globally (server=undefined)
            const searchResults = await supabaseApi.searchCharacter(name, undefined, effectiveRace, 1)

            if (searchResults && searchResults.length > 0) {
                if (searchResults.length === 1) {
                    // Single match -> Auto Navigate
                    handleResultSelect(searchResults[0])
                } else {
                    // Multiple matches -> Show results for user selection
                    setResults(searchResults)
                    setShowResults(true)
                    setLoading(false)
                    // Sync just in case
                    enqueueSync(searchResults)
                }
            } else {
                setError('검색 결과가 없습니다.')
                setLoading(false)
            }
        } catch (e) {
            console.error("Global search error", e)
            setError('검색 중 오류가 발생했습니다.')
            setLoading(false)
        }
    }

    const handleResultSelect = (char: CharacterSearchResult) => {
        suppressResultsRef.current = true
        setResults([])
        setShowResults(false)
        setIsDropdownOpen(false)

        // Use global queue for syncing the selected character too
        enqueueSync([char])

        setServer(char.server)
        let raceVal: 'elyos' | 'asmodian' = race
        if (char.race === 'Elyos' || char.race === '천족') raceVal = 'elyos'
        if (char.race === 'Asmodian' || char.race === '마족') raceVal = 'asmodian'
        setRace(raceVal)
        setName(char.name)

        const query = raceVal ? `?race=${raceVal}` : ''
        setShowResults(false)
        router.push(`/c/${char.server}/${char.name}${query}`)
    }

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen)

    const selectRace = (selectedRace: 'elyos' | 'asmodian') => {
        setRace(selectedRace)
        // Reset server if it doesn't exist in the new race list
        const newServerList = selectedRace === 'elyos' ? ELYOS_SERVERS : ASMODIAN_SERVERS
        if (server && !newServerList.includes(server)) {
            setServer('')
        }
    }

    const selectServer = (selectedServer: string) => {
        setServer(selectedServer)
        setIsDropdownOpen(false)
        setError('')
    }

    // Determine Trigger Button Class - styling now handled inline
    const triggerClass = ''

    // Display Text
    const triggerText = server
        ? `${race === 'elyos' ? '천족' : '마족'} | ${server}`
        : '전체 서버'

    return (
        <div
            style={{ width: '100%', maxWidth: '800px', margin: '0 auto', position: 'relative' }}
        >
            <form
                onSubmit={handleSearch}
                style={{
                    position: 'relative',
                    zIndex: isDropdownOpen ? 50 : 1
                }}
            >
                {/* Gradient Border Container (From DSSearchBar) */}
                <div
                    style={{
                        padding: '2px',
                        borderRadius: '50px',
                        background: (name.length > 0) // Simplified focus check
                            ? 'linear-gradient(90deg, var(--brand-red-main), #F59E0B, var(--brand-red-main))'
                            : 'var(--border)',
                        backgroundSize: '200% 100%',
                        transition: 'all 0.3s ease',
                        animation: (name.length > 0) ? 'gradientMove 3s linear infinite' : 'none'
                    }}
                >
                    {/* Inner Input Container */}
                    <div style={{
                        background: '#0B0D12',
                        borderRadius: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.2rem',
                        position: 'relative',
                        height: '50px'
                    }}>

                        {/* Server Select Button */}
                        <div style={{ position: 'relative' }} ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={toggleDropdown}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-main)',
                                    padding: '0 1rem 0 1.5rem',
                                    height: '100%',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {triggerText}
                                <ChevronDown size={14} style={{ opacity: 0.7, transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>

                            {/* Dropdown Menu (Existing Logic Adapted) */}
                            {isDropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '120%',
                                    left: '0.5rem',
                                    minWidth: '180px',
                                    background: '#1F2937',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: '8px',
                                    padding: '0.5rem',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                    zIndex: 100
                                }}>
                                    {/* Race Toggle Actions */}
                                    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={() => selectRace('elyos')}
                                            style={{
                                                flex: 1,
                                                padding: '6px',
                                                fontSize: '0.75rem',
                                                borderRadius: '4px',
                                                border: race === 'elyos' ? '1px solid #10B981' : '1px solid var(--border)',
                                                color: race === 'elyos' ? '#10B981' : 'var(--text-secondary)',
                                                background: race === 'elyos' ? 'rgba(16,185,129,0.1)' : 'transparent',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            천족
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => selectRace('asmodian')}
                                            style={{
                                                flex: 1,
                                                padding: '6px',
                                                fontSize: '0.75rem',
                                                borderRadius: '4px',
                                                border: race === 'asmodian' ? '1px solid #EF4444' : '1px solid var(--border)',
                                                color: race === 'asmodian' ? '#EF4444' : 'var(--text-secondary)',
                                                background: race === 'asmodian' ? 'rgba(239,68,68,0.1)' : 'transparent',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            마족
                                        </button>
                                    </div>

                                    {/* Server List */}
                                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {currentServerList.map(srv => (
                                            <button
                                                key={srv}
                                                type="button"
                                                onClick={() => selectServer(srv)}
                                                style={{
                                                    padding: '6px 10px',
                                                    textAlign: 'left',
                                                    background: server === srv ? 'rgba(255,255,255,0.05)' : 'transparent',
                                                    color: server === srv ? 'white' : 'var(--text-secondary)',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    borderRadius: '4px',
                                                    fontSize: '0.85rem'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                onMouseLeave={(e) => { if (server !== srv) e.currentTarget.style.background = 'transparent' }}
                                            >
                                                {srv}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 0.5rem' }}></div>

                        {/* Input Field */}
                        <input
                            type="text"
                            placeholder="캐릭터명을 입력하세요"
                            value={name}
                            onChange={(e) => {
                                suppressResultsRef.current = false
                                setName(e.target.value)
                            }}
                            onFocus={() => {
                                if (!suppressResultsRef.current && name.length >= 1) setShowResults(true)
                            }}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-main)',
                                fontSize: '1rem',
                                outline: 'none',
                                padding: '0 0.5rem'
                            }}
                        />

                        {/* Search Button (Icon Only) */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                background: 'var(--brand-red-main)',
                                border: 'none',
                                borderRadius: '50%',
                                color: 'white',
                                width: '42px',
                                height: '42px',
                                margin: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'transform 0.1s, background 0.2s',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--brand-red-dark)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--brand-red-main)'}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Search size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Global Styles for Gradient Animation */}
                <style jsx global>{`
                    @keyframes gradientMove {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                `}</style>
            </form>

            {/* Error Message */}
            {error && (
                <div style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '0',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    backdropFilter: 'blur(4px)'
                }}>
                    {error}
                </div>
            )}

            {/* Integrated Dropdown Panel is now above inside the input container */}

            {/* Autocomplete Dropdown */}
            <SearchAutocomplete
                results={results}
                isVisible={showResults}
                isLoading={isSearching}
                onSelect={handleResultSelect}
            />
        </div>
    )
}
