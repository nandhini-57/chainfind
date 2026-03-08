from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from database import get_db
from models.item import Item
from models.reputation import TxLog
from services.pinata_service import upload_json_to_ipfs
from utils.auth import get_current_wallet

router = APIRouter(prefix="/api/items", tags=["Items"])

class RegisterRequest(BaseModel):
    token_id: str
    name: str
    category: str
    description: str
    serial_number: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    tx_hash: Optional[str] = None
    ipfs_hash: Optional[str] = None
    ipfs_url: Optional[str] = None

@router.post("/register")
async def register_item(req: RegisterRequest, wallet: str = Depends(get_current_wallet), db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Item).where(Item.token_id == req.token_id))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Token ID already registered")
    
    # Set expiry to 90 days from now
    expires_at = datetime.utcnow() + timedelta(days=90)
    
    metadata = {"token_id": req.token_id, "name": req.name, "category": req.category,
                "description": req.description, "serial_number": req.serial_number, "owner": wallet}
    ipfs_hash = req.ipfs_hash or await upload_json_to_ipfs(metadata, f"chainfind-{req.token_id}")
    
    item = Item(
        token_id=req.token_id, 
        name=req.name, 
        category=req.category,
        description=req.description, 
        serial_number=req.serial_number,
        ipfs_hash=ipfs_hash,
        ipfs_url=req.ipfs_url,
        owner_wallet=wallet.lower(),
        latitude=req.latitude, 
        longitude=req.longitude, 
        tx_hash=req.tx_hash,
        expires_at=expires_at
    )
    db.add(item)
    db.add(TxLog(tx_type="mint", tx_hash=req.tx_hash, description=f"{req.token_id} minted for {req.name}", wallet=wallet, token_id=req.token_id))
    await db.commit()
    return {"success": True, "token_id": req.token_id, "ipfs_hash": ipfs_hash, "expires_at": expires_at.isoformat()}

@router.get("")
async def list_items(status: Optional[str] = None, category: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    q = select(Item).order_by(Item.created_at.desc())
    if status: q = q.where(Item.status == status)
    if category: q = q.where(Item.category == category)
    result = await db.execute(q)
    return [_fmt(i) for i in result.scalars().all()]

@router.get("/my")
async def my_items(wallet: str = Depends(get_current_wallet), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item).where(Item.owner_wallet == wallet.lower()).order_by(Item.created_at.desc()))
    return [_fmt(i) for i in result.scalars().all()]

@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    total    = (await db.execute(select(func.count(Item.id)))).scalar()
    lost     = (await db.execute(select(func.count(Item.id)).where(Item.status == "lost"))).scalar()
    returned = (await db.execute(select(func.count(Item.id)).where(Item.status == "returned"))).scalar()
    reward   = (await db.execute(select(func.sum(Item.reward_amount)).where(Item.status == "returned"))).scalar() or 0
    return {"total_registered": total, "active_lost": lost, "returned": returned, "total_rewards_paid": float(reward)}

@router.get("/expired")
async def get_expired_items(db: AsyncSession = Depends(get_db)):
    """Get items that have expired (90 days since lost report)"""
    now = datetime.utcnow()
    result = await db.execute(
        select(Item).where(
            Item.expires_at <= now,
            Item.status.in_(["lost", "registered"])
        )
    )
    return [_fmt(i) for i in result.scalars().all()]

@router.post("/expire/{token_id}")
async def expire_item(token_id: str, db: AsyncSession = Depends(get_db)):
    """Manually expire an item and return reward to owner"""
    result = await db.execute(select(Item).where(Item.token_id == token_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item not found")
    
    if item.status == "lost":
        # Return reward to owner (in a real app, this would interact with blockchain)
        item.status = "expired"
        await db.commit()
        return {"success": True, "message": "Item expired, reward returned to owner"}
    
    return {"success": False, "message": "Item cannot be expired in current state"}

@router.get("/{token_id}")
async def get_item(token_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item).where(Item.token_id == token_id))
    item = result.scalar_one_or_none()
    if not item: raise HTTPException(404, "Item not found")
    return _fmt(item)

def _fmt(i):
    return {"id": str(i.id), "token_id": i.token_id, "name": i.name, "category": i.category,
            "description": i.description, "serial_number": i.serial_number, "ipfs_hash": i.ipfs_hash,
            "ipfs_url": i.ipfs_url, "owner_wallet": i.owner_wallet, "status": i.status, 
            "reward_amount": float(i.reward_amount or 0),
            "finder_wallet": i.finder_wallet, "latitude": float(i.latitude) if i.latitude else None,
            "longitude": float(i.longitude) if i.longitude else None, "tx_hash": i.tx_hash,
            "expires_at": i.expires_at.isoformat() if i.expires_at else None,
            "created_at": i.created_at.isoformat() if i.created_at else None}
