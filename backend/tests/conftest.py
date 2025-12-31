"""
Test configuration and fixtures
"""
import sys
from pathlib import Path
import json
import os

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set DATABASE_URL to SQLite BEFORE importing models
# This ensures models.py uses JSON instead of JSONB
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Import app.models to trigger initialization with SQLite DATABASE_URL
import app.models

# Create a thread-safe SQLite engine for testing
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Replace the engine and SessionLocal in models module
app.models.engine = engine
app.models.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Now import database module (it will import SessionLocal from models)
import app.database

# Now import other modules that depend on the engine
from app.main import app
from app.models import Base
from app.database import get_db
from app.search_log import SearchLog

# Use the testing engine and sessionmaker
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    # Drop all tables and recreate to ensure clean state
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()  # Rollback any uncommitted changes
        session.close()
        # Clean up for next test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database dependency override"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_character_data():
    """Sample character data for testing"""
    return {
        "name": "TestChar",
        "server": "TestServer",
        "class_name": "Warrior",
        "level": 50,
        "power": 100000,
        "stats_json": {
            "attack": 500,
            "defense": 300,
            "hp": 5000
        }
    }
