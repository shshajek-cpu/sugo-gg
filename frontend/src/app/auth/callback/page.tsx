'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

const DEVICE_ID_KEY = 'ledger_device_id'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPopup = searchParams.get('popup') === 'true'
  const [status, setStatus] = useState('로그인 처리 중...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session from URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) throw sessionError
        if (!session) {
          throw new Error('세션을 찾을 수 없습니다')
        }

        setStatus('로그인 성공! 기존 데이터 확인 중...')

        // Check for existing device_id to migrate
        const deviceId = localStorage.getItem(DEVICE_ID_KEY)

        if (deviceId) {
          setStatus('기존 데이터를 계정에 연결 중...')

          // Call migration API
          const res = await fetch('/api/auth/migrate-device', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ device_id: deviceId })
          })

          if (res.ok) {
            const data = await res.json()
            if (data.migrated) {
              // Clear device_id after successful migration
              localStorage.removeItem(DEVICE_ID_KEY)
              setStatus('데이터 연결 완료!')
            } else {
              setStatus('로그인 완료!')
            }
          } else {
            console.warn('Migration warning:', await res.text())
            setStatus('로그인 완료!')
          }
        } else {
          setStatus('로그인 완료!')
        }

        // 팝업 모드인 경우 창 닫기
        if (isPopup) {
          setStatus('로그인 완료! 창을 닫습니다...')
          setTimeout(() => {
            window.close()
          }, 500)
          return
        }

        // 일반 모드인 경우 리다이렉트
        setTimeout(() => router.push('/ledger'), 1000)

      } catch (err: any) {
        console.error('Auth callback error:', err)
        setError(err.message)
      }
    }

    handleCallback()
  }, [router, isPopup])

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B0D12'
      }}>
        <div style={{
          padding: '32px',
          background: '#1b1b1e',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            ❌
          </div>
          <h2 style={{
            color: '#ef4444',
            fontSize: '20px',
            marginBottom: '8px'
          }}>
            로그인 실패
          </h2>
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={() => isPopup ? window.close() : router.push('/')}
            style={{
              padding: '10px 24px',
              background: '#FACC15',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {isPopup ? '창 닫기' : '홈으로 이동'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0B0D12'
    }}>
      <div style={{
        padding: '32px',
        background: '#1b1b1e',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #2d2d30',
          borderTopColor: '#FACC15',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: '#fff', fontSize: '16px' }}>{status}</p>
      </div>
    </div>
  )
}
