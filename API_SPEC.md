# API Specification

본 문서는 AION2 Tool의 API 엔드포인트와 응답 스펙을 정의합니다.

---

## 1. Character Search API

### Endpoint
```
GET /api/characters/search
```

### Parameters
- `server` (required): 서버명 (예: "Siel", "Israphel", "TEST")
- `name` (required): 캐릭터명

### Response

#### 성공 시 (200 OK)
```json
{
  "id": 1,
  "name": "HELLO1",
  "server": "TEST",
  "class": "Ranger",
  "level": 83,
  "power": 443850,
  "updated_at": "2025-12-31T15:20:22.642216+00:00",
  "stats": {
    "attack": 269,
    "defense": 1000,
    "hp": 4337
  },
  "warning": null,
  "power_change": 267524,
  "level_change": -15
}
```

#### 필드 설명
- `id` (integer): 캐릭터 고유 ID
- `name` (string): 캐릭터명
- `server` (string): 서버명
- `class` (string): 직업
- `level` (integer): 레벨
- `power` (integer): 전투력
- `updated_at` (datetime): 마지막 업데이트 시각
- `stats` (object): 상세 스탯 (attack, defense, hp 등)
- `warning` (string | null): 경고 메시지
  - `null`: 정상
  - `"External source unavailable, showing last known data."`: DB fallback
  - `"External source unavailable. Showing generated dummy data."`: Dummy fallback
- **`power_change` (integer | null)**: 이전 검색 대비 전투력 증감 **(NEW)**
  - `null`: 최초 검색 또는 변화 없음
  - 양수: 증가
  - 음수: 감소
- **`level_change` (integer | null)**: 이전 검색 대비 레벨 증감 **(NEW)**
  - `null`: 최초 검색 또는 변화 없음
  - 양수: 증가
  - 음수: 감소

#### Fallback 동작
1. **외부 데이터 소스 실패**
   - DB에 데이터가 있으면 → DB 데이터 반환 + `warning` 설정
   - DB에 데이터가 없으면 → Dummy 데이터 생성 및 저장 + `warning` 설정
2. **히스토리 추적**
   - 검색 시마다 power, level 포함한 스냅샷이 `character_stats` 테이블에 누적 저장됨
   - 이전 값과 비교하여 `power_change`, `level_change` 계산

---

## 2. Character History API **(NEW)**

### Endpoint
```
GET /api/characters/{character_id}/history
```

### Parameters
- `character_id` (required, path): 캐릭터 ID
- `limit` (optional, query, default=10): 조회할 히스토리 개수

### Response

#### 성공 시 (200 OK)
```json
[
  {
    "id": 4,
    "power": 443850,
    "level": 83,
    "captured_at": "2025-12-31T15:20:22.645968Z",
    "stats_json": {
      "hp": 4337,
      "level": 83,
      "power": 443850,
      "attack": 269,
      "defense": 1000
    }
  },
  {
    "id": 3,
    "power": 176326,
    "level": 98,
    "captured_at": "2025-12-31T15:20:16.537426Z",
    "stats_json": {
      "hp": 796,
      "level": 98,
      "power": 176326,
      "attack": 151,
      "defense": 408
    }
  }
]
```

#### 필드 설명
- `id` (integer): 히스토리 레코드 ID
- `power` (integer): 해당 시점의 전투력
- `level` (integer): 해당 시점의 레벨
- `captured_at` (datetime): 스냅샷 캡처 시각
- `stats_json` (object): 해당 시점의 전체 스탯 정보

#### 동작
- 최신순으로 정렬되어 반환 (`captured_at DESC`)
- 캐릭터 검색 시마다 자동으로 히스토리 누적

---

## 3. Rankings API

### Endpoint
```
GET /api/rankings
```

### Parameters
- `type` (optional, default="power"): 정렬 기준 ("power", "level", "updated_at")
- `server` (optional): 서버 필터
- `class` (optional): 직업 필터
- `page` (optional, default=1): 페이지 번호 (페이지당 20개)

### Response

#### 성공 시 (200 OK)
```json
{
  "items": [
    {
      "name": "HELLO1",
      "server": "TEST",
      "class_name": "Ranger",
      "level": 83,
      "power": 443850,
      "rank": 1
    },
    {
      "name": "TestChar",
      "server": "Siel",
      "class_name": "Mage",
      "level": 72,
      "power": 263685,
      "rank": 2
    }
  ],
  "generated_at": "2025-12-31T15:20:41.931113",
  "type": "power",
  "filter_key": "all:all:power:page:1"
}
```

#### 필드 설명
- `items` (array): 랭킹 아이템 목록
  - `name` (string): 캐릭터명
  - `server` (string): 서버명
  - `class_name` (string): 직업
  - `level` (integer): 레벨
  - `power` (integer): 전투력
  - `rank` (integer): 순위
- **`generated_at` (datetime)**: 랭킹 생성 시각 **(ALWAYS INCLUDED)**
- `type` (string): 정렬 기준
- `filter_key` (string): 필터 키 (캐시 키로 사용)

#### 중요 사항
- 랭킹은 **사이트에서 검색된 캐릭터만** 포함됩니다
- `generated_at`는 항상 포함되며, 프론트엔드에서 "마지막 갱신 시각" 표시에 사용됩니다
- 스냅샷 기반 캐싱 (Redis 120초 TTL)

---

## 4. Popular Keywords API

### Endpoint
```
GET /api/search/popular
```

### Parameters
- `limit` (optional, default=10): 조회할 인기 검색어 개수

### Response

#### 성공 시 (200 OK)
```json
[
  {
    "keyword": "TEST:HELLO1",
    "count": 5
  },
  {
    "keyword": "Siel:TestChar",
    "count": 3
  }
]
```

---

## 변경 사항 요약 (AI A 통합)

### 신규 API
- `GET /api/characters/{character_id}/history`: 캐릭터 히스토리 조회

### 변경된 API
- `GET /api/characters/search`:
  - 응답에 `power_change`, `level_change` 필드 추가
  - DB fallback 시에도 일관된 응답 구조 보장

- `GET /api/rankings`:
  - `generated_at` 필드가 항상 포함됨을 명시

### 데이터베이스 변경
- `character_stats` 테이블:
  - 검색 시마다 삭제 후 저장 → **누적 저장**으로 변경
  - `stats_json`에 `power`, `level` 포함하여 히스토리 추적 가능

---

## 에러 응답

### 429 Too Many Requests
```json
{
  "detail": "Too many search requests. Please try again later."
}
```

### 503 Service Unavailable
```json
{
  "detail": "External data source unavailable and no local data found."
}
```
- DB fallback도 실패한 경우 (매우 드문 케이스, 현재는 Dummy fallback으로 방지됨)
