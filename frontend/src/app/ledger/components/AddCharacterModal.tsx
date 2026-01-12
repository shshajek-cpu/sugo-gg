'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Search, UserPlus } from 'lucide-react'
import styles from '../ledger.module.css'
import { SERVERS, SERVER_MAP } from '@/app/constants/servers'
import { RACES, CLASSES } from '@/app/constants/game-data'

// pcId를 직업명으로 변환
const PC_ID_MAP: { [key: number]: string } = {
  7: '검성',
  11: '수호성',
  14: '궁성',
  20: '살성',
  24: '마도성',
  27: '정령성',
  28: '치유성',
  36: '호법성',
  16: '뇌제'
}

function getClassName(pcId: number): string {
  return PC_ID_MAP[pcId] || '알 수 없음'
}

// 디바운스 훅
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface SearchResult {
  character_id: string
  name: string
  level: number
  class_name: string
  server_name: string
  server_id?: string
  race?: string
  profile_image?: string
  item_level?: number
}

interface AddCharacterModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (character: {
    name: string
    class_name: string
    server_name: string
    character_id?: string
    profile_image?: string
    race?: string
    item_level?: number
  }) => void
}

export default function AddCharacterModal({
  isOpen,
  onClose,
  onAdd
}: AddCharacterModalProps) {
  const [server, setServer] = useState('')
  const [race, setRace] = useState('')
  const [name, setName] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [error, setError] = useState('')

  // 디바운스된 검색어
  const debouncedName = useDebounce(name, 300)

  // 자동 검색
  useEffect(() => {
    if (!isOpen) return
    if (debouncedName.trim().length >= 2) {
      handleSearch()
    } else {
      setSearchResults([])
      setError('')
    }
  }, [debouncedName, server, race, isOpen])

  if (!isOpen) return null

  const handleSearch = async () => {
    const searchName = name.trim()
    if (searchName.length < 2) {
      return
    }

    setIsSearching(true)
    setError('')

    try {
      // POST 방식으로 검색 API 호출
      const res = await fetch('/api/search/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: searchName,
          serverId: server || undefined,
          race: race === 'ELYOS' ? 1 : race === 'ASMODIANS' ? 2 : undefined,
          page: 1
        })
      })

      if (res.ok) {
        const data = await res.json()
        const list = data.list || data.characters || []
        if (list.length > 0) {
          setSearchResults(list.slice(0, 10).map((c: any) => {
            // HTML 태그 제거 (API가 <strong>태그</strong> 형식으로 반환)
            const cleanName = (c.name || '').replace(/<[^>]*>/g, '')
            // 프로필 이미지 URL 처리 (상대 경로면 전체 URL로 변환)
            const rawImg = c.profileImageUrl || c.profile_image || c.profileImage || ''
            let profileImg = rawImg
            if (rawImg.startsWith('/')) {
              // 프로필 이미지는 profileimg.plaync.com 도메인 사용
              profileImg = `https://profileimg.plaync.com${rawImg}`
            }
            // 종족 (1=천족, 2=마족)
            const raceValue = c.race === 1 ? '천족' : c.race === 2 ? '마족' : c.race_name || c.raceName || ''
            return {
              character_id: c.characterId || c.character_id || c.id,
              name: cleanName,
              level: c.level || 0,
              class_name: c.class_name || c.className || getClassName(c.pcId),
              server_name: c.serverName || c.server_name || SERVER_MAP[c.serverId] || '알 수 없음',
              server_id: c.serverId || c.server_id,
              race: raceValue,
              profile_image: profileImg,
              item_level: c.itemLevel || c.item_level || 0
            }
          }))
          setError('')
        } else {
          setSearchResults([])
          setError('검색 결과가 없습니다')
        }
      } else {
        setError('검색 중 오류가 발생했습니다')
      }
    } catch (e) {
      console.error('Search error:', e)
      setError('검색 중 오류가 발생했습니다')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelect = (result: SearchResult) => {
    onAdd({
      name: result.name,
      class_name: result.class_name,
      server_name: result.server_name,
      character_id: result.character_id,
      profile_image: result.profile_image,
      race: result.race,
      item_level: result.item_level
    })
    handleClose()
  }

  const handleManualAdd = () => {
    if (!name.trim()) {
      setError('캐릭터 이름을 입력해주세요')
      return
    }

    const selectedServer = SERVERS.find(s => s.id === server)
    const selectedRace = RACES.find(r => r.id === race)

    onAdd({
      name: name.trim(),
      class_name: 'Unknown',
      server_name: selectedServer?.name || '알 수 없음',
      race: selectedRace?.id
    })
    handleClose()
  }

  const handleClose = () => {
    setServer('')
    setRace('')
    setName('')
    setSearchResults([])
    setError('')
    onClose()
  }

  return (
    <div className={styles.modal} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <UserPlus size={20} style={{ marginRight: 8 }} />
            캐릭터 등록
          </h3>
          <button className={styles.modalClose} onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* 종족 선택 버튼 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>종족</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => { setRace('ELYOS'); setServer(''); }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: race === 'ELYOS' ? '#3b82f6' : '#27282e',
                  color: race === 'ELYOS' ? '#fff' : '#a5a8b4'
                }}
              >
                천족
              </button>
              <button
                type="button"
                onClick={() => { setRace('ASMODIANS'); setServer(''); }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: race === 'ASMODIANS' ? '#ef4444' : '#27282e',
                  color: race === 'ASMODIANS' ? '#fff' : '#a5a8b4'
                }}
              >
                마족
              </button>
            </div>
          </div>

          {/* 서버 선택 (종족 선택 후 표시) */}
          {race && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>서버</label>
              <select
                className={styles.formSelect}
                value={server}
                onChange={(e) => setServer(e.target.value)}
              >
                <option value="">서버 선택</option>
                {SERVERS
                  .filter(s => race === 'ELYOS' ? s.id.startsWith('1') : s.id.startsWith('2'))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>캐릭터 이름</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="2글자 이상 입력하면 자동 검색"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {error && (
            <p style={{ color: '#e52f28', fontSize: 13, marginBottom: 12 }}>
              {error}
            </p>
          )}

          {isSearching && (
            <div className={styles.loading}>검색 중...</div>
          )}

          {searchResults.length > 0 && (
            <div className={styles.searchResults}>
              {searchResults.map((result) => (
                <div
                  key={result.character_id}
                  className={styles.searchResult}
                  onClick={() => handleSelect(result)}
                >
                  {result.profile_image ? (
                    <img
                      src={result.profile_image}
                      alt={result.name}
                      className={styles.searchResultAvatar}
                      onError={(e) => {
                        // 이미지 로드 실패 시 기본 아바타로 대체
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove(styles.hidden)
                      }}
                    />
                  ) : null}
                  <div
                    className={`${styles.searchResultAvatar} ${result.profile_image ? styles.hidden : ''}`}
                    style={{
                      background: '#27282e',
                      display: result.profile_image ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#a5a8b4'
                    }}
                  >
                    {result.name[0]}
                  </div>
                  <div className={styles.searchResultInfo}>
                    <div className={styles.searchResultName}>
                      {result.name}
                      {result.race && (
                        <span style={{
                          marginLeft: 8,
                          fontSize: 11,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: result.race === '천족' ? '#3b82f6' : '#ef4444',
                          color: '#fff'
                        }}>
                          {result.race}
                        </span>
                      )}
                    </div>
                    <div className={styles.searchResultMeta}>
                      Lv.{result.level} · {result.class_name} · {result.server_name}
                      {result.item_level ? ` · 아이템 ${result.item_level}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary} onClick={handleClose}>
            취소
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleManualAdd}
            disabled={!name.trim()}
          >
            수동 등록
          </button>
        </div>
      </div>
    </div>
  )
}
