export interface RecentCharacter {
    id: string;          // server_id + '_' + character_name
    name: string;        // Character Name
    server: string;      // Server Name (e.g., Siel)
    serverId: number;    // Server ID
    race: string;        // Race (elyos/asmodian)
    class: string;       // Class Name
    level: number;       // Character Level
    itemLevel: number;   // Item Level (Combat Power-like metric)
    profileImage: string;// Profile Image URL
    timestamp: number;   // Timestamp for sorting
}

export interface RankingCharacter {
    character_id: string;
    server_id: number;
    name: string;
    level: number;
    class_name: string;
    race_name: string;
    guild_name?: string;
    combat_power?: number;
    profile_image?: string;
    hiton_score?: number;      // HITON 전투력 (기존 noa_score)
    ranking_ap?: number;
    ranking_gp?: number;
    item_level?: number;       // 아이템 레벨
    prev_rank?: number | null; // 이전 순위 (null = NEW)
    prev_tier?: string;        // 이전 티어 (진급 하이라이트용)
}
