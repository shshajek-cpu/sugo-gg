'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'

const DEVICE_ID_KEY = 'ledger_device_id'

// device_id 가져오기 (없으면 생성)
function getOrCreateDeviceId(): string | null {
  if (typeof window === 'undefined') return null

  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
    console.log('[getOrCreateDeviceId] 새 device_id 생성:', deviceId.substring(0, 8) + '...')
  }
  return deviceId
}

// Standalone function to get auth headers (for use outside of React components)
export function getAuthHeader(): Record<string, string> {
  const deviceId = getOrCreateDeviceId()
  if (deviceId) {
    return { 'X-Device-ID': deviceId }
  }
  return {}
}

export function useDeviceId() {
  const { user, session, isLoading: isAuthLoading } = useAuth()
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (isAuthLoading) return

    const initUser = async () => {
      // 항상 device_id 사용 (Google 로그인 여부와 관계없이)
      // ledger API는 mnbngmdjiszyowfvnzhk 프로젝트를 사용하므로
      // 다른 Supabase 프로젝트의 Google 토큰은 작동하지 않음
      let id = localStorage.getItem(DEVICE_ID_KEY)

      if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem(DEVICE_ID_KEY, id)
        console.log('[useDeviceId] 새 device_id 생성:', id)
      }

      setDeviceId(id)
      setIsAuthenticated(false) // ledger에서는 항상 device_id 사용
      setIsLoading(false)

      console.log('[useDeviceId] device_id 초기화 완료:', id.substring(0, 8) + '...')

      // Initialize device user (비동기로 실행, 실패해도 계속 진행)
      fetch('/api/ledger/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: id })
      }).catch(e => {
        console.warn('[useDeviceId] Init API warning (무시해도 됨):', e)
      })
    }

    initUser()
  }, [isAuthLoading])

  // Return auth headers for requests
  // 주의: Google 로그인은 다른 Supabase 프로젝트(edwtbiujwjprydmahwhh)를 사용하므로
  // ledger API(mnbngmdjiszyowfvnzhk)에서는 항상 device_id를 사용
  const getAuthHeaderCallback = useCallback((): Record<string, string> => {
    // 항상 device_id 사용 (없으면 생성)
    const id = getOrCreateDeviceId()
    if (id) {
      return { 'X-Device-ID': id }
    }
    return {}
  }, [])

  return {
    deviceId,
    isLoading,
    isAuthenticated,
    getAuthHeader: getAuthHeaderCallback,
    accessToken: session?.access_token
  }
}
