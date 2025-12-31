# 프로젝트 지침서 - 아이온 2 정보 제공 사이트 개발 (AION 2 Info Hub)

## 1. 프로젝트 개요 및 목표

**목표**: 아이온 2(AION 2) 관련 최신 뉴스, 공략, 캐릭터 랭킹, 전투력 분석을 제공하는 고성능 웹사이트 구축

**핵심 가치**:
- 빠른 로딩 속도
- 직관적인 UI/UX
- 정확한 데이터 제공
- 실시간 랭킹 정보

**타겟 사용자**: 아이온 2를 플레이하는 전 세계 게이머 (한국어 지원 필수)

## 2. 개발 원칙 및 커뮤니케이션 수칙 (매우 중요)

이 프로젝트의 모든 참여자(또는 AI 어시스턴트)는 다음 원칙을 준수해야 합니다.

### 언어 규정 (Strict Language Policy)

- **완료된 작업에 대한 보고, 설명, 결과물 제시는 어떤 상황에서도 반드시 '한국어(Korean)'로 대답해야 합니다.** (시스템 오류, 예외 상황 포함)
- 코드 내 주석이나 변수명은 영문을 권장하나, 그에 대한 설명은 한국어로 작성합니다.

### 코드 품질 원칙

- **클린 코드 지향**: 유지보수가 쉽도록 모듈화된 코드를 작성하고, 적절한 주석을 답니다.
- **사용자 중심 설계**: 모든 기능은 '유저가 정보를 찾기 편한가?'를 최우선으로 고려합니다.
- **성능 최적화**: 불필요한 렌더링 방지, 캐싱 활용, API 응답 속도 개선

## 3. 기술 스택

### 프론트엔드
- **Framework**: Next.js 14 (App Router)
- **Styling**: CSS Variables (Dark Theme + Yellow Accent)
- **Icons**: Lucide React
- **Language**: TypeScript

### 백엔드
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Scraping**: Playwright (Headless Browser)
- **Task Queue**: Celery + Redis

### 배포
- **Containerization**: Docker + Docker Compose
- **Frontend Port**: 3000
- **Backend Port**: 8000

## 4. 단계별 개발 로드맵

### 1단계: 기획 및 구조 설계 ✅ (완료)
- [x] 사이트맵 정의: 메인 홈, 랭킹, 캐릭터 상세, 비교 페이지
- [x] UI/UX 와이어프레임: 다크 모드 기반 DAK.GG 스타일 테마
- [x] 데이터베이스 스키마 설계

### 2단계: 핵심 기능 구현 ✅ (완료)
- [x] DB 스키마 구현: 캐릭터, 히스토리, 랭킹 스냅샷 테이블
- [x] 크롤링 시스템: Playwright 기반 공식 랭킹 페이지 스크래핑
- [x] 3-Tier Fallback: External → Stale DB → Dummy 데이터 전략
- [x] 캐싱 시스템: Redis 기반 1시간 캐시 정책
- [x] 검색 기능: 서버별/이름별 캐릭터 검색

### 3단계: 고급 UI 및 분석 기능 ✅ (완료)
- [x] DAK.GG 디자인 오버홀: Dark + Yellow 테마 적용
- [x] 캐릭터 상세 대시보드: KPI Cards, 히스토리 테이블
- [x] 비교 페이지: 최대 3명 캐릭터 비교
- [x] 랭킹 페이지: 서버/직업 필터, TOP 10/50/100
- [x] 홈 페이지 기능 로직:
  - 실시간 랭킹 (TOP 10)
  - 서버별 TOP 3 캐릭터
  - 최근 검색 캐릭터
  - 인기 검색어
  - 클릭 네비게이션

### 4단계: 커뮤니티 및 부가 기능 (예정)
- [ ] 유저 게시판 구현 (자유, 질문, 공략)
- [ ] 실시간 댓글 및 좋아요 기능
- [ ] 반응형 모바일 디자인 개선
- [ ] 다국어 지원 (영어)

## 5. 작업 보고 양식

작업이 완료되면 다음과 같은 형식으로 **반드시 한국어로** 보고하십시오.

```
[작업 완료 보고]

작업 내용: [구체적인 작업 내용]
수정 사항: [버그 수정, 개선 사항 등]
파일 경로: [수정된 파일 경로]
다음 예정 작업: [후속 작업 계획]
```

**예시**:
```
[작업 완료 보고]

작업 내용: 홈 페이지 서버별 TOP 3 캐릭터 위젯 구현 완료
수정 사항: 
  - 새 API 엔드포인트 `/api/rankings/by-server` 추가
  - ServerTopCharacters 컴포넌트 생성
  - 클릭 시 캐릭터 상세로 이동 기능 추가
파일 경로: 
  - frontend/src/app/page.tsx
  - backend/app/main.py
다음 예정 작업: 모바일 반응형 레이아웃 개선
```

## 6. 현재 프로젝트 구조

```
아이온/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI 메인 서버
│   │   ├── models.py        # DB 모델 정의
│   │   ├── database.py      # DB 연결 설정
│   │   ├── adapter.py       # 데이터 소스 어댑터
│   │   └── worker.py        # Celery 백그라운드 작업
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # 홈 페이지
│   │   │   ├── globals.css        # 글로벌 스타일 (Dark + Yellow)
│   │   │   ├── ranking/           # 랭킹 페이지
│   │   │   ├── c/[server]/[name]/ # 캐릭터 상세
│   │   │   └── compare/           # 비교 페이지
│   └── Dockerfile
├── docker-compose.yml
└── .env
```

## 7. 주요 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/characters/search?server={server}&name={name}` | 캐릭터 검색 |
| GET | `/api/rankings?limit={limit}&server={server}` | 랭킹 조회 |
| GET | `/api/rankings/by-server?limit_per_server={n}` | 서버별 TOP N |
| GET | `/api/characters/recent?limit={limit}` | 최근 검색 캐릭터 |
| GET | `/api/search/popular?limit={limit}` | 인기 검색어 |
| GET | `/api/characters/{id}/history` | 캐릭터 히스토리 |

## 8. 환경 변수

`.env` 파일에서 다음 변수를 설정합니다:

```env
# Database
POSTGRES_USER=aion2user
POSTGRES_PASSWORD=aion2pass
POSTGRES_DB=aion2db
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# API
BACKEND_PORT=8000
FRONTEND_PORT=3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Scraping
SOURCE_ADAPTER_TYPE=external
MIN_REFRESH_INTERVAL_MINUTES=60
```

## 9. 개발 워크플로우

1. **기능 요청 접수**: 사용자가 새 기능 또는 버그 수정 요청
2. **구현 계획 작성**: `implementation_plan.md` 작성
3. **코드 작성**: 백엔드/프론트엔드 수정
4. **테스트**: 로컬 환경에서 기능 검증
5. **문서화**: 변경사항을 `walkthrough.md`에 기록
6. **배포**: Docker 컨테이너 재시작

## 10. 품질 기준

- **응답 속도**: API 응답 시간 < 500ms (캐시 적중 시 < 100ms)
- **데이터 정확도**: 공식 랭킹 페이지와 100% 일치
- **사용자 경험**: 모든 페이지 로딩 시간 < 2초
- **코드 품질**: Lint 오류 0개, 타입 안정성 보장

---

**마지막 업데이트**: 2026-01-01  
**프로젝트 상태**: ✅ 베타 서비스 운영 중
