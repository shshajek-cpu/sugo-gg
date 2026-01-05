import { useState, useEffect, useCallback } from 'react'

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/api$/, '')

export interface CharacterProfile {
    id: number
    name: string
    server: string
    class: string
    level: number
    race?: string
    legion?: string
    character_image_url?: string
}

export interface CharacterPower {
    combat_score: number
    item_level: number
    tier_rank: string
    percentile: number
}

export interface FullCharacterData {
    profile: CharacterProfile
    power: CharacterPower
    stats: {
        primary: any
        detailed: any
    }
    equipment: any[]
    titles: any[]
    ranking: any[]
    pet_wings: any[]
    skills: any[]
    stigma: any[]
    devanion: any
    arcana: any[]
    warning?: string
}

export interface UseCharacterDataResult {
    data: FullCharacterData | null
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
}

/**
 * 캐릭터 데이터를 가져오는 커스텀 훅
 * @param server - 서버 이름
 * @param name - 캐릭터 이름
 * @returns 캐릭터 데이터, 로딩 상태, 에러 정보, 재조회 함수
 */
export function useCharacterData(server: string, name: string): UseCharacterDataResult {
    const [data, setData] = useState<FullCharacterData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCharacterData = useCallback(async (forceRefresh = false) => {
        if (!server || !name) return

        setLoading(true)
        setError(null)

        const abortController = new AbortController()

        try {
            // Step 1: Search to get ID
            const searchUrl = `${API_BASE_URL}/api/characters/search?server=${server}&name=${encodeURIComponent(name)}${forceRefresh ? '&refresh_force=true' : ''}`
            const searchRes = await fetch(searchUrl, { signal: abortController.signal })

            if (!searchRes.ok) {
                if (searchRes.status === 404) {
                    throw new Error('캐릭터를 찾을 수 없습니다. 서버와 이름을 확인해주세요.')
                } else if (searchRes.status === 500) {
                    throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
                }
                throw new Error(`캐릭터를 찾을 수 없습니다. (Status: ${searchRes.status})`)
            }

            const searchData = await searchRes.json()

            // Step 2: Fetch Full Details using ID
            const fullRes = await fetch(`${API_BASE_URL}/api/characters/${searchData.id}/full`, {
                signal: abortController.signal
            })

            if (!fullRes.ok) {
                if (fullRes.status === 404) {
                    throw new Error('캐릭터 상세 정보를 찾을 수 없습니다.')
                } else if (fullRes.status === 500) {
                    throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
                }
                throw new Error(`상세 정보를 불러올 수 없습니다. (Status: ${fullRes.status})`)
            }

            const fullData = await fullRes.json()

            if (process.env.NODE_ENV === 'development') {
                console.log('[useCharacterData] Full data loaded:', fullData)
            }

            setData(fullData)
            setError(null)
        } catch (err: any) {
            if (err.name === 'AbortError') {
                // Fetch was aborted, don't set error
                return
            }

            if (err instanceof TypeError) {
                setError('네트워크 연결을 확인해주세요.')
            } else {
                setError(err.message || '정보를 불러오는 중 오류가 발생했습니다.')
            }
        } finally {
            setLoading(false)
        }

        // Cleanup function
        return () => {
            abortController.abort()
        }
    }, [server, name])

    const refetch = useCallback(async () => {
        const confirmRefresh = window.confirm('최신 데이터를 강제로 불러오시겠습니까? 시간이 소요될 수 있습니다.')
        if (!confirmRefresh) return

        await fetchCharacterData(true)
    }, [fetchCharacterData])

    useEffect(() => {
        fetchCharacterData()
    }, [fetchCharacterData])

    return {
        data,
        loading,
        error,
        refetch
    }
}
