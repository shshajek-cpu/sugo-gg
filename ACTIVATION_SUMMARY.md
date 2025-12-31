# ExternalSourceAdapter 활성화 완료 요약

## ✅ 완료된 작업

### 1. 파싱 로직 구현 (adapter.py)

**변경사항:**
- `_parse_response` 메서드를 JSON/HTML 자동 감지 및 파싱으로 개선
- `_parse_json_response`: JSON API 응답 파싱 (여러 필드명 지원)
- `_parse_html_response`: HTML 스크래핑 파싱 (범용 CSS 셀렉터)
- NotImplementedError 제거 → 실제로 동작하는 파싱 로직

**주요 기능:**
```python
# JSON API 지원
- data.get("name") or data.get("characterName") 등 여러 필드명 매핑
- 리스트 응답 자동 처리 (첫 번째 결과 사용)
- 중첩 객체 자동 unwrapping (data.data, data.result 등)

# HTML 스크래핑 지원
- 범용 CSS 셀렉터로 여러 패턴 시도
- 파싱 실패 시 명확한 에러 로깅 및 Fallback
```

**파일 위치:** `backend/app/adapter.py` (line 427-608)

---

### 2. Fallback 메커니즘 강화 (main.py)

**3단계 Fallback 체인 구현:**

```
1단계: External Source (adapter.get_character)
   ↓ 실패
2단계: Database (기존 저장 데이터)
   ↓ 없음
3단계: Dummy Data (서비스 중단 방지)
```

**변경사항:**
- 상세한 에러 로깅 추가 (logger 사용)
- Fallback 이유를 사용자에게 명확히 전달 (warning 메시지)
- 각 단계별 로그 출력으로 디버깅 용이

**주요 로그:**
```python
logger.info("→ Attempting to fetch character: {server}:{name}")
logger.warning("⚠ Adapter fetch failed: {error}")
logger.info("→ Entering fallback mode")
logger.info("✓ Fallback to DB data")
logger.warning("⚠ No DB data. Generating dummy data as last resort")
```

**파일 위치:** `backend/app/main.py` (line 60-111)

---

### 3. 운영 기준 환경변수 설정 (.env)

**보수적 설정 (트래픽/차단 리스크 최소화):**

```bash
# 기본 모드: dummy (안전)
SOURCE_ADAPTER_TYPE=dummy

# 긴 타임아웃 (안정성 우선)
EXTERNAL_CONNECT_TIMEOUT=5.0
EXTERNAL_READ_TIMEOUT=15.0

# 적절한 재시도
EXTERNAL_MAX_RETRIES=3

# 긴 캐시 (외부 호출 최소화)
EXTERNAL_CACHE_TTL=120  # 2분

# 엄격한 레이트리밋 (차단 방지)
EXTERNAL_RATE_LIMIT_WINDOW=60  # 1분
```

**전환 절차:**
1. 현재: `SOURCE_ADAPTER_TYPE=dummy` (테스트 중)
2. 검증 후: `SOURCE_ADAPTER_TYPE=external` (운영 모드)

**파일 위치:** `backend/.env`

---

### 4. 상세 문서화

#### EXTERNAL_ADAPTER_ACTIVATION.md
- 단계별 활성화 절차
- 실시간 모니터링 가이드
- 트러블슈팅 가이드
- 시나리오별 권장 설정
- 최종 체크리스트

#### EXTERNAL_ADAPTER_CHECKLIST.md (기존)
- 기능별 테스트 절차
- Redis 캐싱 테스트
- 레이트리밋 테스트
- 성능 측정 방법

#### ENVIRONMENT_VARIABLES.md (기존)
- 전체 환경변수 레퍼런스
- 시나리오별 권장값
- 세부 설명 및 영향도

---

## 🎯 현재 상태

### ✅ 정상 동작 확인

```bash
# API 테스트 결과
curl "http://localhost:8000/api/characters/search?server=TEST&name=USER1"

# 응답 (Dummy 모드)
{
  "id": 6,
  "name": "USER1",
  "server": "TEST",
  "class": "Ranger",
  "level": 83,
  "power": 478981,
  "stats": { "attack": 155, "defense": 446, "hp": 685 },
  "warning": null
}
```

**확인사항:**
- ✅ 서비스 정상 시작
- ✅ API 정상 응답
- ✅ Dummy 데이터 생성 동작
- ✅ DB 저장 및 조회 정상
- ✅ 3단계 Fallback 메커니즘 구현 완료

---

## 🔄 External 모드 활성화 방법

### 간단 버전 (1분)

```bash
# 1. .env 파일 수정
cd backend
sed -i 's/SOURCE_ADAPTER_TYPE=dummy/SOURCE_ADAPTER_TYPE=external/' .env

# 2. 서비스 재시작
docker-compose restart backend

# 3. 로그 확인
docker-compose logs -f backend
```

### 상세 버전 (권장)

**EXTERNAL_ADAPTER_ACTIVATION.md 참조**

1. 외부 소스 URL 확인 및 업데이트
2. Dry run 테스트 (Python shell에서 직접 호출)
3. 환경변수 전환 (`SOURCE_ADAPTER_TYPE=external`)
4. 서비스 재시작 및 로그 모니터링
5. 성공/실패/Fallback 동작 검증
6. 성능 측정 (캐시 HIT/MISS)

---

## ⚠️ 주의사항

### 1. 파싱 로직 조정 필요

현재 구현은 **범용 파싱 로직**입니다. 실제 외부 소스에 맞게 조정해야 합니다:

**JSON API인 경우:**
```python
# backend/app/adapter.py의 _parse_json_response 확인
# 필드명 매핑이 실제 API 응답과 일치하는지 확인
```

**HTML 스크래핑인 경우:**
```python
# backend/app/adapter.py의 _parse_html_response 확인
# CSS 셀렉터를 실제 HTML 구조에 맞게 업데이트

selectors = {
    'name': ['.actual-name-class', '#character-name'],  # 실제 셀렉터로 변경
    'level': ['.actual-level-class'],
    'class': ['.actual-class-class'],
    'power': ['.actual-power-class']
}
```

### 2. 외부 소스 접근 제한

아이온2 공식 API(`https://api-community.plaync.com/aion/`)가 제한되어 있을 수 있습니다.

**대안:**
- 다른 비공식 데이터 소스 사용
- 웹 스크래핑으로 전환 (URL 변경)
- CORS 프록시 사용
- API 키 발급 (가능한 경우)

### 3. 트래픽 관리

외부 소스가 차단할 수 있으므로:
- 캐시 TTL을 충분히 길게 (120초 이상)
- 레이트리밋을 엄격하게 (60초 이상)
- User-Agent를 실제 브라우저로 위장
- 필요시 요청 간격에 추가 지연 삽입

### 4. 데이터 신뢰성

외부 소스 데이터의 정확성을 보장할 수 없습니다:
- 프론트엔드에 적절한 경고 표시 (이미 구현됨)
- 데이터 검증 로직 추가 고려
- 주기적인 파싱 로직 검증

---

## 📊 성공/실패 로그 예시

### 성공 케이스

```
→ Attempting to fetch character: Siel:Player1
→ Fetching character: Siel:Player1
✓ Parsed JSON: Player1 (Lv.80, Power: 123456)
✓ Cached: Siel:Player1 (TTL: 120s)
✓ Successfully fetched from adapter: Siel:Player1
```

### 캐시 HIT

```
→ Attempting to fetch character: Siel:Player1
→ Fetching character: Siel:Player1
✓ Cache HIT: Siel:Player1
✓ Successfully fetched from adapter: Siel:Player1
```

### 실패 → DB Fallback

```
→ Attempting to fetch character: Siel:Player2
→ Fetching character: Siel:Player2
✗ Timeout: Siel:Player2 - httpx.TimeoutException
⚠ Adapter fetch failed for Siel:Player2: Request timed out
→ Entering fallback mode for Siel:Player2
✓ Fallback to DB data: Siel:Player2
```

### 실패 → Dummy Fallback

```
→ Attempting to fetch character: TEST:NewPlayer
⚠ Adapter fetch failed for TEST:NewPlayer: Parse error
→ Entering fallback mode for TEST:NewPlayer
⚠ No DB data for TEST:NewPlayer. Generating dummy data as last resort
✓ Generated dummy data: TEST:NewPlayer
```

---

## 🔍 모니터링 명령어

### 실시간 로그 확인

```bash
# 전체 로그
docker-compose logs -f backend

# 성공만
docker-compose logs backend | grep "✓ Successfully fetched"

# 실패만
docker-compose logs backend | grep "✗"

# Fallback 발생
docker-compose logs backend | grep "Fallback"

# 캐시 효율
docker-compose logs backend | grep "Cache HIT"
```

### Redis 상태 확인

```bash
# 캐시 키 확인
docker-compose exec redis redis-cli KEYS "external:character:*"

# 캐시 개수
docker-compose exec redis redis-cli DBSIZE

# 특정 캐시 내용
docker-compose exec redis redis-cli GET "external:character:TEST:USER1"
```

### 성능 측정

```bash
# 캐시 MISS (첫 요청)
time curl "http://localhost:8000/api/characters/search?server=S1&name=N1"

# 캐시 HIT (두 번째 요청)
time curl "http://localhost:8000/api/characters/search?server=S1&name=N1"
```

---

## 📁 변경된 파일 목록

### 코드 파일
1. **backend/app/adapter.py** - 파싱 로직 구현
2. **backend/app/main.py** - Fallback 강화, 로깅 추가
3. **backend/requirements.txt** - httpx, tenacity, beautifulsoup4 추가 (기존)

### 설정 파일
4. **backend/.env** - 운영 기준 환경변수 설정 (신규)

### 문서 파일
5. **EXTERNAL_ADAPTER_ACTIVATION.md** - 활성화 가이드 (신규)
6. **EXTERNAL_ADAPTER_CHECKLIST.md** - 테스트 체크리스트 (기존)
7. **ENVIRONMENT_VARIABLES.md** - 환경변수 레퍼런스 (기존)

---

## ✅ 최종 체크리스트

활성화 준비:
- [x] adapter.py 파싱 로직 구현
- [x] main.py Fallback 메커니즘 강화
- [x] .env 파일 생성 (보수적 설정)
- [x] Docker 컨테이너 재빌드 (새 dependencies)
- [x] 서비스 정상 시작 확인
- [x] Dummy 모드 정상 동작 확인
- [x] 상세 문서화 완료

External 모드 전환 전:
- [ ] 외부 소스 URL 확인 및 테스트
- [ ] 파싱 로직 실제 응답 구조에 맞게 조정
- [ ] Dry run 테스트 (Python shell)
- [ ] `SOURCE_ADAPTER_TYPE=external` 설정
- [ ] 서비스 재시작 및 로그 확인
- [ ] 성공/실패/Fallback 동작 검증

---

## 🚀 다음 단계

### 1. 실제 외부 소스 테스트

```bash
# Python shell에서 직접 테스트
docker-compose exec backend python

>>> from app.adapter import ExternalSourceAdapter
>>> adapter = ExternalSourceAdapter()
>>> result = adapter.get_character("Siel", "실제캐릭터명")
>>> print(result)
```

성공하면 → External 모드 활성화
실패하면 → 파싱 로직 조정 또는 URL 변경

### 2. 점진적 활성화

1. 소수의 사용자만 External 모드 적용 (A/B 테스트)
2. 성공률 모니터링
3. 문제 없으면 전체 적용

### 3. 운영 최적화

- 성능 데이터 수집 (캐시 효율, 평균 응답시간)
- 타임아웃/캐시 설정 튜닝
- 에러 패턴 분석 및 파싱 로직 개선

---

**최종 업데이트:** 2026-01-01
**상태:** ✅ Dummy 모드 동작 확인 완료, External 모드 전환 준비 완료
