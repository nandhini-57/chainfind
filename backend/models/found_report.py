from sqlalchemy import Column, String, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func
from database import Base

class FoundReport(Base):
    __tablename__ = "found_reports"
    id = Column(String(20), primary_key=True)
    item_id = Column(String(20))
    finder_wallet = Column(String(100), nullable=False)
    location = Column(String(300), nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    description = Column(Text, nullable=False)
    category = Column(String(100))
    ipfs_hash = Column(String(200))
    ai_match_id = Column(String(20))
    ai_match_score = Column(Float)
    is_matched = Column(Boolean, default=False)
    is_returned = Column(Boolean, default=False)
    reward_released = Column(Boolean, default=False)
    reward_tx_hash = Column(String(100))
    tx_hash = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    def to_dict(self):
        return {"id":self.id,"item_id":self.item_id,"finder_wallet":self.finder_wallet[:6]+"..."+self.finder_wallet[-4:],
                "location":self.location,"description":self.description,"category":self.category,
                "ai_match_id":self.ai_match_id,"ai_match_score":self.ai_match_score,
                "is_matched":self.is_matched,"is_returned":self.is_returned,"created_at":str(self.created_at)}
