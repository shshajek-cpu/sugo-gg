'use client'

import { useState } from 'react'
import styles from './DebugPanel.module.css'

interface DebugLog {
  timestamp: string
  type: 'load' | 'save' | 'error' | 'info'
  message: string
  data?: any
}

interface DebugPanelProps {
  logs: DebugLog[]
  currentState: {
    characterId: string | null
    baseTickets: Record<string, number>
    bonusTickets: Record<string, number>
    odEnergy: {
      timeEnergy: number
      ticketEnergy: number
    }
  }
}

export default function DebugPanel({ logs, currentState }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const copyToClipboard = () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      characterId: currentState.characterId,
      baseTickets: currentState.baseTickets,
      bonusTickets: currentState.bonusTickets,
      odEnergy: currentState.odEnergy,
      logs: logs.slice(-20) // 최근 20개 로그
    }

    const text = JSON.stringify(debugInfo, null, 2)
    navigator.clipboard.writeText(text)
    alert('디버그 정보가 클립보드에 복사되었습니다!')
  }

  const clearLogs = () => {
    // 부모 컴포넌트에서 로그를 관리해야 하므로, 여기서는 표시만
  }

  if (!isOpen) {
    return (
      <button className={styles.toggleBtn} onClick={() => setIsOpen(true)}>
        🐛 디버그
      </button>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3>🐛 디버그 패널</h3>
        <div className={styles.actions}>
          <button className={styles.copyBtn} onClick={copyToClipboard}>
            📋 복사
          </button>
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
            ✕
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {/* 현재 상태 */}
        <div className={styles.section}>
          <h4>현재 상태</h4>
          <div className={styles.info}>
            <div><strong>캐릭터 ID:</strong> {currentState.characterId || 'null'}</div>
            <div><strong>오드 에너지:</strong> {currentState.odEnergy.timeEnergy} + {currentState.odEnergy.ticketEnergy}</div>
          </div>

          <div className={styles.tickets}>
            <div className={styles.ticketGroup}>
              <strong>기본 이용권:</strong>
              <pre>{JSON.stringify(currentState.baseTickets, null, 2)}</pre>
            </div>
            <div className={styles.ticketGroup}>
              <strong>보너스 이용권:</strong>
              <pre>{JSON.stringify(currentState.bonusTickets, null, 2)}</pre>
            </div>
          </div>
        </div>

        {/* 로그 */}
        <div className={styles.section}>
          <h4>로그 ({logs.length})</h4>
          <div className={styles.logs}>
            {logs.length === 0 ? (
              <div className={styles.noLogs}>로그가 없습니다.</div>
            ) : (
              logs.slice(-30).reverse().map((log, idx) => (
                <div key={idx} className={`${styles.log} ${styles[log.type]}`}>
                  <div className={styles.logHeader}>
                    <span className={styles.timestamp}>{log.timestamp}</span>
                    <span className={styles.type}>{log.type.toUpperCase()}</span>
                  </div>
                  <div className={styles.message}>{log.message}</div>
                  {log.data && (
                    <pre className={styles.data}>{JSON.stringify(log.data, null, 2)}</pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 로그 생성 헬퍼
export function createDebugLog(
  type: 'load' | 'save' | 'error' | 'info',
  message: string,
  data?: any
): DebugLog {
  return {
    timestamp: new Date().toLocaleTimeString('ko-KR'),
    type,
    message,
    data
  }
}
