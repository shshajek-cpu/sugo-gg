'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type HistoryItem = {
  id: number
  power: number
  level: number
  captured_at: string
}

type CharacterData = {
  id: number
  name: string
  server: string
  class: string
  level: number
  power: number
  updated_at: string
  rank?: number
  power_change?: number
  level_change?: number
  stats?: Record<string, number>
  warning?: string
}

export default function CharacterDetail() {
  const { server, name } = useParams()
  const router = useRouter()
  const [data, setData] = useState<CharacterData | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  const [activeTab, setActiveTab] = useState<'basic' | 'combat'>('basic')

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

  useEffect(() => {
    setLoading(true)
    setError(null)

    // Parallel fetch for potential optimization, but keeping simple for reliability first
    fetch(`${API_BASE_URL}/api/characters/search?server=${server}&name=${name}`)
      .then(res => {
        if (!res.ok) throw new Error(`서버 응답 오류 (Status: ${res.status})`)
        return res.json()
      })
      .then(d => {
        setData(d)
        setLoading(false)

        if (d.id) {
          setHistoryLoading(true)
          fetch(`${API_BASE_URL}/api/characters/${d.id}/history?limit=30`)
            .then(res => res.ok ? res.json() : [])
            .then(data => {
              // Reverse to show oldest to newest on graph
              setHistory(data.reverse() || [])
              setHistoryLoading(false)
            })
            .catch(() => setHistoryLoading(false))
        }
      })
      .catch(err => {
        setError(err.message || '캐릭터 정보를 불러올 수 없습니다.')
        setLoading(false)
      })
  }, [server, name])

  const handleRefresh = () => {
    window.location.reload()
  }

  // 로딩 상태
  if (loading) return <DashboardSkeleton />

  // 에러 상태
  if (error) return <ErrorState error={error} />

  // 데이터 없음
  if (!data) return <EmptyState />

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* A. Profile Header */}
      <ProfileHeader
        data={data}
        onRefresh={handleRefresh}
        onCompare={() => router.push('/compare')}
      />

      {/* Grid Layout for Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginTop: '1.5rem'
      }}>

        {/* Left Column: Main Stats */}
        <div style={{ gridColumn: 'span 2' }}>
          {/* B. KPI Grid */}
          <KPIGrid data={data} />

          {/* C. Trend Section */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '1.1rem' }}>
              📈 전투력 변화 추이 (최근 30회)
            </h3>
            <PowerTrendChart history={history} loading={historyLoading} />
          </div>
        </div>

        {/* Right Column: Detailed Stats & Extras */}
        <div style={{ gridColumn: 'span 1' }}>
          {/* D. Stats Panel */}
          <div className="card" style={{ height: '100%' }}>
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
              <button
                onClick={() => setActiveTab('basic')}
                style={{
                  background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer',
                  color: activeTab === 'basic' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'basic' ? 'bold' : 'normal',
                  borderBottom: activeTab === 'basic' ? '2px solid var(--primary)' : '2px solid transparent'
                }}
              >
                기본 정보
              </button>
              <button
                onClick={() => setActiveTab('combat')}
                style={{
                  background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer',
                  color: activeTab === 'combat' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'combat' ? 'bold' : 'normal',
                  borderBottom: activeTab === 'combat' ? '2px solid var(--primary)' : '2px solid transparent'
                }}
              >
                세부 스탯
              </button>
            </div>

            <StatsTable data={data} type={activeTab} />
          </div>
        </div>
      </div>

      {/* F. Footer Info */}
      <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-disabled)' }}>
        <p>
          Data Source based on AION Official Ranking Page.<br />
          랭킹에 등재된 캐릭터만 검색 가능하며, 실시간 데이터가 아닐 수 있습니다.
        </p>
      </div>
    </div>
  )
}

// Sub-components

function ProfileHeader({ data, onRefresh, onCompare }: { data: CharacterData, onRefresh: () => void, onCompare: () => void }) {
  const timeAgo = (dateStr: string) => {
    try {
      const diff = new Date().getTime() - new Date(dateStr).getTime()
      const mins = Math.floor(diff / 60000)
      if (mins < 60) return `${mins}분 전`
      const hours = Math.floor(mins / 60)
      if (hours < 24) return `${hours}시간 전`
      return `${Math.floor(hours / 24)}일 전`
    } catch { return '-' }
  }

  return (
    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Avatar Placeholder */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'var(--bg-main)', border: '2px solid var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem'
        }}>
          {data.class ? data.class[0] : '?'}
        </div>

        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {data.name}
            <span className="badge" style={{ fontSize: '0.8rem', background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
              {data.server}
            </span>
          </h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Lv.{data.level} {data.class} |
            <span style={{ marginLeft: '0.5rem', color: data.warning ? 'var(--warning)' : 'var(--success)' }}>
              ● {data.warning ? '캐시된 정보' : '최근 갱신됨'}
            </span>
            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--text-disabled)' }}>
              ({timeAgo(data.updated_at)})
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn-outline" onClick={onRefresh}>
          🔄 갱신
        </button>
        <button className="btn-outline" onClick={onCompare}>
          ⚖️ 비교
        </button>
        <button className="btn" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
          ★
        </button>
      </div>
    </div>
  )
}

function KPIGrid({ data }: { data: CharacterData }) {
  const renderChange = (val: number | undefined, label: string) => {
    if (!val) return <span style={{ color: 'var(--text-disabled)', fontSize: '0.8rem' }}>변동 없음</span>
    const color = val > 0 ? 'var(--success)' : 'var(--danger)'
    return <span style={{ color, fontWeight: 'bold' }}>{val > 0 ? '+' : ''}{val.toLocaleString()}</span>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      {/* Main KPI: Power */}
      <div className="card" style={{ background: 'linear-gradient(145deg, var(--bg-secondary), rgba(250, 204, 21, 0.05))', border: '1px solid rgba(250, 204, 21, 0.2)' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>전투력</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>
          {data.power.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
          어제 대비 {renderChange(data.power_change, '전투력')}
        </div>
      </div>

      {/* Sub KPI: Global Rank */}
      <div className="card">
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>통합 랭킹</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
          {data.rank ? `#${data.rank}` : '-'}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          상세 순위권 진입
        </div>
      </div>

      {/* Sub KPI: Level */}
      <div className="card">
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>레벨</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
          Lv. {data.level}
        </div>
        <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
          변동 {renderChange(data.level_change, 'Lv')}
        </div>
      </div>
    </div>
  )
}

function PowerTrendChart({ history, loading }: { history: HistoryItem[], loading: boolean }) {
  if (loading) return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>로딩 중...</div>
  if (!history || history.length < 2) return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-disabled)' }}>데이터 누적 후 차트가 표시됩니다.</div>

  // Simple SVG chart implementation
  const maxPower = Math.max(...history.map(h => h.power))
  const minPower = Math.min(...history.map(h => h.power))
  const range = maxPower - minPower || 1

  const chartWidth = 100 // percentage
  const chartHeight = 250
  const padding = 40

  const points = history.map((item, i) => {
    const x = (i / (history.length - 1)) * (chartWidth - padding * 2) + padding
    const y = chartHeight - padding - ((item.power - minPower) / range) * (chartHeight - padding * 2)
    return { x, y, power: item.power, date: item.captured_at }
  })

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`

  return (
    <div style={{ position: 'relative', width: '100%', height: '300px' }}>
      <svg width="100%" height={chartHeight} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1={padding}
            y1={padding + (chartHeight - padding * 2) * i / 4}
            x2={chartWidth - padding}
            y2={padding + (chartHeight - padding * 2) * i / 4}
            stroke="rgba(255,255,255,0.1)"
            strokeDasharray="3,3"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#gradient)" />

        {/* Line */}
        <path d={pathData} fill="none" stroke="rgb(59, 130, 246)" strokeWidth="2" />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="rgb(59, 130, 246)" />
            <title>{`${new Date(p.date).toLocaleDateString()}: ${p.power.toLocaleString()}`}</title>
          </g>
        ))}

        {/* Y-axis labels */}
        <text x={padding - 10} y={padding} textAnchor="end" fill="#9CA3AF" fontSize="12">
          {(maxPower / 1000).toFixed(0)}k
        </text>
        <text x={padding - 10} y={chartHeight - padding} textAnchor="end" fill="#9CA3AF" fontSize="12">
          {(minPower / 1000).toFixed(0)}k
        </text>
      </svg>

      {/* Legend */}
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0 40px' }}>
        <span>{new Date(history[0].captured_at).toLocaleDateString()}</span>
        <span>{new Date(history[history.length - 1].captured_at).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

function StatsTable({ data, type }: { data: CharacterData, type: 'basic' | 'combat' }) {
  if (!data.stats) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-disabled)' }}>
        수집된 상세 스탯 정보가 없습니다.<br />
        <span style={{ fontSize: '0.8rem' }}>게임 내 정보공개 설정이 필요할 수 있습니다.</span>
      </div>
    )
  }

  // Example mapping, this should be refined based on actual backend stats_json keys
  // Assuming backend returns: { "hp": 1000, "mp": 500, "attack": 120, ... }
  const basicKeys = ['hp', 'mp', 'speed', 'flight_speed', 'attack_speed', 'casting_speed']
  const combatKeys = ['attack', 'accuracy', 'critical', 'magic_boost', 'magic_accuracy', 'defense', 'magic_suppression', 'parry', 'block', 'evasion']

  const keysToShow = type === 'basic' ? basicKeys : combatKeys

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {keysToShow.map(key => {
          const val = data.stats?.[key]
          // Clean key name for display
          const label = key.replace(/_/g, ' ').toUpperCase()

          if (val === undefined) return null

          return (
            <tr key={key} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.8rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{label}</td>
              <td style={{ padding: '0.8rem 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-main)' }}>
                {val.toLocaleString()}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// Loading & Error Components
function DashboardSkeleton() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="card" style={{ height: '100px', marginBottom: '1.5rem', background: 'var(--bg-secondary)', animation: 'pulse 2s infinite' }}></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div style={{ gridColumn: 'span 2', height: '400px', background: 'var(--bg-secondary)', borderRadius: '8px' }}></div>
        <div style={{ height: '400px', background: 'var(--bg-secondary)', borderRadius: '8px' }}></div>
      </div>
    </div>
  )
}

function ErrorState({ error }: { error: string }) {
  return (
    <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
      <div className="card" style={{ border: '1px solid var(--danger)' }}>
        <h2 style={{ color: 'var(--danger)' }}>⚠️ 오류 발생</h2>
        <p>{error}</p>
        <button className="btn" onClick={() => window.location.href = '/'}>홈으로 돌아가기</button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
      <div className="card">
        <h2>정보를 찾을 수 없습니다</h2>
        <button className="btn" onClick={() => window.location.href = '/'}>홈으로 돌아가기</button>
      </div>
    </div>
  )
}
