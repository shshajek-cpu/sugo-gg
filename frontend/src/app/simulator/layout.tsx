import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '캐릭터 시뮬레이터 | SUGO',
  description: '장비를 변경하고 스탯 변화를 미리 확인하세요. AION 2 캐릭터 시뮬레이터',
  openGraph: {
    title: '캐릭터 시뮬레이터 | SUGO',
    description: '장비를 변경하고 스탯 변화를 미리 확인하세요',
  },
}

export default function SimulatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
