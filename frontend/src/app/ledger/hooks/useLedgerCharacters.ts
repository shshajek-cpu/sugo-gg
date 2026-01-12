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
    if (!isReady) return null

    try {
      const res = await fetch('/api/ledger/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(character)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to add character')
      }

      const newCharacter = await res.json()
      setCharacters(prev => [...prev, newCharacter])
      return newCharacter
    } catch (e: any) {
      setError(e.message)
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
