import { Metadata } from 'next'

export const metadata: Metadata = {
    title: '강화 시뮬레이터 - AION 2 미니게임 | HitOn',
    description: 'AION 2 마석 강화를 시뮬레이션해보세요. 실제 게임과 동일한 UI로 강화 확률을 체험할 수 있는 미니게임입니다.',
    keywords: 'AION 2 강화 시뮬레이터, 아이온2 미니게임, 마석 강화, 강화 확률',
    openGraph: {
        title: '강화 시뮬레이터 - AION 2 미니게임 | HitOn',
        description: 'AION 2 마석 강화를 시뮬레이션해보세요.',
        type: 'website',
        url: 'https://hiton.vercel.app/minigame',
    },
}

export default function MinigameLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
