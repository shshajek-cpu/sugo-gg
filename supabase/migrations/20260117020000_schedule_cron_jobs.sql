-- ============================================
-- Cron Job 스케줄 등록
-- Supabase 서버는 UTC 기준
-- KST = UTC + 9시간
-- ============================================

-- ============================================
-- 1. 초월/원정 충전 (KST 5시, 13시, 21시)
-- KST 05:00 = UTC 20:00 (전날)
-- KST 13:00 = UTC 04:00
-- KST 21:00 = UTC 12:00
-- ============================================
SELECT cron.schedule(
  'charge-transcend-expedition-05',
  '0 20 * * *',
  $$SELECT public.auto_charge_transcend_expedition();$$
);

SELECT cron.schedule(
  'charge-transcend-expedition-13',
  '0 4 * * *',
  $$SELECT public.auto_charge_transcend_expedition();$$
);

SELECT cron.schedule(
  'charge-transcend-expedition-21',
  '0 12 * * *',
  $$SELECT public.auto_charge_transcend_expedition();$$
);

-- ============================================
-- 2. 악몽 충전 (매일 KST 05:00 = UTC 20:00)
-- ============================================
SELECT cron.schedule(
  'charge-nightmare-daily',
  '0 20 * * *',
  $$SELECT public.auto_charge_nightmare();$$
);

-- ============================================
-- 3. 차원침공 충전 (매일 KST 05:00 = UTC 20:00)
-- ============================================
SELECT cron.schedule(
  'charge-dimension-daily',
  '0 20 * * *',
  $$SELECT public.auto_charge_dimension();$$
);

-- ============================================
-- 4. 슈고페스타 충전 (매일 KST 05:00 = UTC 20:00)
-- ============================================
SELECT cron.schedule(
  'charge-shugo-daily',
  '0 20 * * *',
  $$SELECT public.auto_charge_shugo_festa();$$
);

-- ============================================
-- 4-2. 사명 리셋 (매일 KST 05:00 = UTC 20:00)
-- ============================================
SELECT cron.schedule(
  'reset-daily-mission',
  '0 20 * * *',
  $$SELECT public.auto_reset_daily_mission();$$
);

-- ============================================
-- 5. 주간 리셋 (수요일 KST 05:00 = 화요일 UTC 20:00)
-- Cron 요일: 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
-- ============================================
SELECT cron.schedule(
  'reset-weekly-content',
  '0 20 * * 2',
  $$SELECT public.auto_reset_weekly_content();$$
);

-- ============================================
-- 6. 오드 에너지 충전 (KST 2,5,8,11,14,17,20,23시)
-- KST 02:00 = UTC 17:00 (전날)
-- KST 05:00 = UTC 20:00 (전날)
-- KST 08:00 = UTC 23:00 (전날)
-- KST 11:00 = UTC 02:00
-- KST 14:00 = UTC 05:00
-- KST 17:00 = UTC 08:00
-- KST 20:00 = UTC 11:00
-- KST 23:00 = UTC 14:00
-- ============================================
SELECT cron.schedule(
  'charge-od-energy-02',
  '0 17 * * *',
  $$SELECT public.auto_charge_od_energy();$$
);

SELECT cron.schedule(
  'charge-od-energy-05',
  '0 20 * * *',
  $$SELECT public.auto_charge_od_energy();$$
);

SELECT cron.schedule(
  'charge-od-energy-08',
  '0 23 * * *',
  $$SELECT public.auto_charge_od_energy();$$
);

SELECT cron.schedule(
  'charge-od-energy-11',
  '0 2 * * *',
  $$SELECT public.auto_charge_od_energy();$$
);

SELECT cron.schedule(
  'charge-od-energy-14',
  '0 5 * * *',
  $$SELECT public.auto_charge_od_energy();$$
);

SELECT cron.schedule(
  'charge-od-energy-17',
  '0 8 * * *',
  $$SELECT public.auto_charge_od_energy();$$
);

SELECT cron.schedule(
  'charge-od-energy-20',
  '0 11 * * *',
  $$SELECT public.auto_charge_od_energy();$$
);

SELECT cron.schedule(
  'charge-od-energy-23',
  '0 14 * * *',
  $$SELECT public.auto_charge_od_energy();$$
);
