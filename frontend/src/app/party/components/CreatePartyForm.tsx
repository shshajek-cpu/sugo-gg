'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMyCharacters } from '@/hooks/useMyCharacters'
import { useAuth } from '@/context/AuthContext'
import type { DungeonType, CreatePartyRequest, PartyUserCharacter } from '@/types/party'
import { SERVERS } from '@/app/constants/servers'
import { CLASSES } from '@/app/constants/game-data'
import styles from './CreatePartyForm.module.css'

const DUNGEON_TYPES: { value: DungeonType; label: string; maxMembers: number }[] = [
  { value: 'transcend', label: '초월', maxMembers: 4 },
  { value: 'expedition', label: '원정', maxMembers: 4 },
  { value: 'sanctuary', label: '성역', maxMembers: 8 },
  { value: 'subjugation', label: '토벌전', maxMembers: 4 },
  { value: 'pvp', label: 'PVP', maxMembers: 4 }
]

interface DungeonData {
  id: string
  name: string
  tiers?: number[]
}

interface SlotConfig {
  slot_number: number
  party_number: number
  required_class: string | null
}

export default function CreatePartyForm() {
  const router = useRouter()
  const { session } = useAuth()
  const { characters, loading: loadingCharacters } = useMyCharacters({ accessToken: session?.access_token })

  const [dungeonType, setDungeonType] = useState<DungeonType>('transcend')
  const [dungeons, setDungeons] = useState<DungeonData[]>([])
  const [selectedDungeon, setSelectedDungeon] = useState<DungeonData | null>(null)
  const [selectedTier, setSelectedTier] = useState<number>(1)
  const [isImmediate, setIsImmediate] = useState(true)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTimeStart, setScheduledTimeStart] = useState('21:00')
  const [scheduledTimeEnd, setScheduledTimeEnd] = useState('23:00')
  const [runCount, setRunCount] = useState(1)
  const [minItemLevel, setMinItemLevel] = useState<number | undefined>()
  const [minBreakthrough, setMinBreakthrough] = useState<number | undefined>()
  const [minCombatPower, setMinCombatPower] = useState<number | undefined>()
  const [joinType, setJoinType] = useState<'approval' | 'first_come'>('approval')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState<PartyUserCharacter | null>(null)
  const [slots, setSlots] = useState<SlotConfig[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maxMembers = DUNGEON_TYPES.find(d => d.value === dungeonType)?.maxMembers || 4

  // 던전 데이터 로드
  useEffect(() => {
    fetch('/api/ledger/dungeon-data')
      .then(res => res.json())
      .then(data => {
        // 던전 타입에 맞게 데이터 변환
        const dungeonList: DungeonData[] = []

        if (dungeonType === 'transcend' && data.transcendDungeons) {
          data.transcendDungeons.forEach((d: { id: string; name: string }) => {
            dungeonList.push({
              id: d.id,
              name: d.name,
              tiers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            })
          })
        } else if (dungeonType === 'expedition' && data.expeditionDungeons) {
          data.expeditionDungeons.forEach((d: { id: string; name: string }) => {
            dungeonList.push({ id: d.id, name: d.name })
          })
        } else if (dungeonType === 'sanctuary' && data.sanctuaryDungeons) {
          data.sanctuaryDungeons.forEach((d: { id: string; name: string }) => {
            dungeonList.push({ id: d.id, name: d.name })
          })
        } else if (dungeonType === 'subjugation') {
          dungeonList.push({ id: 'subjugation', name: '토벌전' })
        } else if (dungeonType === 'pvp') {
          dungeonList.push({ id: 'arena', name: '아레나' })
          dungeonList.push({ id: 'battlefield', name: '전장' })
        }

        setDungeons(dungeonList)
        if (dungeonList.length > 0) {
          setSelectedDungeon(dungeonList[0])
        }
      })
      .catch(err => console.error('Failed to load dungeon data:', err))
  }, [dungeonType])

  // 슬롯 초기화
  useEffect(() => {
    const newSlots: SlotConfig[] = []
    for (let i = 1; i <= maxMembers; i++) {
      newSlots.push({
        slot_number: i,
        party_number: i <= 4 ? 1 : 2,
        required_class: null
      })
    }
    setSlots(newSlots)
  }, [maxMembers])

  // 캐릭터 자동 선택
  useEffect(() => {
    if (characters.length > 0 && !selectedCharacter) {
      setSelectedCharacter(characters[0])
    }
  }, [characters, selectedCharacter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCharacter) {
      setError('캐릭터를 선택해주세요.')
      return
    }

    if (!selectedDungeon) {
      setError('던전을 선택해주세요.')
      return
    }

    if (!title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      if (!session?.access_token) {
        setError('로그인이 필요합니다.')
        setSubmitting(false)
        return
      }

      const requestData: CreatePartyRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        dungeon_type: dungeonType,
        dungeon_id: selectedDungeon.id,
        dungeon_name: selectedDungeon.name,
        dungeon_tier: selectedDungeon.tiers ? selectedTier : undefined,
        is_immediate: isImmediate,
        scheduled_date: !isImmediate ? scheduledDate : undefined,
        scheduled_time_start: !isImmediate ? scheduledTimeStart : undefined,
        scheduled_time_end: !isImmediate ? scheduledTimeEnd : undefined,
        run_count: runCount,
        max_members: maxMembers,
        join_type: joinType,
        min_item_level: minItemLevel,
        min_breakthrough: minBreakthrough,
        min_combat_power: minCombatPower,
        character_name: selectedCharacter.character_name,
        character_class: selectedCharacter.character_class,
        character_server_id: selectedCharacter.character_server_id,
        character_level: selectedCharacter.character_level,
        character_item_level: selectedCharacter.character_item_level,
        character_breakthrough: selectedCharacter.character_breakthrough,
        character_combat_power: selectedCharacter.character_combat_power,
        slots: slots.map(s => ({
          ...s,
          required_class: s.required_class || undefined
        }))
      }

      const response = await fetch('/api/party', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '파티 생성에 실패했습니다.')
      }

      const data = await response.json()
      router.push(`/party/${data.party.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '파티 생성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateSlotClass = (index: number, className: string | null) => {
    setSlots(prev => {
      const newSlots = [...prev]
      newSlots[index] = { ...newSlots[index], required_class: className }
      return newSlots
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* 캐릭터 선택 - 최상단 카드형 */}
      <div className={styles.characterSection}>
        <h3 className={styles.sectionTitle}>파티장 캐릭터 선택</h3>
        {loadingCharacters ? (
          <div className={styles.loadingState}>불러오는 중...</div>
        ) : characters.length === 0 ? (
          <div className={styles.emptyState}>
            <p>등록된 캐릭터가 없습니다.</p>
            <p className={styles.emptyHint}>상단 "내 모집 캐릭터"에서 먼저 등록해주세요.</p>
          </div>
        ) : (
          <div className={styles.characterCards}>
            {characters.map(char => {
              const serverName = SERVERS.find(s => s.id === String(char.character_server_id))?.name || ''
              const isSelected = selectedCharacter?.id === char.id
              return (
                <button
                  key={char.id}
                  type="button"
                  className={`${styles.characterCard} ${isSelected ? styles.selected : ''}`}
                  onClick={() => setSelectedCharacter(char)}
                >
                  <div className={styles.cardProfile}>
                    {char.profile_image ? (
                      <img src={char.profile_image} alt={char.character_name} className={styles.cardProfileImg} />
                    ) : (
                      <div className={styles.cardProfilePlaceholder}>
                        {char.character_class?.charAt(0) || '?'}
                      </div>
                    )}
                    {isSelected && <span className={styles.selectedBadge}>✓</span>}
                  </div>
                  <div className={styles.cardInfo}>
                    <span className={styles.cardName}>{char.character_name}</span>
                    <span className={styles.cardClass}>{char.character_class}</span>
                    <span className={styles.cardMeta}>{serverName} · Lv{char.character_level || '?'}</span>
                  </div>
                  <div className={styles.cardStats}>
                    {char.character_item_level && (
                      <span className={styles.cardStat}>아이템 {char.character_item_level}</span>
                    )}
                    {char.character_pve_score && (
                      <span className={styles.cardStat}>PVE {(char.character_pve_score / 10000).toFixed(1)}만</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 던전 선택 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>던전 선택</h3>
        <div className={styles.dungeonTypes}>
          {DUNGEON_TYPES.map(type => (
            <button
              key={type.value}
              type="button"
              className={`${styles.typeButton} ${dungeonType === type.value ? styles.active : ''} ${type.value === 'pvp' ? styles.pvp : ''}`}
              onClick={() => setDungeonType(type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>

        {dungeons.length > 0 && (
          <div className={styles.dungeonSelect}>
            <label>보스/맵</label>
            <select
              value={selectedDungeon?.id || ''}
              onChange={e => {
                const dungeon = dungeons.find(d => d.id === e.target.value)
                setSelectedDungeon(dungeon || null)
              }}
            >
              {dungeons.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}

        {selectedDungeon?.tiers && (
          <div className={styles.tierSelect}>
            <label>단계</label>
            <div className={styles.tiers}>
              {selectedDungeon.tiers.map(tier => (
                <button
                  key={tier}
                  type="button"
                  className={`${styles.tierButton} ${selectedTier === tier ? styles.active : ''}`}
                  onClick={() => setSelectedTier(tier)}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 진행 방식 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>진행 방식</h3>
        <div className={styles.radioGroup}>
          <label className={styles.radio}>
            <input
              type="radio"
              checked={isImmediate}
              onChange={() => setIsImmediate(true)}
            />
            <span>⚡ 즉시 진행 - 지금 바로 파티원 모집</span>
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              checked={!isImmediate}
              onChange={() => setIsImmediate(false)}
            />
            <span>📅 예약 진행 - 약속 시간에 시작</span>
          </label>
        </div>

        {!isImmediate && (
          <div className={styles.scheduleInputs}>
            <div className={styles.inputGroup}>
              <label>날짜</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>시작 시간</label>
              <input
                type="time"
                value={scheduledTimeStart}
                onChange={e => setScheduledTimeStart(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>종료 시간</label>
              <input
                type="time"
                value={scheduledTimeEnd}
                onChange={e => setScheduledTimeEnd(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* 진행 횟수 */}
      <div className={styles.section}>
        <div className={styles.runCount}>
          <label>진행 횟수:</label>
          <button type="button" onClick={() => setRunCount(Math.max(1, runCount - 1))}>-</button>
          <span>{runCount}회</span>
          <button type="button" onClick={() => setRunCount(Math.min(10, runCount + 1))}>+</button>
        </div>
      </div>

      {/* 스펙 조건 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>스펙 조건 (선택)</h3>
        <div className={styles.specInputs}>
          <div className={styles.specInput}>
            <input
              type="checkbox"
              checked={!!minItemLevel}
              onChange={e => setMinItemLevel(e.target.checked ? 500 : undefined)}
            />
            <label>최소 아이템레벨:</label>
            <input
              type="number"
              value={minItemLevel || ''}
              onChange={e => setMinItemLevel(Number(e.target.value) || undefined)}
              disabled={!minItemLevel}
              placeholder="510"
            />
          </div>
          <div className={styles.specInput}>
            <input
              type="checkbox"
              checked={!!minBreakthrough}
              onChange={e => setMinBreakthrough(e.target.checked ? 10 : undefined)}
            />
            <label>최소 돌파횟수:</label>
            <input
              type="number"
              value={minBreakthrough || ''}
              onChange={e => setMinBreakthrough(Number(e.target.value) || undefined)}
              disabled={!minBreakthrough}
              placeholder="15"
            />
          </div>
          <div className={styles.specInput}>
            <input
              type="checkbox"
              checked={!!minCombatPower}
              onChange={e => setMinCombatPower(e.target.checked ? 100000 : undefined)}
            />
            <label>최소 전투력:</label>
            <input
              type="number"
              value={minCombatPower || ''}
              onChange={e => setMinCombatPower(Number(e.target.value) || undefined)}
              disabled={!minCombatPower}
              placeholder="140000"
            />
          </div>
        </div>
      </div>

      {/* 파티 슬롯 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>파티 슬롯 (본인 포함 {maxMembers}명)</h3>
        <div className={styles.slots}>
          {slots.map((slot, index) => (
            <div key={index} className={styles.slotRow}>
              <span className={styles.slotLabel}>
                {maxMembers > 4 && `${slot.party_number}파 `}슬롯{slot.slot_number}
                {index === 0 && ' (나)'}:
              </span>
              {index === 0 ? (
                <span className={styles.leaderSlot}>
                  {selectedCharacter
                    ? `${selectedCharacter.character_class} Lv${selectedCharacter.character_level || '?'} ${selectedCharacter.character_name}`
                    : '캐릭터를 선택해주세요'
                  }
                </span>
              ) : (
                <select
                  value={slot.required_class || ''}
                  onChange={e => updateSlotClass(index, e.target.value || null)}
                >
                  <option value="">자유 (제한없음)</option>
                  {CLASSES.map(cls => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
        <p className={styles.slotNote}>※ 해당 직업만 신청 가능, 슬롯이 차면 신청 마감</p>
      </div>

      {/* 참가 방식 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>참가 방식</h3>
        <div className={styles.radioGroup}>
          <label className={styles.radio}>
            <input
              type="radio"
              checked={joinType === 'approval'}
              onChange={() => setJoinType('approval')}
            />
            <span>승인제: 파티장이 신청자 확인 후 수락</span>
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              checked={joinType === 'first_come'}
              onChange={() => setJoinType('first_come')}
            />
            <span>선착순: 조건 충족시 바로 참여</span>
          </label>
        </div>
      </div>

      {/* 제목/설명 */}
      <div className={styles.section}>
        <div className={styles.inputGroup}>
          <label>제목</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="초월 10단 3회 편하게~"
            maxLength={50}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>설명 (선택)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="ㄴㅇㄹ 필수, 숙련자 환영"
            rows={2}
          />
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button
        type="submit"
        className={styles.submitButton}
        disabled={submitting || !selectedCharacter}
      >
        {submitting ? '생성 중...' : '파티 모집 등록'}
      </button>
    </form>
  )
}
