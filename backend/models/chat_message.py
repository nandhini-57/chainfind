from sqlalchemy import Column, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(String(40), primary_key=True)
    case_id = Column(String(30), nullable=False, index=True)
    sender_wallet = Column(String(100), nullable=False)
    sender_role = Column(String(20))
    encrypted_msg = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    def to_dict(self):
        return {"id":self.id,"case_id":self.case_id,"sender_role":self.sender_role,
                "encrypted_msg":self.encrypted_msg,"is_read":self.is_read,"created_at":str(self.created_at)}
