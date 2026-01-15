'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './EnhancedItemCard.module.css'

export interface EnhancedLedgerItem {
  id: string
  item_id: string
  item_name: string
  item_grade: string
  item_category: string
  quantity: number
  unit_price: number
  total_price: number
  is_sold: boolean
  sold_date?: string
  obtained_date?: string
  is_favorite?: boolean
  icon_url?: string
}

interface EnhancedItemCardProps {
  item: EnhancedLedgerItem
  isSelected?: boolean
  onSelect?: () => void
  onUpdate: (id: string, data: Partial<EnhancedLedgerItem>) => Promise<void>
  onSell: (id: string, soldPrice: number) => Promise<void>
  onUnsell: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onToggleFavorite: (itemId: string, itemName: string, itemGrade: string, itemCategory: string) => Promise<void>
}

// 등급 색상 (즐겨찾기와 동일하게 통일)
const GRADE_COLORS: Record<string, string> = {
  common: '#9CA3AF',
  rare: '#60A5FA',
  heroic: '#A78BFA',
  legendary: '#FBBF24',
  ultimate: '#F472B6',
  Common: '#9CA3AF',
  Rare: '#60A5FA',
  Epic: '#A78BFA',
  Unique: '#FBBF24',
  Legend: '#F472B6'
}

export default function EnhancedItemCard({
  item,
  isSelected = false,
  onSelect,
  onUpdate,
  onSell,
  onUnsell,
  onDelete,
  onToggleFavorite
}: EnhancedItemCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [editQuantity, setEditQuantity] = useState(item.quantity)
  const [editUnitPrice, setEditUnitPrice] = useState(item.unit_price)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // 클릭 외부 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setShowTooltip(false)
      }
    }
    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showTooltip])

  // 아이템 데이터 변경 시 편집 상태 동기화
  useEffect(() => {
    setEditQuantity(item.quantity)
    setEditUnitPrice(item.unit_price)
  }, [item.quantity, item.unit_price])

  const getGradeColor = (grade: string | undefined | null) => {
    if (!grade) return '#9CA3AF'
    return GRADE_COLORS[grade] || GRADE_COLORS[grade.toLowerCase()] || '#9CA3AF'
  }

  const handleCardClick = () => {
    if (!item.is_sold && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      setTooltipPos({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2
      })
      setShowTooltip(true)
    }
  }

  const handleSave = async () => {
    setIsUpdating(true)
    try {
      await onUpdate(item.id, {
        quantity: editQuantity,
        unit_price: editUnitPrice,
        total_price: editQuantity * editUnitPrice
      })
      setShowTooltip(false)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSell = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.is_sold) return
    setIsUpdating(true)
    try {
      await onSell(item.id, item.total_price)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`"${item.item_name}"을(를) 삭제하시겠습니까?`)) {
      setIsUpdating(true)
      try {
        await onDelete(item.id)
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleUnsell = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`"${item.item_name}" 판매완료를 취소하시겠습니까?`)) {
      setIsUpdating(true)
      try {
        await onUnsell(item.id)
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.()
  }

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${item.is_sold ? styles.cardSold : ''} ${isSelected ? styles.cardSelected : ''}`}
      onClick={handleCardClick}
    >
      {/* 판매취소 버튼 (판매완료 아이템만) */}
      {item.is_sold && (
        <button
          className={styles.unsellBtn}
          onClick={handleUnsell}
          disabled={isUpdating}
          title="판매취소"
        >
          ×
        </button>
      )}

      {/* 선택 체크박스 (미판매만) */}
      {!item.is_sold && onSelect ? (
        <div className={styles.selectCheckbox} onClick={handleCheckboxClick}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className={styles.checkbox}
          />
        </div>
      ) : null}

      {/* 아이템 이미지 */}
      <div
        className={styles.itemIcon}
        style={{ borderColor: getGradeColor(item.item_grade) }}
      >
        {item.icon_url ? (
          <img
            src={item.icon_url}
            alt={item.item_name}
            className={styles.iconImage}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <span className={styles.iconPlaceholder}>📦</span>
        )}
      </div>

      {/* 아이템 정보 */}
      <div className={styles.itemInfo}>
        <div
          className={styles.itemName}
          style={{ color: getGradeColor(item.item_grade) }}
          title={item.item_name}
        >
          {item.item_name}
        </div>
        <div className={styles.itemPrice}>
          {item.total_price.toLocaleString()} 키나
        </div>
      </div>

      {/* 우측 하단 버튼들 */}
      <div className={styles.actions}>
        {!item.is_sold ? (
          <>
            <button
              className={styles.sellBtn}
              onClick={handleSell}
              disabled={isUpdating}
              title="판매완료"
            >
              ✓
            </button>
            <button
              className={styles.deleteBtn}
              onClick={handleDelete}
              disabled={isUpdating}
              title="삭제"
            >
              ×
            </button>
          </>
        ) : (
          <span className={styles.soldBadge}>판매</span>
        )}
      </div>

      {/* 툴팁 팝업 (fixed position) */}
      {showTooltip && (
        <div
          className={styles.tooltip}
          ref={tooltipRef}
          style={{ top: tooltipPos.top, left: tooltipPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.tooltipHeader}>
            <span style={{ color: getGradeColor(item.item_grade) }}>{item.item_name}</span>
          </div>
          <div className={styles.tooltipBody}>
            <div className={styles.tooltipRow}>
              <label>수량</label>
              <input
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className={styles.tooltipInput}
              />
            </div>
            <div className={styles.tooltipRow}>
              <label>단가</label>
              <input
                type="number"
                value={editUnitPrice}
                onChange={(e) => setEditUnitPrice(Math.max(0, parseInt(e.target.value) || 0))}
                min={0}
                className={styles.tooltipInput}
              />
            </div>
            <div className={styles.tooltipTotal}>
              총액: {(editQuantity * editUnitPrice).toLocaleString()} 키나
            </div>
          </div>
          <div className={styles.tooltipActions}>
            <button
              className={styles.tooltipSaveBtn}
              onClick={handleSave}
              disabled={isUpdating}
            >
              저장
            </button>
            <button
              className={styles.tooltipCancelBtn}
              onClick={() => setShowTooltip(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
