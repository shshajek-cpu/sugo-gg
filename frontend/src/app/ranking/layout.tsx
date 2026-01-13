import { Metadata } from 'next'
import RankingLayoutClient from '../components/ranking/RankingLayoutClient'

export const metadata: Metadata = {
    title: '랭킹 - AION 2 서버별 캐릭터 순위 | HitOn',
    description: 'AION 2 전 서버 캐릭터 랭킹을 확인하세요. 전투력, 레벨, 직업별 순위와 실시간 랭킹 변동을 제공합니다.',
    keywords: 'AION 2 랭킹, 아이온2 순위, 전투력 랭킹, 서버별 랭킹, 직업별 순위',
    openGraph: {
        title: '랭킹 - AION 2 서버별 캐릭터 순위 | HitOn',
        description: 'AION 2 전 서버 캐릭터 랭킹을 확인하세요.',
        type: 'website',
        url: 'https://hiton.vercel.app/ranking',
    },
}

export default function RankingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <RankingLayoutClient>{children}</RankingLayoutClient>
}
