'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock, Gem, Sparkles, Sword, Coins } from 'lucide-react'
import styles from './LedgerPage.module.css'
import RevenueInputForm from '../components/ledger/RevenueInputForm'
import ItemSalesSection from '../components/ledger/ItemSalesSection'
import { IncomeSection, ItemSale } from '@/types/ledger'

type CharacterSummary = {
    id: string
    name: string
    job: string
    income: number
}

const DAILY_TOTAL = 8450000
const WEEKLY_TOTAL = 56200000

const CHARACTERS: CharacterSummary[] = [
    { id: 'elyon', name: '엘리온', job: '수호성', income: 1500000 },
    { id: 'serin', name: '세린', job: '살성', income: 0 },
    { id: 'kairo', name: '카이로', job: '마도성', income: 970000 },
    { id: 'hena', name: '헤나', job: '치유성', income: 2200000 },
]

const INITIAL_INCOME_SECTIONS: IncomeSection[] = [
    {
        id: 'expedition',
        title: '원정대 수입',
        total: 1500000,
        records: [
            { id: 'exp-1', label: '1회차', amount: 500000, timeAgo: '10분 전' },
            { id: 'exp-2', label: '2회차', amount: 350000, timeAgo: '32분 전' },
            { id: 'exp-3', label: '3회차', amount: 650000, timeAgo: '1시간 전' },
        ]
    },
    {
        id: 'transcend',
        title: '초월 콘텐츠',
        total: 920000,
        records: [
            { id: 'tr-1', label: '균열 수호', amount: 420000, timeAgo: '25분 전' },
            { id: 'tr-2', label: '보스 보상', amount: 500000, timeAgo: '2시간 전' },
        ]
    },
    {
        id: 'etc',
        title: '기타 수입',
        total: 310000,
        records: [
            { id: 'etc-1', label: '길드 정산', amount: 180000, timeAgo: '3시간 전' },
            { id: 'etc-2', label: '일일 미션', amount: 130000, timeAgo: '4시간 전' },
        ]
    },
]

const INITIAL_ITEM_SALES: ItemSale[] = [
    { id: 'item-1', name: '전설의 수정검', price: 1200000, timeAgo: '5분 전', date: '2026-01-11T05:00:00', icon: <Gem size={30} /> },
    { id: 'item-2', name: '폭풍의 목걸이', price: 840000, timeAgo: '12분 전', date: '2026-01-11T04:50:00', icon: <Gem size={30} /> },
    { id: 'item-3', name: '심연의 반지', price: 650000, timeAgo: '18분 전', date: '2026-01-11T04:40:00', icon: <Gem size={30} /> },
    { id: 'item-4', name: '수호자의 방패', price: 1100000, timeAgo: '26분 전', date: '2026-01-11T04:30:00', icon: <Gem size={30} /> },
    { id: 'item-5', name: '현자의 망토', price: 720000, timeAgo: '41분 전', date: '2026-01-11T04:15:00', icon: <Gem size={30} /> },
    { id: 'item-6', name: '루미엘의 귀걸이', price: 930000, timeAgo: '1시간 전', date: '2026-01-11T04:00:00', icon: <Gem size={30} /> },
    { id: 'item-7', name: '재앙의 단검', price: 1500000, timeAgo: '1시간 전', date: '2026-01-11T03:55:00', icon: <Gem size={30} /> },
    { id: 'item-8', name: '황혼의 투구', price: 560000, timeAgo: '2시간 전', date: '2026-01-11T03:30:00', icon: <Gem size={30} /> },
    { id: 'item-9', name: '태고의 장갑', price: 470000, timeAgo: '2시간 전', date: '2026-01-11T03:10:00', icon: <Gem size={30} /> },
    { id: 'item-10', name: '용언의 팔찌', price: 990000, timeAgo: '3시간 전', date: '2026-01-11T02:00:00', icon: <Gem size={30} /> },
]

const formatKina = (value: number) => value.toLocaleString('ko-KR')

const formatMan = (value: number) => `${Math.floor(value / 10000).toLocaleString('ko-KR')}만`

export default function LedgerPage() {
    const [activeCharacterId, setActiveCharacterId] = useState(CHARACTERS[0].id)
    const [incomeSections, setIncomeSections] = useState<IncomeSection[]>(INITIAL_INCOME_SECTIONS)
    const [itemSales, setItemSales] = useState<ItemSale[]>(INITIAL_ITEM_SALES)
    const [displayedTotal, setDisplayedTotal] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const previousTotalRef = useRef(0)

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 550)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        const startValue = previousTotalRef.current
        const endValue = DAILY_TOTAL
        previousTotalRef.current = endValue
        const duration = 900
        const startTime = performance.now()
        let frameId = 0

        const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const currentValue = Math.floor(startValue + (endValue - startValue) * eased)
            setDisplayedTotal(currentValue)
            if (progress < 1) {
                frameId = requestAnimationFrame(animate)
            }
        }

        frameId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(frameId)
    }, [])

    const handleAddRecord = (sectionId: string, amount: number, label: string) => {
        setIncomeSections(prev => prev.map(section => {
            if (section.id === sectionId) {
                return {
                    ...section,
                    total: section.total + amount,
                    records: [
                        { id: `rec-${Date.now()}`, label, amount, timeAgo: '방금' },
                        ...section.records
                    ]
                }
            }
            return section
        }))
        // Update total (mock only)
        setDisplayedTotal(prev => prev + amount)
    }

    const handleDeleteRecord = (sectionId: string, recordId: string) => {
        setIncomeSections(prev => prev.map(section => {
            if (section.id === sectionId) {
                const record = section.records.find(r => r.id === recordId)
                if (!record) return section
                return {
                    ...section,
                    total: section.total - record.amount,
                    records: section.records.filter(r => r.id !== recordId)
                }
            }
            return section
        }))
    }

    const handleSearchItem = (query: string) => {
        // Implement local filter for mock data
        if (!query.trim()) {
            setItemSales(INITIAL_ITEM_SALES)
            return
        }
        const lowerQuery = query.toLowerCase()
        const filtered = INITIAL_ITEM_SALES.filter(item =>
            item.name.toLowerCase().includes(lowerQuery) ||
            item.price.toString().includes(lowerQuery)
        )
        setItemSales(filtered)
    }

    return (
        <div className={styles.page}>
            <div className={styles.pageInner}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <span className={styles.headerLabel}>일일 총 수입</span>
                        <div className={styles.headerTotal}>
                            <span className={styles.headerCurrency}>키나</span>
                            <span className={styles.headerValue}>{formatKina(displayedTotal)}</span>
                        </div>
                        <div className={styles.headerHint}>
                            오늘의 정산이 반영되었습니다
                        </div>
                    </div>
                    <div className={styles.headerRight}>
                        <div className={styles.weeklyCard}>
                            <span className={styles.weeklyLabel}>주간 총 수입</span>
                            <span className={styles.weeklyValue}>{formatKina(WEEKLY_TOTAL)}</span>
                            <div className={styles.sparkline} />
                        </div>
                        <div className={styles.headerStatus}>
                            <Clock size={16} />
                            {isLoading ? '실시간 동기화 중...' : '동기화 완료'}
                        </div>
                    </div>
                </header>

                <div className={styles.contentGrid}>
                    <aside className={styles.sidebar}>
                        <div className={styles.sidebarTitle}>내 캐릭터 수입</div>
                        <div className={styles.sidebarList}>
                            {CHARACTERS.map((character) => {
                                const isActive = activeCharacterId === character.id
                                return (
                                    <button
                                        key={character.id}
                                        className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`}
                                        onClick={() => setActiveCharacterId(character.id)}
                                        type="button"
                                    >
                                        <div className={styles.avatar}>
                                            <span>{character.name.slice(0, 1)}</span>
                                        </div>
                                        <div className={styles.sidebarInfo}>
                                            <div className={styles.sidebarName}>{character.name}</div>
                                            <div className={styles.sidebarJob}>{character.job}</div>
                                        </div>
                                        <div className={character.income > 0 ? styles.sidebarIncome : styles.sidebarIncomeMuted}>
                                            +{formatMan(character.income)}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </aside>

                    <main className={styles.mainContent}>
                        <RevenueInputForm
                            sections={incomeSections}
                            onAddRecord={handleAddRecord}
                            onDeleteRecord={handleDeleteRecord}
                        />

                        <ItemSalesSection
                            items={itemSales}
                            onSearchItem={handleSearchItem}
                        />
                    </main>
                </div>
            </div>
        </div>
    )
}
