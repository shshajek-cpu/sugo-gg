'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface OcrTextLine {
    text: string
    confidence: number
    box?: number[][]
}

export interface BrowserOcrResult {
    texts: OcrTextLine[]
    processingTime: number
}

interface OcrState {
    isReady: boolean
    isLoading: boolean
    error: string | null
    status: string
}

export function useBrowserOcr() {
    const [state, setState] = useState<OcrState>({
        isReady: false,
        isLoading: false,
        error: null,
        status: ''
    })

    const iframeRef = useRef<HTMLIFrameElement | null>(null)
    const resolveRef = useRef<((result: BrowserOcrResult | null) => void) | null>(null)

    // 메시지 핸들러
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const { type, ...data } = event.data || {}

            switch (type) {
                case 'ready':
                    setState(prev => ({ ...prev, isReady: true, isLoading: false, status: '준비됨' }))
                    break
                case 'status':
                    setState(prev => ({ ...prev, status: data.message }))
                    break
                case 'result':
                    setState(prev => ({ ...prev, isLoading: false }))
                    if (resolveRef.current) {
                        resolveRef.current({
                            texts: data.texts,
                            processingTime: data.processingTime
                        })
                        resolveRef.current = null
                    }
                    break
                case 'error':
                    setState(prev => ({ ...prev, isLoading: false, error: data.message }))
                    if (resolveRef.current) {
                        resolveRef.current(null)
                        resolveRef.current = null
                    }
                    break
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [])

    // OCR Worker 초기화
    const initOcr = useCallback(() => {
        if (iframeRef.current) return // 이미 초기화됨

        setState(prev => ({ ...prev, isLoading: true, status: '초기화 중...' }))

        // 숨겨진 iframe 생성
        const iframe = document.createElement('iframe')
        iframe.src = '/ocr-worker/index.html'
        iframe.style.display = 'none'
        document.body.appendChild(iframe)
        iframeRef.current = iframe
    }, [])

    // 이미지에서 텍스트 감지
    const detectText = useCallback(async (imageBase64: string): Promise<BrowserOcrResult | null> => {
        if (!iframeRef.current) {
            setState(prev => ({ ...prev, error: 'OCR이 초기화되지 않았습니다' }))
            return null
        }

        if (!state.isReady) {
            setState(prev => ({ ...prev, error: 'OCR 모델이 로딩 중입니다' }))
            return null
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }))

        return new Promise((resolve) => {
            resolveRef.current = resolve

            // OCR Worker에 이미지 전송
            iframeRef.current?.contentWindow?.postMessage({
                type: 'process',
                data: imageBase64
            }, '*')

            // 타임아웃 (30초)
            setTimeout(() => {
                if (resolveRef.current === resolve) {
                    setState(prev => ({ ...prev, isLoading: false, error: '타임아웃' }))
                    resolve(null)
                    resolveRef.current = null
                }
            }, 30000)
        })
    }, [state.isReady])

    // File에서 텍스트 감지
    const detectFromFile = useCallback(async (file: File): Promise<BrowserOcrResult | null> => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = async (e) => {
                const base64 = e.target?.result as string
                const result = await detectText(base64)
                resolve(result)
            }
            reader.onerror = () => {
                setState(prev => ({ ...prev, error: '파일 읽기 실패' }))
                resolve(null)
            }
            reader.readAsDataURL(file)
        })
    }, [detectText])

    // 정리
    const cleanup = useCallback(() => {
        if (iframeRef.current) {
            iframeRef.current.remove()
            iframeRef.current = null
        }
        setState({
            isReady: false,
            isLoading: false,
            error: null,
            status: ''
        })
    }, [])

    return {
        isReady: state.isReady,
        isLoading: state.isLoading,
        error: state.error,
        status: state.status,
        initOcr,
        detectText,
        detectFromFile,
        cleanup
    }
}
