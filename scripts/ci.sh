#!/bin/bash
# CI Script - Quality Gate
# Can be run locally or in CI/CD pipeline

set -e  # Exit on error

echo "========================================"
echo "  AION2 Tool - Quality Gate"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Cleanup function
cleanup() {
    print_info "Cleaning up..."
    docker-compose down -v 2>/dev/null || true
}

# Trap cleanup on exit
trap cleanup EXIT

# Step 1: Build containers
print_info "Step 1/4: Building Docker containers..."
if docker-compose build; then
    print_success "Build completed"
else
    print_error "Build failed"
    exit 1
fi

# Step 2: Start services
print_info "Step 2/4: Starting services..."
if docker-compose up -d; then
    print_success "Services started"
else
    print_error "Failed to start services"
    exit 1
fi

# Wait for services to be ready
print_info "Waiting for services to be healthy..."
sleep 10

# Step 3: Run backend tests
print_info "Step 3/4: Running backend unit tests..."
if docker-compose run --rm backend pytest -v --cov=app --cov-report=term-missing; then
    print_success "Backend tests passed"
else
    print_error "Backend tests failed"
    print_info "Check logs with: docker-compose logs backend"
    exit 1
fi

# Step 4: Run frontend E2E checks
print_info "Step 4/4: Running frontend E2E checks..."
if cd frontend && npm run test:e2e; then
    print_success "Frontend E2E checks passed"
else
    print_error "Frontend E2E checks failed"
    print_info "Check logs with: docker-compose logs frontend"
    cd ..
    exit 1
fi

cd ..

# All checks passed
echo ""
echo "========================================"
print_success "Quality Gate PASSED"
echo "========================================"
echo ""

exit 0
