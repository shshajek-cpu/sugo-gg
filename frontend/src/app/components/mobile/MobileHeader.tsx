'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabaseApi, CharacterSearchResult } from '../../../lib/supabaseApi'
import SearchAutocomplete from '../SearchAutocomplete'
import styles from './MobileHeader.module.css'

export default function MobileHeader() {
    const router = useRouter()
    const pathname = usePathname()

    // --- State ---
    const [searchValue, setSearchValue] = useState('')
    const [results, setResults] = useState<CharacterSearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [searchWarning, setSearchWarning] = useState<string | undefined>(undefined)

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchValue.trim().length >= 1) {
                performSearch(searchValue)
            } else {
                setResults([])
                setShowResults(false)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [searchValue])

    const performSearch = async (term: string) => {
        setIsSearching(true)
        setShowResults(true)
        setSearchWarning(undefined)

        try {
            const res = await supabaseApi.searchCharacter(term)
            setResults(res.list)
            if (res.warning) setSearchWarning(res.warning)
        } catch (e) {
            console.error("Search failed", e)
        } finally {
            setIsSearching(false)
        }
    }

    const handleSearch = (term: string) => {
        if (!term.trim()) return
        router.push(`/c/all/${encodeURIComponent(term)}`)
        setShowResults(false) // 검색 후 자동완성 닫기
    }

    const handleResultSelect = (char: CharacterSearchResult) => {
        setShowResults(false)
        const raceVal = (char.race === 'Elyos' || char.race === '천족') ? 'elyos' : 'asmodian'
        router.push(`/c/${char.server}/${char.name}?race=${raceVal}`)
    }

    // 현재 활성화된 탭 확인
    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true
        if (path !== '/' && pathname?.startsWith(path)) return true
        return false
    }

    return (
        <div className={styles.headerContainer}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoSu}>SU</span>
                    <span className={styles.logoGo}>GO</span>
                    <span className={styles.logoGg}>.gg</span>
                </Link>
                <div className={styles.searchWrapper}>
                    <div className={styles.searchBar}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-disabled)" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="캐릭터 검색..."
                            className={styles.searchInput}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchValue)}
                            onFocus={() => searchValue.length > 0 && setShowResults(true)}
                        />
                    </div>
                    {showResults && (
                        <div className={styles.autocompleteWrapper}>
                            <SearchAutocomplete
                                results={results}
                                isLoading={isSearching}
                                isVisible={showResults}
                                onSelect={handleResultSelect}
                                warning={searchWarning}
                            />
                        </div>
                    )}
                </div>
            </header>

            {/* 메뉴 탭 */}
            <nav className={styles.menuTabs}>
                <Link href="/" className={`${styles.menuTab} ${isActive('/') ? styles.menuTabActive : ''}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                    <span>홈</span>
                </Link>
                <Link href="/ranking" className={`${styles.menuTab} ${isActive('/ranking') ? styles.menuTabActive : ''}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 20V10M12 20V4M6 20v-6" />
                    </svg>
                    <span>랭킹</span>
                </Link>
                <Link href="/party" className={`${styles.menuTab} ${isActive('/party') ? styles.menuTabActive : ''}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>파티</span>
                </Link>
                <Link href="/ledger/mobile" className={`${styles.menuTab} ${isActive('/ledger/mobile') ? styles.menuTabActive : ''}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    <span>가계부</span>
                </Link>
            </nav>
        </div>
    )
}
