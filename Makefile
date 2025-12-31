.PHONY: help test test-backend test-frontend lint lint-backend lint-frontend build up down logs clean

# Default target
help:
	@echo "AION2 Tool - Quality Gate Commands"
	@echo ""
	@echo "Available targets:"
	@echo "  make test              - Run all tests (backend + frontend)"
	@echo "  make test-backend      - Run backend unit tests"
	@echo "  make test-frontend     - Run frontend E2E checks"
	@echo "  make lint              - Run all linters"
	@echo "  make lint-backend      - Run backend linter (flake8)"
	@echo "  make build             - Build all Docker containers"
	@echo "  make up                - Start all services"
	@echo "  make down              - Stop all services"
	@echo "  make logs              - View logs"
	@echo "  make clean             - Clean test artifacts"
	@echo ""

# Run all tests
test: test-backend test-frontend
	@echo "✅ All tests passed!"

# Backend tests
test-backend:
	@echo "🧪 Running backend unit tests..."
	docker-compose run --rm backend pytest -v --cov=app --cov-report=term-missing
	@echo "✅ Backend tests completed"

# Frontend E2E tests
test-frontend:
	@echo "🧪 Running frontend E2E checks..."
	@echo "⚠️  Ensure services are running (make up)"
	cd frontend && npm run test:e2e
	@echo "✅ Frontend E2E checks completed"

# Run all linters
lint: lint-backend
	@echo "✅ All linters passed!"

# Backend linter
lint-backend:
	@echo "🔍 Running backend linter..."
	docker-compose run --rm backend flake8 app --max-line-length=120 --exclude=__pycache__,migrations
	@echo "✅ Backend linting completed"

# Build containers
build:
	@echo "🔨 Building Docker containers..."
	docker-compose build
	@echo "✅ Build completed"

# Start services
up:
	@echo "🚀 Starting services..."
	docker-compose up -d
	@echo "✅ Services started"
	@echo "⏳ Waiting for services to be healthy..."
	@sleep 5
	@echo "✅ Services should be ready"

# Stop services
down:
	@echo "🛑 Stopping services..."
	docker-compose down
	@echo "✅ Services stopped"

# View logs
logs:
	docker-compose logs -f

# Clean test artifacts
clean:
	@echo "🧹 Cleaning test artifacts..."
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name htmlcov -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Cleanup completed"

# Full quality gate check (CI)
ci: build up test
	@echo "✅ Quality gate passed!"
	@make down
