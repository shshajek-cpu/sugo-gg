'use client'

import { useState, useRef, useEffect, CSSProperties } from 'react'
import { SimulatorCharacter, SimulatorEquipment, SimulatorEquipmentDetail } from '../page'
import { aggregateStats } from '../../../lib/statsAggregator'

interface SimulatorHeaderProps {
  onCharacterSelect: (char: SimulatorCharacter) => void
  onReset: () => void
  hasCharacter: boolean
  hasChanges: boolean
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  addLog?: (message: string) => void
}

interface SearchResult {
  characterId: string
  name: string
  serverId: number
  serverName: string
  className: string
  level: number
  race: string
}

// 종족별 서버 목록
const ELYOS_SERVERS = [
  { id: 1001, name: '시엘' }, { id: 1002, name: '네자칸' }, { id: 1003, name: '바이젤' },
  { id: 1004, name: '카이시넬' }, { id: 1005, name: '유스티엘' }, { id: 1006, name: '아리엘' },
  { id: 1007, name: '프레기온' }, { id: 1008, name: '메스람타에다' }, { id: 1009, name: '히타니에' },
  { id: 1010, name: '나니아' }, { id: 1011, name: '타하바타' }, { id: 1012, name: '루터스' },
  { id: 1013, name: '페르노스' }, { id: 1014, name: '다미누' }, { id: 1015, name: '카사카' },
  { id: 1016, name: '바카르마' }, { id: 1017, name: '챈가룽' }, { id: 1018, name: '코치룽' },
  { id: 1019, name: '이슈타르' }, { id: 1020, name: '티아마트' }, { id: 1021, name: '포에타' },
]

const ASMODIAN_SERVERS = [
  { id: 2001, name: '이스라펠' }, { id: 2002, name: '지켈' }, { id: 2003, name: '트리니엘' },
  { id: 2004, name: '루미엘' }, { id: 2005, name: '마르쿠탄' }, { id: 2006, name: '아스펠' },
  { id: 2007, name: '에레슈키갈' }, { id: 2008, name: '브리트라' }, { id: 2009, name: '네몬' },
  { id: 2010, name: '하달' }, { id: 2011, name: '루드라' }, { id: 2012, name: '울고른' },
  { id: 2013, name: '무닌' }, { id: 2014, name: '오다르' }, { id: 2015, name: '젠카카' },
  { id: 2016, name: '크로메데' }, { id: 2017, name: '콰이링' }, { id: 2018, name: '바바룽' },
  { id: 2019, name: '파프니르' }, { id: 2020, name: '인드나흐' }, { id: 2021, name: '이스할겐' },
]

export default function SimulatorHeader({
  onCharacterSelect,
  onReset,
  hasCharacter,
  hasChanges,
  isLoading,
  setIsLoading,
  addLog,
}: SimulatorHeaderProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const [selectedRace, setSelectedRace] = useState<'elyos' | 'asmodian'>('elyos')
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // 현재 종족에 맞는 서버 목록
  const currentServers = selectedRace === 'elyos' ? ELYOS_SERVERS : ASMODIAN_SERVERS

  // 종족 변경 시 서버 선택 초기화
  const handleRaceChange = (race: 'elyos' | 'asmodian') => {
    setSelectedRace(race)
    setSelectedServerId(null)
    addLog?.(`종족 변경: ${race === 'elyos' ? '천족' : '마족'}`)
  }

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 검색 실행
  const performSearch = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    const raceNum = selectedRace === 'elyos' ? 1 : 2
    addLog?.(`검색 API 호출: "${term}" (${selectedRace === 'elyos' ? '천족' : '마족'}${selectedServerId ? ', 서버: ' + selectedServerId : ''})`)
    try {
      // POST 메서드로 호출 (API 스펙에 맞춤)
      const res = await fetch('/api/search/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: term,
          race: raceNum,
          serverId: selectedServerId || undefined
        })
      })
      const data = await res.json()

      // API 응답은 'list' 배열
      if (data.list && Array.isArray(data.list)) {
        addLog?.(`검색 결과: ${data.list.length}건 (DB: ${data.dbCount}, API: ${data.apiCount})`)

        // SearchResult 형식으로 변환
        const results: SearchResult[] = data.list.slice(0, 10).map((item: any) => ({
          characterId: item.characterId,
          name: item.name?.replace(/<[^>]*>/g, '') || item.name, // HTML 태그 제거
          serverId: item.serverId,
          serverName: item.serverName || `서버${item.serverId}`,
          className: item.className || item.jobName || '알수없음',
          level: item.level || 0,
          race: item.race === 1 ? 'elyos' : 'asmodian',
        }))

        setSearchResults(results)
        setShowDropdown(true)
      }
    } catch (err) {
      addLog?.(`검색 오류: ${err}`)
      console.error('[SimulatorHeader] Search error:', err)
    } finally {
      setSearching(false)
    }
  }

  // 입력 변경 핸들러 (디바운스)
  const handleInputChange = (value: string) => {
    setSearchTerm(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }

  // 캐릭터 선택 핸들러
  const handleSelectResult = async (result: SearchResult) => {
    setIsLoading(true)
    setShowDropdown(false)
    setSearchTerm(result.name)

    addLog?.(`캐릭터 API 호출: ${result.name} (ID: ${result.characterId})`)

    try {
      // 캐릭터 상세 정보 로드
      const res = await fetch(`/api/character?id=${result.characterId}&server=${result.serverId}`)
      const data = await res.json()

      if (data.error) {
        addLog?.(`캐릭터 로드 실패: ${data.error}`)
        console.error('[SimulatorHeader] Character load error:', data.error)
        return
      }

      addLog?.(`캐릭터 데이터 수신 완료`)

      // 장비 데이터 맵핑
      const character = mapToSimulatorCharacter(data, result)
      onCharacterSelect(character)
    } catch (err) {
      addLog?.(`캐릭터 로드 오류: ${err}`)
      console.error('[SimulatorHeader] Load error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // API 응답을 SimulatorCharacter로 변환
  const mapToSimulatorCharacter = (data: any, result: SearchResult): SimulatorCharacter => {
    const rawEquipment = data.equipment?.equipmentList || []

    // 장비 분류
    const equipment: SimulatorEquipment[] = []
    const accessories: SimulatorEquipment[] = []
    const arcana: SimulatorEquipment[] = []

    // 슬롯 포지션 맵 (게임 실제 데이터 기준)
    const slotPosToName: Record<number, string> = {
      1: '주무기', 2: '보조무기',
      3: '투구', 4: '견갑', 5: '흉갑', 6: '장갑', 7: '각반', 8: '장화',
      10: '목걸이', 11: '귀걸이1', 12: '귀걸이2',
      13: '반지1', 14: '반지2', 15: '팔찌1', 16: '팔찌2',
      17: '허리띠', 19: '망토', 22: '아뮬렛', 23: '룬1', 24: '룬2',
      41: '아르카나1', 42: '아르카나2', 43: '아르카나3', 44: '아르카나4', 45: '아르카나5',
    }

    rawEquipment.forEach((item: any) => {
      const slotPos = item.slotPos || 0

      // 아이템레벨 추출: detail._raw.level에서 가져옴 (아이템 상세 API)
      const itemLevel = item.detail?._raw?.level || item.itemLevel || item.level || 0
      // 착용가능 레벨 추출: detail._raw.equipLevel에서 가져옴
      const requiredLevel = item.detail?._raw?.equipLevel || item.requiredLevel || item.equipLevel || 0

      // detail과 _raw를 제외한 원본 필드 복사 (디버그용)
      const rawCopy: Record<string, unknown> = {}
      Object.keys(item).forEach(key => {
        if (key !== 'detail') {
          rawCopy[key] = item[key]
        }
      })

      const mapped: SimulatorEquipment = {
        slotPos,
        slotName: slotPosToName[slotPos] || item.slotPosName || '알수없음',
        name: item.name || '빈 슬롯',
        grade: item.grade,
        icon: item.icon,
        itemLevel,
        requiredLevel,
        enchantLevel: item.enchantLevel,
        exceedLevel: item.exceedLevel,
        stats: extractStats(item),
        detail: extractDetail(item),
        _raw: rawCopy,  // API 원본 데이터 저장
      }

      // 슬롯 위치에 따라 분류 (게임 실제 데이터 기준)
      if (slotPos >= 41 && slotPos <= 45) {
        arcana.push(mapped)
      } else if (slotPos >= 10 && slotPos <= 24) {
        // 장신구: 10-22 (목걸이, 귀걸이, 반지, 팔찌, 허리띠, 망토, 아뮬렛, 룬)
        accessories.push(mapped)
      } else if (slotPos >= 1 && slotPos <= 8) {
        equipment.push(mapped)
      }
    })

    // statList에서 기본 정보 추출
    const statList = data.stats?.statList || []
    const itemLevelStat = statList.find((s: any) => s.name === '아이템레벨' || s.type === 'ItemLevel')
    const combatPowerStat = statList.find((s: any) => s.name === '전투력')

    // aggregateStats를 사용하여 전체 능력치 계산 (캐릭터 상세 페이지와 동일)
    const allEquipment = data.equipment?.equipmentList || []
    const titles = data.titles || null
    const daevanionData = data.daevanion || null
    const statsData = data.stats || null
    const equippedTitleId = data.profile?.equipTitleId

    const aggregatedStatDetails = aggregateStats(
      allEquipment,
      titles,
      daevanionData,
      statsData,
      equippedTitleId
    )

    // StatDetail 배열을 Record<string, number>로 변환
    const stats: Record<string, number> = {}
    aggregatedStatDetails.forEach(statDetail => {
      // 고정값 + 퍼센트 합산 (퍼센트 전용 스탯은 퍼센트만)
      const isPercentageOnly = [
        '전투 속도', '이동 속도', '피해 증폭', '피해 내성',
        '치명타 피해 증폭', '치명타 피해 내성', '다단 히트 적중', '다단 히트 저항',
        '완벽', '완벽 저항', '재생', '재생 관통', '철벽', '철벽 관통',
        '재사용 시간', '재사용 시간 감소'
      ].includes(statDetail.name)

      if (isPercentageOnly) {
        stats[statDetail.name] = statDetail.totalValue + statDetail.totalPercentage
      } else {
        stats[statDetail.name] = statDetail.totalValue
        // 퍼센트가 있으면 별도로 저장
        if (statDetail.totalPercentage > 0) {
          stats[`${statDetail.name} %`] = statDetail.totalPercentage
        }
      }
    })

    // 전투력과 아이템레벨도 추가
    if (combatPowerStat?.value) stats['전투력'] = combatPowerStat.value
    if (itemLevelStat?.value) stats['아이템레벨'] = itemLevelStat.value

    return {
      id: result.characterId,
      name: result.name,
      server: result.serverName,
      serverId: result.serverId,
      className: result.className || data.profile?.className || '알수없음',
      level: result.level || data.profile?.characterLevel || 0,
      race: result.race || data.profile?.raceName || '',
      itemLevel: itemLevelStat?.value || data.profile?.itemLevel,
      combatPower: combatPowerStat?.value || data.profile?.combatPower,
      profileImage: data.profile?.profileImage,
      equipment,
      accessories,
      arcana,
      stats,  // 실제 능력치 전달
    }
  }

  // 아이템에서 스탯 추출
  const extractStats = (item: any): Record<string, number> => {
    const stats: Record<string, number> = {}

    // 기본 스탯
    if (item.attack) stats['공격력'] = item.attack
    if (item.defense) stats['방어력'] = item.defense
    if (item.hp) stats['생명력'] = item.hp

    // 상세 스탯 (있다면)
    if (item.detail?.statList) {
      item.detail.statList.forEach((stat: any) => {
        if (stat.name && stat.value) {
          stats[stat.name] = (stats[stat.name] || 0) + stat.value
        }
      })
    }

    return stats
  }

  // 아이템에서 상세 정보 추출 (마석, 신석, 옵션 등)
  const extractDetail = (item: any): SimulatorEquipmentDetail | undefined => {
    if (!item.detail) return undefined

    const detail: SimulatorEquipmentDetail = {}

    // 기본 옵션
    if (item.detail.options && Array.isArray(item.detail.options)) {
      detail.options = item.detail.options.map((opt: any) => ({
        name: opt.name,
        value: opt.value
      }))
    }

    // 랜덤 옵션
    if (item.detail.randomOptions && Array.isArray(item.detail.randomOptions)) {
      detail.randomOptions = item.detail.randomOptions.map((opt: any) => ({
        name: opt.name,
        value: opt.value
      }))
    }

    // 마석
    if (item.detail.manastones && Array.isArray(item.detail.manastones)) {
      detail.manastones = item.detail.manastones.map((stone: any) => ({
        type: stone.type || stone.name,
        value: stone.value,
        grade: stone.grade
      }))
    }

    // 신석
    if (item.detail.godstones && Array.isArray(item.detail.godstones)) {
      detail.godstones = item.detail.godstones.map((stone: any) => ({
        name: stone.name,
        desc: stone.desc,
        grade: stone.grade,
        icon: stone.icon
      }))
    }

    // 영혼각인 (soulImprints 또는 _raw에서 추출)
    if (item.detail._raw?.soulImprintStat && Array.isArray(item.detail._raw.soulImprintStat)) {
      detail.soulImprints = item.detail._raw.soulImprintStat.map((imprint: any) => ({
        name: imprint.name,
        value: imprint.value
      }))
    }

    // _raw 전체 저장 (디버그용)
    if (item.detail._raw) {
      (detail as any)._raw = item.detail._raw
    }

    return Object.keys(detail).length > 0 ? detail : undefined
  }

  const buttonStyle: CSSProperties = {
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* 타이틀 */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          marginBottom: '8px',
        }}>
          캐릭터{' '}
          <span style={{
            color: 'var(--sim-accent)',
            textShadow: '0 0 30px var(--sim-accent-glow)',
          }}>
            시뮬레이터
          </span>
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--sim-text-muted)' }}>
          장비를 변경하고 스탯 변화를 미리 확인하세요
        </p>
      </div>

      {/* 종족/서버 선택 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        marginBottom: '16px',
      }}>
        {/* 종족 선택 버튼 */}
        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--sim-border)' }}>
          <button
            onClick={() => handleRaceChange('elyos')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: selectedRace === 'elyos' ? 'rgba(59, 130, 246, 0.3)' : 'var(--sim-bg-card)',
              color: selectedRace === 'elyos' ? '#60a5fa' : 'var(--sim-text-muted)',
              transition: 'all 0.2s',
            }}
          >
            천족
          </button>
          <button
            onClick={() => handleRaceChange('asmodian')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              borderLeft: '1px solid var(--sim-border)',
              cursor: 'pointer',
              backgroundColor: selectedRace === 'asmodian' ? 'rgba(239, 68, 68, 0.3)' : 'var(--sim-bg-card)',
              color: selectedRace === 'asmodian' ? '#f87171' : 'var(--sim-text-muted)',
              transition: 'all 0.2s',
            }}
          >
            마족
          </button>
        </div>

        {/* 서버 선택 */}
        <select
          value={selectedServerId || ''}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : null
            setSelectedServerId(val)
            addLog?.(`서버 변경: ${val ? currentServers.find(s => s.id === val)?.name : '전체'}`)
          }}
          style={{
            padding: '8px 12px',
            fontSize: '13px',
            backgroundColor: 'var(--sim-bg-card)',
            border: '1px solid var(--sim-border)',
            borderRadius: '8px',
            color: 'var(--sim-text-primary)',
            cursor: 'pointer',
            minWidth: '120px',
          }}
        >
          <option value="">전체 서버</option>
          {currentServers.map(server => (
            <option key={server.id} value={server.id}>{server.name}</option>
          ))}
        </select>
      </div>

      {/* 검색 영역 */}
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}>
        {/* 검색 입력 */}
        <div ref={dropdownRef} style={{ position: 'relative', width: '320px' }}>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            placeholder="캐릭터 이름 검색..."
            style={{
              width: '100%',
              padding: '12px 16px',
              paddingLeft: '44px',
              fontSize: '14px',
              backgroundColor: 'var(--sim-bg-card)',
              border: '1px solid var(--sim-border)',
              borderRadius: '10px',
              color: 'var(--sim-text-primary)',
              outline: 'none',
              transition: 'all 0.2s',
            }}
          />
          {/* 검색 아이콘 */}
          <div style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--sim-text-muted)',
          }}>
            {searching ? (
              <div style={{
                width: '18px',
                height: '18px',
                border: '2px solid var(--sim-accent)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            )}
          </div>

          {/* 검색 결과 드롭다운 */}
          {showDropdown && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              backgroundColor: 'var(--sim-bg-card)',
              border: '1px solid var(--sim-border)',
              borderRadius: '10px',
              boxShadow: '0 16px 32px rgba(0,0,0,0.4)',
              maxHeight: '320px',
              overflowY: 'auto',
              zIndex: 100,
            }}>
              {searchResults.map((result, idx) => (
                <div
                  key={`${result.characterId}-${idx}`}
                  onClick={() => handleSelectResult(result)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: idx < searchResults.length - 1 ? '1px solid var(--sim-border)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sim-bg-elevated)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{result.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--sim-text-muted)', marginTop: '2px' }}>
                        Lv.{result.level} · {result.className} · {result.serverName}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: result.race === 'elyos' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: result.race === 'elyos' ? '#60a5fa' : '#f87171',
                    }}>
                      {result.race === 'elyos' ? '천족' : '마족'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 버튼들 */}
        {hasCharacter && (
          <button
            onClick={onReset}
            disabled={!hasChanges || isLoading}
            style={{
              ...buttonStyle,
              backgroundColor: hasChanges ? 'var(--sim-bg-elevated)' : 'var(--sim-bg-card)',
              color: hasChanges ? 'var(--sim-text-primary)' : 'var(--sim-text-muted)',
              border: '1px solid var(--sim-border)',
              opacity: hasChanges ? 1 : 0.5,
              cursor: hasChanges ? 'pointer' : 'not-allowed',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            초기화
          </button>
        )}
      </div>

      {/* 로딩 표시 */}
      {isLoading && (
        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          color: 'var(--sim-text-muted)',
          fontSize: '13px',
        }}>
          캐릭터 정보를 불러오는 중...
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus {
          border-color: var(--sim-accent) !important;
          box-shadow: 0 0 0 3px var(--sim-accent-glow) !important;
        }
      `}</style>
    </div>
  )
}
