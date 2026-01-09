export interface LedgerUser {
    id: string;
    device_id: string;
    created_at: string;
}

export interface LedgerCharacter {
    id: string;
    user_id: string;
    name: string;
    class_name: string;
    server_name: string;
    is_main: boolean;
    created_at?: string;
}

export interface LedgerDailyRecord {
    id: string;
    character_id: string;
    date: string;
    kina_income: number;
    count_expedition: number;
    count_transcend: number;
    count_bus: number;
    note?: string;
    items?: LedgerRecordItem[];
    created_at?: string;
    updated_at?: string;
}

export interface LedgerRecordItem {
    id: string;
    record_id: string;
    item_name: string;
    count: number;
}
