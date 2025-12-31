# ExternalSourceAdapter 환경변수 목록

## 📋 전체 환경변수 요약

| 환경변수 | 기본값 | 설명 | 권장값 |
|---------|--------|------|--------|
| **어댑터 타입** |
| `SOURCE_ADAPTER_TYPE` | `dummy` | 어댑터 모드 선택<br>• `dummy`: 안전 모드 (더미 데이터)<br>• `external`: 프로덕션 모드 | 개발: `dummy`<br>운영: `external` |
| **HTTP 타임아웃** |
| `EXTERNAL_CONNECT_TIMEOUT` | `3.0` | 연결 타임아웃 (초) | `2.0` - `5.0` |
| `EXTERNAL_READ_TIMEOUT` | `10.0` | 응답 읽기 타임아웃 (초) | `5.0` - `15.0` |
| **재시도 설정** |
| `EXTERNAL_MAX_RETRIES` | `3` | 최대 재시도 횟수 | `2` - `3` |
| `EXTERNAL_RETRY_MIN_WAIT` | `1` | 재시도 최소 대기 시간 (초) | `1` |
| `EXTERNAL_RETRY_MAX_WAIT` | `10` | 재시도 최대 대기 시간 (초) | `10` |
| **캐시 설정** |
| `EXTERNAL_CACHE_ENABLED` | `true` | 캐시 활성화 여부 | `true` |
| `EXTERNAL_CACHE_TTL` | `60` | 캐시 유효 시간 (초) | `30` - `120` |
| **레이트리밋** |
| `EXTERNAL_RATE_LIMIT_ENABLED` | `true` | 레이트리밋 활성화 여부 | `true` |
| `EXTERNAL_RATE_LIMIT_WINDOW` | `60` | 동일 캐릭터 재요청 최소 간격 (초) | `30` - `60` |
| **외부 소스** |
| `EXTERNAL_SOURCE_URL` | `https://aion.plaync.com/search` | 외부 데이터 소스 URL | 실제 URL로 변경 |
| `EXTERNAL_USER_AGENT` | Chrome 120 UA | HTTP User-Agent 헤더 | 최신 브라우저 UA |
| **Redis** |
| `REDIS_URL` | `redis://redis:6379/0` | Redis 연결 URL | - |

---

## 🎯 시나리오별 권장 설정

### 1. 개발 환경 (안전/빠름)
```bash
SOURCE_ADAPTER_TYPE=dummy
# 나머지 설정은 무시됨 (dummy 모드는 외부 호출 없음)
```

### 2. 스테이징 환경 (테스트)
```bash
SOURCE_ADAPTER_TYPE=external
EXTERNAL_CONNECT_TIMEOUT=3.0
EXTERNAL_READ_TIMEOUT=10.0
EXTERNAL_MAX_RETRIES=3
EXTERNAL_CACHE_ENABLED=true
EXTERNAL_CACHE_TTL=30          # 짧은 캐시 (테스트용)
EXTERNAL_RATE_LIMIT_ENABLED=true
EXTERNAL_RATE_LIMIT_WINDOW=30  # 짧은 간격 (테스트용)
```

### 3. 프로덕션 환경 (고트래픽)
```bash
SOURCE_ADAPTER_TYPE=external
EXTERNAL_CONNECT_TIMEOUT=3.0
EXTERNAL_READ_TIMEOUT=10.0
EXTERNAL_MAX_RETRIES=2          # 빠른 실패
EXTERNAL_CACHE_ENABLED=true
EXTERNAL_CACHE_TTL=120          # 긴 캐시 (부하 감소)
EXTERNAL_RATE_LIMIT_ENABLED=true
EXTERNAL_RATE_LIMIT_WINDOW=60  # 남용 방지
```

### 4. 프로덕션 환경 (저트래픽, 신선한 데이터 필요)
```bash
SOURCE_ADAPTER_TYPE=external
EXTERNAL_CONNECT_TIMEOUT=3.0
EXTERNAL_READ_TIMEOUT=10.0
EXTERNAL_MAX_RETRIES=3          # 성공률 우선
EXTERNAL_CACHE_ENABLED=true
EXTERNAL_CACHE_TTL=30           # 짧은 캐시 (신선한 데이터)
EXTERNAL_RATE_LIMIT_ENABLED=true
EXTERNAL_RATE_LIMIT_WINDOW=30  # 빈번한 업데이트 허용
```

### 5. 외부 소스 불안정 시
```bash
SOURCE_ADAPTER_TYPE=external
EXTERNAL_CONNECT_TIMEOUT=5.0    # 긴 타임아웃
EXTERNAL_READ_TIMEOUT=15.0      # 긴 타임아웃
EXTERNAL_MAX_RETRIES=3          # 많은 재시도
EXTERNAL_CACHE_ENABLED=true
EXTERNAL_CACHE_TTL=300          # 매우 긴 캐시 (5분)
EXTERNAL_RATE_LIMIT_ENABLED=true
EXTERNAL_RATE_LIMIT_WINDOW=120  # 긴 간격 (부하 감소)
```

---

## 🔍 세부 설명

### SOURCE_ADAPTER_TYPE
**설명:** 어댑터 동작 모드 선택

**값:**
- `dummy`: 더미 데이터 생성 (외부 호출 없음, 항상 성공)
- `external`: 실제 외부 소스 호출 (프로덕션)

**영향:**
- `dummy` 모드에서는 다른 모든 EXTERNAL_* 설정이 무시됨
- 프로덕션에서는 반드시 `external` 사용

---

### EXTERNAL_CONNECT_TIMEOUT
**설명:** TCP 연결 수립 대기 시간

**단위:** 초 (부동소수점)

**고려사항:**
- 너무 짧으면: 네트워크 지연 시 불필요한 실패
- 너무 길면: 느린 응답 시 사용자 대기 시간 증가

**권장값:**
- 빠른 네트워크: `2.0`
- 일반 네트워크: `3.0`
- 느린 네트워크: `5.0`

---

### EXTERNAL_READ_TIMEOUT
**설명:** HTTP 응답 수신 대기 시간

**단위:** 초 (부동소수점)

**고려사항:**
- 외부 소스의 응답 생성 시간에 따라 조절
- HTML 파싱 시간은 별도 (이 타임아웃에 포함 안 됨)

**권장값:**
- 빠른 API: `5.0`
- 일반 웹사이트: `10.0`
- 복잡한 처리: `15.0`

---

### EXTERNAL_MAX_RETRIES
**설명:** 실패 시 최대 재시도 횟수

**단위:** 정수

**재시도 조건:**
- 네트워크 에러
- 타임아웃
- 일시적 서버 에러 (5xx)

**재시도하지 않는 경우:**
- 클라이언트 에러 (4xx)
- 파싱 에러
- 레이트리밋 에러

**권장값:**
- 빠른 실패 우선: `2`
- 균형: `3`
- 성공률 우선: `4` (권장하지 않음)

---

### EXTERNAL_RETRY_MIN_WAIT / MAX_WAIT
**설명:** 재시도 간 대기 시간 (지수 백오프)

**계산식:**
```
wait_time = min(MIN_WAIT * (2 ^ attempt), MAX_WAIT)

예시 (MIN=1, MAX=10):
- 1차 재시도: 1초 대기
- 2차 재시도: 2초 대기
- 3차 재시도: 4초 대기
- 4차 재시도: 8초 대기
- 5차 재시도: 10초 대기 (MAX)
```

**고려사항:**
- 외부 소스의 복구 시간에 따라 조절
- 너무 짧으면 외부 소스에 부담
- 너무 길면 사용자 대기 시간 증가

---

### EXTERNAL_CACHE_ENABLED
**설명:** Redis 캐시 사용 여부

**값:** `true` / `false`

**효과:**
- `true`: 동일 요청 시 Redis에서 즉시 응답 (외부 호출 없음)
- `false`: 매번 외부 소스 호출

**주의사항:**
- Redis가 없으면 자동으로 비활성화됨
- 비활성화 시 외부 소스 부하 증가

**권장:** 대부분의 경우 `true`

---

### EXTERNAL_CACHE_TTL
**설명:** 캐시 유효 기간

**단위:** 초 (정수)

**트레이드오프:**
- **짧은 TTL (30초):**
  - 장점: 신선한 데이터
  - 단점: 외부 호출 빈도 증가

- **긴 TTL (120초):**
  - 장점: 외부 호출 감소, 응답 속도 향상
  - 단점: 오래된 데이터 가능성

**권장값:**
- 실시간 데이터 필요: `30`
- 균형: `60`
- 고트래픽: `90-120`

---

### EXTERNAL_RATE_LIMIT_ENABLED
**설명:** 캐릭터별 요청 빈도 제한 활성화

**값:** `true` / `false`

**목적:**
- 동일 캐릭터 반복 조회 방지
- 외부 소스 부하 분산
- 남용 방지

**동작:**
- `true`: RATE_LIMIT_WINDOW 내 재요청 시 에러 발생
- `false`: 제한 없음 (캐시는 여전히 작동)

**권장:** `true` (남용 방지)

---

### EXTERNAL_RATE_LIMIT_WINDOW
**설명:** 동일 캐릭터 재요청 최소 간격

**단위:** 초 (정수)

**동작:**
```
1. 캐릭터 A 검색 (성공)
2. Redis에 타임스탬프 저장 (TTL=WINDOW)
3. WINDOW 초 이내 재검색 시도
4. ExternalSourceRateLimitError 발생
5. WINDOW 초 경과 후 재검색 가능
```

**권장값:**
- 캐시 TTL과 동일하거나 약간 긴 값
- 일반적: `60`
- 빈번한 업데이트 허용: `30`
- 엄격한 제한: `120`

---

### EXTERNAL_SOURCE_URL
**설명:** 외부 데이터 소스의 기본 URL

**형식:** `https://example.com/search`

**사용:**
- 실제 요청: `{BASE_URL}?server={server}&keyword={name}`

**주의사항:**
- 실제 URL로 변경 필요
- 파싱 로직도 함께 업데이트 필요

---

### EXTERNAL_USER_AGENT
**설명:** HTTP 요청 시 User-Agent 헤더

**목적:**
- 봇 탐지 회피
- 정상적인 브라우저 요청으로 위장

**권장값:**
- 최신 Chrome/Firefox User-Agent 사용
- 주기적으로 업데이트

**예시:**
```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
```

---

## 🚨 주의사항

### 1. Redis 의존성
다음 기능은 Redis가 필요합니다:
- 캐싱 (`EXTERNAL_CACHE_ENABLED=true`)
- 레이트리밋 (`EXTERNAL_RATE_LIMIT_ENABLED=true`)

Redis 없이 실행하면:
- 자동으로 해당 기능 비활성화
- 경고 로그 출력
- 서비스는 계속 작동 (외부 호출만 수행)

### 2. 타임아웃 총합
실제 최대 대기 시간 계산:
```
MAX_TOTAL_TIME = (CONNECT_TIMEOUT + READ_TIMEOUT) * (MAX_RETRIES + 1)

예시:
- CONNECT_TIMEOUT = 3
- READ_TIMEOUT = 10
- MAX_RETRIES = 3
- 총 시간 = (3 + 10) * (3 + 1) = 52초
```

### 3. 캐시 vs 레이트리밋
- **캐시:** 같은 요청의 응답을 저장 (성능 향상)
- **레이트리밋:** 요청 빈도 제한 (남용 방지)
- 둘 다 활성화 권장

**시나리오:**
```
1. 사용자 A가 캐릭터 검색 (캐시 MISS)
   → 외부 호출, 캐시 저장, 레이트리밋 설정

2. 10초 후 사용자 A가 동일 캐릭터 재검색
   → 캐시 HIT (외부 호출 없음, 레이트리밋 무관)

3. 90초 후 사용자 A가 동일 캐릭터 재검색 (캐시 만료)
   → 레이트리밋 확인 OK → 외부 호출
```

---

## 📊 모니터링 권장사항

### 로그 레벨별 확인사항

**INFO 레벨:**
- 어댑터 초기화 상태
- 캐시 HIT 통계
- 성공적인 외부 호출

**WARNING 레벨:**
- 재시도 발생
- 레이트리밋 발동
- Redis 연결 실패 (graceful degradation)

**ERROR 레벨:**
- 외부 소스 에러
- 파싱 실패
- 예상치 못한 예외

### 메트릭 수집 (Prometheus 권장)

```python
# 수집 권장 메트릭
- external_request_total (counter)
- external_request_duration_seconds (histogram)
- external_cache_hit_ratio (gauge)
- external_rate_limit_exceeded_total (counter)
- external_timeout_total (counter)
- external_retry_total (counter)
```

---

**문서 버전:** 1.0
**최종 업데이트:** 2026-01-01
