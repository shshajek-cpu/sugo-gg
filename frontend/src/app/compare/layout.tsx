import { Metadata } from 'next'

export const metadata: Metadata = {
    title: '캐릭터 비교 - AION 2 스탯 & 장비 비교 | HitOn',
    description: 'AION 2 캐릭터를 비교 분석하세요. 스탯, 장비, 전투력을 한눈에 비교하고 레이더 차트로 차이점을 확인할 수 있습니다.',
    keywords: 'AION 2 캐릭터 비교, 아이온2 스탯 비교, 장비 비교, 전투력 비교',
    openGraph: {
        title: '캐릭터 비교 - AION 2 스탯 & 장비 비교 | HitOn',
        description: 'AION 2 캐릭터를 비교 분석하세요. 스탯, 장비, 전투력 비교.',
        type: 'website',
        url: 'https://hiton.vercel.app/compare',
    },
}

export default function CompareLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
