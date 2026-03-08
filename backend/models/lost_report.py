from sqlalchemy import Column, String, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func
from database import Base

class LostReport(Base):
    __tablename__ = "lost_reports"
    id = Column(String(20), primary_key=True)
    item_id = Column(String(20), nullable=False)
    owner_wallet = Column(String(100), nullable=False)
    location = Column(String(300), nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    lost_at = Column(DateTime(timezone=True))
    details = Column(Text)
    reward_amount = Column(Float, default=0)
    reward_escrowed = Column(Boolean, default=False)
    escrow_tx_hash = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    def to_dict(self):
        return {"id":self.id,"item_id":self.item_id,"owner_wallet":self.owner_wallet,"location":self.location,
                "latitude":self.latitude,"longitude":self.longitude,"reward_amount":self.reward_amount,
                "reward_escrowed":self.reward_escrowed,"is_active":self.is_active,"is_resolved":self.is_resolved,
                "created_at":str(self.created_at)}
