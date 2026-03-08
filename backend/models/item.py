from sqlalchemy import Column, String, Numeric, Boolean, DateTime, Text
from sqlalchemy.sql import func
import uuid
from datetime import datetime, timedelta
from database import Base

class Item(Base):
    __tablename__ = "items"
    id             = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    token_id       = Column(String(50), unique=True, nullable=False, index=True)
    name           = Column(String(255), nullable=False)
    category       = Column(String(100), nullable=False)
    description    = Column(Text, nullable=False)
    serial_number  = Column(String(255))
    ipfs_hash      = Column(String(255))
    ipfs_url       = Column(String(500))
    owner_wallet   = Column(String(42), nullable=False, index=True)
    status         = Column(String(20), default="registered", index=True)
    reward_amount  = Column(Numeric(18, 8), default=0)
    finder_wallet  = Column(String(42))
    latitude       = Column(Numeric(10, 7))
    longitude      = Column(Numeric(10, 7))
    tx_hash        = Column(String(66))
    expires_at     = Column(DateTime(timezone=True))
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class LostReport(Base):
    __tablename__ = "lost_reports"
    id             = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    token_id       = Column(String(50), nullable=False, index=True)
    location       = Column(String(500), nullable=False)
    latitude       = Column(Numeric(10, 7))
    longitude      = Column(Numeric(10, 7))
    lost_at        = Column(DateTime(timezone=True))
    details        = Column(Text)
    reward_amount  = Column(Numeric(18, 8), default=0)
    tx_hash        = Column(String(66))
    active         = Column(Boolean, default=True, index=True)
    expires_at     = Column(DateTime(timezone=True))
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

class FoundReport(Base):
    __tablename__ = "found_reports"
    id             = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    token_id       = Column(String(50), index=True)
    finder_wallet  = Column(String(42), nullable=False, index=True)
    location       = Column(String(500), nullable=False)
    latitude       = Column(Numeric(10, 7))
    longitude      = Column(Numeric(10, 7))
    description    = Column(Text, nullable=False)
    ipfs_hash      = Column(String(255))
    ai_match_score = Column(Numeric(5, 2))
    matched_token  = Column(String(50))
    tx_hash        = Column(String(66))
    confirmed      = Column(Boolean, default=False)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
