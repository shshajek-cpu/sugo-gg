import { Metadata } from 'next'

export const metadata: Metadata = {
    title: '이용약관 | HitOn - AION 2 정보 사이트',
    description: 'HitOn 서비스의 이용약관입니다. 서비스 이용 조건, 이용자의 권리와 의무, 면책조항 등을 안내합니다.',
    openGraph: {
        title: '이용약관 | HitOn',
        description: 'HitOn 서비스의 이용약관입니다.',
        type: 'website',
        url: 'https://hiton.vercel.app/terms',
    },
}

export default function TermsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
