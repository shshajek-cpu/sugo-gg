'use client'

import { CSSProperties } from 'react'
import { SimulatorCharacter, SimulatorEquipment } from '../page'
import EquipmentSlot from './EquipmentSlot'

interface CharacterPanelProps {
  character: SimulatorCharacter
  equipment: SimulatorEquipment[]
  accessories: SimulatorEquipment[]
  runes?: SimulatorEquipment[]
  arcana?: SimulatorEquipment[]
  label?: string
  isEditable?: boolean
  isActive?: boolean
  onSlotClick?: (slotPos: number, slotName: string) => void
}

// 장비 슬롯 순서 (왼쪽: 방어구, 오른쪽: 무기+장신구)
const EQUIPMENT_SLOTS = [
  { pos: 3, name: '투구' },
  { pos: 4, name: '견갑' },
  { pos: 5, name: '흉갑' },
  { pos: 6, name: '장갑' },
  { pos: 7, name: '각반' },
  { pos: 8, name: '장화' },
  { pos: 1, name: '주무기' },
  { pos: 2, name: '보조무기' },
]

const ACCESSORY_SLOTS = [
  { pos: 10, name: '목걸이' },
  { pos: 11, name: '귀걸이1' },
  { pos: 12, name: '귀걸이2' },
  { pos: 13, name: '반지1' },
  { pos: 14, name: '반지2' },
  { pos: 15, name: '팔찌1' },
  { pos: 16, name: '팔찌2' },
  { pos: 17, name: '허리띠' },
  { pos: 19, name: '망토' },
  { pos: 22, name: '아뮬렛' },
]

const RUNE_SLOTS = [
  { pos: 23, name: '룬1' },
  { pos: 24, name: '룬2' },
]

const ARCANA_SLOTS = [
  { pos: 41, name: '아르카나1' },
  { pos: 42, name: '아르카나2' },
  { pos: 43, name: '아르카나3' },
  { pos: 44, name: '아르카나4' },
  { pos: 45, name: '아르카나5' },
]

export default function CharacterPanel({
  character,
  equipment,
  accessories,
  runes = [],
  arcana = [],
  label,
  isEditable = false,
  isActive = false,
  onSlotClick,
}: CharacterPanelProps) {
  // 슬롯 포지션으로 장비 찾기
  const findEquipment = (slotPos: number, list: SimulatorEquipment[]): SimulatorEquipment | null => {
    return list.find(e => e.slotPos === slotPos) || null
  }

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--sim-bg-card)',
    borderRadius: '16px',
    border: `1px solid ${isActive ? 'var(--sim-accent)' : 'var(--sim-border)'}`,
    padding: '20px',
    boxShadow: isActive ? '0 0 20px var(--sim-accent-glow)' : 'none',
    transition: 'all 0.3s',
  }

  const labelStyle: CSSProperties = {
    display: 'inline-block',
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderRadius: '20px',
    backgroundColor: isActive ? 'var(--sim-accent)' : 'var(--sim-bg-elevated)',
    color: isActive ? '#000' : 'var(--sim-text-muted)',
    marginBottom: '16px',
  }

  return (
    <div style={cardStyle}>
      {/* 라벨 */}
      {label && <div style={labelStyle}>{label}</div>}

      {/* 프로필 영역 */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        {/* 프로필 이미지 */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '12px',
          backgroundColor: 'var(--sim-bg-elevated)',
          border: '1px solid var(--sim-border)',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {character.profileImage ? (
            <img
              src={character.profileImage}
              alt={character.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--sim-text-muted)',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </div>

        {/* 캐릭터 정보 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {character.name}
          </h3>
          <div style={{
            fontSize: '13px',
            color: 'var(--sim-text-muted)',
            marginBottom: '8px',
          }}>
            Lv.{character.level} · {character.className} · {character.server}
          </div>

          {/* 템렙/전투력 */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {character.itemLevel && (
              <div style={{
                padding: '4px 10px',
                backgroundColor: 'var(--sim-bg-elevated)',
                borderRadius: '6px',
                fontSize: '12px',
              }}>
                <span style={{ color: 'var(--sim-text-muted)' }}>템렙 </span>
                <span style={{ fontWeight: 600, color: 'var(--sim-accent)' }}>
                  {character.itemLevel.toLocaleString()}
                </span>
              </div>
            )}
            {character.combatPower && (
              <div style={{
                padding: '4px 10px',
                backgroundColor: 'var(--sim-bg-elevated)',
                borderRadius: '6px',
                fontSize: '12px',
              }}>
                <span style={{ color: 'var(--sim-text-muted)' }}>전투력 </span>
                <span style={{ fontWeight: 600 }}>
                  {character.combatPower.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 장비 영역 */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--sim-text-muted)',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          장비
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '6px',
        }}>
          {EQUIPMENT_SLOTS.map(slot => (
            <EquipmentSlot
              key={slot.pos}
              equipment={findEquipment(slot.pos, equipment)}
              isEditable={isEditable}
              onClick={() => onSlotClick?.(slot.pos, slot.name)}
            />
          ))}
        </div>
      </div>

      {/* 장신구 영역 */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--sim-text-muted)',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          장신구
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '6px',
        }}>
          {ACCESSORY_SLOTS.map(slot => (
            <EquipmentSlot
              key={slot.pos}
              equipment={findEquipment(slot.pos, accessories)}
              isEditable={isEditable}
              onClick={() => onSlotClick?.(slot.pos, slot.name)}
            />
          ))}
        </div>
      </div>

      {/* 룬 영역 */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--sim-text-muted)',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          룬
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '6px',
        }}>
          {RUNE_SLOTS.map(slot => (
            <EquipmentSlot
              key={slot.pos}
              equipment={findEquipment(slot.pos, runes)}
              isEditable={isEditable}
              onClick={() => onSlotClick?.(slot.pos, slot.name)}
            />
          ))}
        </div>
      </div>

      {/* 아르카나 영역 */}
      <div>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--sim-text-muted)',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          아르카나
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '6px',
        }}>
          {ARCANA_SLOTS.map(slot => (
            <EquipmentSlot
              key={slot.pos}
              equipment={findEquipment(slot.pos, arcana)}
              isEditable={isEditable}
              onClick={() => onSlotClick?.(slot.pos, slot.name)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
