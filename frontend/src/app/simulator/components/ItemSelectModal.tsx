'use client'

import { useState, useEffect, useRef, CSSProperties } from 'react'
import { SimulatorEquipment, SimulatorEquipmentDetail, SimulatorManastone, SimulatorGodstone } from '../page'
import { GRADE_COLORS, GRADE_LABELS } from '@/types/item'

interface ItemSelectModalProps {
  slotPos: number
  slotName: string
  currentItem: SimulatorEquipment | null
  onSelect: (item: SimulatorEquipment) => void
  onClose: () => void
}

interface SearchItem {
  itemId: string
  name: string
  grade: string
  icon: string
  itemLevel: number
  categoryName?: string
  slotPos?: number
  slotName?: string
  attack?: number
  defense?: number
  hp?: number
  stats?: Record<string, number>
  // 상세 옵션
  options?: Array<{ name: string; value: string | number }>
  randomOptions?: Array<{ name: string; value: string | number }>
  soulImprints?: Array<{ name: string; value: string | number }>
}

// 등급 필터 옵션 (DB 등급값 기준)
const GRADE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'Common', label: '일반' },
  { value: 'Rare', label: '레어' },
  { value: 'Epic', label: '에픽' },
  { value: 'Unique', label: '유니크' },
  { value: 'Legend', label: '전설' },
  { value: 'Special', label: '특수' },
]

// 등급 색상 가져오기
const getGradeColor = (grade?: string): string => {
  if (!grade) return '#9CA3AF'
  return GRADE_COLORS[grade] || '#9CA3AF'
}

// 강화 가능한 슬롯 (장비만)
const ENHANCEABLE_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8]

// 무기 슬롯 (신석 장착 가능)
const WEAPON_SLOTS = [1, 2]

// 기본 마석 타입 (API 데이터 로드 전 폴백)
const DEFAULT_manastoneTypes = [
  { type: '공격력', label: '공격력' },
  { type: '물리 치명타', label: '물리 치명타' },
  { type: '물리 명중', label: '물리 명중' },
  { type: '마법 증폭력', label: '마법 증폭력' },
  { type: '마법 치명타', label: '마법 치명타' },
  { type: '마법 명중', label: '마법 명중' },
  { type: 'HP', label: 'HP' },
  { type: '방어력', label: '방어력' },
  { type: '회피', label: '회피' },
  { type: '물리 방어 관통', label: '물리 방어 관통' },
  { type: '마법 방어 관통', label: '마법 방어 관통' },
]

// 기본 마석 값 (API 데이터 로드 전 폴백)
const DEFAULT_manastoneValues: Record<string, number[]> = {
  '공격력': [30, 40, 50, 60],
  '물리 치명타': [20, 30, 40, 50],
  '물리 명중': [30, 40, 50, 60],
  '마법 증폭력': [40, 50, 60, 70],
  '마법 치명타': [20, 30, 40, 50],
  '마법 명중': [30, 40, 50, 60],
  'HP': [80, 100, 120, 150],
  '방어력': [20, 30, 40, 50],
  '회피': [20, 30, 40, 50],
  '물리 방어 관통': [15, 20, 25, 30],
  '마법 방어 관통': [15, 20, 25, 30],
}

// 마석 API 응답 타입
interface ManastoneApiData {
  type: string
  values: number[]
  count: number
}

// 신석 API 응답 타입
interface GodstoneApiData {
  name: string
  desc?: string
  grade?: string
  icon?: string
  count: number
}

// 슬롯별 기본 마석 슬롯 개수
function getManastoneSlotCount(slotPos: number): number {
  // 무기/방어구: 6슬롯, 장신구: 2슬롯
  if (slotPos >= 1 && slotPos <= 8) return 6
  return 2
}

// 강화로 인한 템렙 증가량 계산
function calculateEnhancementBonus(level: number): number {
  let bonus = 0
  for (let lv = 1; lv <= level; lv++) {
    bonus += lv <= 9 ? 1 : 2
  }
  return bonus
}

// 돌파로 인한 템렙 증가량 계산 (추정치)
function calculateExceedBonus(level: number): number {
  // 돌파 단계당 템렙 증가 (가정: 단계당 +5)
  return level * 5
}

// 돌파 보너스 계산 (슬롯 타입별 고정 수치)
function calculateBreakthroughBonus(slotPos: number, exceedLevel: number): { name: string; value: string }[] {
  if (exceedLevel <= 0) return []

  const isWeapon = slotPos === 1 || slotPos === 2
  const isArmor = slotPos >= 3 && slotPos <= 8

  if (isWeapon) {
    return [
      { name: '공격력', value: `+${30 * exceedLevel}` },
      { name: '공격력 증가', value: `+${1 * exceedLevel}%` }
    ]
  } else if (isArmor) {
    return [
      { name: '방어력', value: `+${40 * exceedLevel}` },
      { name: '생명력', value: `+${40 * exceedLevel}` },
      { name: '방어력 증가', value: `+${1 * exceedLevel}%` }
    ]
  } else {
    // 장신구 (slotPos 9-17)
    return [
      { name: '공격력', value: `+${20 * exceedLevel}` },
      { name: '방어력', value: `+${20 * exceedLevel}` },
      { name: '공격력 증가', value: `+${1 * exceedLevel}%` }
    ]
  }
}

export default function ItemSelectModal({
  slotPos,
  slotName,
  currentItem,
  onSelect,
  onClose,
}: ItemSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [items, setItems] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // 선택된 아이템 (강화/돌파 설정용)
  const [selectedItem, setSelectedItem] = useState<SearchItem | null>(null)
  const [enchantLevel, setEnchantLevel] = useState(0)
  const [exceedLevel, setExceedLevel] = useState(0)

  // 마석 설정
  const manastoneSlotCount = getManastoneSlotCount(slotPos)
  const [manastones, setManastones] = useState<SimulatorManastone[]>(
    Array(manastoneSlotCount).fill(null).map(() => ({ type: '공격력', value: 50 }))
  )

  // 신석 설정 (무기만)
  const [godstone, setGodstone] = useState<SimulatorGodstone | null>(null)
  const [godstoneName, setGodstoneName] = useState('')

  // 영혼각인 설정
  const [soulImprints, setSoulImprints] = useState<Array<{ name: string; value: number }>>([
    { name: '공격력', value: 30 },
    { name: '공격력', value: 30 },
  ])

  // API에서 로드한 마석/신석 데이터
  const [loadedManastones, setLoadedManastones] = useState<ManastoneApiData[]>([])
  const [loadedGodstones, setLoadedGodstones] = useState<GodstoneApiData[]>([])

  // 마석/신석 데이터 로드 (컴포넌트 마운트 시 1회)
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const loadData = async () => {
      try {
        const res = await fetch('/api/simulator/stones', {
          signal: controller.signal,
        })
        if (cancelled) return
        const data = await res.json()
        if (data.manastones) setLoadedManastones(data.manastones)
        if (data.godstones) setLoadedGodstones(data.godstones)
      } catch (err) {
        if (!cancelled) console.error('[ItemSelectModal] Failed to load stones:', err)
      }
    }
    loadData()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  // 사용할 마석 타입 목록 (API 데이터 우선, 없으면 기본값)
  const manastoneTypes = loadedManastones.length > 0
    ? loadedManastones.map(m => ({ type: m.type, label: m.type }))
    : DEFAULT_manastoneTypes

  // 사용할 마석 값 목록 (API 데이터 우선, 없으면 기본값)
  const manastoneValues: Record<string, number[]> = loadedManastones.length > 0
    ? loadedManastones.reduce((acc, m) => {
        acc[m.type] = m.values.length > 0 ? m.values : [30, 40, 50, 60]
        return acc
      }, {} as Record<string, number[]>)
    : DEFAULT_manastoneValues

  // 강화/신석 가능 여부
  const isEnhanceable = ENHANCEABLE_SLOTS.includes(slotPos)
  const canHaveGodstone = WEAPON_SLOTS.includes(slotPos)

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // ESC 키 감지
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedItem) {
          setSelectedItem(null)
        } else {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose, selectedItem])

  // 아이템 검색
  const searchItems = async (term: string, grade: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (term) params.set('keyword', term)
      if (grade) params.set('grade', grade)
      params.set('slot', String(slotPos))

      const res = await fetch(`/api/item/search?${params.toString()}`)
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setItems([])
      } else {
        setItems(data.data || [])
      }
    } catch (err) {
      console.error('[ItemSelectModal] Search error:', err)
      setError('검색 중 오류가 발생했습니다')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  // 검색어 변경 시 디바운스 검색
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      searchItems(searchTerm, gradeFilter)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchTerm, gradeFilter, slotPos])

  // 아이템 클릭 → 강화/돌파 설정 화면
  const handleItemClick = (item: SearchItem) => {
    setSelectedItem(item)
    setEnchantLevel(currentItem?.enchantLevel || 0)
    setExceedLevel(currentItem?.exceedLevel || 0)
  }

  // 적용 버튼 클릭
  const handleApply = () => {
    if (!selectedItem) return

    // 마석 정보 구성 (빈 슬롯 제외)
    const validManastones = manastones.filter(m => m.type && m.value)

    // 신석 정보 구성
    const godstones: SimulatorGodstone[] = godstoneName
      ? [{ name: godstoneName }]
      : []

    // 영혼각인 정보 구성 (빈 슬롯 제외)
    const validSoulImprints = soulImprints.filter(s => s.name && s.value)

    // 상세 정보 구성
    const detail: SimulatorEquipmentDetail = {
      manastones: validManastones,
      godstones: godstones,
      options: selectedItem.options || [],
      randomOptions: selectedItem.randomOptions || [],
      soulImprints: validSoulImprints.length > 0 ? validSoulImprints : (selectedItem.soulImprints || []),
    }

    const equipment: SimulatorEquipment = {
      slotPos,
      slotName,
      name: selectedItem.name,
      grade: selectedItem.grade,
      icon: selectedItem.icon,
      itemLevel: selectedItem.itemLevel,
      enchantLevel: isEnhanceable ? enchantLevel : undefined,
      exceedLevel: isEnhanceable ? exceedLevel : undefined,
      attack: selectedItem.attack,
      defense: selectedItem.defense,
      hp: selectedItem.hp,
      stats: selectedItem.stats,
      detail,
    }
    onSelect(equipment)
  }

  // 뒤로가기 (아이템 목록으로)
  const handleBack = () => {
    setSelectedItem(null)
  }

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  }

  const modalStyle: CSSProperties = {
    backgroundColor: 'var(--sim-bg-card)',
    borderRadius: '16px',
    border: '1px solid var(--sim-border)',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
  }

  const headerStyle: CSSProperties = {
    padding: '20px',
    borderBottom: '1px solid var(--sim-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }

  const filterStyle: CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid var(--sim-border)',
    display: 'flex',
    gap: '12px',
  }

  const listStyle: CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
  }

  // 강화/돌파 설정 화면
  if (selectedItem) {
    const color = getGradeColor(selectedItem.grade)
    const enhanceBonus = calculateEnhancementBonus(enchantLevel)
    const exceedBonus = calculateExceedBonus(exceedLevel)
    const totalBonus = enhanceBonus + exceedBonus

    return (
      <div style={overlayStyle}>
        <div ref={modalRef} style={modalStyle}>
          {/* 헤더 */}
          <div style={headerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handleBack}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--sim-bg-elevated)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--sim-text-muted)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                  강화/돌파 설정
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--sim-text-muted)' }}>
                  {slotName}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--sim-bg-elevated)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--sim-text-muted)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 선택된 아이템 정보 */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--sim-border)' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                backgroundColor: 'var(--sim-bg-base)',
                border: `2px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 20px ${color}40`,
                flexShrink: 0,
              }}>
                {selectedItem.icon ? (
                  <img src={selectedItem.icon} alt={selectedItem.name} style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: '28px', height: '28px', backgroundColor: color, borderRadius: '6px', opacity: 0.5 }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color, marginBottom: '4px' }}>
                  {selectedItem.name}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--sim-text-muted)', marginBottom: '8px' }}>
                  기본 템렙 {selectedItem.itemLevel?.toLocaleString() || '?'}
                </div>
                {/* 기본 스탯 표시 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {selectedItem.attack && (
                    <span style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: '#EF4444',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}>
                      공격력 {selectedItem.attack.toLocaleString()}
                    </span>
                  )}
                  {selectedItem.defense && (
                    <span style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: '#3B82F6',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}>
                      방어력 {selectedItem.defense.toLocaleString()}
                    </span>
                  )}
                  {selectedItem.hp && (
                    <span style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      color: '#22C55E',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}>
                      HP {selectedItem.hp.toLocaleString()}
                    </span>
                  )}
                </div>
                {/* 기본 옵션 표시 */}
                {selectedItem.options && selectedItem.options.length > 0 && (
                  <div style={{
                    padding: '10px',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                  }}>
                    <div style={{ fontSize: '11px', color: '#F59E0B', marginBottom: '6px', fontWeight: 600 }}>
                      기본 옵션
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {selectedItem.options.map((opt, idx) => {
                        // 돌파 값 제거: "208 (+250)" → "208"
                        const cleanValue = String(opt.value).replace(/\s*\([^)]*\)/g, '').trim()
                        return (
                          <div key={idx} style={{ fontSize: '12px', color: '#FCD34D' }}>
                            {opt.name}: <span style={{ color: '#F59E0B' }}>{cleanValue}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {/* 돌파 보너스 (별도 파란색 섹션) */}
                {exceedLevel > 0 && (
                  <div style={{
                    padding: '10px',
                    marginTop: '8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                  }}>
                    <div style={{ fontSize: '11px', color: '#3B82F6', marginBottom: '6px', fontWeight: 600 }}>
                      ◆ 돌파 {exceedLevel}단계 보너스
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {calculateBreakthroughBonus(slotPos, exceedLevel).map((bonus, idx) => (
                        <div key={idx} style={{ fontSize: '12px', color: '#60A5FA' }}>
                          {bonus.name}: <span style={{ color: '#3B82F6', fontWeight: 600 }}>{bonus.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 강화/돌파 설정 */}
          <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
            {isEnhanceable ? (
              <>
                {/* 강화 슬라이더 */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--sim-text-secondary)' }}>
                      강화
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: enchantLevel > 0 ? 'var(--sim-accent)' : 'var(--sim-text-muted)' }}>
                        +{enchantLevel}강
                      </span>
                      {enchantLevel > 0 && (
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          color: 'var(--sim-success)',
                          fontWeight: 600,
                        }}>
                          템렙 +{enhanceBonus}
                        </span>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={15}
                    value={enchantLevel}
                    onChange={(e) => setEnchantLevel(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      height: '8px',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      background: `linear-gradient(to right,
                        var(--sim-accent) 0%,
                        var(--sim-accent) ${(enchantLevel / 15) * 100}%,
                        var(--sim-bg-elevated) ${(enchantLevel / 15) * 100}%,
                        var(--sim-bg-elevated) 100%)`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--sim-text-muted)' }}>
                    <span>+0</span>
                    <span>+5</span>
                    <span>+10</span>
                    <span>+15</span>
                  </div>
                </div>

                {/* 돌파 슬라이더 */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--sim-text-secondary)' }}>
                      돌파
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: exceedLevel > 0 ? 'var(--sim-grade-epic)' : 'var(--sim-text-muted)' }}>
                        {exceedLevel}단계
                      </span>
                      {exceedLevel > 0 && (
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(139, 92, 246, 0.2)',
                          color: 'var(--sim-grade-epic)',
                          fontWeight: 600,
                        }}>
                          템렙 +{exceedBonus}
                        </span>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    value={exceedLevel}
                    onChange={(e) => setExceedLevel(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      height: '8px',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      background: `linear-gradient(to right,
                        var(--sim-grade-epic) 0%,
                        var(--sim-grade-epic) ${(exceedLevel / 5) * 100}%,
                        var(--sim-bg-elevated) ${(exceedLevel / 5) * 100}%,
                        var(--sim-bg-elevated) 100%)`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--sim-text-muted)' }}>
                    <span>0</span>
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                  </div>
                </div>

                {/* 마석 설정 */}
                <div style={{
                  marginBottom: '24px',
                  padding: '16px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        color: '#3B82F6',
                        fontSize: '12px',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#3B82F6' }}>
                        마석 ({manastoneSlotCount}슬롯)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const firstType = manastones[0]?.type || '공격력'
                        const firstValue = manastones[0]?.value || 50
                        setManastones(Array(manastoneSlotCount).fill(null).map(() => ({ type: firstType, value: firstValue })))
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '4px',
                        color: '#3B82F6',
                        cursor: 'pointer',
                      }}
                    >
                      모두 동일
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '8px' }}>
                    {manastones.map((stone, idx) => (
                      <div key={idx} style={{ display: 'contents' }}>
                        <select
                          value={stone.type}
                          onChange={(e) => {
                            const newManastones = [...manastones]
                            newManastones[idx] = { ...stone, type: e.target.value }
                            setManastones(newManastones)
                          }}
                          style={{
                            padding: '8px',
                            fontSize: '12px',
                            backgroundColor: 'var(--sim-bg-elevated)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '6px',
                            color: 'var(--sim-text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          {manastoneTypes.map(t => (
                            <option key={t.type} value={t.type}>{t.label}</option>
                          ))}
                        </select>
                        <select
                          value={stone.value}
                          onChange={(e) => {
                            const newManastones = [...manastones]
                            newManastones[idx] = { ...stone, value: parseInt(e.target.value) }
                            setManastones(newManastones)
                          }}
                          style={{
                            padding: '8px',
                            fontSize: '12px',
                            backgroundColor: 'var(--sim-bg-elevated)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '6px',
                            color: '#3B82F6',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {(manastoneValues[stone.type] || [30, 40, 50, 60]).map(v => (
                            <option key={v} value={v}>+{v}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 신석 설정 (무기만) */}
                {canHaveGodstone && (
                  <div style={{
                    marginBottom: '24px',
                    padding: '16px',
                    backgroundColor: 'rgba(168, 85, 247, 0.08)',
                    borderRadius: '12px',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(168, 85, 247, 0.2)',
                          color: '#A855F7',
                          fontSize: '12px',
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#A855F7' }}>
                          신석
                        </span>
                      </div>
                      {godstoneName && (
                        <button
                          onClick={() => setGodstoneName('')}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            backgroundColor: 'rgba(168, 85, 247, 0.15)',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            borderRadius: '4px',
                            color: '#A855F7',
                            cursor: 'pointer',
                          }}
                        >
                          제거
                        </button>
                      )}
                    </div>
                    <select
                      value={godstoneName}
                      onChange={(e) => setGodstoneName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '13px',
                        backgroundColor: 'var(--sim-bg-elevated)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '8px',
                        color: godstoneName ? '#A855F7' : 'var(--sim-text-muted)',
                        fontWeight: godstoneName ? 600 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">신석 없음</option>
                      {loadedGodstones.length > 0 ? (
                        loadedGodstones.map(g => (
                          <option key={g.name} value={g.name}>
                            {g.name}{g.desc ? ` - ${g.desc.slice(0, 30)}...` : ''}
                          </option>
                        ))
                      ) : (
                        // 기본 신석 옵션 (API 로딩 중이거나 실패 시)
                        <>
                          <option value="침묵의 신석">침묵의 신석</option>
                          <option value="속박의 신석">속박의 신석</option>
                          <option value="마비의 신석">마비의 신석</option>
                          <option value="실명의 신석">실명의 신석</option>
                          <option value="출혈의 신석">출혈의 신석</option>
                        </>
                      )}
                    </select>
                    {/* 선택된 신석 설명 표시 */}
                    {godstoneName && loadedGodstones.length > 0 && (
                      (() => {
                        const selected = loadedGodstones.find(g => g.name === godstoneName)
                        return selected?.desc ? (
                          <div style={{
                            marginTop: '8px',
                            padding: '8px 10px',
                            fontSize: '11px',
                            color: 'var(--sim-text-muted)',
                            backgroundColor: 'var(--sim-bg-base)',
                            borderRadius: '6px',
                            lineHeight: 1.4,
                          }}>
                            {selected.desc}
                          </div>
                        ) : null
                      })()
                    )}
                  </div>
                )}

                {/* 영혼각인 설정 */}
                <div style={{
                  marginBottom: '24px',
                  padding: '16px',
                  backgroundColor: 'rgba(251, 191, 36, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(251, 191, 36, 0.2)',
                        color: '#FBBF24',
                        fontSize: '12px',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#FBBF24' }}>
                        영혼각인 (2슬롯)
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => {
                          if (soulImprints.length < 4) {
                            setSoulImprints([...soulImprints, { name: '공격력', value: 30 }])
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          backgroundColor: 'rgba(251, 191, 36, 0.15)',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          borderRadius: '4px',
                          color: '#FBBF24',
                          cursor: soulImprints.length < 4 ? 'pointer' : 'not-allowed',
                          opacity: soulImprints.length < 4 ? 1 : 0.5,
                        }}
                        disabled={soulImprints.length >= 4}
                      >
                        +추가
                      </button>
                      <button
                        onClick={() => setSoulImprints([])}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          backgroundColor: 'rgba(251, 191, 36, 0.15)',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          borderRadius: '4px',
                          color: '#FBBF24',
                          cursor: 'pointer',
                        }}
                      >
                        초기화
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 24px', gap: '8px', alignItems: 'center' }}>
                    {soulImprints.map((imprint, idx) => (
                      <div key={idx} style={{ display: 'contents' }}>
                        <select
                          value={imprint.name}
                          onChange={(e) => {
                            const newImprints = [...soulImprints]
                            newImprints[idx] = { ...imprint, name: e.target.value }
                            setSoulImprints(newImprints)
                          }}
                          style={{
                            padding: '8px',
                            fontSize: '12px',
                            backgroundColor: 'var(--sim-bg-elevated)',
                            border: '1px solid rgba(251, 191, 36, 0.3)',
                            borderRadius: '6px',
                            color: 'var(--sim-text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          {manastoneTypes.map(t => (
                            <option key={t.type} value={t.type}>{t.label}</option>
                          ))}
                        </select>
                        <select
                          value={imprint.value}
                          onChange={(e) => {
                            const newImprints = [...soulImprints]
                            newImprints[idx] = { ...imprint, value: parseInt(e.target.value) }
                            setSoulImprints(newImprints)
                          }}
                          style={{
                            padding: '8px',
                            fontSize: '12px',
                            backgroundColor: 'var(--sim-bg-elevated)',
                            border: '1px solid rgba(251, 191, 36, 0.3)',
                            borderRadius: '6px',
                            color: '#FBBF24',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => (
                            <option key={v} value={v}>+{v}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const newImprints = soulImprints.filter((_, i) => i !== idx)
                            setSoulImprints(newImprints)
                          }}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#EF4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  {soulImprints.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '12px', color: 'var(--sim-text-muted)', fontSize: '12px' }}>
                      영혼각인 없음 ('+추가' 버튼으로 추가)
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* 강화 불가 슬롯도 마석 설정 가능 */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--sim-text-secondary)' }}>
                      마석 ({manastoneSlotCount}슬롯)
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '8px' }}>
                    {manastones.slice(0, manastoneSlotCount).map((stone, idx) => (
                      <div key={idx} style={{ display: 'contents' }}>
                        <select
                          value={stone.type}
                          onChange={(e) => {
                            const newManastones = [...manastones]
                            newManastones[idx] = { ...stone, type: e.target.value }
                            setManastones(newManastones)
                          }}
                          style={{
                            padding: '8px',
                            fontSize: '12px',
                            backgroundColor: 'var(--sim-bg-elevated)',
                            border: '1px solid var(--sim-border)',
                            borderRadius: '6px',
                            color: 'var(--sim-text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          {manastoneTypes.map(t => (
                            <option key={t.type} value={t.type}>{t.label}</option>
                          ))}
                        </select>
                        <select
                          value={stone.value}
                          onChange={(e) => {
                            const newManastones = [...manastones]
                            newManastones[idx] = { ...stone, value: parseInt(e.target.value) }
                            setManastones(newManastones)
                          }}
                          style={{
                            padding: '8px',
                            fontSize: '12px',
                            backgroundColor: 'var(--sim-bg-elevated)',
                            border: '1px solid var(--sim-border)',
                            borderRadius: '6px',
                            color: 'var(--sim-accent)',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {(manastoneValues[stone.type] || [30, 40, 50, 60]).map(v => (
                            <option key={v} value={v}>+{v}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 하단 요약 및 적용 버튼 */}
          <div style={{
            padding: '20px',
            borderTop: '1px solid var(--sim-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--sim-text-muted)', marginBottom: '4px' }}>
                예상 템렙
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>
                <span style={{ color: 'var(--sim-text-primary)' }}>
                  {(selectedItem.itemLevel + totalBonus).toLocaleString()}
                </span>
                {totalBonus > 0 && (
                  <span style={{ color: 'var(--sim-success)', marginLeft: '8px', fontSize: '14px' }}>
                    (+{totalBonus})
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleApply}
              style={{
                padding: '12px 32px',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: '10px',
                border: 'none',
                backgroundColor: 'var(--sim-accent)',
                color: '#000',
                cursor: 'pointer',
                boxShadow: '0 4px 12px var(--sim-accent-glow)',
              }}
            >
              적용
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 아이템 목록 화면
  return (
    <div style={overlayStyle}>
      <div ref={modalRef} style={modalStyle}>
        {/* 헤더 */}
        <div style={headerStyle}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
              {slotName} 선택
            </h3>
            {currentItem && (
              <div style={{ fontSize: '12px', color: 'var(--sim-text-muted)' }}>
                현재: {currentItem.name}
                {currentItem.enchantLevel && currentItem.enchantLevel > 0 && ` +${currentItem.enchantLevel}강`}
                {currentItem.exceedLevel && currentItem.exceedLevel > 0 && ` ${currentItem.exceedLevel}돌`}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--sim-bg-elevated)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--sim-text-muted)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 필터 영역 */}
        <div style={filterStyle}>
          {/* 검색 입력 */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="아이템 이름 검색..."
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: '13px',
              backgroundColor: 'var(--sim-bg-elevated)',
              border: '1px solid var(--sim-border)',
              borderRadius: '8px',
              color: 'var(--sim-text-primary)',
              outline: 'none',
            }}
          />

          {/* 등급 필터 */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              fontSize: '13px',
              backgroundColor: 'var(--sim-bg-elevated)',
              border: '1px solid var(--sim-border)',
              borderRadius: '8px',
              color: 'var(--sim-text-primary)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {GRADE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* 아이템 목록 */}
        <div style={listStyle}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--sim-text-muted)' }}>
              검색 중...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--sim-danger)' }}>
              {error}
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--sim-text-muted)' }}>
              {searchTerm || gradeFilter ? '검색 결과가 없습니다' : '검색어를 입력하세요'}
            </div>
          ) : (
            items.map((item, idx) => {
              const color = getGradeColor(item.grade)

              return (
                <div
                  key={`${item.itemId}-${idx}`}
                  onClick={() => handleItemClick(item)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    marginBottom: '4px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sim-bg-elevated)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* 아이콘 */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--sim-bg-base)',
                    border: `1px solid ${color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {item.icon ? (
                      <img src={item.icon} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '20px', height: '20px', backgroundColor: color, borderRadius: '4px', opacity: 0.5 }} />
                    )}
                  </div>

                  {/* 정보 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '4px',
                    }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--sim-text-muted)', marginBottom: '4px' }}>
                      템렙 {String(item.itemLevel || 0).replace(/00$/, '') || '?'}
                      {item.attack && ` · 공격력 ${item.attack.toLocaleString()}`}
                      {item.defense && ` · 방어력 ${item.defense.toLocaleString()}`}
                    </div>
                    {/* 상세 옵션 표시 */}
                    {item.options && item.options.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {item.options.slice(0, 3).map((opt, idx) => {
                          // (+XXX) 돌파 보너스 제거
                          const cleanValue = String(opt.value || '').replace(/\s*\(\+[^)]*\)/g, '').trim()
                          return (
                            <span key={idx} style={{
                              padding: '2px 6px',
                              fontSize: '10px',
                              backgroundColor: 'rgba(245, 158, 11, 0.15)',
                              color: '#F59E0B',
                              borderRadius: '3px',
                            }}>
                              {opt.name} {cleanValue}
                            </span>
                          )
                        })}
                        {item.options.length > 3 && (
                          <span style={{
                            padding: '2px 6px',
                            fontSize: '10px',
                            color: 'var(--sim-text-muted)',
                          }}>
                            +{item.options.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 화살표 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--sim-text-muted)',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
