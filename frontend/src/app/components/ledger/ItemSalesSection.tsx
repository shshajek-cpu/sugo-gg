'use client'

import { useState } from 'react'
import { Gem, Search } from 'lucide-react'
import styles from '../../ledger/LedgerPage.module.css'
import { ItemSale } from '@/types/ledger'

interface ItemSalesSectionProps {
    items: ItemSale[]
    onSearchItem: (query: string) => void
}

export default function ItemSalesSection({ items, onSearchItem }: ItemSalesSectionProps) {
    const [searchQuery, setSearchQuery] = useState('')

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value
        setSearchQuery(query)
        onSearchItem(query)
    }

    const formatKina = (value: number) => value.toLocaleString('ko-KR')

    return (
        <section className={styles.salesSection}>
            <div className={styles.sectionHeader}>
                <div>
                    <h2>아이템 판매</h2>
                    <p>고정 크기 카드로 판매 내역을 빠르게 확인하세요.</p>
                </div>
                <div className={styles.sectionBadgeAlt}>
                    <Gem size={16} />
                    인벤토리 뷰
                </div>
            </div>

            {/* Item Search Input */}
            <div className={styles.itemSearchWrapper}>
                <Search className={styles.itemSearchIcon} size={20} />
                <input
                    type="text"
                    className={styles.itemSearchInput}
                    placeholder="판매한 아이템을 검색하여 기록하세요... (예: 전설의 장검, 키나)"
                    value={searchQuery}
                    onChange={handleSearchChange}
                />
            </div>

            <div className={styles.salesGrid}>
                {items.length === 0 ? (
                    <div className={styles.emptyRecord} style={{ gridColumn: '1 / -1' }}>
                        판매 기록이 없습니다.
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className={styles.saleCard}>
                            <div className={styles.saleIcon}>{item.icon || <Gem size={30} />}</div>
                            <div className={styles.saleInfo}>
                                <div className={styles.saleName} title={item.name}>{item.name}</div>
                                <div className={styles.salePrice}>키나 {formatKina(item.price)}</div>
                                <div className={styles.saleTime}>{item.timeAgo}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    )
}
