import { RankingCharacter } from '../../types/character'

/**
 * 전투력 표시 유효성 검사
 * 45레벨 미만이거나 비정상 전투력(177029)인 경우 null 반환
 */
export const getValidScore = (char: RankingCharacter, scoreType: 'pve' | 'pvp'): number | null => {
    const level = char.level || char.item_level || 0
    const isValidLevel = level >= 45
    const isAbnormalScore = char.pve_score === 177029 && char.pvp_score === 177029

    if (!isValidLevel || isAbnormalScore) return null

    if (scoreType === 'pve') {
        return char.pve_score || 0
    }
    return char.pvp_score || 0
}
