from sqlalchemy import Column, String, Float, Integer, DateTime, Text
from sqlalchemy.sql import func
import uuid
from database import Base

class TransactionLog(Base):
    __tablename__ = "transaction_logs"
    id = Column(String(40), primary_key=True, default=lambda: str(uuid.uuid4()))
    tx_type = Column(String(30), nullable=False)
    tx_hash = Column(String(100))
    from_wallet = Column(String(100))
    to_wallet = Column(String(100))
    item_id = Column(String(20))
    description = Column(Text)
    amount = Column(Float, default=0)
    block_number = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    def to_dict(self):
        return {"id":self.id,"tx_type":self.tx_type,"tx_hash":self.tx_hash,"item_id":self.item_id,
                "description":self.description,"amount":self.amount,"created_at":str(self.created_at)}
