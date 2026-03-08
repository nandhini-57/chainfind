import requests, json, hashlib
from config import settings

def upload_to_ipfs(file_content: bytes, filename: str, metadata=None) -> dict:
    if not settings.PINATA_API_KEY:
        mock_hash = "Qm" + hashlib.sha256(file_content).hexdigest()[:44]
        return {"success":True,"ipfs_hash":mock_hash,"ipfs_url":f"https://gateway.pinata.cloud/ipfs/{mock_hash}","mock":True}
    try:
        url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        headers = {"pinata_api_key":settings.PINATA_API_KEY,"pinata_secret_api_key":settings.PINATA_SECRET_KEY}
        r = requests.post(url, files={"file":(filename,file_content)},
            data={"pinataMetadata":json.dumps({"name":filename})}, headers=headers)
        if r.status_code == 200:
            h = r.json()["IpfsHash"]
            return {"success":True,"ipfs_hash":h,"ipfs_url":f"{settings.PINATA_GATEWAY}{h}","mock":False}
        return {"success":False,"error":r.json()}
    except Exception as e:
        return {"success":False,"error":str(e)}

def upload_json_to_ipfs(data: dict, name: str) -> dict:
    if not settings.PINATA_API_KEY:
        mock_hash = "Qm" + hashlib.sha256(json.dumps(data).encode()).hexdigest()[:44]
        return {"success":True,"ipfs_hash":mock_hash,"ipfs_url":f"https://gateway.pinata.cloud/ipfs/{mock_hash}","mock":True}
    try:
        r = requests.post("https://api.pinata.cloud/pinning/pinJSONToIPFS",
            json={"pinataMetadata":{"name":name},"pinataContent":data},
            headers={"Content-Type":"application/json","pinata_api_key":settings.PINATA_API_KEY,"pinata_secret_api_key":settings.PINATA_SECRET_KEY})
        if r.status_code == 200:
            h = r.json()["IpfsHash"]
            return {"success":True,"ipfs_hash":h,"ipfs_url":f"{settings.PINATA_GATEWAY}{h}","mock":False}
        return {"success":False,"error":r.json()}
    except Exception as e:
        return {"success":False,"error":str(e)}
