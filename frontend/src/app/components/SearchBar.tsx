'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronDown, Check } from 'lucide-react'
import SearchAutocomplete from './SearchAutocomplete'
import { supabaseApi, CharacterSearchResult, SERVER_NAME_TO_ID } from '../../lib/supabaseApi'
import styles from './ranking/Ranking.module.css'

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

    const pendingSyncRef = useRef<Map<string, CharacterSearchResult>>(new Map())

    const normalizeNameForKey = (value: string) => value.replace(/<\/?[^>]+(>|$)/g, '').trim().toLowerCase()
    const buildSyncKey = (value: CharacterSearchResult) => {
        if (value.characterId) return `id:${value.characterId}`
        const serverKey = value.server_id ?? value.server
        return `sv:${serverKey}|name:${normalizeNameForKey(value.name)}`
    }

    const enqueueSync = (items: CharacterSearchResult[]) => {
        items.forEach(item => {
            pendingSyncRef.current.set(buildSyncKey(item), item)
        })
    }

    const flushPendingSync = () => {
        const pending = Array.from(pendingSyncRef.current.values())
        if (pending.length === 0) return
        pendingSyncRef.current.clear()
        supabaseApi.syncCharacters(pending)
    }

    useEffect(() => {
        const intervalId = setInterval(() => {
            flushPendingSync()
        }, 10000)

        return () => {
            clearInterval(intervalId)
            flushPendingSync()
        }
    }, [])

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
            flushPendingSync()
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
        flushPendingSync()
        supabaseApi.syncCharacters([char])
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

    // Determine Trigger Button Class
    const triggerClass = `${styles.serverTriggerBtn} ${server ? (race === 'elyos' ? styles.elyos : styles.asmodian) : ''}`
    
    // Display Text
    const triggerText = server 
        ? `${race === 'elyos' ? '천족' : '마족'} | ${server}`
        : '전체 서버'

    return (
        <div className={styles.searchContainer} ref={wrapperRef}>
            <form onSubmit={handleSearch} className={styles.searchBarGlass}>
                {/* Integrated Selector Trigger */}
                <button 
                    type="button" 
                    className={triggerClass}
                    onClick={toggleDropdown}
                >
                    {triggerText}
                    <ChevronDown size={16} style={{ opacity: 0.7 }} />
                </button>

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
                    className={styles.searchInputField}
                />

                {/* Search Action Button */}
                <button type="submit" disabled={loading} className={styles.searchActionBtn}>
                    <Search size={20} strokeWidth={2.5} />
                </button>
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

            {/* Integrated Dropdown Panel */}
            {isDropdownOpen && (
                <div className={styles.dropdownPanel} ref={dropdownRef}>
                    {/* Race Toggles */}
                    <div className={styles.raceToggleGroup}>
                        <button
                            type="button"
                            className={`${styles.raceBtn} ${race === 'elyos' ? styles.activeElyos : ''}`}
                            onClick={() => selectRace('elyos')}
                        >
                            천족 (Elyos)
                        </button>
                        <button
                            type="button"
                            className={`${styles.raceBtn} ${race === 'asmodian' ? styles.activeAsmodian : ''}`}
                            onClick={() => selectRace('asmodian')}
                        >
                            마족 (Asmodian)
                        </button>
                    </div>

                    {/* Server Grid */}
                    <div className={styles.serverGrid}>
                        {currentServerList.map(srv => (
                            <div
                                key={srv}
                                className={`${styles.serverItem} ${server === srv ? styles.selected : ''}`}
                                onClick={() => selectServer(srv)}
                            >
                                {srv}
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
