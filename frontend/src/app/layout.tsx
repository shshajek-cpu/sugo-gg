'use client'

import './globals.css'
import Link from 'next/link'
import SearchBar from './components/SearchBar'
import AdminResetButton from './components/AdminResetButton'
import { SyncProvider } from '../context/SyncContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko">
            <body>
                <SyncProvider>
                    <header style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                        background: 'rgba(11, 13, 18, 0.95)',
                        borderBottom: '1px solid var(--border)',
                        backdropFilter: 'blur(10px)',
                        marginBottom: '2rem'
                    }}>
                        <div className="container" style={{
                            height: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0 2rem'
                        }}>
                            <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
                                <img src="/logo.png" alt="HitOn" style={{ height: '32px', width: 'auto' }} />
                            </Link>

                            {/* Main Nav - Only active pages */}
                            <nav className="nav" style={{ marginBottom: 0 }}>
                                <Link href="/">홈</Link>
                                <Link href="/ranking">랭킹</Link>
                            </nav>
                        </div>
                    </header>

                    {/* Search Bar - Appears on ALL pages, STATIC POSITION */}
                    <div style={{
                        position: 'relative',
                        zIndex: 50,
                        background: 'var(--bg-main)',
                        paddingTop: '2rem',
                        paddingBottom: '2rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{
                            maxWidth: '800px',
                            margin: '0 auto',
                            padding: '0 2rem'
                        }}>
                            {/* NOA Title */}
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <h1 style={{
                                    fontSize: '2.5rem',
                                    fontWeight: '800',
                                    marginBottom: '0.5rem',
                                    color: 'white'
                                }}>
                                    <img src="/logo.png" alt="HitOn" style={{ height: '60px', width: 'auto', marginBottom: '0.5rem', display: 'inline-block' }} />
                                </h1>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                                    실시간 캐릭터 정보를 빠르게 검색하세요.
                                </p>
                            </div>

                            {/* Search Bar - Fixed across all pages */}
                            <SearchBar />
                        </div>
                    </div>

                    {/* Page Content */}
                    <div className="container">
                        {children}
                    </div>
                    <AdminResetButton />
                </SyncProvider>
            </body>
        </html>
    )
}
