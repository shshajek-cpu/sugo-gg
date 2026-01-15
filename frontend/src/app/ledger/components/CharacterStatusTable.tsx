'use client'

import { Users, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { LedgerCharacter } from '@/types/ledger'
import styles from './CharacterStatusTable.module.css'

interface ContentProgress {
  id: string
  name: string
  current: number
  max: number
}

interface CharacterStatus {
  character: LedgerCharacter
  todayIncome: number
  weeklyIncome: number
  sellingItemCount: number
  soldItemCount: number
  weeklyContents: ContentProgress[]
  dailyContents: ContentProgress[]
}

interface CharacterStatusTableProps {
  characterStatuses: CharacterStatus[]
  onCharacterClick: (characterId: string) => void
}

const formatKina = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toLocaleString('ko-KR')
}

function ContentProgressCell({ content }: { content: ContentProgress }) {
  const isComplete = content.current >= content.max
  const percentage = content.max > 0 ? (content.current / content.max) * 100 : 0

  return (
    <div className={styles.contentCell}>
      <div className={styles.contentName}>{content.name}</div>
      <div className={styles.contentProgress}>
        <div
          className={styles.contentProgressBar}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className={`${styles.contentCount} ${isComplete ? styles.contentComplete : ''}`}>
        {content.current}/{content.max}
        {isComplete && ' ✓'}
      </div>
    </div>
  )
}

function CharacterRow({ status, onCharacterClick }: { status: CharacterStatus; onCharacterClick: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={styles.characterCard}>
      {/* 캐릭터 헤더 */}
      <div
        className={styles.characterHeader}
        onClick={() => onCharacterClick(status.character.id)}
      >
        <div className={styles.characterInfo}>
          {status.character.profile_image ? (
            <img
              src={status.character.profile_image}
              alt={status.character.name}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {status.character.name[0]}
            </div>
          )}
          <div className={styles.characterDetails}>
            <div className={styles.characterName}>{status.character.name}</div>
            <div className={styles.characterMeta}>
              {status.character.class_name} · {status.character.server_name}
              {status.character.item_level && status.character.item_level > 0 && ` · IL ${status.character.item_level}`}
            </div>
          </div>
        </div>

        {/* 수입 및 아이템 요약 */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>오늘</span>
            <span className={styles.statValue}>{formatKina(status.todayIncome)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>주간</span>
            <span className={styles.statValue}>{formatKina(status.weeklyIncome)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>판매중</span>
            <span className={styles.statValueNeutral}>{status.sellingItemCount}개</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>완료</span>
            <span className={styles.statValueSuccess}>{status.soldItemCount}개</span>
          </div>
        </div>

        <button className={styles.expandBtn} onClick={toggleExpand}>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* 컨텐츠 진행 현황 (확장 시) */}
      {isExpanded && (
        <div className={styles.contentSection}>
          {/* 주간 컨텐츠 */}
          <div className={styles.contentGroup}>
            <h4 className={styles.contentGroupTitle}>주간 컨텐츠</h4>
            <div className={styles.contentGrid}>
              {status.weeklyContents.map(content => (
                <ContentProgressCell key={content.id} content={content} />
              ))}
            </div>
          </div>

          {/* 일일 컨텐츠 */}
          <div className={styles.contentGroup}>
            <h4 className={styles.contentGroupTitle}>일일 컨텐츠</h4>
            <div className={styles.contentGrid}>
              {status.dailyContents.map(content => (
                <ContentProgressCell key={content.id} content={content} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CharacterStatusTable({
  characterStatuses,
  onCharacterClick
}: CharacterStatusTableProps) {
  if (characterStatuses.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <Users size={18} />
            캐릭터별 현황
          </h2>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👤</div>
          <p className={styles.emptyText}>등록된 캐릭터가 없습니다</p>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Users size={18} />
          캐릭터별 현황
        </h2>
        <span className={styles.subtitle}>
          클릭하여 상세 페이지로 이동, 펼쳐서 컨텐츠 확인
        </span>
      </div>

      <div className={styles.characterList}>
        {characterStatuses.map(status => (
          <CharacterRow
            key={status.character.id}
            status={status}
            onCharacterClick={onCharacterClick}
          />
        ))}
      </div>
    </section>
  )
}
