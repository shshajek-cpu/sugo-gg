from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas import CharacterDTO
from ..models import Character
from ..aion2_adapter import get_aion2_adapter
import logging
from datetime import datetime

router = APIRouter(prefix="/api/rankings", tags=["rankings"])
logger = logging.getLogger(__name__)

@router.post("/fetch", response_model=List[CharacterDTO])
def fetch_rankings(
    server: str = Query(..., description="Server name (e.g., 이스라펠)"),
    race: str = Query(..., description="Race (천족 or 마족)"),
    limit: int = Query(5, description="Number of characters to fetch"),
    db: Session = Depends(get_db)
):
    """
    Fetch top characters from Abyss Ranking for a specific server and race.
    This will also scrape detailed information for each character and save/update it in the database.
    """
    adapter = get_aion2_adapter()
    try:
        # Fetch data (this includes scraping names + fetching details)
        characters_data = adapter.fetch_abyss_rankings(server, race, limit)
        
        saved_chars = []
        for data in characters_data:
            # 1. Find existing character
            char = db.query(Character).filter(
                Character.server == data.server, 
                Character.name == data.name
            ).first()
            
            # 2. Create if not exists
            if not char:
                char = Character(
                    server=data.server,
                    name=data.name,
                    class_name=data.class_name,
                    level=data.level,
                    power=data.power
                )
                db.add(char)
            
            # 3. Update core fields
            char.class_name = data.class_name
            char.level = data.level
            char.power = data.power
            char.updated_at = data.updated_at
            char.last_fetched_at = datetime.now()
            
            # 4. Update extended AION2 fields
            if data.race: char.race = data.race
            if data.legion: char.legion = data.legion
            if data.character_image_url: char.character_image_url = data.character_image_url
            if data.stats_payload: char.stats_payload = data.stats_payload
            if data.equipment_data: char.equipment_data = data.equipment_data
            if data.titles_data: char.titles_data = data.titles_data
            if data.ranking_data: char.ranking_data = data.ranking_data
            if data.pet_wings_data: char.pet_wings_data = data.pet_wings_data
            if data.skills_data: char.skills_data = data.skills_data
            if data.stigma_data: char.stigma_data = data.stigma_data
            if data.devanion_data: char.devanion_data = data.devanion_data
            if data.arcana_data: char.arcana_data = data.arcana_data
            
            db.commit()
            db.refresh(char)
            # Re-convert to DTO if needed or just use input data
            saved_chars.append(data)
            
        return saved_chars
        
    except Exception as e:
        logger.error(f"Error fetching rankings: {e}")
        raise HTTPException(status_code=500, detail=str(e))
