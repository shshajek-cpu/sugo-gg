'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, Clipboard, Loader2, Check, X, Edit3, ImagePlus, Eye, EyeOff } from 'lucide-react'
import styles from './stat-capture.module.css'

// 인식된 스탯 타입
interface RecognizedStat {
    name: string
    value: string
    isPercentage: boolean
}

// 스탯 카테고리
interface StatCategory {
    id: string
    name: string
    stats: RecognizedStat[]
}

// 이미지 슬롯 타입
interface ImageSlot {
    id: string
    name: string
    image: string | null
    isProcessing: boolean
}

const STAT_CATEGORIES = [
    { id: 'basic', name: '기본 스탯' },
    { id: 'damage', name: '피해/판정' },
    { id: 'pvp', name: 'PVP/PVE' },
    { id: 'special', name: '특수/자원' }
]

export default function StatCapturePage() {
    // 4개 이미지 슬롯 상태 (특수/자원 추가됨)
    const [imageSlots, setImageSlots] = useState<ImageSlot[]>(
        STAT_CATEGORIES.map(cat => ({
            id: cat.id,
            name: cat.name,
            image: null,
            isProcessing: false
        }))
    )
    const [activeSlotId, setActiveSlotId] = useState<string>('basic')
    const [recognizedStats, setRecognizedStats] = useState<StatCategory[]>([])
    const [editingIndex, setEditingIndex] = useState<{ categoryId: string; statIndex: number } | null>(null)
    const [ocrTexts, setOcrTexts] = useState<Record<string, string>>({})
    const [error, setError] = useState<string | null>(null)
    const [compareViewId, setCompareViewId] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const workerRef = useRef<HTMLIFrameElement>(null)

    // 클립보드 붙여넣기 핸들러
    const handlePaste = useCallback((e: ClipboardEvent) => {
        const items = e.clipboardData?.items
        if (!items) return

        const itemsArray = Array.from(items)
        for (const item of itemsArray) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile()
                if (file) {
                    processImageFile(file, activeSlotId)
                }
                break
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSlotId])

    // 클립보드 이벤트 등록
    useEffect(() => {
        document.addEventListener('paste', handlePaste)
        return () => document.removeEventListener('paste', handlePaste)
    }, [handlePaste])

    // 파일 업로드 핸들러
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, slotId: string) => {
        const file = e.target.files?.[0]
        if (file) {
            processImageFile(file, slotId)
        }
    }

    // 드래그 앤 드롭 핸들러
    const handleDrop = (e: React.DragEvent, slotId: string) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file && file.type.startsWith('image/')) {
            processImageFile(file, slotId)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    // 이미지 파일 처리
    const processImageFile = async (file: File, slotId: string) => {
        setError(null)

        const reader = new FileReader()
        reader.onload = async (e) => {
            const base64 = e.target?.result as string

            // 슬롯에 이미지 저장
            setImageSlots(prev => prev.map(slot =>
                slot.id === slotId ? { ...slot, image: base64, isProcessing: true } : slot
            ))

            // OCR 처리 시작
            await runOcr(base64, slotId)
        }
        reader.readAsDataURL(file)
    }

    // OCR 실행
    const runOcr = async (base64Image: string, slotId: string) => {
        setImageSlots(prev => prev.map(slot =>
            slot.id === slotId ? { ...slot, isProcessing: true } : slot
        ))

        try {
            // 이미지 전처리
            const processedImage = await preprocessImage(base64Image)

            // OCR 워커에 요청
            const text = await sendToOcrWorker(processedImage)

            // OCR 텍스트 저장
            setOcrTexts(prev => ({ ...prev, [slotId]: text }))

            // 스탯 파싱
            const categoryName = STAT_CATEGORIES.find(c => c.id === slotId)?.name || '인식된 스탯'
            const stats = parseStats(text)

            // 기존 결과에 추가 또는 업데이트
            setRecognizedStats(prev => {
                const existing = prev.filter(c => c.id !== slotId)
                if (stats.length > 0) {
                    return [...existing, { id: slotId, name: categoryName, stats }]
                }
                return existing
            })

        } catch (err) {
            console.error('OCR Error:', err)
            setError('이미지 인식에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setImageSlots(prev => prev.map(slot =>
                slot.id === slotId ? { ...slot, isProcessing: false } : slot
            ))
        }
    }

    // 이미지 전처리 (흑백 + 대비 강화)
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

                // 이미지 데이터 가져오기
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const data = imageData.data

                // 흑백 변환 + 대비 강화
                for (let i = 0; i < data.length; i += 4) {
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]

                    // 대비 강화
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

    // OCR 워커에 요청 전송
    const sendToOcrWorker = async (base64Image: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const worker = workerRef.current
            if (!worker?.contentWindow) {
                reject(new Error('OCR 워커가 준비되지 않았습니다.'))
                return
            }

            const handleMessage = (event: MessageEvent) => {
                const { type, data } = event.data || {}

                if (type === 'result') {
                    window.removeEventListener('message', handleMessage)
                    // texts 배열에서 텍스트만 추출하여 합치기
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

            // OCR 워커에 process 메시지 전송
            worker.contentWindow.postMessage({
                type: 'process',
                data: {
                    image: base64Image,
                    lang: 'kor+eng',
                    psm: '6' // 단일 균일 텍스트 블록
                }
            }, '*')

            // 타임아웃
            setTimeout(() => {
                window.removeEventListener('message', handleMessage)
                reject(new Error('OCR 처리 시간이 초과되었습니다.'))
            }, 30000)
        })
    }

    // 알려진 스탯명 리스트 (2열 레이아웃 분리용)
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
        '질주 속도', '비행 속도', '탑승물 지상 이동 속도', '탑승물 질주 행동력 소모', '탑승물 질주 행동력 소...',
        '치유 증폭', '받는 치유량', '재사용 시간', '적대치 획득량',
        // 자원 스탯
        '행동력', '비행력',
        '전투 생명력 자연 회복', '비전투 생명력 자연 회복', '생명력 물약 회복 증가', '생명력 물약 회복',
        '전투 정신력 자연 회복', '비전투 정신력 자연 회복', '정신력 소모량', '정신력 획득 증가',
        '전투 행동력 자연 회복', '비전투 행동력 자연 회복',
        '전투 비행력 자연 회복', '비전투 비행력 자연 회복'
    ]

    // 스탯 파싱 (2열 레이아웃 대응)
    const parseStats = (text: string): RecognizedStat[] => {
        const lines = text.split('\n').filter(line => line.trim())
        const stats: RecognizedStat[] = []

        for (const line of lines) {
            const trimmedLine = line.trim()

            // 각 줄에서 알려진 스탯명을 찾아 분리
            const foundStats = extractStatsFromLine(trimmedLine)
            stats.push(...foundStats)
        }

        return stats
    }

    // 한 줄에서 스탯 추출 (2열 대응)
    const extractStatsFromLine = (line: string): RecognizedStat[] => {
        const results: RecognizedStat[] = []
        let remaining = line

        // 알려진 스탯명을 긴 것부터 정렬 (더 정확한 매칭)
        const sortedStatNames = [...KNOWN_STAT_NAMES].sort((a, b) => b.length - a.length)

        while (remaining.length > 0) {
            let found = false

            for (const statName of sortedStatNames) {
                // 스탯명으로 시작하는지 확인
                if (remaining.startsWith(statName)) {
                    // 스탯명 뒤의 값 추출
                    const afterName = remaining.substring(statName.length).trim()
                    // 음수 및 백분율 지원 정규식 (-9%, 100, 5.9% 등)
                    const valueMatch = afterName.match(/^([-]?[\d,]+\.?\d*%?)/)

                    if (valueMatch) {
                        const value = valueMatch[1].replace(/,/g, '')
                        results.push({
                            name: statName,
                            value,
                            isPercentage: value.endsWith('%')
                        })

                        // 처리한 부분 제거
                        remaining = afterName.substring(valueMatch[0].length).trim()
                        found = true
                        break
                    }
                }
            }

            if (!found) {
                // 매칭되지 않으면 한 문자씩 건너뛰기
                remaining = remaining.substring(1).trim()
            }
        }

        return results
    }

    // 스탯 값 수정
    const handleStatEdit = (categoryId: string, statIndex: number, newValue: string) => {
        setRecognizedStats(prev => prev.map(category => {
            if (category.id === categoryId) {
                return {
                    ...category,
                    stats: category.stats.map((stat, idx) =>
                        idx === statIndex ? { ...stat, value: newValue } : stat
                    )
                }
            }
            return category
        }))
        setEditingIndex(null)
    }

    // 스탯 삭제
    const handleStatDelete = (categoryId: string, statIndex: number) => {
        setRecognizedStats(prev => prev.map(category => {
            if (category.id === categoryId) {
                return {
                    ...category,
                    stats: category.stats.filter((_, idx) => idx !== statIndex)
                }
            }
            return category
        }))
    }

    // 저장
    const handleSave = async () => {
        // TODO: DB 저장 로직 구현
        console.log('저장할 스탯:', recognizedStats)
        alert('저장 기능은 추후 구현 예정입니다.')
    }

    // 초기화
    const handleReset = () => {
        setImageSlots(STAT_CATEGORIES.map(cat => ({
            id: cat.id,
            name: cat.name,
            image: null,
            isProcessing: false
        })))
        setRecognizedStats([])
        setOcrTexts({})
        setError(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // 총 인식된 스탯 수
    const totalStats = recognizedStats.reduce((sum, cat) => sum + cat.stats.length, 0)

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                {/* 헤더 */}
                <header className={styles.header}>
                    <h1 className={styles.title}>스탯 캡처 등록</h1>
                    <p className={styles.description}>
                        게임 내 스탯 창을 캡처하여 붙여넣거나 업로드하면 자동으로 인식합니다.
                        <br />3개 카테고리(기본, 피해/판정, PVP/PVE)를 각각 등록해주세요.
                    </p>
                </header>

                {/* 3개 이미지 슬롯 */}
                <section className={styles.imageSlots}>
                    {imageSlots.map((slot) => (
                        <div
                            key={slot.id}
                            className={`${styles.imageSlot} ${activeSlotId === slot.id ? styles.active : ''}`}
                            onDrop={(e) => handleDrop(e, slot.id)}
                            onDragOver={handleDragOver}
                            onClick={() => {
                                setActiveSlotId(slot.id)
                                if (!slot.image) {
                                    fileInputRef.current?.click()
                                }
                            }}
                        >
                            <span className={styles.slotLabel}>{slot.name}</span>
                            {slot.isProcessing ? (
                                <div className={styles.slotProcessing}>
                                    <Loader2 className={styles.spinnerSmall} />
                                    <span>인식 중...</span>
                                </div>
                            ) : slot.image ? (
                                <img src={slot.image} alt={slot.name} className={styles.slotImage} />
                            ) : (
                                <div className={styles.slotEmpty}>
                                    <ImagePlus className={styles.slotIcon} />
                                    <span>클릭 또는 Ctrl+V</span>
                                </div>
                            )}
                            {slot.image && !slot.isProcessing && (
                                <button
                                    className={styles.slotRemove}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setImageSlots(prev => prev.map(s =>
                                            s.id === slot.id ? { ...s, image: null } : s
                                        ))
                                        setRecognizedStats(prev => prev.filter(c => c.id !== slot.id))
                                        setOcrTexts(prev => {
                                            const next = { ...prev }
                                            delete next[slot.id]
                                            return next
                                        })
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </section>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, activeSlotId)}
                    className={styles.hiddenInput}
                />

                {/* 에러 메시지 */}
                {error && (
                    <div className={styles.errorBanner}>
                        <X className={styles.errorIcon} />
                        <span>{error}</span>
                    </div>
                )}

                {/* 인식 결과 */}
                <section className={styles.resultSection}>
                    <div className={styles.resultHeader}>
                        <h2 className={styles.resultTitle}>
                            {totalStats > 0 ? (
                                <>
                                    <Check className={styles.successIcon} />
                                    인식 결과 ({totalStats}개)
                                </>
                            ) : (
                                '인식 결과'
                            )}
                        </h2>
                        {totalStats > 0 && (
                            <p className={styles.resultHint}>값을 클릭하여 수정할 수 있습니다.</p>
                        )}
                    </div>

                    {recognizedStats.length > 0 ? (
                        <div className={styles.statsContainer}>
                            {recognizedStats.map((category) => {
                                const slot = imageSlots.find(s => s.id === category.id)
                                const isCompareView = compareViewId === category.id

                                return (
                                    <div key={category.id} className={styles.statCategory}>
                                        <div className={styles.categoryHeader}>
                                            <h3 className={styles.categoryName}>{category.name}</h3>
                                            {slot?.image && (
                                                <button
                                                    className={`${styles.compareButton} ${isCompareView ? styles.compareActive : ''}`}
                                                    onClick={() => setCompareViewId(isCompareView ? null : category.id)}
                                                    title={isCompareView ? '비교 닫기' : '이미지 비교'}
                                                >
                                                    {isCompareView ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    {isCompareView ? '비교 닫기' : '비교 보기'}
                                                </button>
                                            )}
                                        </div>

                                        {isCompareView && slot?.image ? (
                                            <div className={styles.compareView}>
                                                <div className={styles.compareImage}>
                                                    <img src={slot.image} alt={category.name} />
                                                </div>
                                                <div className={styles.compareStats}>
                                                    {category.stats.map((stat, idx) => (
                                                        <div key={idx} className={styles.statItem}>
                                                            <span className={styles.statName}>{stat.name}</span>
                                                            {editingIndex?.categoryId === category.id && editingIndex.statIndex === idx ? (
                                                                <input
                                                                    type="text"
                                                                    defaultValue={stat.value}
                                                                    className={styles.statInput}
                                                                    autoFocus
                                                                    onBlur={(e) => handleStatEdit(category.id, idx, e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            handleStatEdit(category.id, idx, e.currentTarget.value)
                                                                        } else if (e.key === 'Escape') {
                                                                            setEditingIndex(null)
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span
                                                                    className={styles.statValue}
                                                                    onClick={() => setEditingIndex({ categoryId: category.id, statIndex: idx })}
                                                                    title="클릭하여 수정"
                                                                >
                                                                    {stat.value}
                                                                    <Edit3 className={styles.editIcon} />
                                                                </span>
                                                            )}
                                                            <button
                                                                className={styles.deleteButton}
                                                                onClick={() => handleStatDelete(category.id, idx)}
                                                                title="삭제"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={styles.statGrid}>
                                                {category.stats.map((stat, idx) => (
                                                    <div key={idx} className={styles.statItem}>
                                                        <span className={styles.statName}>{stat.name}</span>
                                                        {editingIndex?.categoryId === category.id && editingIndex.statIndex === idx ? (
                                                            <input
                                                                type="text"
                                                                defaultValue={stat.value}
                                                                className={styles.statInput}
                                                                autoFocus
                                                                onBlur={(e) => handleStatEdit(category.id, idx, e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        handleStatEdit(category.id, idx, e.currentTarget.value)
                                                                    } else if (e.key === 'Escape') {
                                                                        setEditingIndex(null)
                                                                    }
                                                                }}
                                                            />
                                                        ) : (
                                                            <span
                                                                className={styles.statValue}
                                                                onClick={() => setEditingIndex({ categoryId: category.id, statIndex: idx })}
                                                                title="클릭하여 수정"
                                                            >
                                                                {stat.value}
                                                                <Edit3 className={styles.editIcon} />
                                                            </span>
                                                        )}
                                                        <button
                                                            className={styles.deleteButton}
                                                            onClick={() => handleStatDelete(category.id, idx)}
                                                            title="삭제"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <p>인식된 스탯이 여기에 표시됩니다.</p>
                            <p className={styles.emptyHint}>위의 슬롯을 클릭하거나 Ctrl+V로 이미지를 붙여넣으세요.</p>
                        </div>
                    )}
                </section>

                {/* 액션 버튼 */}
                {totalStats > 0 && (
                    <div className={styles.actionButtons}>
                        <button onClick={handleReset} className={styles.resetButton}>
                            전체 초기화
                        </button>
                        <button onClick={handleSave} className={styles.saveButton}>
                            저장하기
                        </button>
                    </div>
                )}

                {/* OCR 디버그 (개발용) */}
                {Object.keys(ocrTexts).length > 0 && (
                    <details className={styles.debugSection}>
                        <summary>OCR 원본 텍스트 (디버그)</summary>
                        {Object.entries(ocrTexts).map(([slotId, text]) => (
                            <div key={slotId}>
                                <strong>{STAT_CATEGORIES.find(c => c.id === slotId)?.name}</strong>
                                <pre className={styles.debugText}>{text}</pre>
                            </div>
                        ))}
                    </details>
                )}
            </div>

            {/* 숨겨진 캔버스 (전처리용) */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* OCR 워커 iframe */}
            <iframe
                ref={workerRef}
                src="/ocr-worker/index.html"
                style={{ display: 'none' }}
                title="OCR Worker"
            />
        </main>
    )
}
