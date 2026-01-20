'use client'

import { useMemo } from 'react'
import Link from 'next/link'
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

const DUNGEON_TYPE_ICONS: Record<string, string> = {
  transcend: '🏰',
  expedition: '🗺️',
  sanctuary: '⚔️',
  subjugation: '👹',
  pvp: '🎮'
}

// 던전 이름 → 이미지 경로 매핑
const DUNGEON_IMAGE_MAP: Record<string, string> = {
  // 초월
  '데우스의 연구기지': '/메달/초월/데우스 연구기지.png',
  '데우스 연구기지': '/메달/초월/데우스 연구기지.png',
  '조각난 아르카나스': '/메달/초월/조각난 아르카니스.png',
  '조각난 아르카니스': '/메달/초월/조각난 아르카니스.png',

  // 원정
  '크라오 동굴': '/메달/원정/크라오동굴.png',
  '크라오동굴': '/메달/원정/크라오동굴.png',
  '우루구구 협곡': '/메달/원정/우루구구 협곡.png',
  '불의 신전': '/메달/원정/불의신전.png',
  '불의신전': '/메달/원정/불의신전.png',
  '드라웁니르': '/메달/원정/드라웁니르.png',
  '바크론의 공중섬': '/메달/원정/바크론의 공중섬.png',
  '사나운 뿔 암굴': '/메달/원정/사나운 뿔암굴.png',
  '사나운 뿔암굴': '/메달/원정/사나운 뿔암굴.png',

  // 성역
  '루드라': '/메달/성역/루드라.png',

  // 토벌전
  '토벌전': '/메달/주간컨텐츠/토벌전.png',

  // PVP
  '아레나': '/boss/5.png',
  '전장': '/boss/6.png',
}

// 던전 이름으로 보스 이미지 경로 반환
function getBossImagePath(dungeonType: string, dungeonName: string): string {
  // 직접 매핑된 이미지가 있으면 사용
  if (DUNGEON_IMAGE_MAP[dungeonName]) {
    return DUNGEON_IMAGE_MAP[dungeonName]
  }

  // 기본 이미지
  return '/boss/1.png'
}

export default function PartyCard({
  party,
  showPendingBadge = false,
  showMyRole = false,
  myMember,
  myApplication
}: PartyCardProps) {
  const isPvp = party.dungeon_type === 'pvp'

  const currentMembers = party.current_members ||
    party.members?.filter(m => m.status === 'approved').length || 0

  const timeDisplay = useMemo(() => {
    if (party.is_immediate) {
      return {
        icon: '⚡',
        label: '즉시 진행',
        timeAgo: `등록 ${getRelativeTime(party.created_at)}`
      }
    }

    if (!party.scheduled_date || !party.scheduled_time_start) {
      return null
    }

    const hour = parseInt(party.scheduled_time_start.split(':')[0])
    const timeRef = getTimeOfDay(hour)
    const icon = getTimeOfDayIcon(timeRef)
    const label = getTimeOfDayLabel(timeRef)
    const date = new Date(party.scheduled_date)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}(${['일', '월', '화', '수', '목', '금', '토'][date.getDay()]})`

    return {
      icon: icon,
      label: `${label} ${party.scheduled_time_start.slice(0, 5)}`,
      date: dateStr,
      remaining: getRemainingTime(party.scheduled_date, party.scheduled_time_start)
    }
  }, [party])

  const serverName = SERVERS.find(s => s.id === String(party.character_server_id))?.name || ''

  // 슬롯 상태 표시
  const slotsDisplay = useMemo(() => {
    if (!party.slots) return []

    const approvedMembers = party.members?.filter(m => m.status === 'approved') || []

    return party.slots.map(slot => {
      const member = approvedMembers.find(m => m.slot_id === slot.id)
      const isFilled = slot.status === 'filled' || !!member
      const classLabel = slot.required_class || '자유'

      return {
        id: slot.id,
        label: classLabel,
        isFilled,
        member
      }
    })
  }, [party.slots, party.members])

  const bossImage = getBossImagePath(party.dungeon_type, party.dungeon_name)

  return (
    <Link
      href={`/party/${party.id}`}
      className={`${styles.card} ${isPvp ? styles.pvp : styles.pve}`}
      style={{
        backgroundImage: `url(${bossImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center right',
      }}
    >
      {/* 배경 오버레이 */}
      <div className={styles.bgOverlay} />

      <div className={styles.header}>
        <span className={styles.dungeonType}>
          {DUNGEON_TYPE_ICONS[party.dungeon_type]} {party.dungeon_name}
          {party.dungeon_tier && ` ${party.dungeon_tier}단`}
          {party.run_count && party.run_count > 1 && ` ${party.run_count}회`}
        </span>
        <span className={styles.status}>
          [{party.status === 'recruiting' ? '모집중' : party.status === 'full' ? '마감' : party.status}
          {currentMembers}/{party.max_members}]
        </span>
      </div>

      {party.title && (
        <div className={styles.title}>{party.title}</div>
      )}

      {timeDisplay && (
        <div className={styles.timeBox}>
          <span className={styles.timeIcon}>{timeDisplay.icon}</span>
          <span className={styles.timeLabel}>{timeDisplay.label}</span>
          {timeDisplay.date && (
            <>
              <span className={styles.timeSeparator}>|</span>
              <span className={styles.timeDate}>{timeDisplay.date}</span>
            </>
          )}
          <span className={styles.timeRemaining}>
            {timeDisplay.remaining || timeDisplay.timeAgo}
          </span>
        </div>
      )}

      {(party.min_item_level || party.min_breakthrough || party.min_combat_power) && (
        <div className={styles.specs}>
          조건:
          {party.min_item_level && ` 아이템${party.min_item_level}+`}
          {party.min_breakthrough && ` | 돌파${party.min_breakthrough}+`}
          {party.min_combat_power && ` | 전투력${(party.min_combat_power / 10000).toFixed(0)}만+`}
        </div>
      )}

      <div className={styles.slots}>
        모집:
        {slotsDisplay.slice(0, 8).map(slot => (
          <span
            key={slot.id}
            className={`${styles.slot} ${slot.isFilled ? styles.filled : styles.empty}`}
          >
            [{slot.label}{slot.isFilled ? '✓' : '○'}]
          </span>
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.leader}>
          👤 {party.character_class} Lv{party.character_level || '?'} {serverName}
        </span>
        {showPendingBadge && party.pending_count && party.pending_count > 0 && (
          <span className={styles.pendingBadge}>
            신청 대기: {party.pending_count}건 🔴
          </span>
        )}
        {showMyRole && myMember && (
          <span className={styles.myRole}>
            내 역할: {myMember.character_class}
          </span>
        )}
        {myApplication && (
          <span className={styles.myApplication}>
            신청 상태: 승인 대기 중...
          </span>
        )}
      </div>
    </Link>
  )
}
