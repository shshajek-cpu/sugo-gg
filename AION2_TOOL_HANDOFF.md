# AION2 Character Ranking & Analytics
## Developer Handoff Package (FINAL)

본 문서는 aion2tool.com과 동일한 방식의  
**검색 기반 데이터 누적 → 랭킹/통계 생성 웹서비스**를  
AI 또는 개발자가 즉시 구현할 수 있도록 구성된 최종 전달 문서이다.

---

## 1. 프로젝트 개요

### 1.1 목적
- 캐릭터 검색 시 데이터를 DB에 누적
- 누적 데이터 기준으로 랭킹 및 통계 제공
- 공식 API 부재 상황에서도 운영 가능한 구조

### 1.2 핵심 원칙 (변경 불가)
1. 랭킹은 **사이트 DB 기준**
2. 검색되지 않은 캐릭터는 랭킹 미포함
3. 랭킹/통계는 실시간 계산 금지
4. 외부 데이터 실패 시 서비스 중단 금지

---

## 2. 기술 스택 (권장)

- Frontend: Next.js (App Router)
- Backend: FastAPI (Python)
- DB: PostgreSQL
- Cache: Redis
- Batch: Celery + Redis
- Infra: Docker Compose

---

## 3. 사용자 플로우 (E2E)

1. 유저가 서버 + 캐릭터명 입력
2. 외부 데이터 소스 조회
3. 데이터 유효성 검사
4. DB upsert
5. 캐릭터 상세 페이지 노출
6. 랭킹 배치 시 스냅샷 반영
7. 랭킹/통계 페이지에서 조회

---

## 4. 기능 범위 (MVP)

### In Scope
- 캐릭터 검색
- 캐릭터 상세
- 전투력 랭킹
- 서버 / 직업 필터
- 즐겨찾기 (LocalStorage)
- 공지 / 디스클레이머

### Out of Scope
- 공식 로그인
- 전체 서버 실시간 랭킹
- 길드 / 혈맹
- 아이템 시세 자동 추적

---

## 5. DB Schema (PostgreSQL)

### 5.1 characters
```sql
CREATE TABLE characters (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  server VARCHAR(64) NOT NULL,
  class VARCHAR(64) NOT NULL,
  level INT NOT NULL CHECK (level >= 0),
  power BIGINT NOT NULL CHECK (power >= 0),
  updated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (server, name)
);

CREATE INDEX idx_characters_power
ON characters(power DESC);

CREATE INDEX idx_characters_filter
ON characters(server, class, power DESC);
```

### 5.2 character_stats
```sql
CREATE TABLE character_stats (
  id BIGSERIAL PRIMARY KEY,
  character_id BIGINT REFERENCES characters(id) ON DELETE CASCADE,
  stats_json JSONB NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 rank_snapshots
```sql
CREATE TABLE rank_snapshots (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(32),
  filter_key VARCHAR(128),
  snapshot_json JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_rank_snapshots
ON rank_snapshots(type, filter_key, generated_at DESC);
```

---

## 6. API 명세 (요약)

### GET /api/characters/search
- Query: server, name
- 동작:
  1. 외부 소스 조회
  2. characters upsert
  3. stats snapshot 저장
  4. 결과 반환

### GET /api/characters/{id}
- 캐릭터 상세 조회

### GET /api/rankings
- Query: type=power, server?, class?, page?
- Redis 캐시 → Snapshot fallback

---

## 7. 외부 데이터 소스 어댑터

### 인터페이스
```
get_character(server, name) -> CharacterDTO
```

### DTO 필드
- name
- server
- class
- level
- power
- updated_at
- stats_json (optional)

공식 API / 비공식 파서 교체 가능 구조

---

## 8. 배치 & 캐시 정책

### 랭킹 배치
- 전체 랭킹: 5분 주기
- 서버별 랭킹: 15분 주기
- snapshot_json: 상위 5,000명 저장

### Redis 캐시
- TTL: 120초
- Key: rank:{type}:{server}:{class}:page:{n}

---

## 9. 레이트리밋 & 안정성

- 검색 API: IP 기준 분당 30회
- 동일 캐릭터 60초 캐시
- 외부 실패 시 503 + 사용자 메시지

---

## 10. 프론트 화면

### /
- 검색바
- 인기 검색
- 공지

### /c/{server}/{name}
- 캐릭터 상세
- 즐겨찾기

### /ranking
- 랭킹
- 필터 / 페이지네이션

---

## 11. QA 체크리스트 (완료 기준)

### 기능
- 검색 → DB 저장 확인
- 동일 캐릭터 중복 없음
- 랭킹 스냅샷 반영

### 성능
- 랭킹 API < 500ms (캐시 히트)
- 동시 접속 200명 무응답 없음

### 예외
- 외부 소스 실패 시 UX 메시지
- 데이터 누락 시 부분 렌더링

---

## 12. 법적 고지 (필수)

- 비공식 팬 사이트
- 게임사와 무관
- 데이터 정확성 보장 불가

---

## 13. 개발 티켓 요약

### Backend
- DB 마이그레이션
- SourceAdapter 구현
- 검색 / 랭킹 API

### Batch
- 랭킹 스냅샷 Job
- Redis 캐시

### Frontend
- 홈 / 상세 / 랭킹
- 즐겨찾기

### QA / Ops
- E2E 테스트
- Docker 환경 구성

---

## 14. 최종 완료 기준

- 검색 → DB 누적 → 상세 노출 → 랭킹 반영 E2E 통과
- 실시간 랭킹 계산 없음
- 외부 소스 실패 시 서비스 유지
