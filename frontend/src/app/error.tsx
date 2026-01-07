'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    일시적인 오류가 발생했습니다.
                </h2>
                <p className="text-gray-600 mb-8">
                    서비스 이용에 불편을 드려 죄송합니다.<br />
                    잠시 후 다시 시도해주세요.
                </p>

                {/* 디버그: 실제 에러 메시지 표시 */}
                <div style={{
                    margin: '20px 0',
                    padding: '16px',
                    background: '#1a1a2e',
                    border: '2px solid #FF6B6B',
                    borderRadius: '8px',
                    textAlign: 'left',
                    maxHeight: '200px',
                    overflow: 'auto'
                }}>
                    <div style={{ color: '#FF6B6B', fontWeight: 'bold', marginBottom: '8px' }}>🔧 에러 디버그:</div>
                    <div style={{ color: '#E5E7EB', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                        <div><strong>Name:</strong> {error.name}</div>
                        <div><strong>Message:</strong> {error.message}</div>
                        {error.digest && <div><strong>Digest:</strong> {error.digest}</div>}
                        <div style={{ marginTop: '8px', whiteSpace: 'pre-wrap', fontSize: '0.75rem', color: '#9CA3AF' }}>
                            {error.stack}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => reset()}
                    className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                    다시 시도하기
                </button>
            </div>
        </div>
    );
}
