'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { X, Search, ImagePlus, Loader2, Check, Edit3, LogIn } from 'lucide-react'
import { supabaseApi, CharacterSearchResult, SERVER_NAME_TO_ID } from '../lib/supabaseApi'
import { useAuth } from '../context/AuthContext'
import styles from './CharacterUpdateModal.module.css'

// 천족 서버 목록 (SearchBar와 동일)
const ELYOS_SERVERS = [
  '시엘', '네자칸', '바이젤', '카이시넬', '유스티엘', '아리엘', '프레기온',
  '메스람타에다', '히타니에', '나니아', '타하바타', '루터스', '페르노스',
  '다미누', '카사카', '바카르마', '챈가룽', '코치룽', '이슈타르', '티아마트', '포에타'
]

// 마족 서버 목록 (SearchBar와 동일)
const ASMODIAN_SERVERS = [
  '지켈', '트리니엘', '루미엘', '마르쿠탄', '아스펠', '에레슈키갈', '브리트라',
  '네몬', '하달', '루드라', '울고른', '무닌', '오다르', '젠카카', '크로메데',
  '콰이링', '바바룽', '파프니르', '인드나흐', '이스할겐'
]

// 인식된 스탯 타입
interface RecognizedStat {
  name: string
  value: string
  isPercentage: boolean
}

// 검색 결과 캐릭터 타입
interface SearchCharacter {
  characterId: string
  characterName: string
  serverName: string
  serverId: number
  className: string
  level: number
  raceName: string
}

interface CharacterUpdateModalProps {
  isOpen: boolean
  onClose: () => void
}

// 알려진 스탯명 리스트 (StatCapture와 동기화)
const KNOWN_STAT_NAMES = [
  // 기본 스탯
  '공격력', '방어력', '명중', '회피', '치명타', '치명타 저항',
  '생명력', '정신력', '전투 속도', '이동 속도',
  // 피해 스탯
  '관통', '봉혼석 추가 피해', '치명타 공격력', '치명타 방어력',
  '후방 공격력', '후방 방어력', '피해 증폭', '피해 내성',
  '무기 피해 증폭', '무기 피해 내성', '치명타 피해 증폭', '치명타 피해 내성',
  '후방 피해 증폭', '후방 피해 내성',
  // 판정 스탯
  '다단 히트 적중', '다단 히트 저항', '후방 치명타', '후방 치명타 저항',
  '막기 관통', '막기', '철벽 관통', '철벽', '재생 관통', '재생',
  '완벽', '완벽 저항', '강타', '강타 저항',
  // PVP 스탯
  'PVP 공격력', 'PVP 방어력', 'PVP 피해 증폭', 'PVP 피해 내성',
  'PVP 명중', 'PVP 회피', 'PVP 치명타', 'PVP 치명타 저항',
  // PVE 스탯
  'PVE 공격력', 'PVE 방어력', 'PVE 피해 증폭', 'PVE 피해 내성',
  'PVE 명중', 'PVE 회피',
  // 보스 스탯
  '보스 공격력', '보스 방어력', '보스 피해 증폭', '보스 피해 내성',
  // 특수 스탯
  '질주 속도', '비행 속도', '탑승물 지상 이동 속도', '탑승물 질주 행동력 소모',
  '치유 증폭', '받는 치유량', '재사용 시간', '적대치 획득량',
  // 자원 스탯
  '행동력', '비행력',
  '전투 생명력 자연 회복', '비전투 생명력 자연 회복', '생명력 물약 회복 증가', '생명력 물약 회복',
  '전투 정신력 자연 회복', '비전투 정신력 자연 회복', '정신력 소모량', '정신력 획득 증가',
  '전투 행동력 자연 회복', '비전투 행동력 자연 회복',
  '전투 비행력 자연 회복', '비전투 비행력 자연 회복'
]

export default function CharacterUpdateModal({ isOpen, onClose }: CharacterUpdateModalProps) {
  // Google 로그인 인증
  const { session, isAuthenticated, isLoading: isAuthLoading, signInWithGoogle } = useAuth()
  // Step 상태
  const [race, setRace] = useState<'elyos' | 'asmodian' | null>(null)
  const [serverName, setServerName] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchCharacter[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<SearchCharacter | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // OCR 상태
  const [image, setImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recognizedStats, setRecognizedStats] = useState<RecognizedStat[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const workerRef = useRef<HTMLIFrameElement>(null)
  const [isWorkerReady, setIsWorkerReady] = useState(false)

  // OCR 워커 준비 상태 확인
  useEffect(() => {
    if (!isOpen) {
      setIsWorkerReady(false)
      return
    }

    // 워커 메시지 핸들러
    const handleWorkerMessage = (event: MessageEvent) => {
      const { type } = event.data || {}
      if (type === 'ready') {
        setIsWorkerReady(true)
      }
    }

    window.addEventListener('message', handleWorkerMessage)

    // 워커가 이미 로드되었을 수 있으므로 ping 보내기
    const checkWorker = setInterval(() => {
      if (workerRef.current?.contentWindow) {
        workerRef.current.contentWindow.postMessage({ type: 'ping' }, '*')
      }
    }, 500)

    // 3초 후에는 준비된 것으로 간주
    const fallbackTimer = setTimeout(() => {
      setIsWorkerReady(true)
    }, 3000)

    return () => {
      window.removeEventListener('message', handleWorkerMessage)
      clearInterval(checkWorker)
      clearTimeout(fallbackTimer)
    }
  }, [isOpen])

  // 클립보드 붙여넣기 핸들러
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!isOpen || !selectedCharacter) return

    const items = e.clipboardData?.items
    if (!items) return

    const itemsArray = Array.from(items)
    for (const item of itemsArray) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          processImageFile(file)
        }
        break
      }
    }
  }, [isOpen, selectedCharacter])

  // 클립보드 이벤트 등록
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('paste', handlePaste)
      return () => document.removeEventListener('paste', handlePaste)
    }
  }, [isOpen, handlePaste])

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setRace(null)
      setServerName('')
      setSearchQuery('')
      setSearchResults([])
      setSelectedCharacter(null)
      setImage(null)
      setRecognizedStats([])
      setError(null)
      setSaveSuccess(false)
    }
  }, [isOpen])

  // 캐릭터 검색 (상단 검색과 동일한 방식)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchResults([])
    setError(null)

    try {
      // 서버 ID 가져오기 (선택된 서버가 있으면)
      const serverId = serverName ? SERVER_NAME_TO_ID[serverName] : undefined
      const raceFilter = race || undefined

      // 1. 로컬 DB 검색
      const localResults = await supabaseApi.searchLocalCharacter(searchQuery, serverId, raceFilter)
        .catch(() => [] as CharacterSearchResult[])

      // 2. 외부 API 검색
      const apiResponse = await supabaseApi.searchCharacter(searchQuery, serverId, raceFilter, 1)
      const apiResults = apiResponse.list || []

      // 3. 결과 병합 (중복 제거)
      const seen = new Set<string>()
      const merged: SearchCharacter[] = []

      const addResult = (r: CharacterSearchResult) => {
        const key = r.characterId || `${r.server_id || r.serverId}_${r.name}`
        if (seen.has(key)) return
        seen.add(key)

        // 종족 필터 적용
        if (raceFilter) {
          const charRace = (r.race || '').toLowerCase()
          const isElyos = charRace === 'elyos' || charRace === '천족'
          const isAsmodian = charRace === 'asmodian' || charRace === '마족'
          if (raceFilter === 'elyos' && !isElyos) return
          if (raceFilter === 'asmodian' && !isAsmodian) return
        }

        merged.push({
          characterId: r.characterId,
          characterName: r.name.replace(/<\/?[^>]+(>|$)/g, ''),
          serverName: r.server,
          serverId: r.server_id || r.serverId || 0,
          className: r.className || r.job || '',
          level: r.level || 0,
          raceName: r.race || ''
        })
      }

      localResults.forEach(addResult)
      apiResults.forEach(addResult)

      if (merged.length === 0) {
        setError('검색 결과가 없습니다.')
      } else {
        setSearchResults(merged)
      }
    } catch (err: any) {
      console.error('Search error:', err)
      setError(err.message || '검색 중 오류가 발생했습니다.')
    } finally {
      setIsSearching(false)
    }
  }

  // 이미지 파일 처리
  const processImageFile = async (file: File) => {
    setError(null)
    setRecognizedStats([])

    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      setImage(base64)
      await runOcr(base64)
    }
    reader.readAsDataURL(file)
  }

  // 이미지 전처리
  const preprocessImage = async (base64Image: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) {
          resolve(base64Image)
          return
        }

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(base64Image)
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // 흑백 변환 + 대비 강화
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          const contrast = 1.5
          const adjusted = ((gray / 255 - 0.5) * contrast + 0.5) * 255
          const clamped = Math.max(0, Math.min(255, adjusted))

          data[i] = clamped
          data[i + 1] = clamped
          data[i + 2] = clamped
        }

        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = base64Image
    })
  }

  // OCR 워커에 요청
  const sendToOcrWorker = async (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const worker = workerRef.current
      if (!worker?.contentWindow) {
        reject(new Error('OCR 워커가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.'))
        return
      }

      if (!isWorkerReady) {
        reject(new Error('OCR 엔진을 로딩 중입니다. 잠시 후 다시 시도해주세요.'))
        return
      }

      const handleMessage = (event: MessageEvent) => {
        const { type, data } = event.data || {}

        if (type === 'result') {
          window.removeEventListener('message', handleMessage)
          const fullText = (data?.texts || [])
            .map((t: { text: string }) => t.text)
            .join('\n')
          resolve(fullText)
        } else if (type === 'error') {
          window.removeEventListener('message', handleMessage)
          reject(new Error(data?.message || 'OCR 처리 실패'))
        }
      }

      window.addEventListener('message', handleMessage)

      worker.contentWindow.postMessage({
        type: 'process',
        data: {
          image: base64Image,
          lang: 'kor+eng',
          psm: '6'
        }
      }, '*')

      setTimeout(() => {
        window.removeEventListener('message', handleMessage)
        reject(new Error('OCR 처리 시간이 초과되었습니다.'))
      }, 30000)
    })
  }

  // OCR 실행
  const runOcr = async (base64Image: string) => {
    setIsProcessing(true)

    try {
      const processedImage = await preprocessImage(base64Image)
      const text = await sendToOcrWorker(processedImage)
      const stats = parseStats(text)

      if (stats.length === 0) {
        setError('스탯을 인식하지 못했습니다. 다른 이미지를 시도해주세요.')
      } else {
        setRecognizedStats(stats)
      }
    } catch (err) {
      console.error('OCR Error:', err)
      setError('이미지 인식에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsProcessing(false)
    }
  }

  // 스탯 파싱
  const parseStats = (text: string): RecognizedStat[] => {
    // 1. 전체 텍스트에서 강력한 Regex로 추출 (줄바꿈 무시)
    return extractAllStats(text)
  }



  // OCR 오인식 방지를 위한 별칭(Alias) 매핑
  const STAT_ALIASES: Record<string, string[]> = {
    '명중': ['명증', '멍중', '영중', '몀중', '명 중', '띵중', '명:중', '[ [그', '[[그', '[ [ 그'],
    '치명타': ['치면타', '치멍타', '차명타', '치영타', '치 1 명타', '치:명타', '치명', 'XIE', 'xie'],
    '공격력': ['공걱력', '공격럭'],
    '방어력': ['방어럭', '방이력'],
    '회피': ['회 피', '화피', '회:피'],
    '생명력': ['생명럭', '상명력'],
    '정신력': ['정신럭', '점신력'],
    '전투 속도': ['전투속도', '전투 소도', '전투 쇽도'],
    '이동 속도': ['이동속도', '이동 소도'],
    '철벽': ['HY', 'hy', 'H Y', 'h y', '철 벽'],
    'PVP 회피': ['pvp 2m', 'pvp 2 m', 'pvp2m'],
    '봉혼석 추가 피해': ['BEA', 'bea', 'BEA 추가 피해', 'bea 추가 피해', 'BEA추가피해'],
    '탑승물 질주 행동력 소모': ['탑승물 질주 행동력 소', '탑승물 질주 행동력 소...'],
    '행동력': ['행통력', '행 동 력', '행 통 력'],
    '전투 행동력 자연 회복': ['전투 행통력 자연 회복', '전투 행통력 자연회복'],
    '비전투 행동력 자연 회복': ['비전투 행통력 자연 회복', '비전투 행통력 자연회복']
  }

  // 전체 텍스트에서 스탯 추출 (주력 로직)
  const extractAllStats = (text: string): RecognizedStat[] => {
    // 결과와 매칭 인덱스를 함께 저장할 임시 배열
    const tempResults: { index: number, stat: RecognizedStat }[] = []
    // 긴 이름부터 처리하여 중복 매칭 방지 (치명타 저항 vs 치명타)
    const sortedStatNames = [...KNOWN_STAT_NAMES].sort((a, b) => b.length - a.length)

    let remainingText = text

    for (const statName of sortedStatNames) {
      // 별칭(Alias) 처리 포함
      const searchNames = [statName, ...(STAT_ALIASES[statName] || [])]

      for (const searchName of searchNames) {
        // 스탯명 사이 공백/특수문자 허용 Regex 생성
        const cleanName = searchName.replace(/\s+/g, '')
        // 이름 사이사이 오타/노이즈 허용범위 확대 (점, 밑줄, 파이프, 대괄호 등)
        const escapedParams = cleanName.split('').map(char => char.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('[\\s._\\|\\[\\]]*')

        // 스탯명 + 구분자 + 값
        // 구분자: 숫자, 한글, 하이픈을 제외한 모든 문자(OCR 노이즈)를 건너뜀
        const regex = new RegExp(`(${escapedParams})[^0-9가-힣\\-]*?([-]?[\\d,]+\\.?\\d*\\s*%?)`, 'g')

        let match
        // 동일 스탯이 여러 번 나올 수 있으므로 반복 매칭 (매칭된 부분은 제거)
        while ((match = regex.exec(remainingText)) !== null) {
          const fullMatch = match[0]
          const rawValue = match[2].trim()

          if (!rawValue || rawValue === '-' || rawValue === '.') continue;

          let isPercent = rawValue.endsWith('%')
          let finalValue = rawValue

          if (isPercent) {
            if (finalValue.includes(',')) {
              finalValue = finalValue.replace(/,/, '.')
            }

            const numericVal = parseFloat(finalValue.replace('%', ''))

            // 보스/피해 증폭/내성 스탯: 보통 10% 미만, 소수점 누락 시 보정 (35% -> 3.5%)
            const isLowPercentStat = statName.includes('보스') ||
                                      statName.includes('피해 증폭') ||
                                      statName.includes('피해 내성') ||
                                      statName.includes('치명타 피해') ||
                                      statName.includes('후방 피해')

            console.log('[OCR DEBUG]', { statName, finalValue, numericVal, isLowPercentStat, hasDecimal: finalValue.includes('.') })

            if (isLowPercentStat && numericVal >= 10 && numericVal < 100 && !finalValue.includes('.')) {
              console.log('[OCR DEBUG] Applying /10 correction:', finalValue, '->', (numericVal / 10).toFixed(1) + '%')
              finalValue = (numericVal / 10).toFixed(1) + '%'
            }

            // 속도, 완벽, 재생, 강타, 철벽, 적중 등 소수점이 누락되어 100%를 넘는 경우 보정 (예: 242% -> 24.2%)
            if ((statName.includes('속도') || statName.includes('완벽') || statName.includes('재생') || statName.includes('강타') || statName.includes('철벽') || statName.includes('적중')) && numericVal > 100 && !finalValue.includes('.')) {
              finalValue = (numericVal / 10).toFixed(1) + '%'
            }
          } else {
            finalValue = finalValue.replace(/,/g, '')
          }

          tempResults.push({
            index: match.index,
            stat: {
              name: statName, // 표준 이름 사용
              value: finalValue,
              isPercentage: isPercent
            }
          })

          const beforeMatch = remainingText.substring(0, match.index)
          const afterMatch = remainingText.substring(match.index + fullMatch.length)
          const spaces = ' '.repeat(fullMatch.length)

          remainingText = beforeMatch + spaces + afterMatch
          regex.lastIndex = 0
        }
      }
    }

    // 인덱스 기준 정렬 (이미지 상의 순서대로)
    return tempResults.sort((a, b) => a.index - b.index).map(r => r.stat)
  }

  // 스탯 값 수정
  const handleStatEdit = (index: number, newValue: string) => {
    setRecognizedStats(prev => prev.map((stat, idx) =>
      idx === index ? { ...stat, value: newValue } : stat
    ))
    setEditingIndex(null)
  }

  // 스탯 삭제
  const handleStatDelete = (index: number) => {
    setRecognizedStats(prev => prev.filter((_, idx) => idx !== index))
  }

  // 저장
  const handleSave = async () => {
    if (!selectedCharacter || recognizedStats.length === 0) return
    if (!session?.access_token) {
      setError('로그인이 필요합니다.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      console.log('[CharacterUpdateModal] Saving with token:', session.access_token ? 'exists' : 'missing')

      const res = await fetch('/api/character/ocr-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          characterId: selectedCharacter.characterId,
          serverId: selectedCharacter.serverId,
          characterName: selectedCharacter.characterName,
          stats: recognizedStats
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('[CharacterUpdateModal] Save error:', res.status, errorData)
        throw new Error(errorData.error || `저장 실패: ${res.status}`)
      }

      setSaveSuccess(true)

      // 2초 후 모달 닫기
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || '저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 현재 단계 계산
  const getCurrentStep = () => {
    if (!race) return 1
    if (!selectedCharacter) return 2
    if (recognizedStats.length === 0) return 3
    return 4
  }

  if (!isOpen) return null

  const currentStep = getCurrentStep()
  const availableServers = race === 'elyos' ? ELYOS_SERVERS : ASMODIAN_SERVERS

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className={styles.header}>
          <h2 className={styles.title}>캐릭터 스탯 업데이트</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* 디버그 패널 */}
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '12px',
          margin: '0 16px 16px',
          fontSize: '0.75rem',
          fontFamily: 'monospace'
        }}>
          <div style={{ color: '#f59e0b', marginBottom: '8px', fontWeight: 'bold' }}>🔧 DEBUG INFO</div>
          <div style={{ color: '#9CA3AF' }}>
            <div>isAuthenticated: <span style={{ color: isAuthenticated ? '#10B981' : '#ef4444' }}>{String(isAuthenticated)}</span></div>
            <div>isAuthLoading: <span style={{ color: '#E5E7EB' }}>{String(isAuthLoading)}</span></div>
            <div>session: <span style={{ color: session ? '#10B981' : '#ef4444' }}>{session ? 'exists' : 'null'}</span></div>
            <div>access_token: <span style={{ color: session?.access_token ? '#10B981' : '#ef4444' }}>{session?.access_token ? `${session.access_token.substring(0, 20)}...` : 'null'}</span></div>
            <div>selectedCharacter: <span style={{ color: '#E5E7EB' }}>{selectedCharacter ? selectedCharacter.characterName : 'null'}</span></div>
            <div>recognizedStats: <span style={{ color: '#E5E7EB' }}>{recognizedStats.length}개</span></div>
            <div>isSaving: <span style={{ color: '#E5E7EB' }}>{String(isSaving)}</span></div>
            <div>error: <span style={{ color: error ? '#ef4444' : '#9CA3AF' }}>{error || 'null'}</span></div>
          </div>
        </div>

        {/* 로그인 필요 */}
        {!isAuthenticated ? (
          <div className={styles.content} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <LogIn size={48} style={{ color: '#6B7280', marginBottom: '1rem' }} />
            <h3 style={{ color: '#E5E7EB', marginBottom: '0.5rem' }}>로그인이 필요합니다</h3>
            <p style={{ color: '#9CA3AF', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              캐릭터 스탯 업데이트는 로그인한 사용자만 이용할 수 있습니다.
            </p>
            <button
              onClick={signInWithGoogle}
              disabled={isAuthLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#f59e0b',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {isAuthLoading ? (
                <Loader2 className={styles.spinner} size={20} />
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google로 로그인
                </>
              )}
            </button>
          </div>
        ) : saveSuccess ? (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>
              <Check size={48} />
            </div>
            <h3>저장 완료!</h3>
            <p>{selectedCharacter?.characterName}의 스탯이 업데이트되었습니다.</p>
            <p className={styles.successHint}>캐릭터 상세 페이지에서 확인하세요.</p>
          </div>
        ) : (
          <div className={styles.content}>
            {/* Step 1: 종족 선택 */}
            <div className={styles.step}>
              <div className={styles.stepHeader}>
                <span className={`${styles.stepNumber} ${currentStep >= 1 ? styles.active : ''}`}>1</span>
                <span className={styles.stepLabel}>종족 선택</span>
              </div>
              <div className={styles.raceButtons}>
                <button
                  className={`${styles.raceButton} ${race === 'elyos' ? styles.selected : ''}`}
                  onClick={() => { setRace('elyos'); setServerName(''); setSelectedCharacter(null); setSearchResults([]); }}
                >
                  천족
                </button>
                <button
                  className={`${styles.raceButton} ${race === 'asmodian' ? styles.selected : ''}`}
                  onClick={() => { setRace('asmodian'); setServerName(''); setSelectedCharacter(null); setSearchResults([]); }}
                >
                  마족
                </button>
              </div>
            </div>

            {/* Step 2: 캐릭터 검색 (종족 선택 후) */}
            {race && (
              <div className={styles.step}>
                <div className={styles.stepHeader}>
                  <span className={`${styles.stepNumber} ${currentStep >= 2 ? styles.active : ''}`}>2</span>
                  <span className={styles.stepLabel}>캐릭터 검색</span>
                </div>

                {/* 서버 선택 (선택사항) */}
                <select
                  className={styles.serverSelect}
                  value={serverName}
                  onChange={(e) => { setServerName(e.target.value); setSelectedCharacter(null); }}
                  style={{ marginBottom: '0.75rem' }}
                >
                  <option value="">전체 서버</option>
                  {availableServers.map(srv => (
                    <option key={srv} value={srv}>{srv}</option>
                  ))}
                </select>

                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="캐릭터 이름 입력..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    className={styles.searchButton}
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? <Loader2 className={styles.spinner} size={20} /> : <Search size={20} />}
                  </button>
                </div>

                {/* 검색 결과 */}
                {searchResults.length > 0 && (
                  <div className={styles.searchResults}>
                    {searchResults.map((char) => (
                      <div
                        key={char.characterId}
                        className={`${styles.searchResultItem} ${selectedCharacter?.characterId === char.characterId ? styles.selected : ''}`}
                        onClick={() => setSelectedCharacter(char)}
                      >
                        <div className={styles.charInfo}>
                          <span className={styles.charName}>{char.characterName}</span>
                          <span className={styles.charClass}>{char.className}</span>
                          <span className={styles.charLevel}>Lv.{char.level}</span>
                          <span className={styles.charServer}>{char.serverName}</span>
                        </div>
                        {selectedCharacter?.characterId === char.characterId && (
                          <Check size={18} className={styles.checkIcon} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: 스크린샷 업로드 */}
            {selectedCharacter && (
              <div className={styles.step}>
                <div className={styles.stepHeader}>
                  <span className={`${styles.stepNumber} ${currentStep >= 3 ? styles.active : ''}`}>3</span>
                  <span className={styles.stepLabel}>스탯 스크린샷 업로드</span>
                </div>

                <div
                  className={styles.uploadArea}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files?.[0]
                    if (file && file.type.startsWith('image/')) {
                      processImageFile(file)
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {!isWorkerReady ? (
                    <div className={styles.processingState}>
                      <Loader2 className={styles.spinnerLarge} size={40} />
                      <span>OCR 엔진 로딩 중...</span>
                    </div>
                  ) : isProcessing ? (
                    <div className={styles.processingState}>
                      <Loader2 className={styles.spinnerLarge} size={40} />
                      <span>이미지 분석 중...</span>
                    </div>
                  ) : image ? (
                    <img src={image} alt="Uploaded" className={styles.previewImage} />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      <ImagePlus size={48} />
                      <span>클릭 또는 드래그하여 업로드</span>
                      <span className={styles.uploadHint}>Ctrl+V로 붙여넣기 가능</span>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) processImageFile(file)
                  }}
                />
              </div>
            )}

            {/* Step 4: 추출된 스탯 */}
            {recognizedStats.length > 0 && (
              <div className={styles.step}>
                <div className={styles.stepHeader}>
                  <span className={`${styles.stepNumber} ${styles.active}`}>4</span>
                  <span className={styles.stepLabel}>추출된 스탯 ({recognizedStats.length}개)</span>
                </div>

                <div className={styles.statsGrid}>
                  {recognizedStats.map((stat, idx) => (
                    <div key={idx} className={styles.statItem}>
                      <span className={styles.statName}>{stat.name}</span>
                      {editingIndex === idx ? (
                        <input
                          type="text"
                          defaultValue={stat.value}
                          className={styles.statInput}
                          autoFocus
                          onBlur={(e) => handleStatEdit(idx, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleStatEdit(idx, e.currentTarget.value)
                            } else if (e.key === 'Escape') {
                              setEditingIndex(null)
                            }
                          }}
                        />
                      ) : (
                        <span
                          className={styles.statValue}
                          onClick={() => setEditingIndex(idx)}
                          title="클릭하여 수정"
                        >
                          {stat.value}
                          <Edit3 size={12} className={styles.editIcon} />
                        </span>
                      )}
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleStatDelete(idx)}
                        title="삭제"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className={styles.errorBanner}>
                <X size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* 푸터 */}
        {isAuthenticated && !saveSuccess && (
          <div className={styles.footer}>
            <button className={styles.cancelButton} onClick={onClose}>
              취소
            </button>
            <button
              className={styles.saveButton}
              onClick={handleSave}
              disabled={!selectedCharacter || recognizedStats.length === 0 || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className={styles.spinner} size={18} />
                  저장 중...
                </>
              ) : (
                '스탯 업데이트'
              )}
            </button>
          </div>
        )}
      </div>

      {/* 숨겨진 캔버스 (전처리용) */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* OCR 워커 iframe */}
      <iframe
        ref={workerRef}
        src="/ocr-worker/index.html"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none'
        }}
        onLoad={() => setIsWorkerReady(true)}
        title="OCR Worker"
      />
    </div>
  )
}
