# AION2 Tool - Character Search & Ranking

아이온2 캐릭터 검색 및 랭킹 서비스

## 기술 스택
- **Frontend**: Next.js 14 (App Router), TypeScript, Vanilla CSS
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: Supabase PostgreSQL
- **Deployment**: Netlify (Frontend), Supabase (Backend)

## 주요 기능
- 🔍 **캐릭터 검색**: 실시간 + 로컬 DB 하이브리드 검색
- 📊 **캐릭터 상세**: 장비, 스탯, 칭호, 데바니온 보드 등 모든 정보
- 🏆 **랭킹 시스템**: 서버별/클래스별 랭킹
- ⚡ **자동 캐싱**: 5분 TTL로 자동 갱신
- 🎨 **프리미엄 UI**: 다크 테마 기반 고품질 디자인

## 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- Supabase CLI
- Git

### 1. 저장소 클론
```bash
git clone <repository-url>
cd aion
```

### 2. Supabase 초기화
```bash
# Supabase 프로젝트 연결
cd supabase
supabase link --project-ref <your-project-ref>

# 로컬 Supabase 시작
supabase start

# Edge Functions 배포 (로컬 테스트용)
supabase functions serve
```

### 3. 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```

프론트엔드는 http://localhost:3000 에서 실행됩니다.

## 프로젝트 구조
```
aion/
├── frontend/              # Next.js 앱
│   ├── src/
│   │   ├── app/          # App Router 페이지
│   │   ├── components/   # React 컴포넌트
│   │   ├── lib/          # Supabase 클라이언트
│   │   └── types/        # TypeScript 타입
│   └── package.json
│
├── supabase/             # Supabase 백엔드
│   ├── functions/        # Edge Functions
│   │   ├── get-character/
│   │   ├── search-character/
│   │   ├── search-local-character/
│   │   └── refresh-character/
│   └── migrations/       # DB 마이그레이션
│
└── README.md
```

## 환경 변수

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### Supabase Functions
Supabase 대시보드에서 설정:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 배포

### Frontend (Netlify)
```bash
cd frontend
npm run build
# Netlify에 연결하여 자동 배포
```

### Backend (Supabase)
```bash
cd supabase
# 모든 함수 배포
supabase functions deploy get-character
supabase functions deploy search-character
supabase functions deploy search-local-character
supabase functions deploy refresh-character
```

## API 엔드포인트

### Character APIs
- `GET /functions/v1/get-character` - 캐릭터 상세 정보
- `GET /functions/v1/search-character` - 외부 API 캐릭터 검색
- `GET /functions/v1/search-local-character` - 로컬 DB 캐릭터 검색
- `POST /functions/v1/refresh-character` - 캐릭터 데이터 강제 새로고침

## 개발 가이드

### Edge Function 작성
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 로직 구현
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )

  // ...
})
```

### 로컬 테스트
```bash
# Supabase 로컬 환경
supabase start

# Edge Function 실행
supabase functions serve --env-file ./supabase/.env.local

# 함수 테스트
curl http://localhost:54321/functions/v1/get-character
```

## 문제 해결

### Supabase CLI 문제
```bash
# Supabase 재시작
supabase stop
supabase start

# 함수 로그 확인
supabase functions logs get-character --follow
```

### Frontend 빌드 오류
```bash
# 캐시 삭제
rm -rf .next node_modules
npm install
npm run dev
```

## 라이센스
MIT License

## 기여
Pull Request를 환영합니다!
