from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base

class FinderReputation(Base):
    __tablename__ = "finder_reputation"
    wallet_address = Column(String(100), primary_key=True)
    display_name = Column(String(100))
    total_returns = Column(Integer, default=0)
    reputation_score = Column(Integer, default=0)
    avg_rating = Column(Float, default=0.0)
    sbt_token_id = Column(String(30))
    sbt_tx_hash = Column(String(100))
    badge = Column(String(50), default="New")
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    def to_dict(self):
        w=self.wallet_address
        return {"wallet_address":w[:6]+"..."+w[-4:],"display_name":self.display_name,
                "total_returns":self.total_returns,"reputation_score":self.reputation_score,
                "avg_rating":self.avg_rating,"sbt_token_id":self.sbt_token_id,"badge":self.badge,"is_verified":self.is_verified}
