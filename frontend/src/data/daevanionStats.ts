
export interface NodeStat {
    id: number;
    type: 'stat' | 'skill';
    name: string;
    value: string;
    description: string;
}

// Helper to generate consistent stats based on God archetype
const generateStats = (god: string, statName: string, statVal: number, altStatName: string, altStatVal: number): Record<number, NodeStat> => {
    const stats: Record<number, NodeStat> = {};

    // Center Node (0) is always the Divine Skill
    stats[0] = {
        id: 0,
        type: 'skill',
        name: `${god}의 권능`,
        value: 'Active',
        description: `60초 동안 ${god}의 힘을 빌려 강력한 버프를 부여합니다.`
    };

    // Generate stats for nodes 1-89
    for (let i = 1; i <= 89; i++) {
        // Alternate between primary and secondary stats
        // Inner nodes (1-30) are smaller values
        // Outer nodes (31+) are larger values
        const isPrimary = i % 2 !== 0;
        const multiplier = i > 40 ? 2 : 1;

        if (isPrimary) {
            stats[i] = {
                id: i,
                type: 'stat',
                name: statName,
                value: `+${statVal * multiplier}`,
                description: `${statName}을(를) ${statVal * multiplier}만큼 증가시킵니다.`
            };
        } else {
            stats[i] = {
                id: i,
                type: 'stat',
                name: altStatName,
                value: `+${altStatVal * multiplier}`,
                description: `${altStatName}을(를) ${altStatVal * multiplier}만큼 증가시킵니다.`
            };
        }
    }
    return stats;
};

export const DAEVANION_STATS: Record<string, Record<number, NodeStat>> = {
    'nezakan': generateStats('네자칸', '물리 공격력', 3, '물리 치명타', 12),
    'zikel': generateStats('지켈', '생명력', 120, '물리 방어', 35),
    'baizel': generateStats('바이젤', '회피', 15, '이동 속도', 1),
    'triniel': generateStats('트리니엘', '명중', 20, '상태이상 적중', 10),
    'ariel': generateStats('아리엘', '마법 증폭력', 18, '마법 적중', 15),
    'asphel': generateStats('아스펠', '마법 치명타', 10, '마법 저항', 25),
    // Fallbacks for ID access
    'default': generateStats('주신', '능력치', 10, '보조 능력치', 5)
};
