from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.auth import create_token, verify_wallet_signature

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    wallet_address: str
    message: str
    signature: str

class DevLoginRequest(BaseModel):
    wallet_address: str

@router.post("/login")
async def login(req: LoginRequest):
    if not verify_wallet_signature(req.wallet_address, req.message, req.signature):
        raise HTTPException(401, "Invalid wallet signature")
    token = create_token(req.wallet_address)
    return {"access_token": token, "token_type": "bearer", "wallet": req.wallet_address}

@router.post("/dev-login")
async def dev_login(req: DevLoginRequest):
    """Dev-only login without signature verification"""
    token = create_token(req.wallet_address)
    return {"access_token": token, "token_type": "bearer", "wallet": req.wallet_address}

@router.get("/verify")
async def verify(wallet: str = None):
    return {"valid": True, "wallet": wallet}
