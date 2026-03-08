from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import get_settings
from eth_account.messages import encode_defunct
from web3 import Web3

settings = get_settings()
security = HTTPBearer()

def create_token(wallet_address: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=settings.jwt_expire_hours)
    return jwt.encode({"sub": wallet_address.lower(), "exp": expire}, settings.jwt_secret, algorithm="HS256")

def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_wallet(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    return decode_token(credentials.credentials)

def verify_wallet_signature(wallet_address: str, message: str, signature: str) -> bool:
    """Verify MetaMask signature to authenticate wallet owner."""
    try:
        w3 = Web3()
        msg = encode_defunct(text=message)
        recovered = w3.eth.account.recover_message(msg, signature=signature)
        return recovered.lower() == wallet_address.lower()
    except Exception:
        return False
