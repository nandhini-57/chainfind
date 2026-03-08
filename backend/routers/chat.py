from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from database import get_db
from models.chat import ChatMessage
from models.item import Item
from utils.auth import get_current_wallet
from utils.encryption import encrypt_message, decrypt_message

router = APIRouter(prefix="/api/chat", tags=["Chat"])

class SendMessageRequest(BaseModel):
    case_id: str
    message: str

@router.post("/send")
async def send_message(req: SendMessageRequest, wallet: str = Depends(get_current_wallet), db: AsyncSession = Depends(get_db)):
    item_result = await db.execute(select(Item).where(Item.token_id == req.case_id))
    item = item_result.scalar_one_or_none()
    role = "owner" if (item and item.owner_wallet.lower() == wallet.lower()) else "finder"
    enc_msg, iv = encrypt_message(req.message)
    msg = ChatMessage(case_id=req.case_id, sender_wallet=wallet.lower(), role=role, encrypted_msg=enc_msg, iv=iv)
    db.add(msg)
    await db.commit()
    return {"success": True, "role": role, "timestamp": msg.created_at.isoformat() if msg.created_at else None}

@router.get("/{case_id}")
async def get_messages(case_id: str, wallet: str = Depends(get_current_wallet), db: AsyncSession = Depends(get_db)):
    item_result = await db.execute(select(Item).where(Item.token_id == case_id))
    item = item_result.scalar_one_or_none()
    if not item: raise HTTPException(404, "Case not found")
    wallet_lower = wallet.lower()
    is_owner  = item.owner_wallet.lower() == wallet_lower
    is_finder = item.finder_wallet and item.finder_wallet.lower() == wallet_lower
    if not (is_owner or is_finder): raise HTTPException(403, "Not authorized for this case")
    result = await db.execute(select(ChatMessage).where(ChatMessage.case_id == case_id).order_by(ChatMessage.created_at.asc()))
    msgs = result.scalars().all()
    return [{"id": str(m.id), "role": m.role, "message": decrypt_message(m.encrypted_msg, m.iv),
             "sender_wallet": m.sender_wallet, "timestamp": m.created_at.isoformat() if m.created_at else None} for m in msgs]
