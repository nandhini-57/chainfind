from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid
from database import get_db
from models.item import Item, ItemStatus
from models.chat_message import ChatMessage
from models.finder_reputation import FinderReputation
from models.transaction_log import TransactionLog
from models.police_log import PoliceLog
from models.found_report import FoundReport
from services.ai_service import run_ai_match
from services.blockchain_service import generate_mock_tx_hash
from utils.encryption import encrypt_message, decrypt_message

ai_router = APIRouter(prefix="/api/ai", tags=["AI"])
chat_router = APIRouter(prefix="/api/chat", tags=["Chat"])
rep_router = APIRouter(prefix="/api/reputation", tags=["Reputation"])
police_router = APIRouter(prefix="/api/police", tags=["Police"])
tx_router = APIRouter(prefix="/api/transactions", tags=["Transactions"])
stats_router = APIRouter(prefix="/api/stats", tags=["Stats"])

class MatchRequest(BaseModel):
    description: str; location: Optional[str] = ""; category: Optional[str] = ""

@ai_router.post("/match")
async def ai_match(req: MatchRequest, db: Session = Depends(get_db)):
    lost_items = db.query(Item).filter(Item.status == ItemStatus.lost).all()
    from models.lost_report import LostReport
    lr_map = {lr.item_id: lr for lr in db.query(LostReport).filter(LostReport.is_active==True).all()}
    items_data = []
    for item in lost_items:
        d = item.to_dict()
        lr = lr_map.get(item.id)
        if lr: d["location"]=lr.location; d["reward"]=lr.reward_amount
        items_data.append(d)
    matches = run_ai_match(req.description, req.location, items_data)
    enriched = []
    for m in matches:
        item = db.query(Item).filter(Item.id == m["item_id"]).first()
        if item:
            d = item.to_dict()
            lr = lr_map.get(item.id)
            if lr: d["reward"]=lr.reward_amount; d["location"]=lr.location
            enriched.append({**d, **m})
    return {"success":True,"matches":enriched,"total_searched":len(items_data)}

class SendMessageRequest(BaseModel):
    sender_wallet: str; sender_role: str; message: str

@chat_router.get("/{case_id}")
async def get_messages(case_id: str, wallet: str, db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(ChatMessage.case_id==case_id).order_by(ChatMessage.created_at).all()
    result = []
    for msg in messages:
        d = msg.to_dict()
        d["message"] = decrypt_message(msg.encrypted_msg)
        result.append(d)
    return {"success":True,"messages":result}

@chat_router.post("/{case_id}")
async def send_message(case_id: str, req: SendMessageRequest, db: Session = Depends(get_db)):
    encrypted = encrypt_message(req.message)
    msg = ChatMessage(id=str(uuid.uuid4()), case_id=case_id, sender_wallet=req.sender_wallet,
        sender_role=req.sender_role, encrypted_msg=encrypted)
    db.add(msg); db.commit(); db.refresh(msg)
    d = msg.to_dict(); d["message"] = req.message
    return {"success":True,"message":d}

def get_badge(score):
    if score>=500: return "🏆 Legend"
    if score>=300: return "🥈 Expert"
    if score>=150: return "🥉 Verified"
    if score>=50:  return "⭐ Trusted"
    return "✨ New"

@rep_router.get("/leaderboard")
async def leaderboard(db: Session = Depends(get_db)):
    finders = db.query(FinderReputation).order_by(FinderReputation.reputation_score.desc()).limit(20).all()
    result = []
    for i, f in enumerate(finders):
        d = f.to_dict(); d["rank"]=i+1; d["badge"]=get_badge(f.reputation_score); result.append(d)
    return {"success":True,"leaderboard":result}

@rep_router.get("/profile/{wallet}")
async def get_profile(wallet: str, db: Session = Depends(get_db)):
    rep = db.query(FinderReputation).filter(FinderReputation.wallet_address==wallet).first()
    if not rep: return {"success":True,"profile":None}
    d = rep.to_dict(); d["badge"]=get_badge(rep.reputation_score)
    return {"success":True,"profile":d}

class PoliceLogRequest(BaseModel):
    station_id: str; station_name: str; description: str
    location: str; category: Optional[str]=""; case_number: str

@police_router.post("/log")
async def log_item(req: PoliceLogRequest, db: Session = Depends(get_db)):
    count = db.query(PoliceLog).count()
    log_id = f"GRP-{(count+1):03d}"
    tx_hash = generate_mock_tx_hash()
    log = PoliceLog(id=log_id, station_id=req.station_id, station_name=req.station_name,
        description=req.description, location=req.location, category=req.category,
        case_number=req.case_number, tx_hash=tx_hash)
    db.add(log)
    db.add(TransactionLog(id=str(uuid.uuid4()), tx_type="found", tx_hash=tx_hash,
        description=f"Police {req.station_name} logged: {req.description[:50]}"))
    db.commit(); db.refresh(log)
    return {"success":True,"log":log.to_dict(),"tx_hash":tx_hash}

@police_router.get("/logs")
async def get_logs(db: Session = Depends(get_db)):
    logs = db.query(PoliceLog).order_by(PoliceLog.created_at.desc()).limit(50).all()
    return {"success":True,"logs":[l.to_dict() for l in logs]}

@tx_router.get("")
async def get_transactions(limit: int = 50, db: Session = Depends(get_db)):
    txs = db.query(TransactionLog).order_by(TransactionLog.created_at.desc()).limit(limit).all()
    return {"success":True,"transactions":[t.to_dict() for t in txs]}

@stats_router.get("")
async def get_stats(db: Session = Depends(get_db)):
    return {"success":True,"stats":{
        "total_registered": db.query(Item).count(),
        "active_lost": db.query(Item).filter(Item.status==ItemStatus.lost).count(),
        "items_returned": db.query(Item).filter(Item.status=="returned").count(),
        "found_reports": db.query(FoundReport).count(),
        "total_finders": db.query(FinderReputation).count()}}
