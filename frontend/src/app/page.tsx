'use client'
import SearchBar from './components/SearchBar'

export default function Home() {
    return (
        <main>
            {/* Hero Section */}
            <section style={{
                textAlign: 'center',
                padding: '4rem 0',
                marginBottom: '2rem'
            }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    marginBottom: '1rem',
                    color: 'white'
                }}>
                    NO<span style={{ color: '#facc15' }}>A</span> - 아이온 2 정보 검색 사이트
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
                    실시간 캐릭터 정보를 빠르게 검색하세요.
                </p>

                <div
                    style={{
                        background: 'rgba(250, 204, 21, 0.1)',
                        border: '1px solid rgba(250, 204, 21, 0.2)',
                        borderRadius: '6px',
                        padding: '1rem',
                        marginBottom: '2rem',
                        maxWidth: '600px',
                        margin: '0 auto 2.5rem auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.8rem',
                        color: 'var(--primary)'
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>📢</span>
                    <span style={{ fontSize: '0.9rem' }}>
                        서버명과 캐릭터명을 입력하여 검색하세요.
                    </span>
                </div>

                {/* Search Bar Component */}
                <SearchBar />
            </section>

            {/* Coming Soon Message */}
            <div style={{
                textAlign: 'center',
                padding: '3rem 0',
                color: 'var(--text-secondary)'
            }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#FACC15' }}>
                    🚧 사이트 복구 중
                </h2>
                <p style={{ marginBottom: '0.5rem' }}>
                    캐릭터 검색 기능은 정상 작동합니다.
                </p>
                <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                    랭킹, 통계 등 다른 기능은 곧 복구될 예정입니다.
                </p>
            </div>
        </main>
    )
}
