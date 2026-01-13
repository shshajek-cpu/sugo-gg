import { Metadata } from 'next'

export const metadata: Metadata = {
    title: '파티 분석 - AION 2 파티 스캔 & 분석 | HitOn',
    description: 'AION 2 파티 스크린샷을 업로드하여 파티원 정보를 자동으로 분석합니다. 파티 구성, 전투력, 직업 밸런스를 확인하세요.',
    keywords: 'AION 2 파티 분석, 아이온2 파티 스캔, 파티 구성, 파티원 정보',
    openGraph: {
        title: '파티 분석 - AION 2 파티 스캔 & 분석 | HitOn',
        description: 'AION 2 파티 스크린샷으로 파티원 정보를 자동 분석합니다.',
        type: 'website',
        url: 'https://hiton.vercel.app/analysis',
    },
}

export default function AnalysisLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
