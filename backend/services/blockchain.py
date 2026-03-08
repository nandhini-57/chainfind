from web3 import AsyncWeb3
from web3.middleware import ExtraDataToPOAMiddleware
from config import get_settings
import json

settings = get_settings()

# Minimal ABI for ChainFind contract
CHAINFIND_ABI = [
    {"inputs":[{"type":"string","name":"tokenId"},{"type":"string","name":"ipfsHash"}],"name":"registerItem","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"type":"string","name":"tokenId"},{"type":"string","name":"location"}],"name":"reportLost","outputs":[],"stateMutability":"payable","type":"function"},
    {"inputs":[{"type":"string","name":"tokenId"},{"type":"string","name":"location"},{"type":"string","name":"descHash"}],"name":"submitFound","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"type":"string","name":"tokenId"}],"name":"confirmReturn","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"type":"string","name":"tokenId"}],"name":"getItem","outputs":[{"components":[{"type":"string","name":"tokenId"},{"type":"address","name":"owner"},{"type":"string","name":"ipfsHash"},{"type":"uint8","name":"status"},{"type":"uint256","name":"rewardAmount"},{"type":"address","name":"finder"},{"type":"uint256","name":"registeredAt"},{"type":"uint256","name":"updatedAt"},{"type":"string","name":"revokeReason"}],"type":"tuple","name":""}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"getAllTokenIds","outputs":[{"type":"string[]","name":""}],"stateMutability":"view","type":"function"},
]

def get_web3():
    w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(settings.polygon_rpc_url))
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    return w3

async def get_item_from_chain(token_id: str) -> dict | None:
    if not settings.contract_address:
        return None
    try:
        w3 = get_web3()
        contract = w3.eth.contract(
            address=AsyncWeb3.to_checksum_address(settings.contract_address),
            abi=CHAINFIND_ABI,
        )
        item = await contract.functions.getItem(token_id).call()
        return {
            "token_id": item[0], "owner": item[1], "ipfs_hash": item[2],
            "status": item[3], "reward_amount": item[4],
            "finder": item[5], "registered_at": item[6],
        }
    except Exception as e:
        print(f"[Blockchain] Error fetching {token_id}: {e}")
        return None

async def verify_wallet_owns_token(wallet: str, token_id: str) -> bool:
    data = await get_item_from_chain(token_id)
    if not data:
        return False
    return data["owner"].lower() == wallet.lower()
