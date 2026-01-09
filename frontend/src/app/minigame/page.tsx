import EnhanceGame from '@/app/components/minigame/EnhanceGame'

export default function MinigamePage() {
    return (
        <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
                    강화 시뮬레이터
                </h1>
                <p className="text-gray-400">
                    이미지와 동일한 UI로 구성된 마석 강화 미니게임입니다.
                </p>
            </div>

            <EnhanceGame />

            <div className="mt-20 text-xs text-gray-600">
                Developed by AION 2 Info Hub Team
            </div>
        </div>
    )
}
