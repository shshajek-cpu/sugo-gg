from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class CharacterDTO(BaseModel):
    name: str
    server: str
    class_name: str = Field(alias="class")
    level: int
    power: int
    updated_at: datetime
    stats_json: Optional[dict] = None

    class Config:
        populate_by_name = True

class RankingItem(BaseModel):
    name: str
    server: str
    class_name: str
    level: int
    power: int
    rank: int

class RankingResponse(BaseModel):
    items: List[RankingItem]
    generated_at: datetime
    type: str
    filter_key: str

class CharacterStatHistory(BaseModel):
    id: int
    power: int
    level: int
    captured_at: datetime
    stats_json: dict

class CharacterDetailResponse(BaseModel):
    id: int
    name: str
    server: str
    class_name: str = Field(alias="class")
    level: int
    power: int
    updated_at: datetime
    stats: Optional[dict] = None
    rank: Optional[int] = None # Added for Detail Badge
    warning: Optional[str] = None
    power_change: Optional[int] = None
    level_change: Optional[int] = None

    class Config:
        populate_by_name = True
