from celery import Celery
from .models import SessionLocal, Character, RankSnapshot
from .schemas import RankingItem
from datetime import datetime, timedelta
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
celery = Celery("tasks", broker=REDIS_URL, backend=REDIS_URL)

@celery.task
def generate_ranking_snapshots():
    db = SessionLocal()
    try:
        type = "power"
        filter_key = "all:all:page:1"
        
        results = db.query(Character).order_by(Character.power.desc()).limit(100).all()
        
        items = [
            RankingItem(
                name=c.name,
                server=c.server,
                class_name=c.class_name,
                level=c.level,
                power=c.power,
                rank=i + 1
            ).dict() for i, c in enumerate(results)
        ]
        
        snapshot = RankSnapshot(
            type=type,
            filter_key=filter_key,
            snapshot_json={"items": items},
            generated_at=datetime.now(),
            expires_at=datetime.now() + timedelta(minutes=15)
        )
        db.add(snapshot)
        db.commit()
    finally:
        db.close()

celery.conf.beat_schedule = {
    "generate-rankings-every-5-min": {
        "task": "app.worker.generate_ranking_snapshots",
        "schedule": 300.0,
    },
}
