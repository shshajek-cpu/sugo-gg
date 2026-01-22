-- ============================================
-- 이용권 자동 충전 SQL 함수
-- Cron Job에서 호출되어 이용권을 자동으로 충전
-- ============================================

-- ============================================
-- 1. 초월/원정 충전 함수 (5시, 13시, 21시에 각 +1)
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_charge_transcend_expedition()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ledger_character_state
  SET
    base_tickets = jsonb_set(
      jsonb_set(
        base_tickets,
        '{transcend}',
        to_jsonb(LEAST(14, COALESCE((base_tickets->>'transcend')::int, 0) + 1))
      ),
      '{expedition}',
      to_jsonb(LEAST(21, COALESCE((base_tickets->>'expedition')::int, 0) + 1))
    ),
    last_charge_time = NOW(),
    updated_at = NOW();

  RAISE NOTICE '[Auto Charge] 초월/원정 충전 완료: %', NOW();
END;
$$;

-- ============================================
-- 2. 악몽 충전 함수 (매일 5시, +2)
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_charge_nightmare()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ledger_character_state
  SET
    base_tickets = jsonb_set(
      base_tickets,
      '{nightmare}',
      to_jsonb(LEAST(14, COALESCE((base_tickets->>'nightmare')::int, 0) + 2))
    ),
    updated_at = NOW();

  RAISE NOTICE '[Auto Charge] 악몽 충전 (+2) 완료: %', NOW();
END;
$$;

-- ============================================
-- 3. 차원침공 충전 함수 (매일 5시, +1)
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_charge_dimension()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ledger_character_state
  SET
    base_tickets = jsonb_set(
      base_tickets,
      '{dimension}',
      to_jsonb(LEAST(14, COALESCE((base_tickets->>'dimension')::int, 0) + 1))
    ),
    updated_at = NOW();

  RAISE NOTICE '[Auto Charge] 차원침공 충전 (+1) 완료: %', NOW();
END;
$$;

-- ============================================
-- 4. 주간 리셋 함수 (수요일 5시)
-- 성역, 일일던전, 각성전, 토벌전, 어비스회랑
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_reset_weekly_content()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- ledger_character_state 테이블 리셋
  UPDATE public.ledger_character_state
  SET
    base_tickets = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              base_tickets,
              '{sanctuary}',
              '4'::jsonb
            ),
            '{daily_dungeon}',
            '7'::jsonb
          ),
          '{awakening}',
          '3'::jsonb
        ),
        '{subjugation}',
        '3'::jsonb
      ),
      '{abyss_hallway}',
      '3'::jsonb
    ),
    last_sanctuary_charge_time = NOW(),
    updated_at = NOW();

  -- ledger_weekly_content 테이블 리셋 (주간지령서, 어비스지령서)
  UPDATE public.ledger_weekly_content
  SET
    weekly_order_count = 0,
    abyss_order_count = 0,
    updated_at = NOW();

  RAISE NOTICE '[Auto Charge] 주간 컨텐츠 리셋 완료: %', NOW();
END;
$$;

-- ============================================
-- 4-2. 사명 리셋 함수 (매일 5시)
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_reset_daily_mission()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ledger_daily_mission
  SET
    count = 0,
    updated_at = NOW();

  RAISE NOTICE '[Auto Charge] 사명 리셋 완료: %', NOW();
END;
$$;

-- ============================================
-- 5. 슈고페스타 충전 함수 (매일 5시, +2)
-- ledger_weekly_content 테이블의 shugo_base 업데이트
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_charge_shugo_festa()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ledger_weekly_content
  SET
    shugo_base = LEAST(14, COALESCE(shugo_base, 0) + 2),
    shugo_last_charge_time = NOW(),
    updated_at = NOW();

  RAISE NOTICE '[Auto Charge] 슈고페스타 충전 (+2) 완료: %', NOW();
END;
$$;

-- ============================================
-- 6. 오드 시간 에너지 충전 함수 (3시간마다, +15)
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_charge_od_energy()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ledger_character_state
  SET
    od_time_energy = LEAST(840, COALESCE(od_time_energy, 0) + 15),
    od_last_charge_time = NOW(),
    updated_at = NOW();

  RAISE NOTICE '[Auto Charge] 오드 에너지 충전 (+15) 완료: %', NOW();
END;
$$;

-- ============================================
-- 권한 설정
-- ============================================
GRANT EXECUTE ON FUNCTION public.auto_charge_transcend_expedition() TO postgres;
GRANT EXECUTE ON FUNCTION public.auto_charge_nightmare() TO postgres;
GRANT EXECUTE ON FUNCTION public.auto_charge_dimension() TO postgres;
GRANT EXECUTE ON FUNCTION public.auto_reset_weekly_content() TO postgres;
GRANT EXECUTE ON FUNCTION public.auto_reset_daily_mission() TO postgres;
GRANT EXECUTE ON FUNCTION public.auto_charge_shugo_festa() TO postgres;
GRANT EXECUTE ON FUNCTION public.auto_charge_od_energy() TO postgres;
