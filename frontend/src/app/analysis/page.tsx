'use client';

import React, { useEffect, useState } from 'react';
import PartyAnalysisResult from '@/app/components/analysis/PartyAnalysisResult';
import { usePartyScanner } from '@/hooks/usePartyScanner';

export default function AnalysisPage() {
    const { isScanning, scanImage } = usePartyScanner();
    const [analysisData, setAnalysisData] = useState<any>(null);

    const handleScan = async (file: File) => {
        try {
            const result = await scanImage(file);
            setAnalysisData(result);
        } catch (e) {
            console.error("Scan failed", e);
            // Optionally handle error toast here
        }
    };

    // Global Paste Handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.indexOf('image') !== -1) {
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
    }, [scanImage]); // scanImage is stable from hook

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '2rem 1rem',
            paddingTop: '6rem', // Header spacing
            paddingBottom: '5rem',
            minHeight: '100vh'
        }}>
            {/* Consistent Background */}
            <style jsx global>{`
                body {
                    background-color: var(--bg-main);
                    background-image: radial-gradient(circle at 50% 0%, rgba(217, 43, 75, 0.1) 0%, var(--bg-main) 70%);
                    color: var(--text-main);
                }
            `}</style>

            <PartyAnalysisResult
                data={analysisData}
                isScanning={isScanning}
                onReset={() => setAnalysisData(null)}
                onManualUpload={handleScan}
            />
        </div>
    );
}
