from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from ..database import get_db
from ..models import Character
from ..schemas import CharacterFullResponse, CharacterDTO
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/characters", tags=["characters"])

@router.get("/recent", response_model=List[CharacterDTO])
def get_recent_characters(limit: int = 5, db: Session = Depends(get_db)):
    """
    Get recently updated characters.
    """
    chars = db.query(Character).order_by(Character.updated_at.desc()).limit(limit).all()
    return [
        CharacterDTO.from_orm(c) for c in chars
    ]

@router.get("/{character_id}/full", response_model=CharacterFullResponse)
def get_character_full_detail(character_id: int, db: Session = Depends(get_db)):
    """
    Get comprehensive character details including:
    - Profile (name, level, class, server, race, title, image)
    - Power (combat score, item level, tier rank, percentile)
    - Stats (primary + detailed with percentiles)
    - Equipment (detailed info with soul engraving, manastones)
    - Titles (collection status)
    - Ranking (abyss, nightmare, etc.)
    - Pet/Wings
    - Skills
    - Stigma
    - Devanion (board status)
    - Arcana
    """
    char = db.query(Character).filter(Character.id == character_id).first()
    
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Safely extract stats
    stats_payload = char.stats_payload or {}
    
    # Build profile section
    profile = {
        "id": char.id,
        "name": char.name,
        "server": char.server,
        "class": char.class_name,
        "level": char.level,
        "race": getattr(char, 'race', None),
        "legion": getattr(char, 'legion', None),
        "character_image_url": char.character_image_url
    }
    
    # Build power section
    power = {
        "combat_score": char.power_score or char.power,
        "item_level": 0,
        "tier_rank": char.power_rank,  
        "percentile": char.percentile,  
        "server_rank": None  
    }
    
    # Build stats section
    stats = {
        "primary": stats_payload.get("primary", {}),
        "detailed": stats_payload.get("detailed", {})
    }
    
    # All data sections from new columns
    equipment = char.equipment_data or []
    titles = getattr(char, 'titles_data', None) or []
    ranking = getattr(char, 'ranking_data', None) or []
    pet_wings = getattr(char, 'pet_wings_data', None) or []
    skills = getattr(char, 'skills_data', None) or []
    stigma = getattr(char, 'stigma_data', None) or []
    devanion = getattr(char, 'devanion_data', None) or {}
    arcana = getattr(char, 'arcana_data', None) or []
    
    return CharacterFullResponse(
        profile=profile,
        power=power,
        stats=stats,
        equipment=equipment,
        titles=titles,
        ranking=ranking,
        pet_wings=pet_wings,
        skills=skills,
        stigma=stigma,
        devanion=devanion,
        arcana=arcana
    )
