from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models.item import Item, LostReport, FoundReport
from models.reputation import TxLog, FinderReputation
from services.pinata_service import upload_json_to_ipfs
from utils.auth import get_current_wallet

router = APIRouter(prefix="/api/found", tags=["Found Reports"])

class FoundRequest(BaseModel):
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: str
    category: Optional[str] = None
    matched_token: Optional[str] = None
    ai_match_score: Optional[float] = None
    tx_hash: Optional[str] = None

class ConfirmReturnRequest(BaseModel):
    token_id: str
    tx_hash: Optional[str] = None

@router.post("/report")
async def submit_found(req: FoundRequest, wallet: str = Depends(get_current_wallet), db: AsyncSession = Depends(get_db)):
    ipfs_hash = await upload_json_to_ipfs({"description": req.description, "location": req.location, "finder": wallet}, "found-report")
    report = FoundReport(finder_wallet=wallet.lower(), location=req.location, latitude=req.latitude,
                         longitude=req.longitude, description=req.description, ipfs_hash=ipfs_hash,
                         ai_match_score=req.ai_match_score, matched_token=req.matched_token, tx_hash=req.tx_hash)
    if req.matched_token:
        result = await db.execute(select(Item).where(Item.token_id == req.matched_token))
        item = result.scalar_one_or_none()
        if item and item.status == "lost":
            report.token_id = req.matched_token
            item.status = "found"
            item.finder_wallet = wallet.lower()
            lost_r = await db.execute(select(LostReport).where(LostReport.token_id == req.matched_token).where(LostReport.active == True))
            lr = lost_r.scalars().first()
            if lr: lr.active = False
    db.add(report)
    db.add(TxLog(tx_type="found", tx_hash=req.tx_hash, description=f"Found report by {wallet[:10]}...", wallet=wallet))
    await db.commit()
    return {"success": True, "report_id": str(report.id), "ipfs_hash": ipfs_hash}

@router.post("/confirm-return")
async def confirm_return(req: ConfirmReturnRequest, wallet: str = Depends(get_current_wallet), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item).where(Item.token_id == req.token_id))
    item = result.scalar_one_or_none()
    if not item: raise HTTPException(404, "Item not found")
    if item.owner_wallet.lower() != wallet.lower(): raise HTTPException(403, "Not your item")
    if item.status != "found": raise HTTPException(400, "Item must be in found state")
    item.status = "returned"
    finder_wallet = item.finder_wallet
    if finder_wallet:
        rep = await db.execute(select(FinderReputation).where(FinderReputation.wallet_address == finder_wallet))
        rep_obj = rep.scalar_one_or_none()
        if rep_obj:
            rep_obj.total_score += 50
            rep_obj.return_count += 1
        else:
            db.add(FinderReputation(wallet_address=finder_wallet, total_score=50, return_count=1, badges=["✅ Verified"]))
    db.add(TxLog(tx_type="reward", tx_hash=req.tx_hash, description=f"Reward released for {req.token_id}", wallet=wallet, token_id=req.token_id))
    await db.commit()
    return {"success": True, "token_id": req.token_id, "finder": finder_wallet}

@router.get("")
async def list_found(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FoundReport).order_by(FoundReport.created_at.desc()).limit(50))
    return [_fmt(r) for r in result.scalars().all()]

def _fmt(r): return {"id": str(r.id), "token_id": r.token_id, "finder_wallet": r.finder_wallet, "location": r.location, "description": r.description, "ai_match_score": float(r.ai_match_score) if r.ai_match_score else None, "matched_token": r.matched_token, "confirmed": r.confirmed, "created_at": r.created_at.isoformat() if r.created_at else None}
