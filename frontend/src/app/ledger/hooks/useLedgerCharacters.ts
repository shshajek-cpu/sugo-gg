'use client'

import { useState, useEffect, useCallback } from 'react'
import { LedgerCharacter, CreateCharacterRequest } from '@/types/ledger'

interface UseLedgerCharactersProps {
  getAuthHeader: () => Record<string, string>
  isReady: boolean
}

export function useLedgerCharacters({ getAuthHeader, isReady }: UseLedgerCharactersProps) {
  const [characters, setCharacters] = useState<LedgerCharacter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCharacters = useCallback(async () => {
    if (!isReady) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/ledger/characters', {
        headers: getAuthHeader()
      })

      if (!res.ok) {
        throw new Error('Failed to fetch characters')
      }

      const data = await res.json()
      setCharacters(data)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [isReady, getAuthHeader])

  useEffect(() => {
    fetchCharacters()
  }, [fetchCharacters])

  const addCharacter = async (character: CreateCharacterRequest) => {
    // isReady가 false여도 시도 (로딩 중일 수 있음)
    const headers = getAuthHeader()

    console.log('[useLedgerCharacters] addCharacter 시작:', {
      character,
      headers: Object.keys(headers),
      isReady
    })

    // 인증 헤더가 없으면 에러
    if (Object.keys(headers).length === 0) {
      console.error('[useLedgerCharacters] No auth headers available')
      setError('인증 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return null
    }

    try {
      const res = await fetch('/api/ledger/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(character)
      })

      console.log('[useLedgerCharacters] API 응답:', res.status, res.statusText)

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}: ${res.statusText}`
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // JSON 파싱 실패 무시
        }
        throw new Error(errorMessage)
      }

      const newCharacter = await res.json()
      console.log('[useLedgerCharacters] 캐릭터 추가 성공:', newCharacter)
      setCharacters(prev => [...prev, newCharacter])
      return newCharacter
    } catch (e: any) {
      const errorMsg = e?.message || String(e) || '캐릭터 추가에 실패했습니다'
      console.error('[useLedgerCharacters] addCharacter error:', errorMsg, e)
      setError(errorMsg)
      return null
    }
  }

  const removeCharacter = async (id: string) => {
    if (!isReady) return false

    try {
      const res = await fetch(`/api/ledger/characters/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })

      if (!res.ok) {
        throw new Error('Failed to delete character')
      }

      setCharacters(prev => prev.filter(c => c.id !== id))
      return true
    } catch (e: any) {
      setError(e.message)
      return false
    }
  }

  return {
    characters,
    isLoading,
    error,
    addCharacter,
    removeCharacter,
    refetch: fetchCharacters
  }
}
