'use client'

import styles from '../components/ranking/Ranking.module.css'

export default function RankingLoading() {
    return (
        <div style={{ paddingBottom: '2rem' }}>
            {/* 필터 바 스켈레톤 */}
            <div className={styles.filterBar} style={{ marginBottom: '2rem' }}>
                <div className={styles.selectGroup}>
                    <div className={`${styles.skeleton}`} style={{ width: '140px', height: '44px', borderRadius: '9999px' }}></div>
                    <div className={`${styles.skeleton}`} style={{ width: '140px', height: '44px', borderRadius: '9999px' }}></div>
                    <div className={`${styles.skeleton}`} style={{ width: '140px', height: '44px', borderRadius: '9999px' }}></div>
                </div>
                <div className={`${styles.skeleton}`} style={{ flex: 1, minWidth: '240px', height: '44px', borderRadius: '9999px' }}></div>
            </div>

            {/* 탭 스켈레톤 */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                <div className={`${styles.skeleton}`} style={{ width: '100px', height: '40px', borderRadius: '9999px' }}></div>
                <div className={`${styles.skeleton}`} style={{ width: '100px', height: '40px', borderRadius: '9999px' }}></div>
                <div className={`${styles.skeleton}`} style={{ width: '100px', height: '40px', borderRadius: '9999px' }}></div>
            </div>

            {/* 테이블 스켈레톤 */}
            <table className={styles.rankingTable}>
                <thead>
                    <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>변동</th>
                        <th style={{ width: '60px', textAlign: 'center' }}>순위</th>
                        <th>캐릭터</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>서버/종족</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>아이템Lv</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>티어</th>
                        <th style={{ width: '120px', textAlign: 'right' }}>HITON 전투력</th>
                    </tr>
                </thead>
                <tbody>
                    {[...Array(10)].map((_, i) => (
                        <tr key={i}>
                            <td style={{ textAlign: 'center' }}>
                                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '30px', margin: '0 auto' }}></div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '20px', margin: '0 auto' }}></div>
                            </td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className={`${styles.skeleton} ${styles.skeletonCircle}`}></div>
                                    <div style={{ flex: 1 }}>
                                        <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '120px' }}></div>
                                        <div className={`${styles.skeleton} ${styles.skeletonTextShort}`}></div>
                                    </div>
                                </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '60px', margin: '0 auto' }}></div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '40px', margin: '0 auto' }}></div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '60px', margin: '0 auto' }}></div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '80px', marginLeft: 'auto' }}></div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
