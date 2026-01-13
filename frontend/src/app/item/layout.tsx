import { Metadata } from 'next'
import ItemLayoutClient from '../components/item/ItemLayoutClient'

export const metadata: Metadata = {
    title: '아이템 정보 - AION 2 장비 & 아이템 검색 | HitOn',
    description: 'AION 2 아이템 정보를 검색하세요. 장비 티어, 옵션, 마석, 각인 정보와 아이템 비교 기능을 제공합니다.',
    keywords: 'AION 2 아이템, 아이온2 장비, 아이템 검색, 장비 옵션, 마석, 각인',
    openGraph: {
        title: '아이템 정보 - AION 2 장비 & 아이템 검색 | HitOn',
        description: 'AION 2 아이템 정보를 검색하세요. 장비 티어, 옵션 정보 제공.',
        type: 'website',
        url: 'https://hiton.vercel.app/item',
    },
}

export default function ItemLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <ItemLayoutClient>{children}</ItemLayoutClient>
}
