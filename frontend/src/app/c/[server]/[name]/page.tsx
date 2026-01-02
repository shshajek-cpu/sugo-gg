'use client'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import CharacterHeader from '../../../components/CharacterHeader'
import PowerDisplay from '../../../components/PowerDisplay'
import EquipmentGrid from '../../../components/EquipmentGrid'
import StatCard from '../../../components/StatCard'
import TitleSystem from '../../../components/TitleSystem'
import DevanionBoard from '../../../components/DevanionBoard'
import { supabaseApi, CharacterDetail, SERVER_NAME_TO_ID } from '../../../../lib/supabaseApi'

// --- Types mapping to UI components ---
type CharacterData = {
  id: number
  name: string
  server: string
  class: string
  level: number
  power: number
  power_index?: number
  tier_rank?: string
  percentile?: number
  rank?: number
  updated_at: string
  power_change?: number
  level_change?: number
  stats?: Record<string, number>
  warning?: string
  race?: string
  title?: string
  character_image_url?: string
  item_level?: number
}

// --- Helper Functions for Data Mapping ---

const mapEquipment = (rawEquipment: any): { equipment: any[], accessories: any[] } => {
  if (!rawEquipment?.equipmentList) return { equipment: [], accessories: [] }

  const list = rawEquipment.equipmentList
  const equipment: any[] = []
  const accessories: any[] = []

  // Slot mapping from AION API naming to our UI Naming
  const slotMap: Record<string, string> = {
    'Main Hand': '주무기', 'Sub Hand': '보조무기',
    'Head': '투구', 'Shoulder': '견갑', 'Torso': '흉갑', 'Glove': '장갑', 'Pants': '각반', 'Shoes': '장화', 'Waist': '허리띠', 'Wing': '망토',
    'Earring 1': '귀걸이1', 'Earring 2': '귀걸이2', 'Necklace': '목걸이',
    'Ring 1': '반지1', 'Ring 2': '반지2', 'Belt': '허리띠' // check duplicated waist/belt
  }
  // Note: Actual API Strings might be in Korean or different format.
  // Assuming the API returns Korean slot names? Or we default to using the raw category name if valid.

  list.forEach((item: any) => {
    // Attempt to map slot or use categoryName directly
    const slotName = item.categoryName || item.slotName

    // Determine target list based on slot type
    const isAccessory = ['귀걸이', '목걸이', '반지', '팔찌', '깃털', '날개'].some(k => slotName?.includes(k))

    const mappedItem = {
      slot: slotName,
      name: item.itemName,
      enhancement: item.enchantLevel > 0 ? `+${item.enchantLevel}` : '',
      tier: item.gradeCode || 3, // Fallback tier
      image: item.image || item.itemArt,
      category: item.categoryName,
      soulEngraving: item.soulEngraving ? { grade: item.soulEngraving.grade, percentage: item.soulEngraving.value } : undefined,
      manastones: item.manastoneList?.map((m: any) => ({ type: m.name, value: m.point })) || []
    }

    if (isAccessory) {
      accessories.push(mappedItem)
    } else {
      equipment.push(mappedItem)
    }
  })

  return { equipment, accessories }
}

const mapStats = (rawStats: any): any[] => {
  if (!rawStats?.statList) return []

  return rawStats.statList.map((stat: any) => ({
    name: stat.name,
    value: typeof stat.value === 'string' ? parseInt(stat.value.replace(/,/g, '')) : stat.value,
    percentile: undefined, // API usually doesn't give per-stat percentile in this list
    breakdown: undefined // Detailed breakdown might need separate parsing
  }))
}

const mapDevanion = (rawDevanion: any) => {
  if (!rawDevanion?.boardList) return { boards: {}, totalInvestment: 0, globalRank: 0 }

  // Transform logic if needed, currently passing raw structure or empty
  // Assuming UI can handle or we create a simple structure
  return {
    boards: {}, // Implement complex mapping if structure known
    totalInvestment: 0,
    globalRank: 0
  }
}


export default function CharacterDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const raceParam = searchParams.get('race') || undefined

  // URL params are usually encoded so we decode them
  const serverName = decodeURIComponent(params.server as string)
  const charName = decodeURIComponent(params.name as string)

  const [data, setData] = useState<CharacterData | null>(null)
  const [rawData, setRawData] = useState<CharacterDetail | null>(null) // Keep full DB response if needed
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('basic')

  // Mapped Data States
  const [mappedEquipment, setMappedEquipment] = useState<{ equipment: any[], accessories: any[] }>({ equipment: [], accessories: [] })
  const [mappedStats, setMappedStats] = useState<any[]>([])
  // const [mappedDevanion, setMappedDevanion] = ...

  const fetchData = async (refresh = false) => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching data for:', charName, serverName)

      // Map server name to ID for accurate search
      const targetSearchServerId = SERVER_NAME_TO_ID[serverName]

      // Step 1: Search to find ID (Global search to find exact match in any page)
      const searchResults = await supabaseApi.searchCharacter(charName, undefined, raceParam)

      // Filter by server name or ID locally.
      const match = searchResults.find(r => {
        // If we have a verified server ID for the requested server, match strictly by ID
        if (targetSearchServerId && r.server_id) {
          return r.server_id === targetSearchServerId
        }
        // Fallback to name matching
        return r.server === serverName
      })

      if (!match) {
        throw new Error(`'${serverName}' 서버에서 '${charName}' 캐릭터를 찾을 수 없습니다. (ID: ${targetSearchServerId || 'unknown'})`)
      }

      // Step 2: Get Detail
      let detail: CharacterDetail
      // Use the server ID directly from the search result if available.
      // Falls back to parsing server name (which likely fails for strings) or defaults to 1.
      const targetServerId = (match as any).server_id || parseInt(match.server) || 1

      if (refresh) {
        detail = await supabaseApi.refreshCharacter(match.characterId, targetServerId)
      } else {
        detail = await supabaseApi.getCharacterDetail(match.characterId, targetServerId)
      }

      console.log('Got detail:', detail)
      setRawData(detail)

      // Step 3: Map to UI Model
      const mapped: CharacterData = {
        id: detail.server_id,
        name: detail.name,
        server: serverName,
        class: detail.class_name,
        level: detail.level,
        power: detail.combat_power || 0,
        power_index: detail.combat_power,
        updated_at: detail.updated_at || new Date().toISOString(),
        race: detail.race_name,
        character_image_url: detail.profile_image,
        tier_rank: 'Unranked', // TODO: Map from ranking info if available
        percentile: 0,
        rank: 0,
        item_level: 0,
      }

      setData(mapped)

      // Map Sub-Components
      setMappedEquipment(mapEquipment(detail.equipment))
      setMappedStats(mapStats(detail.stats))

    } catch (err: any) {
      console.error(err)
      setError(err.message || '캐릭터 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (serverName && charName) {
      fetchData()
    }
  }, [serverName, charName, raceParam])

  const handleRefresh = () => {
    if (loading) return
    const confirmRefresh = window.confirm('최신 데이터를 강제로 불러오시겠습니까? 시간이 소요될 수 있습니다.')
    if (confirmRefresh) {
      fetchData(true)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1rem', textAlign: 'center', color: '#9CA3AF' }}>
        <div style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>캐릭터 정보를 불러오는 중...</div>
        <div style={{ fontSize: '0.875rem' }}>AION2 서버와 통신하고 있습니다.</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1rem', textAlign: 'center' }}>
        <div style={{
          padding: '2rem',
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          color: '#b91c1c',
          display: 'inline-block'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>오류 발생</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem',
              padding: '0.5rem 1.5rem',
              background: '#b91c1c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            페이지 새로고침
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  // --- Dummy Components Data (REMOVED/REPLACED) ---
  const dummyDevanionData = {
    boards: { '네자칸': { progress: '완료', activeNodes: 45, totalNodes: 45, effects: ['물리 공격력 +5%', '치명타 +120'] } },
    totalInvestment: 0,
    globalRank: 0
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Search/Refresh FAB */}
      <button
        onClick={handleRefresh}
        disabled={loading}
        title="데이터 강제 갱신"
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 50,
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'transform 0.2s',
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1.0)'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2v6h-6"></path>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
          <path d="M3 22v-6h6"></path>
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
        </svg>
      </button>

      {/* Header */}
      <CharacterHeader data={data} />

      {/* Power Display */}
      <div style={{ marginTop: '2rem' }}>
        <PowerDisplay
          combatScore={data.power || 0}
          itemLevel={data.item_level || 0}
          tier={data.tier_rank || 'Unranked'}
          percentile={data.percentile || 0}
        />
      </div>

      {/* Tabs */}
      <div style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          {['basic', 'devanion', 'growth'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.75rem 0',
                marginRight: '1rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                color: activeTab === tab ? '#2563eb' : '#6b7280',
                fontWeight: activeTab === tab ? '600' : '400',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              {tab === 'basic' && '기본 정보'}
              {tab === 'devanion' && '데바니온'}
              {tab === 'growth' && '성장 도표'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <EquipmentGrid equipment={mappedEquipment.equipment} accessories={mappedEquipment.accessories} />

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>상세 스탯</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {mappedStats.map((stat, i) => (
                    <StatCard key={i} statName={stat.name} value={stat.value} percentile={stat.percentile} contribution={stat.contribution} breakdown={stat.breakdown} />
                  ))}
                  {mappedStats.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280', padding: '1rem' }}>표시할 스탯 정보가 없습니다.</div>
                  )}
                </div>
              </div>

              <TitleSystem data={{ totalTitles: 0, collectedTitles: 0, attackTitles: '0/0', defenseTitles: '0/0', miscTitles: '0/0', activeEffects: [] }} />
            </div>
          )}
          {activeTab === 'devanion' && <DevanionBoard data={dummyDevanionData} />}
          {activeTab === 'growth' && (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#f9fafb', borderRadius: '12px', color: '#6b7280' }}>
              준비 중인 기능입니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
