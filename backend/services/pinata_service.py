import httpx, json
from config import get_settings

settings = get_settings()
PINATA_URL = "https://api.pinata.cloud"

async def upload_json_to_ipfs(data: dict, name: str = "item-metadata") -> str:
    """Upload JSON metadata to IPFS via Pinata. Returns IPFS CID."""
    if not settings.pinata_jwt:
        # Return mock hash in dev
        import hashlib
        return "Qm" + hashlib.md5(json.dumps(data).encode()).hexdigest()[:44]

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PINATA_URL}/pinning/pinJSONToIPFS",
            json={"pinataContent": data, "pinataMetadata": {"name": name}},
            headers={"Authorization": f"Bearer {settings.pinata_jwt}"},
            timeout=30,
        )
        response.raise_for_status()
        return response.json()["IpfsHash"]

async def upload_file_to_ipfs(file_bytes: bytes, filename: str) -> str:
    """Upload file to IPFS via Pinata. Returns IPFS CID."""
    if not settings.pinata_jwt:
        import hashlib
        return "Qm" + hashlib.md5(file_bytes).hexdigest()[:44]

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PINATA_URL}/pinning/pinFileToIPFS",
            files={"file": (filename, file_bytes)},
            headers={"Authorization": f"Bearer {settings.pinata_jwt}"},
            timeout=60,
        )
        response.raise_for_status()
        return response.json()["IpfsHash"]
