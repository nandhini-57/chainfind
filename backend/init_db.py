import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import init_db as create_tables, AsyncSessionLocal
from models.item import Item, ItemStatus
from models.lost_report import LostReport
from models.found_report import FoundReport
from models.transaction_log import TransactionLog
from models.finder_reputation import FinderReputation
from models.police_log import PoliceLog
import uuid
import asyncio

async def seed():
    async with AsyncSessionLocal() as db:
        try:
            for M in [LostReport,FoundReport,TransactionLog,FinderReputation,PoliceLog,Item]:
                await db.execute(M.__table__.delete())
            await db.commit()

            items = [
            Item(id="NFT-001",name="Black Leather Wallet",category="Wallet / Purse",description="Genuine leather, brown interior, Aadhaar & 3 debit cards",serial_id="Initials AK carved inside",owner_wallet="0x7f3a9e2c4b1d8f06",ipfs_hash="QmWallet001abcdef",status=ItemStatus.lost,latitude=13.0827,longitude=80.2707,token_id="NFT-001",tx_hash="0x"+"a"*64),
            Item(id="NFT-002",name="iPhone 14 Pro Max",category="Phone / Tablet",description="Space Black, cracked screen protector, red case elephant keychain",serial_id="IMEI: 354-871-09-234567",owner_wallet="0x3b1c4d8f9a2e7c01",ipfs_hash="QmPhone002abcdef",status=ItemStatus.lost,latitude=13.1986,longitude=80.2986,token_id="NFT-002",tx_hash="0x"+"b"*64),
            Item(id="NFT-003",name="Blue Jansport Backpack",category="Bag / Backpack",description="Navy blue, college name tag, laptop & notebooks inside",serial_id="Tag: BITSHY-22-CS-089",owner_wallet="0x9a2d7e1b3c4f8e02",ipfs_hash="QmBag003abcdef",status=ItemStatus.found,latitude=13.0569,longitude=80.2425,token_id="NFT-003",tx_hash="0x"+"c"*64),
            Item(id="NFT-004",name="Gold Mangalsutra",category="Jewellery",description="22k gold, 18 inch chain, diamond pendant",serial_id="Hallmark: 22K-BIS-2021",owner_wallet="0x2e8f1a3c9d4b7e03",ipfs_hash="QmJewel004abcdef",status=ItemStatus.lost,latitude=13.0674,longitude=80.2176,token_id="NFT-004",tx_hash="0x"+"d"*64),
            Item(id="NFT-005",name="Passport + Travel Wallet",category="Documents",description="Indian passport, blue travel wallet, Zurich flight tickets",serial_id="Passport: Z-1847392",owner_wallet="0x6c4a8b2e1f3d9c04",ipfs_hash="QmDoc005abcdef",status=ItemStatus.lost,latitude=12.9941,longitude=80.1709,token_id="NFT-005",tx_hash="0x"+"e"*64),
            Item(id="NFT-006",name="House Keys Bundle",category="Keys",description="3 keys on red keychain with Ganesh idol, bike + 2 door keys",serial_id="Bike: TN09-BF-2834",owner_wallet="0x1f7e5c9a2b4d8f05",ipfs_hash="QmKeys006abcdef",status=ItemStatus.found,latitude=13.0418,longitude=80.2341,token_id="NFT-006",tx_hash="0x"+"f"*64),
            ]
            for i in items: db.add(i)

        lrs = [
            LostReport(id="LR-001",item_id="NFT-001",owner_wallet="0x7f3a9e2c4b1d8f06",location="Chennai Central Railway Station, Platform 3",latitude=13.0827,longitude=80.2707,reward_amount=500,reward_escrowed=True,escrow_tx_hash="0x"+"1"*64),
            LostReport(id="LR-002",item_id="NFT-002",owner_wallet="0x3b1c4d8f9a2e7c01",location="Chennai International Airport, Terminal 2",latitude=13.1986,longitude=80.2986,reward_amount=2000,reward_escrowed=True,escrow_tx_hash="0x"+"2"*64),
            LostReport(id="LR-003",item_id="NFT-004",owner_wallet="0x2e8f1a3c9d4b7e03",location="T. Nagar Shopping Complex",latitude=13.0674,longitude=80.2176,reward_amount=5000,reward_escrowed=True,escrow_tx_hash="0x"+"3"*64),
            LostReport(id="LR-004",item_id="NFT-005",owner_wallet="0x6c4a8b2e1f3d9c04",location="Chennai Bus Stand, Bay 14",latitude=12.9941,longitude=80.1709,reward_amount=1000,reward_escrowed=True,escrow_tx_hash="0x"+"4"*64),
        ]
        for lr in lrs: db.add(lr)

        finders = [
            FinderReputation(wallet_address="0xa1b2c3d4e5f6a7b8",display_name="RailwayHelper_TN",total_returns=12,reputation_score=780,avg_rating=4.9,badge="🏆 Legend",is_verified=True),
            FinderReputation(wallet_address="0xe5f6a7b8c9d0e1f2",display_name="HonestFinder99",total_returns=8,reputation_score=520,avg_rating=4.8,badge="🥈 Expert",is_verified=True),
            FinderReputation(wallet_address="0xb3c4d5e6f7a8b9c0",display_name="GoodSamaritan",total_returns=5,reputation_score=320,avg_rating=4.7,badge="🥉 Verified"),
            FinderReputation(wallet_address="0xf7g8h9i0j1k2l3m4",display_name="AnonymousHelper",total_returns=3,reputation_score=180,avg_rating=4.5,badge="⭐ Trusted"),
        ]
        for f in finders: db.add(f)

        txs = [
            TransactionLog(id=str(uuid.uuid4()),tx_type="mint",tx_hash="0x"+"a"*64,item_id="NFT-001",description="NFT-001 minted for Black Leather Wallet"),
            TransactionLog(id=str(uuid.uuid4()),tx_type="lost",tx_hash="0x"+"1"*64,item_id="NFT-001",description="Lost report filed for NFT-001",amount=500),
            TransactionLog(id=str(uuid.uuid4()),tx_type="lost",tx_hash="0x"+"2"*64,item_id="NFT-002",description="Lost report filed for NFT-002",amount=2000),
            TransactionLog(id=str(uuid.uuid4()),tx_type="found",tx_hash="0x"+"5"*64,description="Found report submitted anonymously"),
            TransactionLog(id=str(uuid.uuid4()),tx_type="reward",tx_hash="0x"+"7"*64,item_id="NFT-003",description="300 MATIC reward released for NFT-003 return",amount=300),
        ]
        for t in txs: db.add(t)

        db.add(PoliceLog(id="GRP-001",station_id="grp-chennai-central",station_name="Chennai Central GRP",description="Silver bracelet - name engraving Priya",location="Platform 1",category="Jewellery",case_number="GRP/CHN/2025/1841",tx_hash="0x"+"8"*64))
        await db.commit()
        print("✅ Seeded! Items:6 LostReports:4 Finders:4 Txs:5")
    except Exception as e:
        print(f"❌ Error: {e}"); await db.rollback(); raise

if __name__ == "__main__":
    print("🔧 Initializing ChainFind DB...")
    asyncio.run(create_tables())
    asyncio.run(seed())
    print("🚀 Done! Run: uvicorn main:app --reload")
