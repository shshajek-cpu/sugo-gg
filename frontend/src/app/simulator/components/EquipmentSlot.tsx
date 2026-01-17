'use client'

import { CSSProperties, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { SimulatorEquipment } from '../page'
import { GRADE_COLORS } from '@/types/item'

interface EquipmentSlotProps {
  equipment: SimulatorEquipment | null
  isEditable?: boolean
  onClick?: () => void
}

// 등급별 스타일 가져오기
const getGradeStyle = (grade?: string): { bg: string; border: string; glow: string } => {
  const color = grade ? GRADE_COLORS[grade] : null
  if (!color) {
    return {
      bg: 'var(--sim-bg-elevated)',
      border: 'var(--sim-border)',
      glow: 'transparent',
    }
  }
  return {
    bg: `${color}15`,
    border: color,
    glow: `${color}40`,
  }
}

// 고등급 여부 확인
const isHighGrade = (grade?: string): boolean => {
  if (!grade) return false
  return ['Legend', 'Legendary', 'Unique', 'Mythic', 'Epic'].includes(grade)
}

export default function EquipmentSlot({ equipment, isEditable, onClick }: EquipmentSlotProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Portal 마운트 확인
  useEffect(() => {
    setMounted(true)
  }, [])

  const colors = getGradeStyle(equipment?.grade)
  const hasGlow = isHighGrade(equipment?.grade)
  const gradeColor = equipment?.grade ? GRADE_COLORS[equipment.grade] : '#9CA3AF'

  // 툴팁 위치 계산
  const updateTooltipPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setTooltipPos({
        top: rect.bottom + 8 + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      })
    }
  }

  // 툴팁 표시 핸들러
  const handleMouseEnter = () => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current)
    updateTooltipPosition()
    tooltipTimeoutRef.current = setTimeout(() => {
      updateTooltipPosition()
      setShowTooltip(true)
    }, 300)
  }

  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current)
    setShowTooltip(false)
  }

  // 강화/돌파 텍스트 생성
  const getEnhanceText = () => {
    const parts: string[] = []
    if (equipment?.enchantLevel && equipment.enchantLevel > 0) {
      parts.push(`+${equipment.enchantLevel}`)
    }
    if (equipment?.exceedLevel && equipment.exceedLevel > 0) {
      parts.push(`${equipment.exceedLevel}돌`)
    }
    return parts.join(' ')
  }

  const enhanceText = getEnhanceText()

  // 마석/신석 정보 생성
  const getDetailInfo = () => {
    const info: string[] = []
    const detail = equipment?.detail

    if (detail?.manastones && detail.manastones.length > 0) {
      info.push(`마석${detail.manastones.length}`)
    }
    if (detail?.godstones && detail.godstones.length > 0) {
      info.push(`신석`)
    }
    if (detail?.soulImprints && detail.soulImprints.length > 0) {
      info.push(`각인${detail.soulImprints.length}`)
    }

    return info.join(' · ')
  }

  const detailInfo = getDetailInfo()

  // 가로형 레이아웃 컨테이너
  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #3f3f46',
    borderRadius: '8px',
    cursor: isEditable ? 'pointer' : 'default',
    transition: 'all 0.2s',
    boxShadow: 'none',
    minHeight: '56px',
  }

  const iconStyle: CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '6px',
    backgroundColor: 'var(--sim-bg-elevated)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    position: 'relative',
  }

  const infoStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  }

  const nameStyle: CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: gradeColor,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  const statsStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: 'var(--sim-text-muted)',
  }

  return (
    <div
      ref={containerRef}
      onClick={isEditable ? onClick : undefined}
      style={{ ...containerStyle, position: 'relative' }}
      onMouseEnter={(e) => {
        handleMouseEnter()
        if (isEditable) {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.borderColor = 'var(--sim-accent)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.2)'
        }
      }}
      onMouseLeave={(e) => {
        handleMouseLeave()
        if (isEditable) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = '#3f3f46'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {/* 아이콘 */}
      <div style={iconStyle}>
        {equipment?.icon ? (
          <img
            src={equipment.icon}
            alt={equipment.name}
            style={{
              width: '36px',
              height: '36px',
              objectFit: 'contain',
            }}
          />
        ) : (
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            backgroundColor: 'var(--sim-border)',
            opacity: 0.5,
          }} />
        )}
        {/* 편집 가능 표시 */}
        {isEditable && (
          <div style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: 'var(--sim-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div style={infoStyle}>
        {/* 아이템 이름 */}
        <div style={nameStyle}>
          {equipment?.name || '빈 슬롯'}
        </div>
        {/* 강화/돌파/템렙 */}
        <div style={statsStyle}>
          {enhanceText && (
            <span style={{ color: 'var(--sim-accent)', fontWeight: 600 }}>
              {enhanceText}
            </span>
          )}
          {equipment?.itemLevel && (
            <span>
              Lv.{equipment.itemLevel}
            </span>
          )}
          {!enhanceText && !equipment?.itemLevel && (
            <span>-</span>
          )}
        </div>
        {/* 마석/신석/영혼각인 정보 */}
        {detailInfo && (
          <div style={{
            fontSize: '10px',
            color: '#8b5cf6',
            marginTop: '1px',
          }}>
            {detailInfo}
          </div>
        )}
      </div>

      {/* 상세 툴팁 - Portal로 body에 렌더링 */}
      {mounted && showTooltip && equipment && createPortal(
        <div style={{
          position: 'absolute',
          top: tooltipPos.top,
          left: tooltipPos.left,
          transform: 'translateX(-50%)',
          zIndex: 99999,
          minWidth: '280px',
          maxWidth: '320px',
          backgroundColor: '#1a1a1a',
          border: `1px solid ${gradeColor}`,
          borderRadius: '12px',
          boxShadow: `0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)`,
          padding: '16px',
          pointerEvents: 'none',
        }}>
          {/* 화살표 (위쪽) */}
          <div style={{
            position: 'absolute',
            top: '-6px',
            left: '50%',
            width: '12px',
            height: '12px',
            backgroundColor: '#1a1a1a',
            border: `1px solid ${gradeColor}`,
            borderBottom: 'none',
            borderRight: 'none',
            transform: 'translateX(-50%) rotate(45deg)',
          }} />

          {/* 헤더 */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              backgroundColor: '#0a0a0a',
              border: `1px solid ${gradeColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {equipment.icon && (
                <img src={equipment.icon} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
              )}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: gradeColor, marginBottom: '4px' }}>
                {equipment.name}
              </div>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                {enhanceText && <span style={{ color: '#F59E0B', marginRight: '8px' }}>{enhanceText}</span>}
                템렙 {equipment.itemLevel?.toLocaleString() || '-'}
              </div>
            </div>
          </div>

          {/* 기본 옵션 */}
          {equipment.detail?.options && equipment.detail.options.length > 0 && (
            <div style={{
              padding: '10px',
              backgroundColor: '#0a0a0a',
              borderRadius: '8px',
              marginBottom: '10px',
            }}>
              <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '6px' }}>기본 옵션</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {equipment.detail.options.map((opt, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: '#E5E7EB' }}>
                    {opt.name}: <span style={{ color: '#F59E0B' }}>{opt.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 추가 옵션 (랜덤 옵션) */}
          {equipment.detail?.randomOptions && equipment.detail.randomOptions.length > 0 && (
            <div style={{
              padding: '10px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              marginBottom: '10px',
            }}>
              <div style={{ fontSize: '11px', color: '#22C55E', marginBottom: '6px', fontWeight: 600 }}>추가 옵션</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {equipment.detail.randomOptions.map((opt, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: '#86EFAC' }}>
                    {opt.name}: <span style={{ color: '#4ADE80' }}>{opt.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 기본 스탯 (attack, defense, hp) */}
          {(equipment.attack || equipment.defense || equipment.hp) && (
            <div style={{
              padding: '10px',
              backgroundColor: '#0a0a0a',
              borderRadius: '8px',
              marginBottom: '10px',
            }}>
              <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '6px' }}>스탯</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {equipment.attack && (
                  <span style={{ fontSize: '12px', color: '#EF4444' }}>공격력 {equipment.attack.toLocaleString()}</span>
                )}
                {equipment.defense && (
                  <span style={{ fontSize: '12px', color: '#3B82F6' }}>방어력 {equipment.defense.toLocaleString()}</span>
                )}
                {equipment.hp && (
                  <span style={{ fontSize: '12px', color: '#22C55E' }}>HP {equipment.hp.toLocaleString()}</span>
                )}
              </div>
            </div>
          )}

          {/* 마석 정보 */}
          {equipment.detail?.manastones && equipment.detail.manastones.length > 0 && (
            <div style={{
              padding: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              marginBottom: '10px',
            }}>
              <div style={{ fontSize: '11px', color: '#3B82F6', marginBottom: '6px', fontWeight: 600 }}>
                마석 ({equipment.detail.manastones.length}개)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {equipment.detail.manastones.map((stone, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: '#93C5FD' }}>
                    {stone.type} {String(stone.value).startsWith('+') ? stone.value : `+${stone.value}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 신석 정보 */}
          {equipment.detail?.godstones && equipment.detail.godstones.length > 0 && (
            <div style={{
              padding: '10px',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              marginBottom: '10px',
            }}>
              <div style={{ fontSize: '11px', color: '#A855F7', marginBottom: '6px', fontWeight: 600 }}>신석</div>
              {equipment.detail.godstones.map((stone, idx) => (
                <div key={idx}>
                  <div style={{ fontSize: '12px', color: '#C4B5FD', marginBottom: '4px' }}>{stone.name}</div>
                  {stone.desc && (
                    <div style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: 1.4 }}>{stone.desc}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 영혼각인 */}
          {equipment.detail?.soulImprints && equipment.detail.soulImprints.length > 0 && (
            <div style={{
              padding: '10px',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(251, 191, 36, 0.2)',
            }}>
              <div style={{ fontSize: '11px', color: '#FBBF24', marginBottom: '6px', fontWeight: 600 }}>영혼각인</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {equipment.detail.soulImprints.map((imprint, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: '#FCD34D' }}>
                    {imprint.name}: <span>{imprint.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
