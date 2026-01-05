// NOA Combat Power Calculation System

export interface TierInfo {
    tier: string
    subLevel: number
    color: string
    displayName: string
    minPower: number
    maxPower: number
}

// Tier thresholds and colors
const TIER_CONFIG = [
    { name: 'Bronze', color: '#CD7F32', min: 0, max: 4999 },
    { name: 'Silver', color: '#C0C0C0', min: 5000, max: 9999 },
    { name: 'Gold', color: '#FFD700', min: 10000, max: 14999 },
    { name: 'Platinum', color: '#E5E4E2', min: 15000, max: 19999 },
    { name: 'Emerald', color: '#50C878', min: 20000, max: 24999 },
    { name: 'Diamond', color: '#B9F2FF', min: 25000, max: 29999 },
    { name: 'Master', color: '#FF6B6B', min: 30000, max: Infinity }
]

// Stat weights for combat power calculation
const STAT_WEIGHTS = {
    '위력': 1.5,
    'Power': 1.5,
    '공격력': 1.5,
    '민첩': 1.2,
    'Agility': 1.2,
    '공격속도': 1.2,
    '정확': 1.0,
    'Accuracy': 1.0,
    '명중': 1.0,
    '의지': 1.0,
    'Will': 1.0,
    '마법저항': 1.0,
    '지식': 1.3,
    'Knowledge': 1.3,
    '마법력': 1.3,
    '체력': 0.8,
    'Stamina': 0.8,
    'HP': 0.8,
    '생명력': 0.8
}

/**
 * Calculate combat power from character stats and equipment
 */
export function calculateCombatPower(stats: any, equipment: any[]): number {
    let totalPower = 0

    // 1. Base stats contribution
    if (stats?.statList) {
        for (const stat of stats.statList) {
            const statName = stat.name || stat.statName
            const statValue = typeof stat.value === 'string'
                ? parseInt(stat.value.replace(/,/g, ''))
                : (stat.value || stat.statValue || 0)

            const weight = STAT_WEIGHTS[statName] || 0.5
            totalPower += statValue * weight
        }
    }

    // 2. Equipment contribution
    for (const item of equipment) {
        if (!item) continue

        // Item level bonus
        if (item.itemLevel) {
            totalPower += item.itemLevel * 10
        }

        // Enhancement bonus
        if (item.enhancement) {
            const enhanceLevel = parseInt(item.enhancement.replace('+', ''))
            totalPower += enhanceLevel * 50
        }

        // Breakthrough bonus
        if (item.breakthrough) {
            totalPower += item.breakthrough * 100
        }

        // Soul engraving bonus
        if (item.soulEngraving) {
            const grade = item.soulEngraving.grade
            if (grade === 'S') totalPower += 200
            else if (grade === 'A') totalPower += 150
            else if (grade === 'B') totalPower += 100
        }

        // Manastone bonus
        if (item.manastones) {
            totalPower += item.manastones.length * 20
        }
    }

    return Math.floor(totalPower)
}

/**
 * Determine tier and sub-level based on combat power
 */
export function getTierInfo(combatPower: number): TierInfo {
    for (const tier of TIER_CONFIG) {
        if (combatPower >= tier.min && combatPower <= tier.max) {
            const range = tier.max - tier.min
            const position = combatPower - tier.min

            // Calculate sub-level (1-5)
            let subLevel = 1
            if (range !== Infinity) {
                const subRange = range / 5
                subLevel = Math.min(5, Math.floor(position / subRange) + 1)
            } else {
                // For Master tier, use increments of 2000
                subLevel = Math.min(5, Math.floor((combatPower - tier.min) / 2000) + 1)
            }

            return {
                tier: tier.name,
                subLevel,
                color: tier.color,
                displayName: `${tier.name} ${subLevel}`,
                minPower: tier.min,
                maxPower: tier.max
            }
        }
    }

    // Fallback to Bronze 1
    return {
        tier: 'Bronze',
        subLevel: 1,
        color: '#CD7F32',
        displayName: 'Bronze 1',
        minPower: 0,
        maxPower: 4999
    }
}

/**
 * Get tier icon/badge component
 */
export function getTierBadgeStyle(tierInfo: TierInfo) {
    return {
        background: `linear-gradient(135deg, ${tierInfo.color}20, ${tierInfo.color}10)`,
        border: `1px solid ${tierInfo.color}60`,
        color: tierInfo.color,
        fontWeight: 'bold',
        padding: '0.3rem 0.6rem',
        borderRadius: '6px',
        fontSize: '0.75rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em'
    }
}
