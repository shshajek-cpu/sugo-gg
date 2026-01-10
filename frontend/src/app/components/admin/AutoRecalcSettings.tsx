'use client'

import { useState, useEffect } from 'react'
import DSCard from '../design-system/DSCard'
import DSButton from '../design-system/DSButton'
import DSBadge from '../design-system/DSBadge'

interface Settings {
    auto_recalc_enabled: boolean
    auto_recalc_interval: 'hourly' | 'daily' | 'weekly'
    auto_recalc_batch_size: number
    auto_recalc_time: string
    last_auto_recalc: string | null
    last_auto_recalc_count: number
    cron_secret: string
}

const DEFAULT_SETTINGS: Settings = {
    auto_recalc_enabled: false,
    auto_recalc_interval: 'daily',
    auto_recalc_batch_size: 50,
    auto_recalc_time: '03:00',
    last_auto_recalc: null,
    last_auto_recalc_count: 0,
    cron_secret: ''
}

export default function AutoRecalcSettings() {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [showSecret, setShowSecret] = useState(false)
    const [cronUrl, setCronUrl] = useState('')

    useEffect(() => {
        fetchSettings()
        // Cron URL 생성
        if (typeof window !== 'undefined') {
            setCronUrl(`${window.location.origin}/api/cron/recalc?secret=YOUR_SECRET`)
        }
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings')
            const data = await res.json()
            if (data.settings) {
                setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err)
        } finally {
            setLoading(false)
        }
    }

    const saveSettings = async () => {
        setSaving(true)
        setMessage(null)

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings })
            })

            const data = await res.json()

            if (data.success) {
                setMessage({ type: 'success', text: '설정이 저장되었습니다!' })
            } else {
                setMessage({ type: 'error', text: data.error || '저장 실패' })
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setSaving(false)
        }
    }

    const generateSecret = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let secret = ''
        for (let i = 0; i < 32; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setSettings({ ...settings, cron_secret: secret })
    }

    const copyCronUrl = () => {
        const url = `${window.location.origin}/api/cron/recalc?secret=${settings.cron_secret}`
        navigator.clipboard.writeText(url)
        setMessage({ type: 'success', text: 'Cron URL이 복사되었습니다!' })
    }

    const intervalLabels = {
        hourly: '매시간',
        daily: '매일',
        weekly: '매주'
    }

    if (loading) {
        return (
            <DSCard title="자동 재계산 설정" hoverEffect={false} style={{ padding: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    로딩 중...
                </div>
            </DSCard>
        )
    }

    return (
        <DSCard title="자동 재계산 설정" hoverEffect={false} style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* 활성화 토글 */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: settings.auto_recalc_enabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    border: `1px solid ${settings.auto_recalc_enabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}`
                }}>
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>자동 재계산</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Cron으로 주기적 실행
                        </div>
                    </div>
                    <button
                        onClick={() => setSettings({ ...settings, auto_recalc_enabled: !settings.auto_recalc_enabled })}
                        style={{
                            width: '50px',
                            height: '26px',
                            borderRadius: '13px',
                            border: 'none',
                            background: settings.auto_recalc_enabled ? '#10B981' : '#374151',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'background 0.2s'
                        }}
                    >
                        <div style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: 'white',
                            position: 'absolute',
                            top: '2px',
                            left: settings.auto_recalc_enabled ? '26px' : '2px',
                            transition: 'left 0.2s'
                        }} />
                    </button>
                </div>

                {/* 실행 간격 */}
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                        실행 간격
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(['hourly', 'daily', 'weekly'] as const).map(interval => (
                            <button
                                key={interval}
                                onClick={() => setSettings({ ...settings, auto_recalc_interval: interval })}
                                style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    border: `1px solid ${settings.auto_recalc_interval === interval ? '#FACC15' : 'rgba(255,255,255,0.1)'}`,
                                    background: settings.auto_recalc_interval === interval ? 'rgba(250, 204, 21, 0.1)' : 'rgba(0,0,0,0.2)',
                                    color: settings.auto_recalc_interval === interval ? '#FACC15' : 'var(--text-secondary)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 500
                                }}
                            >
                                {intervalLabels[interval]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 실행 시간 (daily/weekly만) */}
                {settings.auto_recalc_interval !== 'hourly' && (
                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                            실행 시간
                        </label>
                        <input
                            type="time"
                            value={settings.auto_recalc_time}
                            onChange={(e) => setSettings({ ...settings, auto_recalc_time: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: 'var(--text-main)',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>
                )}

                {/* 배치 사이즈 */}
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                        배치 사이즈 (한 번에 처리할 캐릭터 수)
                    </label>
                    <input
                        type="number"
                        min="10"
                        max="500"
                        value={settings.auto_recalc_batch_size}
                        onChange={(e) => setSettings({ ...settings, auto_recalc_batch_size: parseInt(e.target.value) || 50 })}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            color: 'var(--text-main)',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>

                {/* Cron 비밀키 */}
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                        Cron 비밀키 (외부 호출 인증용)
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type={showSecret ? 'text' : 'password'}
                            value={settings.cron_secret}
                            onChange={(e) => setSettings({ ...settings, cron_secret: e.target.value })}
                            placeholder="비밀키를 입력하거나 생성하세요"
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: 'var(--text-main)',
                                fontSize: '0.85rem',
                                fontFamily: 'monospace'
                            }}
                        />
                        <button
                            onClick={() => setShowSecret(!showSecret)}
                            style={{
                                padding: '0.5rem 0.75rem',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                            }}
                        >
                            {showSecret ? '숨김' : '보기'}
                        </button>
                        <button
                            onClick={generateSecret}
                            style={{
                                padding: '0.5rem 0.75rem',
                                background: 'rgba(250, 204, 21, 0.1)',
                                border: '1px solid rgba(250, 204, 21, 0.3)',
                                borderRadius: '6px',
                                color: '#FACC15',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                            }}
                        >
                            생성
                        </button>
                    </div>
                </div>

                {/* Cron URL */}
                {settings.cron_secret && (
                    <div style={{
                        padding: '0.75rem',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            Cron URL (이 URL을 cron-job.org 등에 등록하세요)
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <code style={{
                                flex: 1,
                                fontSize: '0.7rem',
                                color: '#60A5FA',
                                wordBreak: 'break-all'
                            }}>
                                {`${typeof window !== 'undefined' ? window.location.origin : ''}/api/cron/recalc?secret=${settings.cron_secret}`}
                            </code>
                            <button
                                onClick={copyCronUrl}
                                style={{
                                    padding: '0.4rem 0.6rem',
                                    background: 'rgba(96, 165, 250, 0.1)',
                                    border: '1px solid rgba(96, 165, 250, 0.3)',
                                    borderRadius: '4px',
                                    color: '#60A5FA',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                복사
                            </button>
                        </div>
                    </div>
                )}

                {/* 마지막 실행 정보 */}
                {settings.last_auto_recalc && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '6px',
                        fontSize: '0.8rem'
                    }}>
                        <span style={{ color: 'var(--text-secondary)' }}>마지막 실행</span>
                        <span style={{ color: 'var(--text-main)' }}>
                            {new Date(settings.last_auto_recalc).toLocaleString('ko-KR')}
                            <span style={{ color: '#34D399', marginLeft: '0.5rem' }}>
                                ({settings.last_auto_recalc_count}개 처리)
                            </span>
                        </span>
                    </div>
                )}

                {/* 메시지 */}
                {message && (
                    <div style={{
                        padding: '0.75rem',
                        background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: '6px',
                        color: message.type === 'success' ? '#34D399' : '#EF4444',
                        fontSize: '0.85rem'
                    }}>
                        {message.text}
                    </div>
                )}

                {/* 저장 버튼 */}
                <DSButton
                    variant="primary"
                    onClick={saveSettings}
                    disabled={saving}
                    style={{ width: '100%' }}
                >
                    {saving ? '저장 중...' : '설정 저장'}
                </DSButton>
            </div>
        </DSCard>
    )
}
