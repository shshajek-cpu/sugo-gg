import { Metadata } from 'next'

export const metadata: Metadata = {
    title: '개인정보처리방침 | HitOn - AION 2 정보 사이트',
    description: 'HitOn 서비스의 개인정보처리방침입니다. 수집하는 개인정보 항목, 이용 목적, 보유 기간 등을 안내합니다.',
    openGraph: {
        title: '개인정보처리방침 | HitOn',
        description: 'HitOn 서비스의 개인정보처리방침입니다.',
        type: 'website',
        url: 'https://hiton.vercel.app/privacy-policy',
    },
}

export default function PrivacyPolicyLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
