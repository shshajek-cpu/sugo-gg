@echo off
REM CI Script - Quality Gate (Windows)
REM Can be run locally or in CI/CD pipeline

echo ========================================
echo   AION2 Tool - Quality Gate
echo ========================================
echo.

REM Step 1: Build containers
echo [1/4] Building Docker containers...
docker-compose build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    exit /b 1
)
echo SUCCESS: Build completed
echo.

REM Step 2: Start services
echo [2/4] Starting services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start services
    exit /b 1
)
echo SUCCESS: Services started
echo.

REM Wait for services to be ready
echo Waiting for services to be healthy...
timeout /t 10 /nobreak > nul
echo.

REM Step 3: Run backend tests
echo [3/4] Running backend unit tests...
docker-compose run --rm backend pytest -v --cov=app --cov-report=term-missing
if %errorlevel% neq 0 (
    echo ERROR: Backend tests failed
    echo Check logs with: docker-compose logs backend
    goto cleanup
)
echo SUCCESS: Backend tests passed
echo.

REM Step 4: Run frontend E2E checks
echo [4/4] Running frontend E2E checks...
cd frontend
call npm run test:e2e
if %errorlevel% neq 0 (
    echo ERROR: Frontend E2E checks failed
    echo Check logs with: docker-compose logs frontend
    cd ..
    goto cleanup
)
cd ..
echo SUCCESS: Frontend E2E checks passed
echo.

REM All checks passed
echo ========================================
echo SUCCESS: Quality Gate PASSED
echo ========================================
goto end

:cleanup
docker-compose down -v
exit /b 1

:end
docker-compose down -v
exit /b 0
