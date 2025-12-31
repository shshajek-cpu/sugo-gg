from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.sql import func
from .models import Base, IntegerType

class SearchLog(Base):
    __tablename__ = "search_logs"

    id = Column(IntegerType, primary_key=True, index=True)
    keyword = Column(String(128), index=True)
    count = Column(Integer, default=1)
    last_searched_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
