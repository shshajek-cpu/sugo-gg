'use client'

import { Suspense } from 'react'
import AuthCallbackContent from './AuthCallbackContent'

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <AuthCallbackContent />
    </Suspense>
  )
}

function LoadingUI() {
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0B0D12'
  }

  return (
    <div style={overlayStyle}>
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
          borderTopColor: '#f59e0b',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: '#fff', fontSize: '16px' }}>로그인 처리 중...</p>
      </div>
    </div>
  )
}
