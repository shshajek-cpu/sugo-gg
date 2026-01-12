'use client'

import { useState } from 'react'
import { X, Search, Package } from 'lucide-react'
import { ItemCategory, ItemGrade, ITEM_CATEGORY_LABELS, ITEM_GRADE_LABELS, CreateItemRequest } from '@/types/ledger'
import styles from '../ledger.module.css'

interface AddItemModalProps {
  isOpen: boolean
  contentTypes: { id: string; name: string }[]
  onClose: () => void
  onAdd: (item: CreateItemRequest) => void
}

export default function AddItemModal({
  isOpen,
  contentTypes,
  onClose,
  onAdd
}: AddItemModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<{
    id?: string
    name: string
    category: ItemCategory
    grade: ItemGrade
  } | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [sourceContent, setSourceContent] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])

  // 수동 입력 모드
  const [manualMode, setManualMode] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualCategory, setManualCategory] = useState<ItemCategory>('equipment')
  const [manualGrade, setManualGrade] = useState<ItemGrade>('rare')

  if (!isOpen) return null

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // 기존 아이템 검색 API 활용
      const res = await fetch(`/api/item/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.items || data || [])
      }
    } catch (e) {
      console.error('Item search error:', e)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectSearchResult = (item: any) => {
    setSelectedItem({
      id: item.id,
      name: item.name,
      category: item.category || 'equipment',
      grade: item.grade || 'rare'
    })
    setSearchQuery('')
    setSearchResults([])
  }

  const handleSubmit = () => {
    if (manualMode) {
      if (!manualName.trim()) return

      onAdd({
        item_name: manualName.trim(),
        item_category: manualCategory,
        item_grade: manualGrade,
        quantity,
        source_content: sourceContent || undefined
      })
    } else {
      if (!selectedItem) return

      onAdd({
        item_name: selectedItem.name,
        item_category: selectedItem.category,
        item_grade: selectedItem.grade,
        quantity,
        source_content: sourceContent || undefined,
        item_id: selectedItem.id
      })
    }

    handleClose()
  }

  const handleClose = () => {
    setSearchQuery('')
    setSelectedItem(null)
    setQuantity(1)
    setSourceContent('')
    setSearchResults([])
    setManualMode(false)
    setManualName('')
    setManualCategory('equipment')
    setManualGrade('rare')
    onClose()
  }

  return (
    <div className={styles.modal} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <Package size={20} style={{ marginRight: 8 }} />
            아이템 등록
          </h3>
          <button className={styles.modalClose} onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* 모드 전환 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              className={`${styles.filterBtn} ${!manualMode ? styles.filterBtnActive : ''}`}
              onClick={() => setManualMode(false)}
            >
              검색
            </button>
            <button
              className={`${styles.filterBtn} ${manualMode ? styles.filterBtnActive : ''}`}
              onClick={() => setManualMode(true)}
            >
              직접 입력
            </button>
          </div>

          {!manualMode ? (
            <>
              {/* 검색 모드 */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>아이템 검색 (전체 검색)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="아이템 이름 입력..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    className={styles.btnPrimary}
                    style={{ width: 'auto', padding: '0 16px' }}
                    onClick={handleSearch}
                    disabled={isSearching}
                  >
                    <Search size={16} />
                  </button>
                </div>
              </div>

              {isSearching && (
                <div className={styles.loading}>검색 중...</div>
              )}

              {searchResults.length > 0 && (
                <div className={styles.searchResults}>
                  {searchResults.slice(0, 10).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className={styles.searchResult}
                      onClick={() => handleSelectSearchResult(item)}
                    >
                      <div className={styles.searchResultInfo}>
                        <div className={styles.searchResultName}>
                          {item.name}
                        </div>
                        <div className={styles.searchResultMeta}>
                          {ITEM_GRADE_LABELS[item.grade as ItemGrade] || item.grade} ·
                          {ITEM_CATEGORY_LABELS[item.category as ItemCategory] || item.category}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedItem && (
                <div style={{
                  background: '#212227',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16
                }}>
                  <p style={{ color: '#a5a8b4', fontSize: 12, marginBottom: 4 }}>
                    선택된 아이템
                  </p>
                  <p style={{ color: '#ffffff', fontWeight: 500 }}>
                    {selectedItem.name}
                  </p>
                  <p style={{ color: '#a5a8b4', fontSize: 13 }}>
                    {ITEM_GRADE_LABELS[selectedItem.grade]} · {ITEM_CATEGORY_LABELS[selectedItem.category]}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* 수동 입력 모드 */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>아이템 이름</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="아이템 이름 입력"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>카테고리</label>
                  <select
                    className={styles.formSelect}
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as ItemCategory)}
                  >
                    {Object.entries(ITEM_CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>등급</label>
                  <select
                    className={styles.formSelect}
                    value={manualGrade}
                    onChange={(e) => setManualGrade(e.target.value as ItemGrade)}
                  >
                    {Object.entries(ITEM_GRADE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* 공통 필드 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>수량</label>
              <input
                type="number"
                className={styles.formInput}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>획득처</label>
              <select
                className={styles.formSelect}
                value={sourceContent}
                onChange={(e) => setSourceContent(e.target.value)}
              >
                <option value="">선택 안함</option>
                {contentTypes.map((ct) => (
                  <option key={ct.id} value={ct.name}>{ct.name}</option>
                ))}
                <option value="거래소">거래소</option>
                <option value="기타">기타</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary} onClick={handleClose}>
            취소
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={manualMode ? !manualName.trim() : !selectedItem}
          >
            등록
          </button>
        </div>
      </div>
    </div>
  )
}
