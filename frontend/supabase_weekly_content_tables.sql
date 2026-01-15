-- 주간 컨텐츠 테이블 (주간 지령서, 슈고페스타, 어비스 회랑)
CREATE TABLE IF NOT EXISTS ledger_weekly_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES ledger_characters(id) ON DELETE CASCADE,
  week_key VARCHAR(20) NOT NULL, -- 예: "2024-W03" (주간 키)
  weekly_order_count INTEGER DEFAULT 0,
  abyss_order_count INTEGER DEFAULT 0,
  shugo_base INTEGER DEFAULT 14,
  shugo_bonus INTEGER DEFAULT 0,
  shugo_last_charge_time TIMESTAMPTZ,
  abyss_regions JSONB DEFAULT '[{"id":"ereshrantas_root","name":"에렌슈란타의 뿌리","enabled":false},{"id":"siels_wing","name":"시엘의 날개군도","enabled":false},{"id":"sulfur_tree","name":"유황나무섬","enabled":false}]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, week_key)
);

-- 일일 사명 테이블
CREATE TABLE IF NOT EXISTS ledger_daily_mission (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES ledger_characters(id) ON DELETE CASCADE,
  game_date DATE NOT NULL, -- 게임 날짜 (새벽 5시 기준)
  mission_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, game_date)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_weekly_content_character_week ON ledger_weekly_content(character_id, week_key);
CREATE INDEX IF NOT EXISTS idx_daily_mission_character_date ON ledger_daily_mission(character_id, game_date);

-- RLS 정책 (Row Level Security)
ALTER TABLE ledger_weekly_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_daily_mission ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 자신의 캐릭터 데이터에만 접근 가능하도록 정책 설정
-- (ledger_characters를 통해 user_id 확인)
CREATE POLICY "Users can manage their own weekly content" ON ledger_weekly_content
  FOR ALL USING (
    character_id IN (
      SELECT id FROM ledger_characters WHERE user_id IN (
        SELECT id FROM ledger_users WHERE device_id IS NOT NULL OR auth_user_id IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can manage their own daily missions" ON ledger_daily_mission
  FOR ALL USING (
    character_id IN (
      SELECT id FROM ledger_characters WHERE user_id IN (
        SELECT id FROM ledger_users WHERE device_id IS NOT NULL OR auth_user_id IS NOT NULL
      )
    )
  );

-- 던전 기록 테이블 (초월/원정/성역 기록)
CREATE TABLE IF NOT EXISTS ledger_dungeon_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES ledger_characters(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  transcend_records JSONB DEFAULT '[]',
  expedition_records JSONB DEFAULT '[]',
  sanctuary_records JSONB DEFAULT '[]',
  transcend_double BOOLEAN DEFAULT false,
  expedition_double BOOLEAN DEFAULT false,
  sanctuary_double BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, record_date)
);

-- 던전 선택 정보 테이블 (캐릭터별 마지막 선택한 보스/단계)
CREATE TABLE IF NOT EXISTS ledger_dungeon_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES ledger_characters(id) ON DELETE CASCADE UNIQUE,
  transcend_boss VARCHAR(100) DEFAULT '',
  transcend_tier INTEGER DEFAULT 1,
  expedition_category VARCHAR(100) DEFAULT '',
  expedition_boss VARCHAR(100) DEFAULT '',
  sanctuary_boss VARCHAR(100) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_dungeon_records_character_date ON ledger_dungeon_records(character_id, record_date);
CREATE INDEX IF NOT EXISTS idx_dungeon_selections_character ON ledger_dungeon_selections(character_id);

-- RLS 정책
ALTER TABLE ledger_dungeon_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_dungeon_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own dungeon records" ON ledger_dungeon_records
  FOR ALL USING (
    character_id IN (
      SELECT id FROM ledger_characters WHERE user_id IN (
        SELECT id FROM ledger_users WHERE device_id IS NOT NULL OR auth_user_id IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can manage their own dungeon selections" ON ledger_dungeon_selections
  FOR ALL USING (
    character_id IN (
      SELECT id FROM ledger_characters WHERE user_id IN (
        SELECT id FROM ledger_users WHERE device_id IS NOT NULL OR auth_user_id IS NOT NULL
      )
    )
  );
