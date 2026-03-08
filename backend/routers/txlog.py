from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.reputation import TxLog

router = APIRouter(prefix="/api/txlog", tags=["Transaction Log"])

@router.get("")
async def get_tx_log(limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TxLog).order_by(TxLog.created_at.desc()).limit(limit))
    logs = result.scalars().all()
    return [{"id": str(l.id), "tx_type": l.tx_type, "tx_hash": l.tx_hash, "description": l.description,
             "wallet": l.wallet, "token_id": l.token_id, "created_at": l.created_at.isoformat() if l.created_at else None} for l in logs]
