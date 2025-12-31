from .models import SessionLocal, init_db, SearchLog

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
