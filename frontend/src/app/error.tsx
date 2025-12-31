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
