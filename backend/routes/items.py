from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
import uuid
from database import get_db
from models.item import Item, ItemStatus
from models.lost_report import LostReport
from models.found_report import FoundReport
from models.transaction_log import TransactionLog
from services.blockchain_service import mint_item_nft, escrow_reward, generate_mock_tx_hash
from services.ipfs_service import upload_json_to_ipfs

router = APIRouter(prefix="/api/items", tags=["items"])

class RegisterItemRequest(BaseModel):
    name: str; category: str; description: str
    serial_id: Optional[str] = ""; owner_wallet: str
    latitude: Optional[float] = None; longitude: Optional[float] = None

class LostReportRequest(BaseModel):
    item_id: str; owner_wallet: str; location: str
    latitude: Optional[float] = None; longitude: Optional[float] = None
    details: Optional[str] = ""; reward_amount: Optional[float] = 0

class FoundReportRequest(BaseModel):
    finder_wallet: str; location: str; description: str
    latitude: Optional[float] = None; longitude: Optional[float] = None
    category: Optional[str] = ""

class ConfirmReturnRequest(BaseModel):
    item_id: str; owner_wallet: str; found_report_id: str

def get_next_id(db, Model, prefix):
    count = db.query(func.count(Model.id)).scalar()
    return f"{prefix}-{(count+1):03d}"

def log_tx(db, tx_type, desc, item_id=None, tx_hash=None, amount=0):
    db.add(TransactionLog(id=str(uuid.uuid4()), tx_type=tx_type,
        tx_hash=tx_hash or generate_mock_tx_hash(), description=desc, item_id=item_id, amount=amount))

@router.post("/register")
async def register_item(req: RegisterItemRequest, db: Session = Depends(get_db)):
    item_id = get_next_id(db, Item, "NFT")
    metadata = {"name":req.name,"description":req.description,"category":req.category,"owner":req.owner_wallet,"token_id":item_id}
    ipfs_result = upload_json_to_ipfs(metadata, f"{item_id}-metadata.json")
    bc_result = mint_item_nft(item_id, ipfs_result.get("ipfs_hash",""), req.owner_wallet)
    item = Item(id=item_id, name=req.name, category=req.category, description=req.description,
        serial_id=req.serial_id, owner_wallet=req.owner_wallet, ipfs_hash=ipfs_result.get("ipfs_hash",""),
        ipfs_url=ipfs_result.get("ipfs_url",""), status=ItemStatus.registered,
        latitude=req.latitude, longitude=req.longitude, token_id=item_id, tx_hash=bc_result.get("tx_hash"))
    db.add(item)
    log_tx(db, "mint", f"{item_id} minted for {req.name}", item_id, bc_result.get("tx_hash"))
    db.commit(); db.refresh(item)
    return {"success":True,"item":item.to_dict(),"ipfs":ipfs_result,"blockchain":bc_result,"message":f"NFT {item_id} minted!"}

@router.post("/report-lost")
async def report_lost(req: LostReportRequest, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == req.item_id).first()
    if not item: raise HTTPException(404, "Item not found")
    if item.owner_wallet != req.owner_wallet: raise HTTPException(403, "Not item owner")
    lr_id = get_next_id(db, LostReport, "LR")
    bc_result = escrow_reward(req.item_id, int((req.reward_amount or 0)*1e18))
    lr = LostReport(id=lr_id, item_id=req.item_id, owner_wallet=req.owner_wallet,
        location=req.location, latitude=req.latitude, longitude=req.longitude,
        details=req.details, reward_amount=req.reward_amount or 0,
        reward_escrowed=bc_result.get("success",False), escrow_tx_hash=bc_result.get("tx_hash"))
    item.status = ItemStatus.lost
    if req.latitude: item.latitude = req.latitude
    if req.longitude: item.longitude = req.longitude
    db.add(lr)
    log_tx(db, "lost", f"Lost report filed for {req.item_id} ({item.name})", req.item_id, bc_result.get("tx_hash"), req.reward_amount or 0)
    db.commit()
    return {"success":True,"report":lr.to_dict(),"blockchain":bc_result}

@router.post("/report-found")
async def report_found(req: FoundReportRequest, db: Session = Depends(get_db)):
    fr_id = get_next_id(db, FoundReport, "FR")
    tx_hash = generate_mock_tx_hash()
    fr = FoundReport(id=fr_id, finder_wallet=req.finder_wallet, location=req.location,
        latitude=req.latitude, longitude=req.longitude, description=req.description,
        category=req.category, tx_hash=tx_hash)
    db.add(fr)
    log_tx(db, "found", "Found report submitted anonymously", None, tx_hash)
    db.commit(); db.refresh(fr)
    return {"success":True,"report":fr.to_dict(),"message":"Run AI matcher to find the owner!"}

@router.get("/lost")
async def get_lost_items(db: Session = Depends(get_db)):
    items = db.query(Item).filter(Item.status == ItemStatus.lost).all()
    lr_map = {lr.item_id: lr for lr in db.query(LostReport).filter(LostReport.is_active==True).all()}
    result = []
    for item in items:
        d = item.to_dict()
        lr = lr_map.get(item.id)
        if lr: d["location"] = lr.location; d["reward"] = lr.reward_amount
        result.append(d)
    return {"success":True,"items":result,"count":len(result)}

@router.get("/map")
async def get_map_markers(db: Session = Depends(get_db)):
    lost_items = db.query(Item).filter(Item.status == ItemStatus.lost).all()
    found_reports = db.query(FoundReport).filter(FoundReport.is_returned==False).all()
    lr_map = {lr.item_id: lr for lr in db.query(LostReport).filter(LostReport.is_active==True).all()}
    markers = []
    for item in lost_items:
        if item.latitude and item.longitude:
            lr = lr_map.get(item.id)
            markers.append({"id":item.id,"type":"lost","name":item.name,"category":item.category,
                "lat":item.latitude,"lng":item.longitude,"reward":lr.reward_amount if lr else 0,
                "location":lr.location if lr else ""})
    for fr in found_reports:
        if fr.latitude and fr.longitude:
            markers.append({"id":fr.id,"type":"found","name":f"Found: {fr.category or 'Unknown'}",
                "category":fr.category,"lat":fr.latitude,"lng":fr.longitude,"description":fr.description[:60]})
    return {"success":True,"markers":markers,"count":len(markers)}

@router.get("/all")
async def get_all_items(db: Session = Depends(get_db)):
    items = db.query(Item).all()
    return {"success":True,"items":[i.to_dict() for i in items]}

@router.post("/confirm-return/{item_id}")
async def confirm_return(item_id: str, req: ConfirmReturnRequest, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item: raise HTTPException(404,"Item not found")
    from services.blockchain_service import release_reward
    bc_result = release_reward(item_id)
    item.status = ItemStatus.returned
    found_report = db.query(FoundReport).filter(FoundReport.id == req.found_report_id).first()
    if found_report:
        found_report.is_returned = True
        found_report.reward_released = bc_result.get("success",False)
        found_report.reward_tx_hash = bc_result.get("tx_hash")
        from models.finder_reputation import FinderReputation
        rep = db.query(FinderReputation).filter(FinderReputation.wallet_address==found_report.finder_wallet).first()
        if rep: rep.total_returns += 1; rep.reputation_score += 50
        else: db.add(FinderReputation(wallet_address=found_report.finder_wallet,display_name="Anonymous Finder",total_returns=1,reputation_score=50))
    lr = db.query(LostReport).filter(LostReport.item_id==item_id,LostReport.is_active==True).first()
    if lr: lr.is_active = False; lr.is_resolved = True
    log_tx(db,"reward",f"Reward released after owner confirmed return of {item.name}",item_id,bc_result.get("tx_hash"))
    db.commit()
    return {"success":True,"blockchain":bc_result,"message":"Return confirmed! Reward released."}

@router.get("/{item_id}")
async def get_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item: raise HTTPException(404,"Item not found")
    lr = db.query(LostReport).filter(LostReport.item_id==item_id,LostReport.is_active==True).first()
    d = item.to_dict()
    if lr: d["location"]=lr.location; d["reward"]=lr.reward_amount
    return {"success":True,"item":d}
