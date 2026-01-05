import { useMemo } from 'react'

export interface ProcessedSkill {
    sequenceNumber: number
    skillCategory: 'active' | 'passive' | 'stigma' | 'unknown'
    [key: string]: any
}

export interface SkillStats {
    total: number
    activeCount: number
    passiveCount: number
    stigmaCount: number
}

/**
 * 스킬 데이터를 처리하고 카테고리별로 분류하는 훅
 * @param skills - API에서 받아온 스킬 배열
 * @param stigma - API에서 받아온 스티그마 배열
 * @returns 처리된 스킬 목록과 통계
 */
export function useSkillProcessing(skills: any[] = [], stigma: any[] = []) {
    const processedSkills = useMemo(() => {
        // 스킬과 스티그마를 하나의 배열로 합침
        const allSkills = [
            ...(skills || []),
            ...(stigma || []).map(s => ({ ...s, type: 'stigma', category: 'stigma' }))
        ]

        // 순서대로 번호를 매기고 카테고리 분류
        const withNumbers = allSkills.map((skill, index) => {
            const sequenceNumber = index + 1
            let skillCategory: 'active' | 'passive' | 'stigma' | 'unknown' = 'unknown'

            if (sequenceNumber >= 1 && sequenceNumber <= 12) {
                skillCategory = 'active'
            } else if (sequenceNumber >= 13 && sequenceNumber <= 22) {
                skillCategory = 'passive'
            } else if (sequenceNumber >= 23 && sequenceNumber <= 33) {
                skillCategory = 'stigma'
            }

            return {
                ...skill,
                sequenceNumber,
                skillCategory
            }
        })

        return withNumbers
    }, [skills, stigma])

    const stats = useMemo<SkillStats>(() => ({
        total: processedSkills.length,
        activeCount: processedSkills.filter(s => s.skillCategory === 'active').length,
        passiveCount: processedSkills.filter(s => s.skillCategory === 'passive').length,
        stigmaCount: processedSkills.filter(s => s.skillCategory === 'stigma').length
    }), [processedSkills])

    return {
        processedSkills,
        stats
    }
}
