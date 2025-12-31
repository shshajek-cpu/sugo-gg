from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import get_db, init_db
from .models import Character, CharacterStat, RankSnapshot
from .search_log import SearchLog
from .schemas import RankingResponse, RankingItem, CharacterDetailResponse, CharacterStatHistory, CharacterDTO
from .adapter import adapter
from datetime import datetime
from typing import Optional, List
import redis
import json
import os
import logging

# Configure logger
logger = logging.getLogger(__name__)

app = FastAPI(title="AION2 Tool API")

# CORS 설정 - 환경 변수로 관리
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
cache = redis.from_url(REDIS_URL)

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/servers")
def get_available_servers():
    """
    Returns list of available servers for character search
    """
    servers = ["Siel", "Israphel", "Nezakan", "Zikel", "Chantra"]
    return {
        "servers": servers,
        "default": "Siel"
    }

@app.get("/api/characters/search")
def search_character(
    server: str, 
    name: str, 
    refresh_force: bool = False, # Admin Bypass
    db: Session = Depends(get_db)
):
    # 1. Rate Limiting (Redis)
    client_ip = "127.0.0.1" # In prod, get from request.client.host
    rate_limit_key = f"rate_limit:{client_ip}:search"
    current_requests = cache.incr(rate_limit_key)
    if current_requests == 1:
        cache.expire(rate_limit_key, 60) # 1 minute window
    
    if current_requests > 10:
        raise HTTPException(status_code=429, detail="Too many search requests. Please try again later.")

    # 2. Update Search Log
    keyword = f"{server}:{name}"
    log = db.query(SearchLog).filter(SearchLog.keyword == keyword).first()
    if log:
        log.count += 1
    else:
        new_log = SearchLog(keyword=keyword)
        db.add(new_log)
    db.commit()

    warning_msg = None
    data = None
    fetch_error = None

    # 3. Check DB for Recent Data (Strict Cache Policy)
    # Env Var: MIN_REFRESH_INTERVAL_MINUTES (Default: 60 minutes)
    refresh_interval = int(os.getenv("MIN_REFRESH_INTERVAL_MINUTES", "60"))
    # force_refresh is now passed from query param
    
    char = db.query(Character).filter(Character.server == server, Character.name == name).first()
    
    # Logic: If data exists AND is recent AND no force refresh -> Return DB data
    if char and not refresh_force:
        # Fix: Ensure naive vs aware compatibility
        last_updated = char.updated_at.replace(tzinfo=None) if char.updated_at.tzinfo else char.updated_at
        time_diff = datetime.now() - last_updated
        minutes_elapsed = time_diff.total_seconds() / 60
        
        if minutes_elapsed < refresh_interval:
            logger.info(f"✓ Serving cached data for {server}:{name} (Age: {int(minutes_elapsed)}m < {refresh_interval}m)")
            latest_stats = char.stats[0].stats_json if char.stats else {}
            
            # Warn user if it's cached (Transparency)
            # But "Recent" is better than "Stale"
            # We can use a different field or reuse warning with a lighter tone if needed.
            # Requirement says: "Recent data notice"
            cache_notice = f"[최근 데이터] {int(minutes_elapsed)}분 전 수집된 정보입니다."
            
            return {
                "id": char.id,
                "name": char.name,
                "server": char.server,
                "class": char.class_name,
                "level": char.level,
                "power": char.power,
                "updated_at": char.updated_at,
                "stats": latest_stats,
                "warning": cache_notice, # Using warning field to display the notice
                "power_change": None, 
                "level_change": None
            }

    # 4. Try fetching from Adapter (If not cached or stale)
    try:
        logger.info(f"→ Attempting to fetch character (Refresh): {server}:{name}")
        data = adapter.get_character(server, name)
        logger.info(f"✓ Successfully fetched from adapter: {server}:{name}")
    except Exception as e:
        fetch_error = str(e)
        logger.warning(f"⚠ Adapter fetch failed for {server}:{name}: {e}")
        warning_msg = "외부 데이터 소스를 사용할 수 없습니다. 저장된 데이터를 표시합니다."

    # char query moved up
    # char = db.query(Character).filter(Character.server == server, Character.name == name).first()

    # 5. Fallback Logic (3-tier: External → DB → Dummy)
    if not data:
        logger.info(f"→ Entering fallback mode for {server}:{name}")

        # Tier 1 Fallback: Existing DB data
        if char:
            logger.info(f"✓ Fallback to DB data: {server}:{name}")
            latest_stats = char.stats[0].stats_json if char.stats else {}
            return {
                "id": char.id,
                "name": char.name,
                "server": char.server,
                "class": char.class_name,
                "level": char.level,
                "power": char.power,
                "updated_at": char.updated_at,
                "stats": latest_stats,
                "warning": warning_msg,
                "power_change": None,
                "level_change": None
            }

        # Tier 2 Fallback: Generate dummy data (last resort)
        else:
            from .adapter import DummySourceAdapter
            logger.warning(
                f"⚠ No DB data for {server}:{name}. "
                f"Generating dummy data as last resort. Error: {fetch_error}"
            )
            data = DummySourceAdapter()._get_dummy_data(server, name)
            warning_msg = (
                "외부 데이터 소스를 사용할 수 없고 저장된 데이터가 없습니다. "
                "임시 데이터를 표시합니다."
            )
            # Continue to save dummy data (allows future DB fallback)
            logger.info(f"✓ Generated dummy data: {server}:{name}")

    # 6. Success - Update DB and calculate changes
    prev_power = None
    prev_level = None

    if not char:
        char = Character(server=server, name=name)
        db.add(char)
    else:
        # Store previous values for comparison
        prev_power = char.power
        prev_level = char.level

    char.class_name = data.class_name
    char.level = data.level
    char.power = data.power
    char.updated_at = data.updated_at
    char.last_seen_at = datetime.now()

    db.commit()
    db.refresh(char)

    # History tracking: accumulate stats instead of deleting
    if data.stats_json:
        # Add full snapshot including power and level for history tracking
        stats_with_core = {
            **data.stats_json,
            "power": data.power,
            "level": data.level
        }
        stat = CharacterStat(character_id=char.id, stats_json=stats_with_core)
        db.add(stat)
        db.commit()

    # Calculate changes
    power_change = None
    level_change = None
    if prev_power is not None:
        power_change = char.power - prev_power
    if prev_level is not None:
        level_change = char.level - prev_level

    # Calculate Rank (Live)
    # Count chars with higher power
    rank = db.query(Character).filter(Character.power > char.power).count() + 1

    return {
        "id": char.id,
        "name": char.name,
        "server": char.server,
        "class": char.class_name,
        "level": char.level,
        "power": char.power,
        "rank": rank, # Added rank
        "updated_at": char.updated_at,
        "stats": data.stats_json,
        "warning": warning_msg,
        "power_change": power_change,
        "level_change": level_change
    }

@app.get("/api/characters/{character_id}/history", response_model=List[CharacterStatHistory])
def get_character_history(character_id: int, limit: int = 10, db: Session = Depends(get_db)):
    """Get character stat history (최근 스냅샷 조회)"""
    stats = db.query(CharacterStat).filter(
        CharacterStat.character_id == character_id
    ).order_by(CharacterStat.captured_at.desc()).limit(limit).all()

    return [
        CharacterStatHistory(
            id=s.id,
            power=s.stats_json.get("power", 0),
            level=s.stats_json.get("level", 0),
            captured_at=s.captured_at,
            stats_json=s.stats_json
        ) for s in stats
    ]

@app.post("/api/characters/compare")
def compare_characters(
    characters: List[dict],  # [{"server": "Siel", "name": "혼"}, ...]
    db: Session = Depends(get_db)
):
    """
    Compare 2-3 characters
    Returns comparison table data
    """
    if len(characters) < 2 or len(characters) > 3:
        raise HTTPException(status_code=400, detail="2~3명의 캐릭터를 입력해주세요")
    
    result = []
    
    for char_input in characters:
        server = char_input.get("server")
        name = char_input.get("name")
        
        if not server or not name:
            continue
            
        char = db.query(Character).filter(
            Character.server == server,
            Character.name == name
        ).first()
        
        if not char:
            result.append({
                "server": server,
                "name": name,
                "error": "캐릭터를 찾을 수 없습니다",
                "power": 0,
                "level": 0,
                "class": "Unknown",
                "stats": {}
            })
            continue
        
        # Get latest stats
        latest_stat = db.query(CharacterStat).filter(
            CharacterStat.character_id == char.id
        ).order_by(CharacterStat.captured_at.desc()).first()
        
        stats_json = latest_stat.stats_json if latest_stat else {}
        
        result.append({
            "server": char.server,
            "name": char.name,
            "class": char.class_name,
            "level": char.level,
            "power": char.power,
            "stats": stats_json,
            "updated_at": char.updated_at
        })
    
    return {
        "characters": result,
        "count": len(result),
        "generated_at": datetime.now()
    }

@app.get("/api/search/popular")
def get_popular_keywords(limit: int = 10, db: Session = Depends(get_db)):
    results = db.query(SearchLog.keyword, SearchLog.count).order_by(SearchLog.count.desc()).limit(limit).all()
    # Format: [{"keyword": "server:name", "count": 10}, ...]
    # Or maybe cleaner: [{"server": "s1", "name": "n1", "count": 10}]
    return [{"keyword": r[0], "count": r[1]} for r in results]

@app.get("/api/characters/recent", response_model=List[CharacterDTO])
def get_recent_characters(limit: int = 10, db: Session = Depends(get_db)):
    """
    Get characters sorted by last_seen_at (Recently Searched/Updated)
    """
    # Exclude those with very low power/level if needed, but for now just raw list
    recents = db.query(Character).order_by(Character.last_seen_at.desc()).limit(limit).all()
    
    return [
        CharacterDTO(
            name=c.name,
            server=c.server,
            class_name=c.class_name,
            level=c.level,
            power=c.power,
            updated_at=c.updated_at,
            stats_json=c.stats[0].stats_json if c.stats else {}
        ) for c in recents
    ]

@app.get("/api/rankings", response_model=RankingResponse)
def get_rankings(
    type: str = "power",
    server: Optional[str] = None,
    class_name: Optional[str] = Query(None, alias="class"),
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    # Support multiple sort types
    # type: power (default), level, updated_at

    filter_key = f"{server or 'all'}:{class_name or 'all'}:{type}:page:{page}:limit:{limit}"
    cache_key = f"rank:{filter_key}"

    cached = cache.get(cache_key)
    if cached:
        return json.loads(cached)

    snapshot = db.query(RankSnapshot).filter(
        RankSnapshot.type == type,
        RankSnapshot.filter_key == filter_key
    ).order_by(RankSnapshot.generated_at.desc()).first()

    if snapshot:
        return {
            "items": snapshot.snapshot_json["items"],
            "generated_at": snapshot.generated_at,
            "type": type,
            "filter_key": filter_key,
            "is_realtime": False,
            "message": "스냅샷 데이터 기준" if snapshot.snapshot_json["items"] else "데이터가 없습니다"
        }

    query = db.query(Character)
    if server:
        query = query.filter(Character.server == server)
    if class_name:
        query = query.filter(Character.class_name == class_name)

    # Sorting logic
    if type == "level":
        query = query.order_by(Character.level.desc(), Character.power.desc())
    elif type == "updated_at":
        query = query.order_by(Character.updated_at.desc())
    else: # default power
        query = query.order_by(Character.power.desc())

    results = query.offset((page-1)*limit).limit(limit).all()

    items = [
        RankingItem(
            name=c.name,
            server=c.server,
            class_name=c.class_name,
            level=c.level,
            power=c.power,
            rank=(page-1)*limit + i + 1
        ) for i, c in enumerate(results)
    ]

    # Prepare message for empty data
    message = None
    if not items:
        if server and class_name:
            message = f"{server} 서버의 {class_name} 직업 캐릭터가 없습니다"
        elif server:
            message = f"{server} 서버에 검색된 캐릭터가 없습니다"
        elif class_name:
            message = f"{class_name} 직업의 검색된 캐릭터가 없습니다"
        else:
            message = "검색된 캐릭터가 없습니다"

    response = {
        "items": [item.dict() for item in items],
        "generated_at": datetime.now(),
        "type": type,
        "filter_key": filter_key,
        "is_realtime": True,
        "message": message
    }

    cache.setex(cache_key, 120, json.dumps(response, default=str))
    return response

@app.get("/api/rankings/by-server")
def get_rankings_by_server(limit_per_server: int = 3, db: Session = Depends(get_db)):
    """
    Get TOP N characters per server for home page display
    Returns: {"Siel": [{name, power, class, level}...], "Israphel": [...], ...}
    """
    cache_key = f"rank:by_server:{limit_per_server}"
    cached = cache.get(cache_key)
    if cached:
        return json.loads(cached)
    
    servers = ["Siel", "Israphel", "Nezakan", "Zikel", "Chantra"]
    result = {}
    
    for server in servers:
        top_chars = db.query(Character).filter(
            Character.server == server
        ).order_by(Character.power.desc()).limit(limit_per_server).all()
        
        result[server] = [
            {
                "name": c.name,
                "server": c.server,
                "class": c.class_name,
                "level": c.level,
                "power": c.power
            } for c in top_chars
        ]
    
    response = {
        "data": result,
        "generated_at": datetime.now()
    }
    
    cache.setex(cache_key, 300, json.dumps(response, default=str))
    return response


@app.get("/api/stats")
def get_statistics(server: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Get overall statistics for the statistics page
    - Server-wise average & median power
    - Class distribution
    - Power distribution (histogram)
    """
    cache_key = f"stats:overview:{server or 'all'}"
    cached = cache.get(cache_key)
    if cached:
        return json.loads(cached)

    # Base query
    query = db.query(Character)
    if server:
        query = query.filter(Character.server == server)
    
    # Get total sample size
    sample_size = query.count()
    
    if sample_size == 0:
        return {
            "server_avg": [],
            "class_distribution": [],
            "power_distribution": [],
            "sample_size": 0,
            "total_characters": 0,
            "computed_at": datetime.now(),
            "note": "현재 수집된 데이터 기준",
            "message": "아직 수집된 데이터가 없습니다"
        }

    # 1. Server-wise Average & Median Power
    if server:
        # Single server stats
        chars = query.all()
        powers = [c.power for c in chars]
        powers.sort()
        median_power = powers[len(powers) // 2] if powers else 0
        
        server_avg = [{
            "server": server,
            "avg_power": int(db.query(func.avg(Character.power)).filter(Character.server == server).scalar() or 0),
            "median_power": median_power,
            "count": len(chars)
        }]
    else:
        # All servers
        servers = ["Siel", "Israphel", "Nezakan", "Zikel", "Chantra"]
        server_avg = []
        
        for s in servers:
            avg = db.query(func.avg(Character.power)).filter(Character.server == s).scalar()
            count = db.query(func.count(Character.id)).filter(Character.server == s).scalar()
            
            if count and count > 0:
                # Calculate median
                chars = db.query(Character.power).filter(Character.server == s).order_by(Character.power).all()
                powers = [c[0] for c in chars]
                median_power = powers[len(powers) // 2] if powers else 0
                
                server_avg.append({
                    "server": s,
                    "avg_power": int(avg or 0),
                    "median_power": median_power,
                    "count": count
                })

    # 2. Class Distribution
    class_query = db.query(
        Character.class_name,
        func.count(Character.id).label("count")
    )
    if server:
        class_query = class_query.filter(Character.server == server)
    
    class_stats = class_query.group_by(Character.class_name).all()
    
    class_distribution = [
        {"class": cls, "count": cnt, "percentage": round((cnt / sample_size) * 100, 1)}
        for cls, cnt in class_stats
    ]
    class_distribution.sort(key=lambda x: x["count"], reverse=True)

    # 3. Power Distribution (TOP 100, 50k buckets)
    top_query = query.order_by(Character.power.desc()).limit(100)
    top_chars = top_query.all()
    
    power_buckets = {}
    for char in top_chars:
        bucket = (char.power // 50000) * 50000
        bucket_label = f"{bucket:,} - {bucket + 49999:,}"
        power_buckets[bucket_label] = power_buckets.get(bucket_label, 0) + 1

    power_distribution = [
        {"range": k, "count": v} for k, v in sorted(power_buckets.items())
    ]

    # Total count
    total_characters = db.query(func.count(Character.id)).scalar()

    response = {
        "server_avg": server_avg,
        "class_distribution": class_distribution,
        "power_distribution": power_distribution,
        "sample_size": sample_size,
        "total_characters": total_characters,
        "computed_at": datetime.now(),
        "note": "현재 수집된 데이터 기준",
        "server_filter": server or "all"
    }

    # Cache for 5 minutes
    cache.setex(cache_key, 300, json.dumps(response, default=str))
    return response

@app.get("/api/tiers")
def get_tiers(
    server: Optional[str] = None, 
    class_name: Optional[str] = Query(None, alias="class"),
    db: Session = Depends(get_db)
):
    """
    Get tier-based character rankings using percentile distribution
    - S Tier: Top 5%
    - A Tier: Top 15% (5-15%)
    - B Tier: Top 35% (15-35%)
    - C Tier: Remainder (35%+)
    """
    cache_key = f"tiers:{server or 'all'}:{class_name or 'all'}"
    cached = cache.get(cache_key)
    if cached:
        return json.loads(cached)

    # Build query
    query = db.query(Character)
    if server:
        query = query.filter(Character.server == server)
    if class_name:
        query = query.filter(Character.class_name == class_name)

    # Get all characters sorted by power
    all_chars = query.order_by(Character.power.desc()).all()
    total = len(all_chars)

    if total == 0:
        return {
            "tiers": {"S": [], "A": [], "B": [], "C": []},
            "tier_thresholds": {"S": 0, "A": 0, "B": 0, "C": 0},
            "tier_counts": {"S": 0, "A": 0, "B": 0, "C": 0},
            "sample_size": 0,
            "total_characters": 0,
            "server": server or "all",
            "class": class_name or "all",
            "generated_at": datetime.now(),
            "message": "데이터가 없습니다"
        }

    # Calculate percentile thresholds (S: 5%, A: 15%, B: 35%)
    idx_5 = int(total * 0.05)   # Top 5%
    idx_15 = int(total * 0.15)  # Top 15%
    idx_35 = int(total * 0.35)  # Top 35%

    # Get threshold power values
    threshold_s = all_chars[idx_5].power if idx_5 < total else all_chars[-1].power
    threshold_a = all_chars[idx_15].power if idx_15 < total else all_chars[-1].power
    threshold_b = all_chars[idx_35].power if idx_35 < total else all_chars[-1].power

    # Classify characters into tiers
    tiers = {"S": [], "A": [], "B": [], "C": []}

    for rank, char in enumerate(all_chars, 1):
        char_data = {
            "rank": rank,
            "name": char.name,
            "server": char.server,
            "class": char.class_name,
            "level": char.level,
            "power": char.power
        }

        if rank <= idx_5:
            tiers["S"].append(char_data)
        elif rank <= idx_15:
            tiers["A"].append(char_data)
        elif rank <= idx_35:
            tiers["B"].append(char_data)
        else:
            tiers["C"].append(char_data)

    response = {
        "tiers": tiers,
        "tier_thresholds": {
            "S": threshold_s,
            "A": threshold_a,
            "B": threshold_b,
            "C": 0
        },
        "tier_counts": {
            "S": len(tiers["S"]),
            "A": len(tiers["A"]),
            "B": len(tiers["B"]),
            "C": len(tiers["C"])
        },
        "sample_size": total,
        "total_characters": total,
        "server": server or "all",
        "class": class_name or "all",
        "generated_at": datetime.now()
    }

    # Cache for 3 minutes
    cache.setex(cache_key, 180, json.dumps(response, default=str))
    return response

@app.get("/api/servers/compare")
def compare_servers(db: Session = Depends(get_db)):
    """
    Compare servers across multiple metrics:
    - Average power per server
    - Top ranker distribution (TOP 100, TOP 500)
    - Server activity (based on search count)
    """
    cache_key = "servers:compare"
    cached = cache.get(cache_key)
    if cached:
        return json.loads(cached)

    from sqlalchemy import func

    # 1. Server-wise average power and character count
    server_stats = db.query(
        Character.server,
        func.avg(Character.power).label('avg_power'),
        func.max(Character.power).label('max_power'),
        func.count(Character.id).label('count')
    ).group_by(Character.server).all()

    server_data = {}
    for s in server_stats:
        server_data[s.server] = {
            "server": s.server,
            "avg_power": round(s.avg_power, 2) if s.avg_power else 0,
            "max_power": s.max_power or 0,
            "total_characters": s.count
        }

    # 2. Top ranker distribution (TOP 100, TOP 500)
    top_100 = db.query(Character).order_by(Character.power.desc()).limit(100).all()
    top_500 = db.query(Character).order_by(Character.power.desc()).limit(500).all()

    for server in server_data.keys():
        server_data[server]["top_100_count"] = sum(1 for c in top_100 if c.server == server)
        server_data[server]["top_500_count"] = sum(1 for c in top_500 if c.server == server)

    # 3. Server activity (based on search logs)
    search_stats = db.query(SearchLog.keyword, SearchLog.count).all()
    server_search_count = {}
    for keyword, count in search_stats:
        # keyword format: "server:name"
        if ':' in keyword:
            server = keyword.split(':')[0]
            server_search_count[server] = server_search_count.get(server, 0) + count

    for server in server_data.keys():
        server_data[server]["search_count"] = server_search_count.get(server, 0)

    response = {
        "servers": list(server_data.values()),
        "generated_at": datetime.now()
    }

    # Cache for 5 minutes
    cache.setex(cache_key, 300, json.dumps(response, default=str))
    return response
