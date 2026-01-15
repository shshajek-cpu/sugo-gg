'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Package, ChevronDown, ChevronUp } from 'lucide-react'
import { ItemGrade, ITEM_GRADE_COLORS } from '@/types/ledger'
import styles from './TotalItemsSummary.module.css'

interface ItemByCharacter {
  characterId: string
  characterName: string
  quantity: number
  price: number
}

interface AggregatedItem {
  itemName: string
  itemGrade: ItemGrade
  iconUrl?: string
  totalQuantity: number
  totalPrice: number
  byCharacter: ItemByCharacter[]
}

interface TotalItemsSummaryProps {
  sellingItems: AggregatedItem[]
  soldItems: AggregatedItem[]
  totalSellingCount: number
  totalSoldCount: number
  totalSoldIncome: number
}

function ItemCard({ item, isSold }: { item: AggregatedItem; isSold: boolean }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const gradeColor = ITEM_GRADE_COLORS[item.itemGrade] || '#9CA3AF'
  const gradeBgColor = `${gradeColor}20` // 20% opacity

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    })
    setShowTooltip(true)
  }

  return (
    <div
      className={styles.itemCard}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
      style={{ borderColor: gradeColor }}
    >
      {/* 아이템 이미지 */}
      <div
        className={styles.itemImageWrapper}
        style={{ backgroundColor: gradeBgColor }}
      >
        {item.iconUrl ? (
          <img
            src={item.iconUrl}
            alt={item.itemName}
            className={styles.itemImage}
          />
        ) : (
          <div
            className={styles.itemImagePlaceholder}
            style={{ color: gradeColor }}
          >
            <Package size={24} />
          </div>
        )}
        {/* 수량 뱃지 */}
        <div className={styles.quantityBadge}>
          {item.totalQuantity}
        </div>
      </div>

      {/* 아이템 정보 */}
      <div className={styles.itemInfo}>
        <div
          className={styles.itemName}
          style={{ color: gradeColor }}
        >
          {item.itemName}
        </div>
        <div className={styles.itemPrice}>
          {item.totalPrice.toLocaleString('ko-KR')}
        </div>
      </div>

      {/* 툴팁 - 캐릭터별 breakdown (Portal로 body에 렌더링) */}
      {mounted && showTooltip && createPortal(
        <div
          className={styles.tooltip}
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className={styles.tooltipTitle}>캐릭터별 현황</div>
          {item.byCharacter.length > 0 ? (
            item.byCharacter.map((charItem, idx) => (
              <div key={idx} className={styles.tooltipRow}>
                <span className={styles.tooltipCharName}>{charItem.characterName}</span>
                <span className={styles.tooltipCharStats}>
                  {charItem.quantity}개 ({charItem.price.toLocaleString('ko-KR')})
                </span>
              </div>
            ))
          ) : (
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipCharName}>데이터 없음</span>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

function ItemList({ title, items, emptyMessage, isSold }: {
  title: string
  items: AggregatedItem[]
  emptyMessage: string
  isSold: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className={styles.listSection}>
      <div
        className={styles.listHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className={styles.listTitle}>{title}</h4>
        <span className={styles.listCount}>{items.length}종</span>
        <button className={styles.expandBtn}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.listContent}>
          {items.length === 0 ? (
            <div className={styles.emptyList}>{emptyMessage}</div>
          ) : (
            <div className={styles.itemGrid}>
              {items.map((item, index) => (
                <ItemCard key={`${item.itemName}-${index}`} item={item} isSold={isSold} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TotalItemsSummary({
  sellingItems,
  soldItems,
  totalSellingCount,
  totalSoldCount,
  totalSoldIncome
}: TotalItemsSummaryProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Package size={18} />
          전체 아이템 현황
        </h2>
      </div>

      {/* 요약 카드 */}
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>판매중</div>
          <div className={styles.summaryValue}>{totalSellingCount}개</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>판매완료</div>
          <div className={styles.summaryValueSuccess}>{totalSoldCount}개</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>총 수익</div>
          <div className={styles.summaryValueGold}>
            {totalSoldIncome.toLocaleString('ko-KR')}
          </div>
        </div>
      </div>

      {/* 아이템 목록 */}
      <div className={styles.listsContainer}>
        <ItemList
          title="판매중 아이템"
          items={sellingItems}
          emptyMessage="판매중인 아이템이 없습니다"
          isSold={false}
        />
        <ItemList
          title="판매완료 아이템"
          items={soldItems}
          emptyMessage="판매완료된 아이템이 없습니다"
          isSold={true}
        />
      </div>

      <div className={styles.tooltipHint}>
        아이템에 마우스를 올리면 캐릭터별 현황을 볼 수 있습니다
      </div>
    </section>
  )
}
