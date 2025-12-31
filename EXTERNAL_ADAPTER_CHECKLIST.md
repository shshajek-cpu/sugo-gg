# ExternalSourceAdapter 동작 확인 체크리스트

## 📋 사전 준비

### 1. 환경 설정 확인
```bash
# .env 파일 생성 (backend/.env.example 참고)
cd backend
cp .env.example .env

# 필수 환경변수 설정 확인
cat .env | grep EXTERNAL
```

**확인 사항:**
- [ ] `.env` 파일이 존재함
- [ ] `SOURCE_ADAPTER_TYPE` 설정됨 (dummy 또는 external)
- [ ] Redis 연결 정보 (`REDIS_URL`) 정확함
- [ ] 타임아웃 설정이 적절함

### 2. 의존성 설치
```bash
# 백엔드 컨테이너 재빌드
docker-compose build backend

# 또는 로컬 설치 확인
pip install -r backend/requirements.txt
```

**확인 사항:**
- [ ] `tenacity` 패키지 설치됨
- [ ] `beautifulsoup4` 패키지 설치됨
- [ ] `httpx` 패키지 설치됨

### 3. Redis 서비스 확인
```bash
# Redis 컨테이너 상태 확인
docker-compose ps redis

# Redis 연결 테스트
docker-compose exec redis redis-cli ping
# 예상 출력: PONG
```

**확인 사항:**
- [ ] Redis 컨테이너가 실행 중
- [ ] Redis ping 응답 정상

---

## 🧪 기능별 테스트

### A. Dummy Adapter 모드 (안전 모드)

```bash
# .env 설정
SOURCE_ADAPTER_TYPE=dummy

# 서비스 재시작
docker-compose restart backend

# API 호출 테스트
curl "http://localhost:8000/api/characters/search?server=TEST&name=USER1"
```

**확인 사항:**
- [ ] 응답이 즉시 반환됨 (< 1초)
- [ ] `name`, `server`, `level`, `power` 필드 포함
- [ ] 동일한 server:name 조합은 동일한 데이터 반환 (deterministic)

**로그 확인:**
```bash
docker-compose logs backend | grep "dummy"
# 예상: "Using DummySourceAdapter", "Generated dummy data"
```

---

### B. External Adapter 모드 (프로덕션 모드)

#### B-1. 타임아웃 테스트

```bash
# .env 설정
SOURCE_ADAPTER_TYPE=external
EXTERNAL_CONNECT_TIMEOUT=0.1  # 매우 짧게 설정
EXTERNAL_READ_TIMEOUT=0.1

# 서비스 재시작
docker-compose restart backend

# API 호출 (타임아웃 예상)
time curl "http://localhost:8000/api/characters/search?server=TEST&name=USER2"
```

**확인 사항:**
- [ ] 요청이 짧은 시간 내에 실패함 (< 1초)
- [ ] 로그에 "Timeout" 메시지 출력
- [ ] Fallback이 작동함 (DB 또는 Dummy 데이터 반환)

**로그 확인:**
```bash
docker-compose logs backend --tail=50 | grep -i timeout
# 예상: "ExternalSourceTimeoutError", "Request timed out"
```

#### B-2. 재시도 (Retry) 테스트

```bash
# .env 설정
EXTERNAL_MAX_RETRIES=3
EXTERNAL_RETRY_MIN_WAIT=1
EXTERNAL_RETRY_MAX_WAIT=5

# 로그 모니터링
docker-compose logs -f backend &

# API 호출
curl "http://localhost:8000/api/characters/search?server=TEST&name=USER3"
```

**확인 사항:**
- [ ] 로그에 재시도 시도가 표시됨
- [ ] 지수 백오프 확인 (1초, 2초, 4초... 대기)
- [ ] 최대 3회 시도 후 실패

**로그 예시:**
```
Retrying in 1 seconds...
Retrying in 2 seconds...
Retrying in 4 seconds...
✗ Timeout: TEST:USER3
```

#### B-3. Redis 캐싱 테스트

```bash
# .env 설정
EXTERNAL_CACHE_ENABLED=true
EXTERNAL_CACHE_TTL=60

# 서비스 재시작
docker-compose restart backend

# 첫 번째 요청 (캐시 MISS)
time curl "http://localhost:8000/api/characters/search?server=TEST&name=USER4"

# 즉시 두 번째 요청 (캐시 HIT 예상)
time curl "http://localhost:8000/api/characters/search?server=TEST&name=USER4"
```

**확인 사항:**
- [ ] 첫 번째 요청이 더 느림 (외부 호출 시간 포함)
- [ ] 두 번째 요청이 매우 빠름 (< 100ms)
- [ ] 로그에 "Cache HIT" 메시지 출력

**Redis 직접 확인:**
```bash
# Redis에 저장된 캐시 확인
docker-compose exec redis redis-cli KEYS "external:character:*"

# 특정 캐시 내용 확인
docker-compose exec redis redis-cli GET "external:character:TEST:USER4"
```

**확인 사항:**
- [ ] Redis에 `external:character:TEST:USER4` 키 존재
- [ ] TTL이 설정되어 있음 (60초 이하)
- [ ] 캐시 데이터가 JSON 형식

#### B-4. 레이트리밋 테스트

```bash
# .env 설정
EXTERNAL_RATE_LIMIT_ENABLED=true
EXTERNAL_RATE_LIMIT_WINDOW=60

# 서비스 재시작
docker-compose restart backend

# 캐시 삭제 (레이트리밋만 테스트하기 위해)
docker-compose exec redis redis-cli DEL "external:character:TEST:USER5"

# 첫 번째 요청 (성공 예상)
curl "http://localhost:8000/api/characters/search?server=TEST&name=USER5"

# 즉시 두 번째 요청 (레이트리밋 예상)
curl "http://localhost:8000/api/characters/search?server=TEST&name=USER5"
```

**확인 사항:**
- [ ] 첫 번째 요청 성공 (200 OK)
- [ ] 두 번째 요청 실패 또는 캐시 반환
- [ ] 로그에 "Rate limit exceeded" 메시지

**Redis 확인:**
```bash
# 레이트리밋 키 확인
docker-compose exec redis redis-cli KEYS "ratelimit:character:*"

# TTL 확인
docker-compose exec redis redis-cli TTL "ratelimit:character:TEST:USER5"
# 예상: 60초 이하의 값
```

#### B-5. 예외 처리 및 Fallback 테스트

```bash
# 잘못된 URL 설정 (HTTP 에러 유발)
# .env에 추가
EXTERNAL_SOURCE_URL=https://httpstat.us/500

# 서비스 재시작
docker-compose restart backend

# API 호출
curl "http://localhost:8000/api/characters/search?server=TEST&name=USER6"
```

**확인 사항:**
- [ ] API가 500 에러 대신 정상 응답 반환 (Fallback 작동)
- [ ] 로그에 "HTTP 500" 에러 메시지
- [ ] 로그에 Fallback 동작 메시지
- [ ] DB 데이터 또는 Dummy 데이터 반환

**로그 확인:**
```bash
docker-compose logs backend --tail=100 | grep -E "(HTTP|Fallback|dummy)"
```

---

## 📊 성능 및 모니터링

### 1. 응답 시간 측정

```bash
# 여러 시나리오 측정
echo "=== Cache MISS (첫 요청) ==="
time curl "http://localhost:8000/api/characters/search?server=S1&name=N1"

echo "=== Cache HIT (두 번째 요청) ==="
time curl "http://localhost:8000/api/characters/search?server=S1&name=N1"

echo "=== Rate Limited ==="
docker-compose exec redis redis-cli DEL "external:character:S2:N2"
curl "http://localhost:8000/api/characters/search?server=S2&name=N2"
curl "http://localhost:8000/api/characters/search?server=S2&name=N2"
```

**기준 시간:**
- Cache HIT: < 100ms
- Cache MISS (external): 2-10초 (네트워크 + 파싱)
- Rate Limited: < 100ms (즉시 반환)

### 2. Redis 메모리 사용량

```bash
# Redis 메모리 정보
docker-compose exec redis redis-cli INFO memory | grep used_memory_human

# 캐시 키 개수
docker-compose exec redis redis-cli DBSIZE
```

### 3. 로그 레벨별 출력 확인

```bash
# ERROR 레벨 로그만 보기
docker-compose logs backend | grep ERROR

# WARNING 레벨 로그
docker-compose logs backend | grep WARNING

# INFO 레벨 로그 (캐시 HIT/MISS, 레이트리밋 등)
docker-compose logs backend | grep INFO | grep -E "(Cache|Rate|Fetching)"
```

---

## 🔧 문제 해결 (Troubleshooting)

### 문제 1: "Redis cache unavailable" 경고

**증상:**
```
⚠ Redis cache unavailable: Error 111 connecting to redis:6379. Connection refused.
```

**해결방법:**
```bash
# Redis 컨테이너 상태 확인
docker-compose ps redis

# Redis 재시작
docker-compose restart redis

# Redis 연결 테스트
docker-compose exec redis redis-cli ping
```

### 문제 2: "Rate limiter unavailable" 경고

**원인:** Redis 연결 문제 (위와 동일)

**해결방법:** 문제 1과 동일

### 문제 3: 모든 요청이 타임아웃

**확인사항:**
```bash
# 타임아웃 설정이 너무 짧은지 확인
env | grep TIMEOUT

# 외부 URL이 올바른지 확인
env | grep EXTERNAL_SOURCE_URL

# 네트워크 연결 테스트
docker-compose exec backend curl -v https://aion.plaync.com
```

### 문제 4: 캐시가 작동하지 않음

**확인사항:**
```bash
# 캐시 활성화 여부
env | grep CACHE_ENABLED

# Redis 키 확인
docker-compose exec redis redis-cli KEYS "*"

# 로그에서 캐시 관련 메시지 확인
docker-compose logs backend | grep -i cache
```

### 문제 5: Parsing 에러 (HTML 구조 변경)

**증상:**
```
ExternalSourceParseError: Required elements not found
```

**해결방법:**
1. 외부 소스의 HTML 구조 확인
2. `adapter.py`의 `_parse_response` 함수 업데이트
3. CSS 셀렉터 수정

**임시 해결:**
```bash
# Dummy 모드로 전환
SOURCE_ADAPTER_TYPE=dummy
docker-compose restart backend
```

---

## ✅ 최종 점검 체크리스트

### 환경변수 설정
- [ ] `SOURCE_ADAPTER_TYPE` 설정 완료
- [ ] 타임아웃 값이 적절함 (CONNECT: 2-5초, READ: 5-15초)
- [ ] 재시도 설정 (MAX_RETRIES: 2-3)
- [ ] 캐시 TTL 설정 (30-120초)
- [ ] 레이트리밋 설정 (30-60초)

### 서비스 상태
- [ ] Backend 컨테이너 정상 실행
- [ ] Redis 컨테이너 정상 실행
- [ ] Redis 연결 가능 (ping 응답)

### 기능 동작
- [ ] Dummy 모드에서 데이터 생성 확인
- [ ] External 모드에서 타임아웃 처리 확인
- [ ] 재시도 로직 작동 확인
- [ ] Redis 캐싱 작동 확인 (HIT/MISS)
- [ ] 레이트리밋 작동 확인
- [ ] Fallback 메커니즘 작동 확인

### 로그 확인
- [ ] 초기화 로그 출력 ("✓ Redis cache initialized")
- [ ] 캐시 HIT/MISS 로그 출력
- [ ] 레이트리밋 로그 출력
- [ ] 에러 로그에 상세 정보 포함

### 성능
- [ ] Cache HIT 응답 < 100ms
- [ ] Cache MISS 응답 < 10초 (타임아웃 내)
- [ ] Redis 메모리 사용량 정상 범위

---

## 📖 추가 참고사항

### 로깅 상세 레벨 활성화
```python
# main.py에 추가
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Redis 캐시 수동 관리
```bash
# 모든 캐시 삭제
docker-compose exec redis redis-cli FLUSHDB

# 특정 패턴 삭제
docker-compose exec redis redis-cli --scan --pattern "external:*" | xargs docker-compose exec redis redis-cli DEL

# 캐시 통계
docker-compose exec redis redis-cli INFO stats
```

### 프로덕션 모니터링 권장사항
1. **Prometheus + Grafana** 설정하여 메트릭 수집
   - 캐시 히트율
   - 평균 응답 시간
   - 레이트리밋 발생 빈도
   - 외부 API 에러율

2. **Sentry** 연동하여 에러 추적

3. **로그 집계** (ELK Stack 등)
   - 외부 API 호출 패턴 분석
   - 에러 빈도 분석

---

**문서 버전:** 1.0
**최종 업데이트:** 2026-01-01
