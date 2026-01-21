'use client'

import { useMemo, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { PartyPost, PartySlot, PartyMember } from '@/types/party'
import { getTimeOfDay, getTimeOfDayIcon, getTimeOfDayLabel, getRelativeTime, getRemainingTime } from '@/types/party'
import { SERVERS } from '@/app/constants/servers'
import styles from './PartyCard.module.css'

interface PartyCardProps {
  party: PartyPost & {
    slots?: PartySlot[]
    members?: PartyMember[]
    current_members?: number
    pending_count?: number
  }
  showPendingBadge?: boolean
  showMyRole?: boolean
  myMember?: { character_name: string; character_class: string; role: string }
  myApplication?: { character_name: string; character_class: string; applied_at: string }
}

const DUNGEON_TYPE_LABELS: Record<string, string> = {
  transcend: '초월',
  expedition: '원정',
  sanctuary: '성역',
  subjugation: '토벌전',
  pvp: 'PVP'
}

const DUNGEON_TYPE_COLORS: Record<string, string> = {
  transcend: '#f59e0b',
  expedition: '#3b82f6',
  sanctuary: '#ef4444',
  subjugation: '#8b5cf6',
  pvp: '#ef4444'
}

// 종족 색상
const RACE_COLORS: Record<string, string> = {
  Elyos: '#2DD4BF',
  Asmodian: '#A78BFA'
}

// 클래스 아이콘 (임시 - 실제 아이콘으로 대체 가능)
const CLASS_ICONS: Record<string, string> = {
  검성: '⚔️',
  마도성: '🔮',
  호법성: '🛡️',
  치유성: '💚',
  기공사: '🌀',
  사격성: '🎯',
  궁성: '🏹',
  암살성: '🗡️'
}

function PartyCard({
  party,
  showPendingBadge = false,
  showMyRole = false,
  myMember,
  myApplication
}: PartyCardProps) {
  const isPvp = party.dungeon_type === 'pvp'
  const dungeonColor = DUNGEON_TYPE_COLORS[party.dungeon_type] || '#f59e0b'

  const currentMembers = party.current_members ||
    party.members?.filter(m => m.status === 'approved').length || 0

  const timeDisplay = useMemo(() => {
    if (party.is_immediate) {
      return {
        icon: '⚡',
        label: '즉시 진행',
        sub: getRelativeTime(party.created_at)
      }
    }

    if (!party.scheduled_date || !party.scheduled_time_start) {
      return null
    }

    const hour = parseInt(party.scheduled_time_start.split(':')[0])
    const timeRef = getTimeOfDay(hour)
    const icon = getTimeOfDayIcon(timeRef)
    const date = new Date(party.scheduled_date)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}(${['일', '월', '화', '수', '목', '금', '토'][date.getDay()]})`

    return {
      icon: icon,
      label: `${dateStr} ${party.scheduled_time_start.slice(0, 5)}`,
      sub: getRemainingTime(party.scheduled_date, party.scheduled_time_start)
    }
  }, [party])

  const serverName = SERVERS.find(s => s.id === String(party.character_server_id))?.name || ''

  // 슬롯과 멤버 정보 매핑
  const memberSlots = useMemo(() => {
    const slots = party.slots || []
    const approvedMembers = party.members?.filter(m => m.status === 'approved') || []

    // 최대 표시 슬롯 수
    const maxDisplay = Math.min(party.max_members || 4, 6)
    const result = []

    for (let i = 0; i < maxDisplay; i++) {
      const slot = slots[i]
      const member = slot ? approvedMembers.find(m => m.slot_id === slot.id) : approvedMembers[i]

      if (member) {
        // 멤버 서버 이름 조회
        const memberServerName = SERVERS.find(s => s.id === String(member.character_server_id))?.name || serverName
        result.push({
          id: slot?.id || i,
          type: 'filled' as const,
          member: {
            name: member.character_name || '파티원',
            class: member.character_class || '자유',
            server: memberServerName,
            race: 'Elyos', // TODO: 동기화 작업 시 추가
            profileImage: null, // TODO: 동기화 작업 시 추가
            itemLevel: member.character_item_level || null,
            pveScore: member.character_combat_power || null, // TODO: PVE 스코어로 변경
            pvpScore: null // TODO: 동기화 작업 시 추가
          }
        })
      } else {
        result.push({
          id: slot?.id || i,
          type: 'empty' as const,
          requiredClass: slot?.required_class || '자유'
        })
      }
    }

    return result
  }, [party.slots, party.members, party.max_members, serverName])

  // 파티장 정보
  const leaderInfo = useMemo(() => {
    return {
      name: party.character_name || '파티장',
      class: party.character_class || '',
      server: serverName,
      race: 'Elyos', // TODO: 동기화 작업 시 추가
      profileImage: null, // TODO: 동기화 작업 시 추가
      itemLevel: party.character_item_level || null,
      pveScore: party.character_combat_power || null, // TODO: PVE 스코어로 변경
      pvpScore: null // TODO: 동기화 작업 시 추가
    }
  }, [party, serverName])

  return (
    <Link href={`/party/${party.id}`} className={styles.card}>
      {/* 헤더: 던전 정보 + 상태 */}
      <div className={styles.header}>
        <div className={styles.dungeonInfo}>
          <span
            className={styles.dungeonBadge}
            style={{ background: dungeonColor }}
          >
            {DUNGEON_TYPE_LABELS[party.dungeon_type]}
          </span>
          <span className={styles.dungeonName}>
            {party.dungeon_name}
            {party.dungeon_tier && <span className={styles.tier}>{party.dungeon_tier}단</span>}
          </span>
        </div>
        <div className={styles.statusBadge}>
          <span className={party.status === 'recruiting' ? styles.recruiting : styles.full}>
            {party.status === 'recruiting' ? '모집중' : '마감'}
          </span>
          <span className={styles.memberCount}>{currentMembers}/{party.max_members}</span>
        </div>
      </div>

      {/* 제목 */}
      {party.title && (
        <div className={styles.title}>{party.title}</div>
      )}

      {/* 시간 정보 */}
      {timeDisplay && (
        <div className={styles.timeBox}>
          <span className={styles.timeIcon}>{timeDisplay.icon}</span>
          <span className={styles.timeLabel}>{timeDisplay.label}</span>
          <span className={styles.timeSub}>{timeDisplay.sub}</span>
        </div>
      )}

      {/* 참가 조건 */}
      {(party.min_item_level || party.min_combat_power) && (
        <div className={styles.requirements}>
          {party.min_item_level && (
            <span className={styles.reqItem}>
              <span className={styles.reqLabel}>아이템</span>
              <span className={styles.reqValue}>{party.min_item_level}+</span>
            </span>
          )}
          {party.min_combat_power && (
            <span className={styles.reqItem}>
              <span className={styles.reqLabel}>전투력</span>
              <span className={styles.reqValue}>{(party.min_combat_power / 10000).toFixed(0)}만+</span>
            </span>
          )}
        </div>
      )}

      {/* 파티원 슬롯 그리드 */}
      <div className={styles.membersSection}>
        <div className={styles.membersGrid}>
          {/* 파티장 */}
          <div className={styles.memberSlot}>
            <div className={styles.memberCard}>
              <div className={styles.leaderBadge}>파티장</div>
              <div className={styles.profileWrapper}>
                {leaderInfo.profileImage ? (
                  <Image
                    src={leaderInfo.profileImage}
                    alt={leaderInfo.name}
                    width={48}
                    height={48}
                    className={styles.profileImage}
                  />
                ) : (
                  <div className={styles.profilePlaceholder}>
                    {CLASS_ICONS[leaderInfo.class] || '👤'}
                  </div>
                )}
                <span
                  className={styles.raceIndicator}
                  style={{ background: RACE_COLORS[leaderInfo.race] || '#2DD4BF' }}
                />
              </div>
              <div className={styles.memberInfo}>
                <span className={styles.memberName}>{leaderInfo.name}</span>
                <span className={styles.memberClass}>{leaderInfo.class}</span>
                <span className={styles.memberServer}>{leaderInfo.server}</span>
              </div>
              <div className={styles.memberStats}>
                {leaderInfo.itemLevel && (
                  <span className={styles.statItem}>
                    <span className={styles.statLabel}>아이템</span>
                    <span className={styles.statValue}>{leaderInfo.itemLevel}</span>
                  </span>
                )}
                {leaderInfo.pveScore && (
                  <span className={styles.statItem}>
                    <span className={styles.statLabel}>PVE</span>
                    <span className={styles.statValue}>{(leaderInfo.pveScore / 10000).toFixed(1)}만</span>
                  </span>
                )}
                {leaderInfo.pvpScore && (
                  <span className={styles.statItem}>
                    <span className={styles.statLabel}>PVP</span>
                    <span className={styles.statValue}>{(leaderInfo.pvpScore / 10000).toFixed(1)}만</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 파티원 슬롯들 */}
          {memberSlots.map((slot, idx) => (
            <div key={slot.id} className={styles.memberSlot}>
              {slot.type === 'filled' ? (
                <div className={styles.memberCard}>
                  <div className={styles.profileWrapper}>
                    {slot.member.profileImage ? (
                      <Image
                        src={slot.member.profileImage}
                        alt={slot.member.name}
                        width={48}
                        height={48}
                        className={styles.profileImage}
                      />
                    ) : (
                      <div className={styles.profilePlaceholder}>
                        {CLASS_ICONS[slot.member.class] || '👤'}
                      </div>
                    )}
                    <span
                      className={styles.raceIndicator}
                      style={{ background: RACE_COLORS[slot.member.race] || '#2DD4BF' }}
                    />
                  </div>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{slot.member.name}</span>
                    <span className={styles.memberClass}>{slot.member.class}</span>
                    <span className={styles.memberServer}>{slot.member.server}</span>
                  </div>
                  <div className={styles.memberStats}>
                    {slot.member.itemLevel && (
                      <span className={styles.statItem}>
                        <span className={styles.statLabel}>아이템</span>
                        <span className={styles.statValue}>{slot.member.itemLevel}</span>
                      </span>
                    )}
                    {slot.member.pveScore && (
                      <span className={styles.statItem}>
                        <span className={styles.statLabel}>PVE</span>
                        <span className={styles.statValue}>{(slot.member.pveScore / 10000).toFixed(1)}만</span>
                      </span>
                    )}
                    {slot.member.pvpScore && (
                      <span className={styles.statItem}>
                        <span className={styles.statLabel}>PVP</span>
                        <span className={styles.statValue}>{(slot.member.pvpScore / 10000).toFixed(1)}만</span>
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles.emptySlot}>
                  <div className={styles.emptyIcon}>+</div>
                  <span className={styles.emptyClass}>
                    {slot.requiredClass === '자유' ? '모집중' : slot.requiredClass}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 푸터: 상태 뱃지 */}
      <div className={styles.footer}>
        {showPendingBadge && party.pending_count && party.pending_count > 0 && (
          <span className={styles.pendingBadge}>
            신청 대기 {party.pending_count}건
          </span>
        )}
        {showMyRole && myMember && (
          <span className={styles.myRoleBadge}>
            내 역할: {myMember.character_class}
          </span>
        )}
        {myApplication && (
          <span className={styles.applicationBadge}>
            승인 대기중
          </span>
        )}
        {party.run_count && party.run_count > 1 && (
          <span className={styles.runCountBadge}>
            {party.run_count}회 진행
          </span>
        )}
      </div>
    </Link>
  )
}

export default memo(PartyCard)
