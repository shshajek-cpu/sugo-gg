// 아이템 검색 결과
export interface ItemSearchResult {
    itemId: string
    name: string
    categoryName: string
    grade: ItemGrade | string
    itemLevel: number
    icon: string
    slotPos: number
    slotName?: string
    classRestriction?: string[]

    // 기본 스탯
    attack?: number
    magicAttack?: number
    defense?: number
    magicDefense?: number
    hp?: number

    // 세트 정보
    setName?: string

    // 획득처
    source?: string

    // 공식 API 추가 필드
    options?: string[] | ItemOption[]
    tradable?: boolean
    description?: string
}

export interface ItemOption {
    name: string
    value: string | number
    isRandom?: boolean
}

// 공식 API 아이템 응답
export interface OfficialItem {
    id: number
    name: string
    image: string
    grade: string // 'Common' | 'Rare' | 'Legend' | 'Unique' | 'Epic'
    options: string[]
    favorite: boolean
    tradable: boolean
    categoryName: string
    description: string
}

// 공식 API 검색 응답
export interface OfficialSearchResponse {
    contents: OfficialItem[]
    pagination: {
        page: number
        size: number
        lastPage: number
        total: number
        limit: number
    }
}

// 공식 API 카테고리
export interface OfficialCategory {
    id: string
    name: string
    child?: OfficialCategory[]
}

// 공식 API 등급
export interface OfficialGrade {
    id: string
    name: string
}

// OfficialItem -> ItemSearchResult 변환
export function convertOfficialToSearchResult(item: OfficialItem): ItemSearchResult {
    return {
        itemId: String(item.id),
        name: item.name,
        categoryName: item.categoryName,
        grade: item.grade,
        itemLevel: 0,
        icon: item.image,
        slotPos: 0,
        options: item.options,
        tradable: item.tradable,
        description: item.description
    }
}

// 아이템 상세 정보
export interface ItemDetail extends ItemSearchResult {
    options: ItemOption[]
    randomOptions?: ItemOption[]
    setEffects?: SetEffect[]
    manastoneSlots?: number
    godstoneSlot?: boolean
}

export interface SetEffect {
    setName: string
    pieces: number
    bonuses: SetBonus[]
    items: SetItem[]
}

export interface SetBonus {
    degree: number          // 2세트, 3세트 등
    descriptions: string[]
}

export interface SetItem {
    itemId: string
    name: string
    equipped: boolean
}

// 아이템 사용 통계
export interface ItemUsageStat {
    itemId: string
    itemName: string
    slotPos: number
    slotName: string
    grade: string
    icon: string
    usageCount: number
    usagePercent: number
    avgEnhanceLevel: number
    avgBreakthrough: number
}

// 슬롯별 티어 리스트
export interface SlotTierList {
    slotPos: number
    slotName: string
    tierItems: TierItem[]
}

export interface TierItem {
    tier: ItemTier
    items: ItemUsageStat[]
}

// 아이템 티어
export type ItemTier = 'S' | 'A' | 'B' | 'C' | 'D'

// 아이템 카테고리
export type ItemCategory =
    | 'weapon'      // 주무기
    | 'subweapon'   // 보조무기
    | 'armor'       // 방어구
    | 'accessory'   // 장신구
    | 'rune'        // 룬
    | 'arcana'      // 아르카나

// 아이템 등급
export type ItemGrade =
    | 'Mythic'
    | 'Legendary'
    | 'Unique'
    | 'Epic'
    | 'Fabled'
    | 'Rare'
    | 'Common'

// 슬롯 포지션 맵 (게임 실제 데이터 기준)
export const SLOT_POS_MAP: Record<number, string> = {
    1: '주무기',
    2: '보조무기',
    3: '투구',
    4: '견갑',
    5: '흉갑',
    6: '장갑',
    7: '각반',
    8: '장화',
    10: '목걸이',
    11: '귀걸이1',
    12: '귀걸이2',
    13: '반지1',
    14: '반지2',
    15: '팔찌1',
    16: '팔찌2',
    17: '허리띠',
    19: '망토',
    22: '아뮬렛',
    23: '룬1',
    24: '룬2',
    41: '아르카나1',
    42: '아르카나2',
    43: '아르카나3',
    44: '아르카나4',
    45: '아르카나5',
}

// 슬롯 카테고리 분류 (게임 실제 데이터 기준)
export const SLOT_CATEGORIES: Record<ItemCategory, number[]> = {
    weapon: [1],
    subweapon: [2],
    armor: [3, 4, 5, 6, 7, 8, 17, 19],
    accessory: [10, 11, 12, 13, 14, 15, 16, 22],
    rune: [23, 24],
    arcana: [41, 42, 43, 44, 45]
}

// 슬롯 그룹 정의 (UI용)
export const SLOT_GROUPS = [
    { name: '무기', slots: [1, 2] },
    { name: '방어구', slots: [3, 4, 5, 6, 7, 8, 17, 19] },
    { name: '장신구', slots: [10, 11, 12, 13, 14, 15, 16, 22] },
    { name: '룬', slots: [23, 24] }
]

// 등급 색상 (DB 등급값 기준 + 공식 사이트 색상)
// Common(일반) - 회색, Rare(레어) - 파랑, Epic(에픽) - 보라
// Unique(유니크) - 노랑, Legend(전설) - 주황, Special(특수) - 초록
export const GRADE_COLORS: Record<string, string> = {
    // DB에서 사용하는 등급명
    'Common': '#9CA3AF',      // 일반 - 회색
    'Rare': '#3B82F6',        // 레어 - 파랑
    'Epic': '#A855F7',        // 에픽 - 보라
    'Unique': '#FACC15',      // 유니크 - 노랑
    'Legend': '#F97316',      // 전설 - 주황
    'Special': '#22C55E',     // 특수 - 초록
    // 하위 호환용 (다른 표기)
    'Mythic': '#14B8A6',      // 신화 - 청록
    'Legendary': '#F97316',   // 전설 (Legend와 동일)
    'Fabled': '#EE6C2A',      // 페이블드 - 주황
}

// 등급 우선순위 (높을수록 좋음)
export const GRADE_PRIORITY: Record<string, number> = {
    'Mythic': 7,
    'Legend': 6,
    'Legendary': 6,
    'Unique': 5,
    'Epic': 4,
    'Fabled': 3,
    'Rare': 2,
    'Special': 1,
    'Common': 0,
}

// 등급 한글명
export const GRADE_LABELS: Record<string, string> = {
    'Common': '일반',
    'Rare': '레어',
    'Epic': '에픽',
    'Unique': '유니크',
    'Legend': '전설',
    'Legendary': '전설',
    'Special': '특수',
    'Mythic': '신화',
    'Fabled': '페이블드',
}

// 티어 색상
export const TIER_COLORS: Record<ItemTier, string> = {
    'S': '#FF6B6B',
    'A': '#FF922B',
    'B': '#FFD43B',
    'C': '#69DB7C',
    'D': '#9CA3AF'
}

// 티어 분류 함수 (사용률 기반)
export function getTierByPercent(percent: number): ItemTier {
    if (percent >= 30) return 'S'
    if (percent >= 15) return 'A'
    if (percent >= 5) return 'B'
    if (percent >= 1) return 'C'
    return 'D'
}

// 티어 라벨
export const TIER_LABELS: Record<ItemTier, string> = {
    'S': '최상위',
    'A': '상위',
    'B': '중상위',
    'C': '중위',
    'D': '하위'
}
