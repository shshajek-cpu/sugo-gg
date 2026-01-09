'use client';

import React, { useEffect, useState, useCallback } from 'react';
import PartyAnalysisResult from '@/app/components/analysis/PartyAnalysisResult';
import { usePartyScanner } from '@/hooks/usePartyScanner';

export default function AnalysisPage() {
    const {
        isScanning,
        scanImage,
        logs,
        croppedPreview,
        pendingSelections,
        analysisResult,
        selectServer
    } = usePartyScanner();
    const [error, setError] = useState<string | null>(null);

    const handleScan = useCallback(async (file: File) => {
        setError(null);
        try {
            console.log('[AnalysisPage] Starting scan...');
            const result = await scanImage(file);
            console.log('[AnalysisPage] Scan result:', result);
        } catch (e: any) {
            console.error("Scan failed", e);
            setError(e?.message || 'OCR 스캔 중 오류가 발생했습니다.');
        }
    }, [scanImage]);

    // Global Paste Handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            console.log('[PartyAnalysis] Paste event detected');
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.indexOf('image') !== -1) {
                    console.log('[PartyAnalysis] Image found in clipboard');
                    const file = item.getAsFile();
                    if (file) {
                        handleScan(file);
                    }
                    break;
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handleScan]);

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '2rem 1rem',
            paddingTop: '6rem',
            paddingBottom: '5rem',
            minHeight: '100vh'
        }}>
            <style jsx global>{`
                body {
                    background-color: var(--bg-main);
                    background-image: radial-gradient(circle at 50% 0%, rgba(217, 43, 75, 0.1) 0%, var(--bg-main) 70%);
                    color: var(--text-main);
                }
            `}</style>

            {/* 크롭된 이미지 보기 버튼 */}
            {croppedPreview && (
                <button
                    onClick={() => {
                        const newTab = window.open();
                        if (newTab) {
                            newTab.document.write(`<html><head><title>OCR 스캔 영역</title></head><body style="background:#000;margin:0;padding:20px;"><h3 style="color:#FACC15;">OCR 스캔 영역 (크롭된 이미지)</h3><img src="${croppedPreview}" style="max-width:100%;border:2px solid #FACC15;"/></body></html>`);
                        }
                    }}
                    style={{
                        position: 'fixed',
                        top: '100px',
                        right: '20px',
                        zIndex: 9999,
                        padding: '12px 20px',
                        background: '#FACC15',
                        color: '#000',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    OCR 스캔 영역 보기 (새 탭)
                </button>
            )}

            <PartyAnalysisResult
                data={analysisResult}
                isScanning={isScanning}
                onReset={() => { setError(null); }}
                onManualUpload={handleScan}
                pendingSelections={pendingSelections}
                onSelectServer={selectServer}
            />

            {/* Error Display */}
            {error && (
                <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#EF4444'
                }}>
                    {error}
                </div>
            )}

            {/* Debug Logs (개발용) */}
            {logs.length > 0 && (
                <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    fontFamily: 'monospace'
                }}>
                    <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>OCR 로그:</div>
                    {logs.map((log, i) => (
                        <div key={i}>{log}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
