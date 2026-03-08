from sqlalchemy import Column, String, Integer, Numeric, DateTime, Text, JSON
from sqlalchemy.sql import func
import uuid
from database import Base

class FinderReputation(Base):
    __tablename__ = "finder_reputation"
    id             = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    wallet_address = Column(String(42), unique=True, nullable=False, index=True)
    display_name   = Column(String(100))
    total_score    = Column(Integer, default=0)
    return_count   = Column(Integer, default=0)
    avg_rating     = Column(Numeric(3, 2), default=0)
    sbt_token_id   = Column(String(50))
    badges         = Column(JSON, default=[])
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class PoliceLog(Base):
    __tablename__ = "police_log"
    id             = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    station_id     = Column(String(100), nullable=False)
    station_name   = Column(String(255), nullable=False)
    description    = Column(Text, nullable=False)
    category       = Column(String(100))
    location       = Column(String(500))
    case_number    = Column(String(100), unique=True, nullable=False)
    token_id       = Column(String(50))
    ipfs_hash      = Column(String(255))
    tx_hash        = Column(String(66))
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

class TxLog(Base):
    __tablename__ = "tx_log"
    id          = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tx_type     = Column(String(30), nullable=False)
    tx_hash     = Column(String(66))
    description = Column(Text)
    wallet      = Column(String(42))
    token_id    = Column(String(50))
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
