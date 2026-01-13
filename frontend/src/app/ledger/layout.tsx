import { Metadata } from 'next'

export const metadata: Metadata = {
    title: '가계부 - AION 2 수입 & 지출 관리 | HitOn',
    description: 'AION 2 게임 내 수입과 지출을 관리하세요. 일일/주간 수익 추적, 콘텐츠별 수입 분석, 아이템 시세 기록 기능을 제공합니다.',
    keywords: 'AION 2 가계부, 아이온2 수입 관리, 키나 관리, 콘텐츠 수익',
    openGraph: {
        title: '가계부 - AION 2 수입 & 지출 관리 | HitOn',
        description: 'AION 2 게임 내 수입과 지출을 관리하세요.',
        type: 'website',
        url: 'https://hiton.vercel.app/ledger',
    },
}

export default function LedgerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
