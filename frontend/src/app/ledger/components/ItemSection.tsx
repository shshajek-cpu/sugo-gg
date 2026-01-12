'use client'

import { useState } from 'react'
import { Package, Search, Plus, Trash2, Check, Gem, Sword, Feather, Box } from 'lucide-react'
import { LedgerItem, ItemCategory, ITEM_CATEGORY_LABELS, ITEM_GRADE_LABELS, ITEM_GRADE_COLORS } from '@/types/ledger'
import styles from '../ledger.module.css'

interface ItemSectionProps {
  items: LedgerItem[]
  filter: ItemCategory | 'all'
  onFilterChange: (filter: ItemCategory | 'all') => void
  onSellItem: (id: string, price: number) => void
  onDeleteItem: (id: string) => void
  onAddItem: () => void
}

const CATEGORY_ICONS: Record<ItemCategory | 'all', React.ReactNode> = {
  all: <Box size={14} />,
  equipment: <Sword size={14} />,
  material: <Gem size={14} />,
  wing: <Feather size={14} />,
  etc: <Package size={14} />
}

export default function ItemSection({
  items,
  filter,
  onFilterChange,
  onSellItem,
  onDeleteItem,
  onAddItem
}: ItemSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [saleInputs, setSaleInputs] = useState<Record<string, string>>({})

  // 검색 필터링
  const filteredItems = items.filter(item =>
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSaleInputChange = (id: string, value: string) => {
    setSaleInputs(prev => ({ ...prev, [id]: value }))
  }

  const handleSellConfirm = (id: string) => {
    const value = saleInputs[id]
    if (!value) return

    const price = parseInt(value, 10)
    if (!isNaN(price) && price > 0) {
      onSellItem(id, price)
      setSaleInputs(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const getGradeClass = (grade: string) => {
    const gradeMap: Record<string, string> = {
      common: styles.gradeCommon,
      rare: styles.gradeRare,
      heroic: styles.gradeHeroic,
      legendary: styles.gradeLegendary,
      ultimate: styles.gradeUltimate
    }
    return gradeMap[grade] || styles.gradeCommon
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}.${date.getDate()}`
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <Package size={18} />
          아이템 획득 목록
        </h2>
      </div>

      {/* 필터 및 검색 */}
      <div className={styles.itemFilters}>
        {(['all', 'equipment', 'material', 'wing', 'etc'] as const).map((cat) => (
          <button
            key={cat}
            className={`${styles.filterBtn} ${filter === cat ? styles.filterBtnActive : ''}`}
            onClick={() => onFilterChange(cat)}
          >
            {CATEGORY_ICONS[cat]}
            {cat === 'all' ? '전체' : ITEM_CATEGORY_LABELS[cat]}
          </button>
        ))}

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, color: '#848999' }} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="아이템 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 32 }}
          />
        </div>
      </div>

      {/* 아이템 목록 */}
      <div className={styles.itemList}>
        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <p className={styles.emptyText}>등록된 아이템이 없습니다</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className={styles.itemCard}>
              {/* 아이콘 */}
              <div className={styles.itemIcon} style={{ color: ITEM_GRADE_COLORS[item.item_grade] }}>
                {CATEGORY_ICONS[item.item_category]}
              </div>

              {/* 정보 */}
              <div className={styles.itemInfo}>
                <div className={styles.itemName}>
                  {item.item_name}
                  {item.quantity > 1 && ` x${item.quantity}`}
                </div>
                <div className={styles.itemMeta}>
                  <span className={`${styles.itemGrade} ${getGradeClass(item.item_grade)}`}>
                    {ITEM_GRADE_LABELS[item.item_grade]}
                  </span>
                  <span className={styles.itemCategory}>
                    {ITEM_CATEGORY_LABELS[item.item_category]}
                  </span>
                  {item.source_content && (
                    <span className={styles.itemSource}>{item.source_content}</span>
                  )}
                </div>
              </div>

              {/* 날짜 */}
              <span className={styles.itemDate}>{formatDate(item.obtained_date)}</span>

              {/* 판매 상태 */}
              <div className={styles.itemSale}>
                {item.sold_price !== null ? (
                  <div className={styles.soldBadge}>
                    <Check size={14} />
                    {item.sold_price.toLocaleString('ko-KR')} 키나
                  </div>
                ) : (
                  <>
                    <input
                      type="number"
                      className={styles.saleInput}
                      placeholder="판매 금액"
                      value={saleInputs[item.id] || ''}
                      onChange={(e) => handleSaleInputChange(item.id, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSellConfirm(item.id)}
                    />
                    <button
                      className={styles.saleBtn}
                      onClick={() => handleSellConfirm(item.id)}
                      disabled={!saleInputs[item.id]}
                    >
                      확인
                    </button>
                  </>
                )}

                <button
                  className={styles.deleteBtn}
                  onClick={() => onDeleteItem(item.id)}
                  title="삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 아이템 추가 버튼 */}
      <button className={styles.addItemBtn} onClick={onAddItem}>
        <Plus size={16} style={{ marginRight: 8 }} />
        아이템 등록
      </button>
    </section>
  )
}
