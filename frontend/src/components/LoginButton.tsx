'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { LogIn, LogOut, User } from 'lucide-react'

export default function LoginButton() {
  const { user, isLoading, signInWithGoogle, signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  if (isLoading) {
    return (
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: '#1f2937'
      }} />
    )
  }

  // Not logged in - show login button
  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: 'transparent',
          border: '1px solid rgba(250, 204, 21, 0.4)',
          borderRadius: '20px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          color: 'rgba(250, 204, 21, 0.8)',
          fontSize: '13px',
          fontWeight: 500
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(250, 204, 21, 0.1)'
          e.currentTarget.style.borderColor = '#FACC15'
          e.currentTarget.style.color = '#FACC15'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = 'rgba(250, 204, 21, 0.4)'
          e.currentTarget.style.color = 'rgba(250, 204, 21, 0.8)'
        }}
      >
        <LogIn size={14} />
        <span>로그인</span>
      </button>
    )
  }

  // Logged in - show user avatar with dropdown
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '20px'
        }}
      >
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="Profile"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '2px solid rgba(250, 204, 21, 0.5)'
            }}
          />
        ) : (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#FACC15',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={16} color="#000" />
          </div>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setShowDropdown(false)}
          />
          {/* Dropdown */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: '#1b1b1e',
            border: '1px solid #2d2d30',
            borderRadius: '8px',
            padding: '8px',
            minWidth: '200px',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
          }}>
            <div style={{
              padding: '8px 12px',
              borderBottom: '1px solid #2d2d30',
              marginBottom: '8px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                {user.user_metadata?.full_name || 'User'}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                {user.email}
              </div>
            </div>
            <button
              onClick={async () => {
                await signOut()
                setShowDropdown(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#ef4444',
                fontSize: '13px',
                borderRadius: '4px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <LogOut size={14} />
              로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  )
}
