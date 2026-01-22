'use client'

import type { PartyMember } from '@/types/party'
import { SERVERS } from '@/app/constants/servers'
import BreakthroughBadge from './BreakthroughBadge'
import styles from './CharacterTooltip.module.css'

interface CharacterTooltipProps {
  member: PartyMember
}

export default function CharacterTooltip({ member }: CharacterTooltipProps) {
  const serverName = SERVERS.find(s => s.id === String(member.character_server_id))?.name || ''

  const equipment = member.character_equipment as Record<string, { name?: string; grade?: string; enhance?: number }> | null
  const stats = member.character_stats as Record<string, number> | null

  return (
    <div className={styles.tooltip}>
      <div className={styles.header}>
        {member.character_class} Lv{member.character_level} | {serverName}서버
      </div>

      <div className={styles.section}>
        <div className={styles.stat}>
          <span className={styles.label}>아이템레벨:</span>
          <span className={styles.value}>{member.character_item_level || '-'}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>돌파:</span>
          <span className={styles.value}>
            {member.character_breakthrough ? (
              <BreakthroughBadge value={member.character_breakthrough} size="small" />
            ) : '-'}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>전투력:</span>
          <span className={styles.value}>
            {member.character_combat_power
              ? member.character_combat_power.toLocaleString()
              : '-'}
          </span>
        </div>
      </div>

      {equipment && Object.keys(equipment).length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>⚔️ 장비</div>
          {Object.entries(equipment).map(([slot, item]) => (
            <div key={slot} className={styles.equipItem}>
              <span className={styles.equipSlot}>{slot}:</span>
              <span className={styles.equipName}>
                {item?.grade && `[${item.grade}] `}
                {item?.name || '-'}
                {item?.enhance && item.enhance > 0 && ` +${item.enhance}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {stats && Object.keys(stats).length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>📊 능력치</div>
          <div className={styles.statsGrid}>
            {Object.entries(stats).map(([statName, statValue]) => (
              <div key={statName} className={styles.statItem}>
                <span className={styles.statName}>{statName}:</span>
                <span className={styles.statValue}>
                  {typeof statValue === 'number' ? statValue.toLocaleString() : statValue}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
