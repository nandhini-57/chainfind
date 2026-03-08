from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from database import get_db
from models.item import Item, LostReport
from models.reputation import TxLog
from utils.auth import get_current_wallet

router = APIRouter(prefix="/api/lost", tags=["Lost Reports"])

class LostRequest(BaseModel):
    token_id: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    lost_at: Optional[str] = None
    details: Optional[str] = None
    reward_amount: Optional[float] = 0
    tx_hash: Optional[str] = None

@router.post("/report")
async def report_lost(req: LostRequest, wallet: str = Depends(get_current_wallet), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item).where(Item.token_id == req.token_id))
    item = result.scalar_one_or_none()
    if not item: raise HTTPException(404, "Item not found")
    if item.owner_wallet.lower() != wallet.lower(): raise HTTPException(403, "Not your item")
    if item.status not in ("registered",): raise HTTPException(400, f"Cannot report lost (status: {item.status})")
    item.status = "lost"
    item.reward_amount = req.reward_amount or 0
    lost_at = datetime.fromisoformat(req.lost_at) if req.lost_at else datetime.utcnow()
    report = LostReport(token_id=req.token_id, location=req.location, latitude=req.latitude,
                        longitude=req.longitude, lost_at=lost_at, details=req.details,
                        reward_amount=req.reward_amount or 0, tx_hash=req.tx_hash,
                        expires_at=datetime.utcnow() + timedelta(days=90))
    db.add(report)
    db.add(TxLog(tx_type="lost", tx_hash=req.tx_hash, description=f"Lost report for {req.token_id}", wallet=wallet, token_id=req.token_id))
    await db.commit()
    return {"success": True, "token_id": req.token_id, "reward_escrowed": req.reward_amount}

@router.get("/active")
async def get_active_lost(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Item, LostReport).join(LostReport, Item.token_id == LostReport.token_id)
        .where(Item.status == "lost").where(LostReport.active == True)
        .order_by(LostReport.created_at.desc())
    )
    rows = result.all()
    return [{"item": _fmt_item(r[0]), "report": _fmt_report(r[1])} for r in rows]

@router.get("/{token_id}")
async def get_lost_report(token_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LostReport).where(LostReport.token_id == token_id).order_by(LostReport.created_at.desc()))
    r = result.scalars().first()
    if not r: raise HTTPException(404, "Lost report not found")
    return _fmt_report(r)

def _fmt_item(i): return {"token_id": i.token_id, "name": i.name, "category": i.category, "description": i.description, "reward_amount": float(i.reward_amount or 0), "latitude": float(i.latitude) if i.latitude else None, "longitude": float(i.longitude) if i.longitude else None}
def _fmt_report(r): return {"token_id": r.token_id, "location": r.location, "latitude": float(r.latitude) if r.latitude else None, "longitude": float(r.longitude) if r.longitude else None, "details": r.details, "reward_amount": float(r.reward_amount or 0), "active": r.active, "created_at": r.created_at.isoformat() if r.created_at else None}
