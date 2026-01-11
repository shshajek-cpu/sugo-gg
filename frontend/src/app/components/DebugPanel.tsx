'use client'

import { useState, useEffect } from 'react'
import { debugLogger, LogEntry } from '@/utils/debugLogger'
import { Terminal, X, Copy, Trash2, ChevronUp, ChevronDown } from 'lucide-react'

export default function DebugPanel() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)

    useEffect(() => {
        setLogs(debugLogger.getLogs())
        const unsubscribe = debugLogger.subscribe((newLogs) => {
            setLogs(newLogs)
        })
        return () => { unsubscribe() }
    }, [])

    const handleCopy = () => {
        const text = logs.map(l => {
            const time = new Date(l.timestamp).toLocaleTimeString()
            const dataStr = l.data ? `\nData: ${JSON.stringify(l.data, null, 2)}` : ''
            return `[${time}] [${l.level.toUpperCase()}] ${l.message}${dataStr}`
        }).join('\n-------------------\n')
        
        navigator.clipboard.writeText(text).then(() => {
            alert('로그가 클립보드에 복사되었습니다.')
        })
    }

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 9999,
                    background: 'rgba(0,0,0,0.8)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    borderRadius: '50%',
                    width: '48px',
                    height: '48px',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}
            >
                <Terminal size={24} />
            </button>
        )
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: isMinimized ? '300px' : '600px',
            height: isMinimized ? 'auto' : '400px',
            zIndex: 9999,
            background: '#0c0c0d',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            fontFamily: 'monospace',
            overflow: 'hidden',
            fontSize: '12px'
        }}>
            <div style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#e5e7eb'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Terminal size={14} color="#f59e0b" />
                    <span style={{ fontWeight: 600 }}>Debug Console ({logs.length})</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                     <button onClick={handleCopy} title="Copy All" style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
                        <Copy size={14} />
                    </button>
                    <button onClick={() => debugLogger.clear()} title="Clear" style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                    </button>
                    <button onClick={() => setIsMinimized(!isMinimized)} title={isMinimized ? "Maximize" : "Minimize"} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
                        {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => setIsOpen(false)} title="Close" style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
                        <X size={16} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}>
                    {logs.length === 0 ? (
                        <div style={{ color: '#666', padding: '20px', textAlign: 'center' }}>No logs yet...</div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={log.timestamp + i} style={{
                                padding: '4px 8px',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                color: log.level === 'error' ? '#ef4444' : log.level === 'warn' ? '#f59e0b' : '#9ca3af'
                            }}>
                                <span style={{ color: '#555', marginRight: '8px' }}>
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span style={{ marginRight: '8px', fontWeight: 'bold' }}>
                                    [{log.level.toUpperCase()}]
                                </span>
                                <span>{log.message}</span>
                                {log.data && (
                                    <pre style={{ 
                                        margin: '4px 0 0 0', 
                                        padding: '4px',
                                        background: 'rgba(0,0,0,0.3)', 
                                        borderRadius: '4px',
                                        overflowX: 'auto',
                                        color: '#d1d5db'
                                    }}>
                                        {JSON.stringify(log.data, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
