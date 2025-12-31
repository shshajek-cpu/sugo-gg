# ExternalSourceAdapter 실제 활성화 가이드

## 📋 개요

이 문서는 ExternalSourceAdapter를 실제 운영 환경에서 안전하게 활성화하는 방법을 설명합니다.

**현재 상태:**
- ✅ ExternalSourceAdapter 구현 완료 (retry, cache, rate limit)
- ✅ 3단계 Fallback 메커니즘 (External → DB → Dummy)
- ✅ 운영 기준 환경변수 설정
- ✅ 상세 로깅 및 모니터링
- ⚠️ 파싱 로직은 범용 구현 (실제 소스에 맞게 조정 필요)

---

## 🚀 활성화 단계별 절차

### 1단계: 현재 상태 확인 (Dummy 모드)

```bash
# 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f backend

# 예상 로그:
# Using DummySourceAdapter (safe fallback mode)
# ✓ Generated dummy data: TEST:USER1
```

**확인사항:**
- [ ] 서비스 정상 시작
- [ ] API 호출 시 dummy 데이터 반환
- [ ] 3단계 fallback 동작 확인

---

### 2단계: 외부 소스 URL 확인 및 설정

현재 `.env` 파일의 `EXTERNAL_SOURCE_URL`을 확인하세요:

```bash
cat backend/.env | grep EXTERNAL_SOURCE_URL
```

**현재 설정:**
```
EXTERNAL_SOURCE_URL=https://api-community.plaync.com/aion/characters/search
```

**⚠️ 중요: 실제 작동하는 URL로 변경 필요**

아이온2 공식 API가 제한되어 있을 경우, 다음 옵션을 고려하세요:

#### 옵션 A: 공식 API 사용 (추천)
```bash
# 공식 API 엔드포인트 확인 후 업데이트
EXTERNAL_SOURCE_URL=https://api-community.plaync.com/aion/characters/search
```

#### 옵션 B: 웹 스크래핑 사용
```bash
# 웹 검색 페이지 URL
EXTERNAL_SOURCE_URL=https://aion.plaync.com/search
```

**파싱 로직 확인:**

실제 URL에 맞게 `backend/app/adapter.py`의 파싱 로직을 조정해야 합니다:

```python
# JSON API인 경우: _parse_json_response 메서드 확인
# HTML 스크래핑인 경우: _parse_html_response 메서드의 CSS 셀렉터 업데이트
```

---

### 3단계: 외부 소스 테스트 (Dry Run)

External 모드로 전환하기 전에 수동으로 테스트:

```bash
# Python shell에서 테스트
docker-compose exec backend python

>>> from app.adapter import ExternalSourceAdapter
>>> adapter = ExternalSourceAdapter()
>>> result = adapter.get_character("Siel", "TestCharacter")
>>> print(result)
```

**예상 결과:**
- 성공: CharacterDTO 객체 반환
- 실패: ExternalSourceParseError 또는 TimeoutError

**실패 시 조치:**
1. 로그에서 에러 원인 확인
2. URL이 올바른지 확인
3. 파싱 로직이 응답 구조와 맞는지 확인
4. 네트워크 접근이 가능한지 확인

---

### 4단계: External 모드로 전환 (점진적 활성화)

#### 4-1. 환경변수 변경

`backend/.env` 파일 수정:

```bash
# Before
SOURCE_ADAPTER_TYPE=dummy

# After
SOURCE_ADAPTER_TYPE=external
```

#### 4-2. 보수적 설정 확인

트래픽과 차단 리스크를 최소화하기 위한 설정:

```bash
# 긴 타임아웃 (안정성 우선)
EXTERNAL_CONNECT_TIMEOUT=5.0
EXTERNAL_READ_TIMEOUT=15.0

# 적절한 재시도
EXTERNAL_MAX_RETRIES=3

# 긴 캐시 (외부 호출 최소화)
EXTERNAL_CACHE_TTL=120

# 엄격한 레이트리밋 (차단 방지)
EXTERNAL_RATE_LIMIT_WINDOW=60
```

#### 4-3. 서비스 재시작

```bash
docker-compose restart backend

# 로그 모니터링
docker-compose logs -f backend
```

**예상 로그:**
```
Using ExternalSourceAdapter (production mode)
✓ Redis cache initialized successfully
✓ Rate limiter initialized successfully
✓ ExternalSourceAdapter initialized (cache: True, rate_limit: True)
```

---

### 5단계: 실시간 모니터링

#### 성공적인 외부 호출

```bash
# 로그 필터링
docker-compose logs backend | grep "✓ Successfully fetched"

# 예시:
# → Fetching character: Siel:Player1
# ✓ Parsed JSON: Player1 (Lv.80, Power: 123456)
# ✓ Cached: Siel:Player1 (TTL: 120s)
# ✓ Successfully fetched: Siel:Player1
```

#### 캐시 동작 확인

```bash
# 캐시 HIT 확인 (동일 캐릭터 재검색)
docker-compose logs backend | grep "Cache HIT"

# 예시:
# ✓ Cache HIT: Siel:Player1
```

#### 레이트리밋 동작 확인

```bash
# 레이트리밋 발생 확인
docker-compose logs backend | grep "Rate limit"

# 예시:
# ⚠ Rate limit exceeded: Siel:Player1 (retry after 45s)
```

#### 실패 및 Fallback 확인

```bash
# 외부 소스 실패 로그
docker-compose logs backend | grep -E "(✗|⚠)"

# 예시:
# ✗ Timeout: Siel:Player2 - httpx.TimeoutException
# ⚠ Adapter fetch failed for Siel:Player2: Request timed out
# → Entering fallback mode for Siel:Player2
# ✓ Fallback to DB data: Siel:Player2
```

---

### 6단계: 안정성 검증

#### 6-1. Fallback 체인 테스트

**시나리오 1: 외부 성공 → DB 업데이트**
```bash
curl "http://localhost:8000/api/characters/search?server=Siel&name=NewPlayer"

# 로그:
# → Fetching character: Siel:NewPlayer
# ✓ Successfully fetched from adapter: Siel:NewPlayer
# (DB에 저장됨)
```

**시나리오 2: 외부 실패 → DB Fallback**
```bash
# Redis 캐시 삭제 + 외부 소스 차단 시뮬레이션
docker-compose exec redis redis-cli DEL "external:character:Siel:ExistingPlayer"

# 외부 실패 유발 (잘못된 URL 설정 등)
curl "http://localhost:8000/api/characters/search?server=Siel&name=ExistingPlayer"

# 로그:
# ⚠ Adapter fetch failed for Siel:ExistingPlayer
# → Entering fallback mode for Siel:ExistingPlayer
# ✓ Fallback to DB data: Siel:ExistingPlayer
```

**시나리오 3: 외부 실패 + DB 없음 → Dummy Fallback**
```bash
curl "http://localhost:8000/api/characters/search?server=TEST&name=NoDataPlayer"

# 로그:
# ⚠ Adapter fetch failed for TEST:NoDataPlayer
# → Entering fallback mode for TEST:NoDataPlayer
# ⚠ No DB data for TEST:NoDataPlayer. Generating dummy data as last resort
# ✓ Generated dummy data: TEST:NoDataPlayer
```

#### 6-2. 성능 측정

```bash
# 캐시 MISS (첫 요청)
time curl "http://localhost:8000/api/characters/search?server=S1&name=N1"
# 예상: 2-10초 (외부 호출 시간 포함)

# 캐시 HIT (두 번째 요청)
time curl "http://localhost:8000/api/characters/search?server=S1&name=N1"
# 예상: < 100ms
```

---

## 🔍 트러블슈팅

### 문제 1: 모든 요청이 Timeout

**증상:**
```
✗ Timeout: Server:Name - httpx.TimeoutException
```

**원인:**
- 외부 URL이 잘못됨
- 네트워크 접근 불가
- 타임아웃 설정이 너무 짧음

**해결:**
```bash
# 1. URL 확인
docker-compose exec backend curl -v $EXTERNAL_SOURCE_URL

# 2. 타임아웃 늘리기
EXTERNAL_CONNECT_TIMEOUT=10.0
EXTERNAL_READ_TIMEOUT=20.0

# 3. Dummy 모드로 일시 전환
SOURCE_ADAPTER_TYPE=dummy
```

---

### 문제 2: 파싱 에러

**증상:**
```
✗ Parse error for Server:Name: Invalid JSON structure
```

**원인:**
- 응답 구조가 예상과 다름
- API 스키마 변경

**해결:**
```bash
# 1. 실제 응답 확인
docker-compose logs backend | grep "Response preview"

# 2. 파싱 로직 수정
# backend/app/adapter.py의 _parse_json_response 또는 _parse_html_response 수정

# 3. 필드명 매핑 확인
# data.get("name") → data.get("characterName")
```

---

### 문제 3: 외부 소스 차단 (429 Too Many Requests)

**증상:**
```
✗ HTTP 429: Server:Name
```

**원인:**
- 너무 많은 요청
- 레이트리밋 설정이 느슨함

**해결:**
```bash
# 캐시 TTL 늘리기 (외부 호출 감소)
EXTERNAL_CACHE_TTL=300  # 5분

# 레이트리밋 강화
EXTERNAL_RATE_LIMIT_WINDOW=120  # 2분

# 재시도 줄이기 (빠른 실패)
EXTERNAL_MAX_RETRIES=1

# 서비스 재시작
docker-compose restart backend
```

---

### 문제 4: Redis 연결 실패

**증상:**
```
⚠ Redis cache unavailable: Error 111 connecting to redis:6379
```

**원인:**
- Redis 컨테이너 미실행

**해결:**
```bash
# Redis 상태 확인
docker-compose ps redis

# Redis 재시작
docker-compose restart redis

# Redis 연결 테스트
docker-compose exec redis redis-cli ping
```

---

## 📊 운영 모니터링 체크리스트

### 일일 확인사항

- [ ] **성공률**: 외부 호출 성공 비율
  ```bash
  docker-compose logs backend | grep "✓ Successfully fetched" | wc -l
  docker-compose logs backend | grep "✗" | wc -l
  ```

- [ ] **캐시 효율**: 캐시 HIT 비율
  ```bash
  docker-compose logs backend | grep "Cache HIT" | wc -l
  ```

- [ ] **Fallback 빈도**: DB/Dummy fallback 발생 횟수
  ```bash
  docker-compose logs backend | grep "Fallback" | wc -l
  ```

- [ ] **에러 로그**: 심각한 에러 확인
  ```bash
  docker-compose logs backend | grep "ERROR"
  ```

### 주간 확인사항

- [ ] **파싱 로직 유효성**: 외부 소스 구조 변경 확인
- [ ] **성능 튜닝**: 타임아웃/캐시 설정 최적화
- [ ] **Redis 메모리**: 캐시 메모리 사용량
  ```bash
  docker-compose exec redis redis-cli INFO memory
  ```

---

## 🎯 권장 운영 설정

### 저트래픽 환경 (개인/소규모)

```bash
SOURCE_ADAPTER_TYPE=external
EXTERNAL_CONNECT_TIMEOUT=5.0
EXTERNAL_READ_TIMEOUT=15.0
EXTERNAL_MAX_RETRIES=3
EXTERNAL_CACHE_TTL=60
EXTERNAL_RATE_LIMIT_WINDOW=60
```

### 고트래픽 환경 (공개 서비스)

```bash
SOURCE_ADAPTER_TYPE=external
EXTERNAL_CONNECT_TIMEOUT=3.0
EXTERNAL_READ_TIMEOUT=10.0
EXTERNAL_MAX_RETRIES=2  # 빠른 실패
EXTERNAL_CACHE_TTL=300  # 긴 캐시 (5분)
EXTERNAL_RATE_LIMIT_WINDOW=120  # 엄격한 제한 (2분)
```

### 외부 소스 불안정 시

```bash
SOURCE_ADAPTER_TYPE=external
EXTERNAL_CONNECT_TIMEOUT=10.0  # 긴 대기
EXTERNAL_READ_TIMEOUT=20.0
EXTERNAL_MAX_RETRIES=3
EXTERNAL_CACHE_TTL=600  # 매우 긴 캐시 (10분)
EXTERNAL_RATE_LIMIT_WINDOW=180  # 매우 느슨한 제한 (3분)
```

---

## ⚠️ 중요 주의사항

### 1. 파싱 로직 유효성
- 외부 소스의 HTML/API 구조가 변경되면 파싱 실패
- 정기적으로 파싱 로직 검증 필요
- 실패 시 자동으로 Fallback 작동

### 2. 트래픽 제한
- 외부 소스가 차단할 수 있음
- 캐시와 레이트리밋을 적절히 설정
- 필요시 User-Agent 업데이트

### 3. 데이터 신뢰성
- 외부 소스 데이터의 정확성 보장 불가
- 프론트엔드에 적절한 경고 메시지 표시
- DB에 저장된 데이터가 백업 역할

### 4. Fallback 메커니즘
- 3단계 Fallback: External → DB → Dummy
- 서비스 중단 없이 항상 응답 반환
- Warning 메시지로 사용자에게 상태 알림

---

## 📝 최종 체크리스트

활성화 전:
- [ ] `.env` 파일 설정 완료
- [ ] `EXTERNAL_SOURCE_URL` 실제 URL로 업데이트
- [ ] 파싱 로직 실제 응답 구조에 맞게 수정
- [ ] Redis 정상 작동 확인
- [ ] Dry run 테스트 성공

활성화 후:
- [ ] `SOURCE_ADAPTER_TYPE=external` 설정
- [ ] 서비스 재시작 및 로그 확인
- [ ] 외부 호출 성공 확인
- [ ] 캐시 동작 확인
- [ ] Fallback 메커니즘 동작 확인
- [ ] 성능 및 응답 시간 측정

---

**문서 버전:** 1.0
**최종 업데이트:** 2026-01-01
**작성자:** Claude Code Assistant
