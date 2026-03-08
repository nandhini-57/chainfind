from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.reputation import FinderReputation
from utils.auth import get_current_wallet

router = APIRouter(prefix="/api/reputation", tags=["Reputation"])

@router.get("/leaderboard")
async def leaderboard(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FinderReputation).order_by(FinderReputation.total_score.desc()).limit(20))
    return [_fmt(r) for r in result.scalars().all()]

@router.get("/me")
async def my_reputation(wallet: str = Depends(get_current_wallet), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FinderReputation).where(FinderReputation.wallet_address == wallet.lower()))
    r = result.scalar_one_or_none()
    if not r:
        return {"wallet_address": wallet.lower(), "total_score": 0, "return_count": 0, "avg_rating": 0, "badges": []}
    return _fmt(r)

def _fmt(r): return {"wallet_address": r.wallet_address, "display_name": r.display_name, "total_score": r.total_score, "return_count": r.return_count, "avg_rating": float(r.avg_rating or 0), "sbt_token_id": r.sbt_token_id, "badges": r.badges or []}
