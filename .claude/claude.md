# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AION 2 character search and ranking service. A web application providing character information, rankings, equipment data, and stats for the AION 2 game.

**Tech Stack:**
- Frontend: Next.js 14 (App Router), TypeScript, CSS Variables (Dark + Yellow theme)
- Backend: Supabase Edge Functions (Deno)
- Database: Supabase PostgreSQL
- Deployment: Netlify (Frontend), Supabase (Backend)

## Commands

```bash
# From project root
cd frontend && npm run dev      # Dev server at http://localhost:3000
cd frontend && npm run build    # Production build
cd frontend && npm run lint     # ESLint check
cd frontend && npm run test:e2e # E2E health check

# Supabase Edge Functions (from supabase/)
supabase functions serve        # Local function testing
supabase functions deploy <fn>  # Deploy: get-character, search-character, etc.
```

## Architecture

```
hiton2/
├── frontend/src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes (Next.js)
│   │   ├── c/[server]/[name]/  # Character detail page
│   │   ├── ranking/            # Ranking page
│   │   ├── admin/              # Admin tools
│   │   └── components/         # Page-specific components
│   ├── components/             # Shared React components
│   ├── lib/                    # Core utilities
│   │   ├── supabaseApi.ts      # Supabase client wrapper
│   │   ├── statsAggregator.ts  # Character stats calculation
│   │   ├── chzzk.ts            # Live streaming integration
│   │   └── theme.ts            # Theme configuration
│   ├── types/                  # TypeScript type definitions
│   ├── hooks/                  # Custom React hooks
│   └── data/                   # Static data files
│
└── supabase/
    ├── functions/              # Edge Functions (Deno)
    │   ├── get-character/      # Character detail fetch
    │   ├── search-character/   # External API search
    │   ├── search-local-character/  # Local DB search
    │   └── refresh-character/  # Force data refresh
    └── migrations/             # Database schema
```

## Key Patterns

**Hybrid Search:** Searches combine local DB (fast) + external API (fresh) in parallel:
```typescript
// Local search first, then live API
supabaseApi.searchLocalCharacter(term).then(...)
supabaseApi.searchCharacter(term, serverId, race, 1).then(...)
```

**API Routes:** Use Next.js route handlers with proper error handling:
```typescript
export async function GET(request: NextRequest) {
    try {
        const [data1, data2] = await Promise.all([fetch(url1), fetch(url2)])
        return NextResponse.json(transformedData)
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
```

**Client Components:** Mark with `'use client'` at top when using hooks/interactivity.

## API Usage Principles

**CRITICAL: Always prioritize self-hosted APIs over external APIs to maximize speed and minimize costs.**

### 1. **Self-Hosted API First (자체 API 우선)**

When implementing features, always check these in order:

1. **Check existing self-hosted APIs** in `frontend/src/app/api/`
2. **Check Supabase Edge Functions** in `supabase/functions/`
3. **Check database cache** - most data is already cached in Supabase
4. **Only if absolutely necessary**, call external AION2 API

### 2. **When to Use External API (공식 API 사용 조건)**

Call external AION2 API (`https://aion2.plaync.com/api/*`) ONLY when:

- ✅ Data doesn't exist in cache (first-time search)
- ✅ User explicitly requests refresh (force refresh button)
- ✅ Cache is expired (>5 minutes old)
- ❌ **NEVER** call on every request
- ❌ **NEVER** call without checking cache first

### 3. **Caching Strategy (캐싱 전략)**

All external API responses must be cached in Supabase:

```typescript
// ✅ GOOD: Check cache first
const { data: cached } = await supabase
  .from('characters')
  .select('*')
  .eq('character_id', characterId)
  .single()

// Return cached if fresh (< 5 minutes)
if (cached && isFresh(cached.scraped_at)) {
  return cached
}

// ❌ BAD: Call external API directly
const response = await fetch('https://aion2.plaync.com/api/...')
```

**Cache TTL:**
- Character info: 5 minutes (`CACHE_TTL_SECONDS = 300`)
- Search results: Immediate (background update)
- Rankings: 10 minutes

### 4. **Existing Self-Hosted APIs**

Use these instead of external API:

| Feature | Self-Hosted API | External API (Avoid) |
|---------|----------------|----------------------|
| 캐릭터 검색 | `/api/search/live` | ❌ |
| 캐릭터 상세 | `/api/character?id=...` | ❌ |
| 랭킹 조회 | `/api/ranking?...` | ❌ |
| 아이템 검색 | `/api/item/search` | ❌ |
| 파티 스캔 | `/api/party/scan` | ❌ |

### 5. **Creating New APIs**

When creating new features requiring external data:

```typescript
// 1. Create Next.js API route: frontend/src/app/api/[feature]/route.ts
export async function GET(request: NextRequest) {
  // Step 1: Check cache
  const cached = await getCachedData(params)
  if (cached && isFresh(cached)) return cached

  // Step 2: Call external API (only if needed)
  const fresh = await fetchExternalAPI(params)

  // Step 3: Save to cache
  await saveToCache(fresh)

  return fresh
}

// 2. Add rate limiting
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit'
const rateLimit = checkRateLimit(request, RATE_LIMITS.external)
if (!rateLimit.success) return rateLimit.error

// 3. Add error handling
try {
  // ... API logic
} catch (error) {
  console.error('[API Name] Error:', error)
  return NextResponse.json({ error: 'User-friendly message' }, { status: 500 })
}
```

### 6. **Performance Best Practices**

- **Parallel Requests**: Use `Promise.all()` for independent queries
- **Batch Updates**: Group DB writes when possible
- **Lazy Loading**: Load data only when needed
- **Background Updates**: Use cache-first, update-background pattern

```typescript
// ✅ GOOD: Parallel queries
const [char, equipment, stats] = await Promise.all([
  getCharacter(id),
  getEquipment(id),
  getStats(id)
])

// ❌ BAD: Sequential queries
const char = await getCharacter(id)
const equipment = await getEquipment(id)
const stats = await getStats(id)
```

### 7. **Cost & Speed Reference**

| Method | Speed | Cost | When to Use |
|--------|-------|------|-------------|
| Supabase Query | 10-50ms | Free (unlimited) | ✅ Always first |
| Self-hosted API | 50-200ms | Free (500k/month) | ✅ Second choice |
| External API | 500-2000ms | Rate limited | ⚠️ Last resort only |

## Project Guidelines

1. **Compact UI**: Keep fonts, cards, buttons reasonably sized to minimize scrolling
2. **Korean Language**: All explanations and reports in Korean
3. **Error Handling**: Display user-friendly error messages with copy button for debugging
4. **TypeScript Strict**: Maintain type safety throughout
5. **AION2 Data**: Apply game-specific race/class board ID rules accurately
6. **Data Persistence**: **CRITICAL - ALWAYS use Supabase for data storage, NEVER use localStorage**
   - All user data, settings, and application state MUST be stored in Supabase PostgreSQL
   - Create proper database tables with migrations in `supabase/migrations/`
   - Implement API routes in `frontend/src/app/api/` for data access
   - Use RLS (Row Level Security) policies to protect user data
   - localStorage is only acceptable for temporary UI state (e.g., collapsed panels, theme preference)
   - When implementing new features with data persistence:
     1. Design the database schema and create migration SQL
     2. Create API routes (GET/POST/DELETE) with proper authentication
     3. Implement frontend logic using the API routes
   - Example pattern:
     ```typescript
     // ✅ GOOD: Supabase persistence
     const res = await fetch('/api/ledger/character-state', {
       method: 'POST',
       body: JSON.stringify(data)
     })

     // ❌ BAD: localStorage persistence
     localStorage.setItem('user-data', JSON.stringify(data))
     ```

## Supabase Project Configuration

**CRITICAL: 반드시 `mnbngmdjiszyowfvnzhk` Supabase 프로젝트만 사용**

이 프로젝트는 단일 Supabase 인스턴스를 사용합니다:

| 항목 | 값 |
|------|---|
| Project ID | `mnbngmdjiszyowfvnzhk` |
| URL | `https://mnbngmdjiszyowfvnzhk.supabase.co` |
| Dashboard | Supabase Dashboard에서 해당 프로젝트 선택 |

### 주의사항

1. **다른 Supabase 프로젝트 사용 금지**
   - `edwtbiujwjprydmahwhh` 등 다른 프로젝트 ID 사용 절대 금지
   - API 라우트 생성 시 반드시 올바른 URL/Key 확인

2. **API 라우트 작성 시 필수 패턴**
   ```typescript
   // ✅ GOOD: 올바른 프로젝트 (mnbngmdjiszyowfvnzhk)
   const SUPABASE_URL = 'https://mnbngmdjiszyowfvnzhk.supabase.co'
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uYm5nbWRqaXN6eW93ZnZuemhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5OTY0ODAsImV4cCI6MjA4MjU3MjQ4MH0.AIvvGxd_iQKpQDbmOBoe4yAmii1IpB92Pp7Scs8Lz7U'

   // ❌ BAD: 잘못된 프로젝트 (다른 ID)
   const SUPABASE_URL = 'https://edwtbiujwjprydmahwhh.supabase.co'  // 절대 사용 금지
   ```

3. **Ledger API 인증 방식**
   - Google 로그인은 현재 비활성화 (다른 Supabase 프로젝트 사용 중)
   - 모든 ledger API는 `device_id`를 우선 사용
   - `X-Device-ID` 헤더를 Bearer 토큰보다 먼저 확인

   ```typescript
   // API 라우트에서 인증 처리 패턴
   async function getUserFromRequest(request: Request) {
     // 1. device_id 우선 확인
     const device_id = request.headers.get('X-Device-ID') || request.headers.get('x-device-id')
     if (device_id) {
       return getOrCreateUserByDeviceId(device_id)
     }

     // 2. Bearer 토큰은 폴백으로만 사용
     // ...
   }
   ```

## Environment Variables

Frontend `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://mnbngmdjiszyowfvnzhk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uYm5nbWRqaXN6eW93ZnZuemhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5OTY0ODAsImV4cCI6MjA4MjU3MjQ4MH0.AIvvGxd_iQKpQDbmOBoe4yAmii1IpB92Pp7Scs8Lz7U
```

## CSS Theme

Uses CSS Variables for Dark + Yellow accent theme:
```css
--bg-main: #0B0D12
--primary: #FACC15
--text-main: #E5E7EB
```
