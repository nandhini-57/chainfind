from sqlalchemy import Column, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from database import Base

class PoliceLog(Base):
    __tablename__ = "police_logs"
    id = Column(String(20), primary_key=True)
    station_id = Column(String(100), nullable=False)
    station_name = Column(String(200))
    description = Column(Text, nullable=False)
    location = Column(String(300))
    category = Column(String(100))
    case_number = Column(String(100))
    item_id = Column(String(20))
    ipfs_hash = Column(String(200))
    tx_hash = Column(String(100))
    is_claimed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    def to_dict(self):
        return {"id":self.id,"station_name":self.station_name,"description":self.description,
                "location":self.location,"category":self.category,"case_number":self.case_number,
                "is_claimed":self.is_claimed,"tx_hash":self.tx_hash,"created_at":str(self.created_at)}
