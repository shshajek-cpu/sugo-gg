'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SearchBar from './components/SearchBar'
import AdminResetButton from './components/AdminResetButton'
import { SyncProvider } from '../context/SyncContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isAdminPage = pathname?.startsWith('/admin')

    // Admin 페이지는 완전히 독립된 레이아웃 사용
    if (isAdminPage) {
        return (
            <html lang="ko">
                <body style={{ margin: 0, padding: 0 }}>
                    {children}
                </body>
            </html>
        )
    }

    // 일반 페이지 레이아웃
    return (
        <html lang="ko">
            <body>
                <SyncProvider>
                    <header style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                        background: 'rgba(12, 12, 13, 0.95)',
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
                                <img src="/logo.png" alt="HitOn" style={{ height: '28px', width: 'auto' }} />
                            </Link>

                            <nav className="nav" style={{ marginBottom: 0 }}>
                                <Link href="/">홈</Link>
                                <Link href="/ranking">랭킹</Link>
                            </nav>
                        </div>
                    </header>

                    <div style={{
                        position: 'relative',
                        zIndex: 50,
                        background: 'var(--bg-main)',
                        paddingTop: '0',
                        paddingBottom: '3rem',
                        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(217, 43, 75, 0.08) 0%, transparent 50%)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{
                            maxWidth: '800px',
                            margin: '0 auto',
                            padding: '0 2rem'
                        }}>
                            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                                <h1 style={{
                                    fontSize: '2.5rem',
                                    fontWeight: '800',
                                    marginBottom: '0.5rem',
                                    color: 'white',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <img
                                        src="/logo.png"
                                        alt="HitOn"
                                        style={{
                                            height: '260px',
                                            width: 'auto',
                                            marginBottom: '0.5rem',
                                            display: 'inline-block'
                                        }}
                                    />
                                </h1>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                                    힛온 - 실시간 캐릭터 정보를 빠르게 검색하세요.
                                </p>
                            </div>

                            <SearchBar />
                        </div>
                    </div>

                    <div className="container">
                        {children}
                    </div>
                    <AdminResetButton />
                </SyncProvider>
            </body>
        </html>
    )
}
