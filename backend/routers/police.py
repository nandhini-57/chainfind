from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models.reputation import PoliceLog, TxLog
from services.pinata_service import upload_json_to_ipfs
from utils.auth import get_current_wallet

router = APIRouter(prefix="/api/police", tags=["Police Portal"])

class PoliceLogRequest(BaseModel):
    station_id: str
    station_name: str
    description: str
    category: Optional[str] = None
    location: str
    case_number: str

@router.post("/log")
async def log_item(req: PoliceLogRequest, wallet: str = Depends(get_current_wallet), db: AsyncSession = Depends(get_db)):
    ipfs_hash = await upload_json_to_ipfs(req.model_dump(), f"police-{req.case_number}")
    log = PoliceLog(station_id=req.station_id, station_name=req.station_name, description=req.description,
                    category=req.category, location=req.location, case_number=req.case_number, ipfs_hash=ipfs_hash)
    db.add(log)
    db.add(TxLog(tx_type="police_log", description=f"Police logged: {req.description[:40]}...", wallet=wallet))
    await db.commit()
    return {"success": True, "case_number": req.case_number, "ipfs_hash": ipfs_hash}

@router.get("/log")
async def get_police_log(station_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    q = select(PoliceLog).order_by(PoliceLog.created_at.desc())
    if station_id: q = q.where(PoliceLog.station_id == station_id)
    result = await db.execute(q)
    logs = result.scalars().all()
    return [{"id": str(l.id), "station_id": l.station_id, "station_name": l.station_name, "description": l.description,
             "category": l.category, "location": l.location, "case_number": l.case_number,
             "ipfs_hash": l.ipfs_hash, "created_at": l.created_at.isoformat() if l.created_at else None} for l in logs]
