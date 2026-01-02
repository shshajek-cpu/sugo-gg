from pydantic import BaseModel, Field, root_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

class CharacterDTO(BaseModel):
    id: Optional[int] = None
    server: str
    name: str = Field(..., alias="character_name")
    class_name: str = Field(..., alias="character_class")
    level: int
    power: int = Field(default=0, alias="combat_score")
    updated_at: Optional[datetime] = None
    
    # Extended Data
    character_image_url: Optional[str] = None
    stats_json: Optional[Dict[str, Any]] = None
    stats_payload: Optional[Dict[str, Any]] = None
    equipment_data: Optional[List[Dict[str, Any]]] = None
    
    # AION2 Extended Data
    race: Optional[str] = None
    legion: Optional[str] = None
    titles_data: Optional[List[Dict[str, Any]]] = None
    ranking_data: Optional[List[Dict[str, Any]]] = None
    pet_wings_data: Optional[List[Dict[str, Any]]] = None
    skills_data: Optional[List[Dict[str, Any]]] = None
    stigma_data: Optional[List[Dict[str, Any]]] = None
    devanion_data: Optional[Dict[str, Any]] = None
    arcana_data: Optional[List[Dict[str, Any]]] = None
    
    class Config:
        from_attributes = True
        populate_by_name = True
        alias_generator = None  # Disable auto alias generation to use explicit aliases
        
    @root_validator(pre=True)
    def normalize_aliases(cls, values):
        # Allow 'class' as input for 'class_name'
        if 'class' in values:
            values['class_name'] = values.pop('class')
        # Allow 'character_class' as input for 'class_name'
        if 'character_class' in values:
            values['class_name'] = values['character_class']
            
        # Allow 'name' as input for 'name'
        if 'name' in values:
            values['name'] = values['name']
        # Allow 'character_name' as input for 'name'
        if 'character_name' in values:
            values['name'] = values['character_name']

        return values

class SearchRequest(BaseModel):
    server: str
    name: str

class SearchResponse(BaseModel):
    server: str
    name: str
    class_name: str
    level: int
    power: int
    updated_at: datetime
    message: Optional[str] = None

class RankingItem(BaseModel):
    rank: int
    name: str
    server: str
    class_name: str
    level: int
    power: int

class RankingResponse(BaseModel):
    items: List[RankingItem]
    generated_at: datetime
    type: str # 'power', 'level', 'updated_at'
    filter_key: str
    is_realtime: bool
    message: Optional[str] = None

class CharacterStatHistory(BaseModel):
    id: int
    power: int
    level: int
    captured_at: datetime
    stats_json: Dict

class CharacterDetailResponse(BaseModel):
    id: int
    name: str
    server: str
    class_name: str
    level: int
    power: int
    power_index: Optional[int]
    tier_rank: Optional[str] # S, A, B, C
    percentile: Optional[int] # 0-100
    nextRankPower: Optional[int]
    statContribution: Optional[List[Dict]]
    stats: Dict
    rank: int
    updated_at: Optional[datetime]
    warning: Optional[str] = None
    power_change: Optional[int] = None
    level_change: Optional[int] = None

class CharacterFullResponse(BaseModel):
    profile: Dict[str, Any]
    power: Dict[str, Any]
    stats: Dict[str, Any]
    equipment: List[Dict[str, Any]]
    
    # New sections for AION2
    titles: List[Dict[str, Any]]
    ranking: List[Dict[str, Any]]
    pet_wings: List[Dict[str, Any]]
    skills: List[Dict[str, Any]]
    stigma: List[Dict[str, Any]]
    devanion: Dict[str, Any]
    arcana: List[Dict[str, Any]]
    
    warning: Optional[str] = None
