from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id        = Column(String(50), nullable=False, index=True)
    sender_wallet  = Column(String(42), nullable=False, index=True)
    role           = Column(String(10), nullable=False)
    encrypted_msg  = Column(Text, nullable=False)
    iv             = Column(String(64), nullable=False)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
