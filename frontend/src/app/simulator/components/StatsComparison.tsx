'use client'

import { useMemo, CSSProperties } from 'react'
import { SimulatorEquipment } from '../page'

interface StatsComparisonProps {
  originalStats: Record<string, number>      // 원본 실제 능력치
  simulatedEquipment: SimulatorEquipment[]   // 시뮬 장비 (차이 계산용)
  originalEquipment: SimulatorEquipment[]    // 원본 장비 (차이 계산용)
  hasChanges: boolean
}

// 스탯 카테고리 분류 (statsAggregator.ts와 동일)
const ATTACK_STATS = [
  '공격력', '추가 공격력', '위력', '강타', '명중', '피해 증폭', '공격력 증가',
  'PVE 공격력', 'PVE 명중', 'PVP 공격력', 'PVP 명중', '보스 공격력',
  '치명타', '치명타 공격력', '치명타 피해', '치명타 피해 증폭', '치명타 증가',
  '완벽', '다단 히트 적중', 'PVP 치명타',
  '정신력', '전투 속도', '관통', '철벽 관통', '재생 관통',
  'PVP 피해 증폭', 'PVE 피해 증폭', '무기 피해 증폭', '정신력 소모량',
  // 퍼센트 버전
  '공격력 %', '치명타 %', '명중 %', '피해 증폭 %'
]

const DEFENSE_STATS = [
  '방어력', '추가 방어력', '방어력 증가', '생명력', '체력',
  '막기', '회피', '철벽', '치명타 저항', '치명타 피해 내성',
  '완벽 저항', '강타 저항', '피해 내성', '다단 히트 저항',
  'PVE 방어력', 'PVE 회피', 'PVP 방어력', 'PVP 회피', 'PVP 치명타 저항', '보스 방어력',
  '재생', '정신력 증가', '생명력 증가',
  // 퍼센트 버전
  '방어력 %', '생명력 %', '회피 %'
]

const UTILITY_STATS = [
  '이동 속도', '재사용 시간', '재사용 시간 감소'
]

// 시뮬레이션용: 장비 변경에 따른 스탯 차이 계산
const ENHANCEABLE_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8]
const WEAPON_SLOTS = [1, 2]
const ARMOR_SLOTS = [3, 4, 5, 6, 7, 8]

function calculateEnhancementBonus(level: number): number {
  let bonus = 0
  for (let lv = 1; lv <= level; lv++) {
    bonus += lv <= 9 ? 1 : 2
  }
  return bonus
}

function calculateExceedBonus(level: number): number {
  return level * 5
}

function calculateAttackBonus(enchantLevel: number, baseAttack: number): number {
  const bonusPercent = enchantLevel * 0.02
  return Math.floor(baseAttack * bonusPercent)
}

function calculateDefenseBonus(enchantLevel: number, baseDefense: number): number {
  const bonusPercent = enchantLevel * 0.015
  return Math.floor(baseDefense * bonusPercent)
}

function calculateExceedStatBonus(exceedLevel: number, baseStat: number): number {
  const bonusPercent = exceedLevel * 0.05
  return Math.floor(baseStat * bonusPercent)
}

function calculateTotalItemLevel(item: SimulatorEquipment): number {
  let total = item.itemLevel || 0
  if (ENHANCEABLE_SLOTS.includes(item.slotPos)) {
    if (item.enchantLevel) total += calculateEnhancementBonus(item.enchantLevel)
    if (item.exceedLevel) total += calculateExceedBonus(item.exceedLevel)
  }
  return total
}

// 장비 목록에서 스탯 합계 계산
const aggregateEquipmentStats = (equipment: SimulatorEquipment[]): Record<string, number> => {
  const stats: Record<string, number> = {
    '공격력': 0,
    '방어력': 0,
    '생명력': 0,
  }

  let totalItemLevel = 0
  let itemLevelCount = 0

  equipment.forEach(item => {
    const baseAttack = item.attack || 0
    const baseDefense = item.defense || 0
    const enchantLevel = item.enchantLevel || 0
    const exceedLevel = item.exceedLevel || 0

    let attackTotal = baseAttack
    let defenseTotal = baseDefense

    if (ENHANCEABLE_SLOTS.includes(item.slotPos)) {
      if (WEAPON_SLOTS.includes(item.slotPos) && baseAttack > 0) {
        attackTotal += calculateAttackBonus(enchantLevel, baseAttack)
        attackTotal += calculateExceedStatBonus(exceedLevel, baseAttack)
      }
      if (ARMOR_SLOTS.includes(item.slotPos) && baseDefense > 0) {
        defenseTotal += calculateDefenseBonus(enchantLevel, baseDefense)
        defenseTotal += calculateExceedStatBonus(exceedLevel, baseDefense)
      }
    }

    stats['공격력'] += attackTotal
    stats['방어력'] += defenseTotal
    if (item.hp) stats['생명력'] += item.hp

    const itemLevel = calculateTotalItemLevel(item)
    if (itemLevel > 0) {
      totalItemLevel += itemLevel
      itemLevelCount++
    }

    if (item.stats) {
      Object.entries(item.stats).forEach(([name, value]) => {
        if (name !== '공격력' && name !== '방어력' && name !== '생명력') {
          stats[name] = (stats[name] || 0) + value
        }
      })
    }
  })

  stats['평균 템렙'] = itemLevelCount > 0 ? Math.floor(totalItemLevel / itemLevelCount) : 0
  return stats
}

// 스탯 분류 함수
function categorizeStats(stats: Record<string, number>) {
  const attack: { name: string; value: number }[] = []
  const defense: { name: string; value: number }[] = []
  const utility: { name: string; value: number }[] = []
  const other: { name: string; value: number }[] = []

  Object.entries(stats).forEach(([name, value]) => {
    // 아이템레벨, 전투력은 제외 (별도 표시)
    if (name === '아이템레벨' || name === '전투력') return

    const statEntry = { name, value }
    if (ATTACK_STATS.includes(name)) {
      attack.push(statEntry)
    } else if (DEFENSE_STATS.includes(name)) {
      defense.push(statEntry)
    } else if (UTILITY_STATS.includes(name)) {
      utility.push(statEntry)
    } else {
      other.push(statEntry)
    }
  })

  return { attack, defense, utility, other }
}

// 스탯 셀 컴포넌트
interface StatCellProps {
  name: string
  original: number
  simulated: number
  hasChange: boolean
}

function StatCell({ name, original, simulated, hasChange }: StatCellProps) {
  const diff = simulated - original

  const cellStyle: CSSProperties = {
    padding: '4px 6px',
    borderRadius: '4px',
    backgroundColor: hasChange ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
    border: hasChange ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
  }

  return (
    <div style={cellStyle}>
      <div style={{
        fontSize: '11.5px',
        color: 'var(--sim-text-secondary)',
        marginBottom: '1px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {name}
      </div>

      {hasChange ? (
        <>
          <div style={{
            fontSize: '11.5px',
            color: 'var(--sim-text-muted)',
            textDecoration: 'line-through',
          }}>
            {original.toLocaleString()}
          </div>
          <div style={{
            fontSize: '13.5px',
            fontWeight: 600,
            color: 'var(--sim-text-primary)',
          }}>
            {simulated.toLocaleString()}
          </div>
          <div style={{
            display: 'inline-block',
            fontSize: '10.5px',
            fontWeight: 600,
            padding: '1px 4px',
            borderRadius: '3px',
            backgroundColor: diff > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: diff > 0 ? 'var(--sim-success)' : 'var(--sim-danger)',
          }}>
            {diff > 0 ? '+' : ''}{diff.toLocaleString()}{diff > 0 ? '↑' : '↓'}
          </div>
        </>
      ) : (
        <div style={{
          fontSize: '13.5px',
          color: 'var(--sim-text-primary)',
        }}>
          {original.toLocaleString()}
        </div>
      )}
    </div>
  )
}

// 섹션 컴포넌트
interface StatSectionProps {
  title: string
  icon: string
  stats: { name: string; value: number }[]
  originalStats: Record<string, number>
  simulatedStats: Record<string, number>
}

function StatSection({ title, icon, stats, originalStats, simulatedStats }: StatSectionProps) {
  if (stats.length === 0) return null

  const changedCount = stats.filter(s => {
    const orig = originalStats[s.name] || 0
    const sim = simulatedStats[s.name] || 0
    return orig !== sim
  }).length

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '4px',
        marginBottom: '4px',
        paddingBottom: '3px',
        borderBottom: '1px solid var(--sim-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '13.5px' }}>{icon}</span>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--sim-text-primary)' }}>
            {title}
          </span>
        </div>
        {changedCount > 0 && (
          <span style={{
            fontSize: '10.5px',
            padding: '1px 5px',
            borderRadius: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            color: 'var(--sim-accent)',
            fontWeight: 600,
          }}>
            {changedCount}개 변경
          </span>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '3px',
      }}>
        {stats.map(stat => {
          const orig = originalStats[stat.name] || 0
          const sim = simulatedStats[stat.name] || 0
          const hasChange = orig !== sim
          return (
            <StatCell
              key={stat.name}
              name={stat.name}
              original={orig}
              simulated={sim}
              hasChange={hasChange}
            />
          )
        })}
      </div>
    </div>
  )
}

export default function StatsComparison({
  originalStats,
  originalEquipment,
  simulatedEquipment,
  hasChanges,
}: StatsComparisonProps) {
  // 장비 기반 스탯 차이 계산
  const originalEquipStats = useMemo(() => aggregateEquipmentStats(originalEquipment), [originalEquipment])
  const simulatedEquipStats = useMemo(() => aggregateEquipmentStats(simulatedEquipment), [simulatedEquipment])

  // 시뮬레이션 스탯: 원본 실제 능력치 + 장비 차이
  const simulatedStats = useMemo(() => {
    const result: Record<string, number> = { ...originalStats }

    // 장비 변경으로 인한 차이 적용
    Object.keys(originalEquipStats).forEach(key => {
      const origEquip = originalEquipStats[key] || 0
      const simEquip = simulatedEquipStats[key] || 0
      const diff = simEquip - origEquip

      if (diff !== 0 && result[key] !== undefined) {
        result[key] = result[key] + diff
      }
    })

    return result
  }, [originalStats, originalEquipStats, simulatedEquipStats])

  // 스탯 분류
  const categorized = useMemo(() => categorizeStats(originalStats), [originalStats])

  // 변경된 스탯 개수
  const totalChangedCount = useMemo(() => {
    let count = 0
    Object.keys(originalStats).forEach(key => {
      const orig = originalStats[key] || 0
      const sim = simulatedStats[key] || 0
      if (orig !== sim) count++
    })
    return count
  }, [originalStats, simulatedStats])

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--sim-bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--sim-border)',
    padding: '12px',
  }

  return (
    <div style={cardStyle}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
      }}>
        <h3 style={{ fontSize: '14.5px', fontWeight: 700, margin: 0 }}>
          능력치 비교
        </h3>
        {hasChanges && totalChangedCount > 0 && (
          <div style={{
            fontSize: '11.5px',
            padding: '2px 8px',
            borderRadius: '10px',
            backgroundColor: 'var(--sim-accent)',
            color: '#000',
            fontWeight: 600,
          }}>
            {totalChangedCount}개 변경
          </div>
        )}
      </div>

      {/* 전투력/템렙 요약 */}
      {(originalStats['전투력'] || originalStats['아이템레벨']) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          marginBottom: '10px',
          padding: '8px',
          backgroundColor: 'var(--sim-bg-elevated)',
          borderRadius: '8px',
        }}>
          {originalStats['전투력'] !== undefined && (
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--sim-text-muted)', marginBottom: '1px' }}>
                전투력
              </div>
              <div style={{ fontSize: '17.5px', fontWeight: 700, color: 'var(--sim-accent)' }}>
                {originalStats['전투력'].toLocaleString()}
              </div>
            </div>
          )}
          {originalStats['아이템레벨'] !== undefined && (
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--sim-text-muted)', marginBottom: '1px' }}>
                아이템 레벨
              </div>
              <div style={{ fontSize: '17.5px', fontWeight: 700, color: 'var(--sim-text-primary)' }}>
                {originalStats['아이템레벨'].toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 공격 스탯 */}
      <StatSection
        title="공격"
        icon="⚔️"
        stats={categorized.attack}
        originalStats={originalStats}
        simulatedStats={simulatedStats}
      />

      {/* 방어 스탯 */}
      <StatSection
        title="방어"
        icon="🛡️"
        stats={categorized.defense}
        originalStats={originalStats}
        simulatedStats={simulatedStats}
      />

      {/* 유틸 스탯 */}
      <StatSection
        title="유틸"
        icon="⚡"
        stats={categorized.utility}
        originalStats={originalStats}
        simulatedStats={simulatedStats}
      />

      {/* 기타 스탯 */}
      {categorized.other.length > 0 && (
        <StatSection
          title="기타"
          icon="📊"
          stats={categorized.other}
          originalStats={originalStats}
          simulatedStats={simulatedStats}
        />
      )}

      {/* 스탯이 없을 때 */}
      {Object.keys(originalStats).length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '16px',
          color: 'var(--sim-text-muted)',
          fontSize: '13.5px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '8px', opacity: 0.5 }}>
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M13 17V5" />
            <path d="M8 17v-3" />
          </svg>
          <div>캐릭터를 선택하면 능력치가 표시됩니다</div>
        </div>
      )}
    </div>
  )
}
