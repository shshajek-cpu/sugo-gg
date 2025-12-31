# AION2 Tool - Character Ranking & Analytics

This project is a character search and ranking accumulation tool for AION2.

## Technology Stack
- **Backend**: FastAPI (Python), SQLAlchemy, PostgreSQL
- **Frontend**: Next.js (App Router), Vanilla CSS
- **Cache/Task**: Redis, Celery
- **Infrastructure**: Docker Compose

## Prerequisites
- Docker & Docker Compose

## Quick Start
1. Run the entire stack:
   ```bash
   docker-compose up -d --build
   ```
2. Open your browser:
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

## Project Structure
- `backend/`: FastAPI application and Celery worker logic.
- `frontend/`: Next.js web application.
- `docker-compose.yml`: Infrastructure orchestration.
- `API_SPEC.md`: Detailed API specification and response schemas.

## Features
- **Character Search**: Automatically updates the local database when a character is searched.
- **Character History Tracking** ⭐ *NEW*: Tracks power and level changes over time.
  - View stat progression with `/api/characters/{id}/history`
  - Shows `+/-` indicators on character detail page
- **Ranking System**: Background snapshots are generated every 5 minutes.
  - Displays last update time (`generated_at`)
  - Shows disclaimer about search-based rankings
- **Fallback System**:
  - External source failure → DB fallback
  - No DB data → Dummy data generation (prevents service interruption)
- **Toss Blue Theme**: Premium UI design with Toss Blue highlights.

## New API Endpoints

### Character History API
```bash
# Get character stat history (latest 10 records)
curl "http://localhost:8000/api/characters/1/history?limit=10"
```

### Enhanced Search Response
The search API now returns `power_change` and `level_change` fields:
```json
{
  "id": 1,
  "name": "TestChar",
  "power": 443850,
  "power_change": 267524,  // ← NEW: Change since last search
  "level_change": -15,     // ← NEW: Change since last search
  ...
}
```

## Testing

### E2E Test Scenarios
Run these commands to verify all features:

```bash
# 1. First search (no changes)
curl "http://localhost:8000/api/characters/search?server=TEST&name=HELLO1"
# Expected: power_change = null, level_change = null

# 2. Second search (with changes)
curl "http://localhost:8000/api/characters/search?server=TEST&name=HELLO1"
# Expected: power_change and level_change calculated

# 3. Check history accumulation
curl "http://localhost:8000/api/characters/1/history?limit=5"
# Expected: 2+ history records in descending order by captured_at

# 4. Check rankings with generated_at
curl "http://localhost:8000/api/rankings"
# Expected: response includes "generated_at" field
```

### External Failure Simulation
The system gracefully handles external source failures:
- DB fallback: Returns last known data with warning
- Dummy fallback: Generates data when no DB record exists

## API Documentation
See [API_SPEC.md](./API_SPEC.md) for detailed API specifications, including:
- Request/response schemas
- New fields and their meanings
- Fallback behavior
- Error handling

## Deployment
```bash
# Production deployment
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down
```

## Quality Gate & Testing

### Running Tests Locally

The project includes comprehensive quality gates with unit tests and E2E checks.

#### Quick Start (Using Make)
```bash
# Run all tests
make test

# Run only backend tests
make test-backend

# Run only frontend E2E checks
make test-frontend

# Run linters
make lint

# Full CI pipeline (build + test)
make ci
```

#### Manual Testing

**Backend Unit Tests (9 tests)**
```bash
# Run all backend tests with coverage
docker-compose run --rm backend pytest -v --cov=app --cov-report=term-missing

# Run specific test
docker-compose run --rm backend pytest tests/test_api.py::TestCharacterSearch::test_search_character_success -v
```

**Frontend E2E Checks**
```bash
# Ensure services are running first
docker-compose up -d

# Run E2E checks
cd frontend && npm run test:e2e
```

**Linting**
```bash
# Backend linting
docker-compose run --rm backend flake8 app --max-line-length=120
```

### Test Coverage

**Backend Tests (9 tests)**
1. ✅ Character search - normal case
2. ✅ Character search - detect changes (2nd search)
3. ✅ External failure → DB fallback
4. ✅ External failure + No DB → Dummy fallback
5. ✅ History accumulation and sorting
6. ✅ Rankings from DB (no snapshot)
7. ✅ Rankings with snapshot
8. ✅ Rankings with filters
9. ✅ Popular keywords

**Frontend E2E Checks (4 checks)**
1. ✅ Backend health check
2. ✅ Home page renders
3. ✅ Ranking page renders
4. ✅ Rankings API responds

### CI Scripts

The project includes CI scripts that can be run locally or in CI/CD:

**Linux/Mac:**
```bash
bash scripts/ci.sh
```

**Windows:**
```cmd
scripts\ci.bat
```

### Troubleshooting Test Failures

#### Backend Test Failures

**1. Check backend logs**
```bash
docker-compose logs backend --tail=50
```

**2. Check database connection**
```bash
docker-compose logs db --tail=20
```

**3. Common issues:**
- **Import errors**: Rebuild containers with `docker-compose build backend`
- **Database errors**: Restart services with `docker-compose restart db backend`
- **Test isolation**: Each test uses an in-memory SQLite database (no cleanup needed)

#### Frontend E2E Failures

**1. Check if services are running**
```bash
docker-compose ps
# All services should be "Up" and "healthy"
```

**2. Check frontend logs**
```bash
docker-compose logs frontend --tail=50
```

**3. Manual verification**
```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend home page
curl http://localhost:3000

# Check rankings page
curl http://localhost:3000/ranking
```

**4. Common issues:**
- **Connection refused**: Services not started → Run `docker-compose up -d`
- **Timeout errors**: Services starting → Wait 10-15 seconds and retry
- **Port conflicts**: Check if ports 3000/8000 are already in use

#### General Debugging

**View all service logs**
```bash
docker-compose logs -f
```

**Restart specific service**
```bash
docker-compose restart backend
docker-compose restart frontend
```

**Full reset**
```bash
docker-compose down -v
docker-compose up -d --build
```

**Check service health**
```bash
# Backend health endpoint
curl http://localhost:8000/health
# Expected: {"status": "ok"}

# Frontend accessibility
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK
```

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `CORS_ORIGINS`: Comma-separated allowed origins
- `SOURCE_ADAPTER_TYPE`: `dummy` (default) or `external`

## Real Data Operation (실데이터 운영 모드)

This project supports switching between **Dummy Mode** (Mock Data) and **External Mode** (Real Data).

### 1. Activating Real Data
To enable real data fetching, update your `.env` file:
```bash
SOURCE_ADAPTER_TYPE=external
```
> **Note**: Default is `dummy`. Switch to `external` only when ready for production scraping.

### 2. Operational Policies
The `ExternalSourceAdapter` includes built-in protection mechanisms:

- **Frequency**:
  - **Rate Limit**: Max 1 request per 60 seconds *per character*.
  - **Block Protection**: Retries on transient errors (502/503), but strict fail on 429/403.
- **Caching**:
  - **TTL**: Successful responses are cached in Redis for **60 seconds**.
- **Resilience**:
  - **Timeout**: Connect 3s / Read 10s.
  - **Fallback Chain**: External API Fail → Stale DB Data → Dummy Data (Zero Downtime).

### 3. Recommended Scenarios

| Scenario | Behavior | Action Required |
| :--- | :--- | :--- |
| **Normal** | Fetches live data, updates DB, caches result. | None |
| **External Outage** | Returns **Stale DB Data** with warning toast. | Monitor logs for recovery. |
| **New Char + Outage** | Returns **Dummy Data** with warning. | None (prevents white screen). |
| **IP Block (403)** | Returns Stale/Dummy Data. | Update Proxy/VPN or Check User-Agent. |

## Change Log

### v1.1.0 (Latest)
- ✅ Character history tracking with power/level changes
- ✅ New API: `/api/characters/{id}/history`
- ✅ Enhanced search response with `power_change` and `level_change`
- ✅ Ranking page displays last update time and disclaimer
- ✅ Improved fallback system (DB → Dummy)
- ✅ Stats accumulation (no longer overwrites history)

### v1.0.0
- Initial release with basic search and ranking features
