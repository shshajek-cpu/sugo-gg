'use client'

import Link from 'next/link'

export default function Footer() {
    return (
        <footer style={{
            marginTop: '60px',
            padding: '30px 20px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)',
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
            }}>
                {/* 상단 링크들 */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '20px',
                    justifyContent: 'center',
                }}>
                    <Link
                        href="/privacy-policy"
                        style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                        }}
                    >
                        개인정보처리방침
                    </Link>
                    <Link
                        href="/terms"
                        style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                        }}
                    >
                        이용약관
                    </Link>
                    <a
                        href="mailto:hiton.aion2@gmail.com"
                        style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                        }}
                    >
                        문의하기
                    </a>
                </div>

                {/* 하단 정보 */}
                <div style={{
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    lineHeight: '1.6',
                }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                        HitOn은 AION 2 팬 사이트이며, 엔씨소프트(NCSOFT)와 제휴 관계가 없습니다.
                    </p>
                    <p style={{ margin: 0 }}>
                        © {new Date().getFullYear()} HitOn. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
