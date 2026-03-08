import secrets, hashlib, json
from config import settings

try:
    from web3 import Web3
    w3 = Web3(Web3.HTTPProvider(settings.AMOY_RPC_URL))
    WEB3_AVAILABLE = w3.is_connected()
except:
    WEB3_AVAILABLE = False
    w3 = None

CONTRACT_ABI = [
    {"inputs":[{"name":"tokenId","type":"string"},{"name":"ipfsHash","type":"string"}],"name":"registerItem","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"name":"tokenId","type":"string"}],"name":"reportLost","outputs":[],"stateMutability":"payable","type":"function"},
    {"inputs":[{"name":"tokenId","type":"string"},{"name":"reportId","type":"string"}],"name":"confirmReturn","outputs":[],"stateMutability":"nonpayable","type":"function"},
]

def generate_mock_tx_hash(): return "0x" + secrets.token_hex(32)
def generate_item_id(counter): return f"NFT-{counter:03d}"
def hash_item_data(data): return "0x" + hashlib.sha256(json.dumps(data,sort_keys=True).encode()).hexdigest()

def mint_item_nft(token_id, ipfs_hash, owner_wallet):
    if not WEB3_AVAILABLE or not settings.CONTRACT_ADDRESS or not settings.PRIVATE_KEY:
        return {"success":True,"tx_hash":generate_mock_tx_hash(),"block_number":12847392,"mock":True}
    try:
        contract = w3.eth.contract(address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS), abi=CONTRACT_ABI)
        account = w3.eth.account.from_key(settings.PRIVATE_KEY)
        tx = contract.functions.registerItem(token_id, ipfs_hash).build_transaction(
            {"from":account.address,"nonce":w3.eth.get_transaction_count(account.address),"gas":200000,"gasPrice":w3.eth.gas_price,"chainId":settings.CHAIN_ID})
        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        return {"success":True,"tx_hash":tx_hash.hex(),"block_number":receipt.blockNumber,"mock":False}
    except Exception as e:
        return {"success":False,"error":str(e)}

def escrow_reward(token_id, amount_wei):
    if not WEB3_AVAILABLE or not settings.CONTRACT_ADDRESS:
        return {"success":True,"tx_hash":generate_mock_tx_hash(),"mock":True}
    try:
        contract = w3.eth.contract(address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS), abi=CONTRACT_ABI)
        account = w3.eth.account.from_key(settings.PRIVATE_KEY)
        tx = contract.functions.reportLost(token_id).build_transaction(
            {"from":account.address,"nonce":w3.eth.get_transaction_count(account.address),"gas":150000,"gasPrice":w3.eth.gas_price,"value":amount_wei,"chainId":settings.CHAIN_ID})
        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        return {"success":True,"tx_hash":tx_hash.hex(),"mock":False}
    except Exception as e:
        return {"success":False,"error":str(e)}

def release_reward(token_id):
    if not WEB3_AVAILABLE or not settings.CONTRACT_ADDRESS:
        return {"success":True,"tx_hash":generate_mock_tx_hash(),"mock":True}
    return {"success":True,"tx_hash":generate_mock_tx_hash(),"mock":True}
