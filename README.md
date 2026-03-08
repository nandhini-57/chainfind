# ⛓️ ChainFind — Decentralised Lost & Found Registry
> BC-03 Hackathon · Polygon Amoy Testnet · FastAPI + PostgreSQL + Groq AI

## 🏗️ Stack
| Layer | Tech |
|-------|------|
| Smart Contract | Solidity + Hardhat + Polygon Amoy |
| Backend | Python 3.11 + FastAPI |
| Database | PostgreSQL + SQLAlchemy |
| AI Matching | Groq API (LLaMA 3 70B) |
| File Storage | IPFS via Pinata |
| Frontend | React 18 + Vite + TailwindCSS |
| Maps | React-Leaflet |
| Auth | JWT + MetaMask wallet signature |
| Chat | AES-256 encrypted messages |

---

## 🚀 Setup (3 terminals)

### 1. Database
```bash
psql -U postgres -c "CREATE DATABASE chainfind;"
psql -U postgres -d chainfind -f database/init.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env        # Fill in your API keys
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → API docs at http://localhost:8000/docs
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# → App at http://localhost:5173
```

### 4. Smart Contract (optional for demo)
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network amoy
# Copy CONTRACT_ADDRESS to backend/.env
```

---

## 🔑 Required API Keys (backend/.env)
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/chainfind
GROQ_API_KEY=gsk_xxxxxxxxxxxx          # → groq.com (free)
PINATA_JWT=eyJhbGc...                   # → pinata.cloud (free)
CONTRACT_ADDRESS=0x...                  # After deploying contract
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
JWT_SECRET=any_random_64_char_string
ENCRYPTION_KEY=any_32_byte_hex_string  # 64 hex chars
```

---

## 📡 API Endpoints
```
POST /api/auth/login          Wallet signature login
POST /api/auth/dev-login      Dev login (no signature)
POST /api/items/register      Register item + mint NFT
GET  /api/items               List all items
GET  /api/items/my            My registered NFTs
GET  /api/items/stats         Dashboard stats
POST /api/lost/report         File lost report + escrow reward
GET  /api/lost/active         Active lost reports
POST /api/found/report        Submit found report
POST /api/found/confirm-return Confirm return + release reward
POST /api/ai/match            Groq AI item matching
GET  /api/ai/map-markers      Map data
POST /api/chat/send           Send encrypted message
GET  /api/chat/{case_id}      Get decrypted chat history
GET  /api/reputation/leaderboard Finder leaderboard
POST /api/police/log          Police log found item
GET  /api/txlog               Blockchain transaction log
```
## 📊 Project Presentation

You can view the project presentation here:

ChainFind Presentation:
presentation/ChainFind (1).pptx

---

## 🎯 Features Built
- ✅ NFT item registration with IPFS metadata
- ✅ Lost report with reward escrow logic
- ✅ Anonymous found report submission
- ✅ Groq AI (LLaMA 3 70B) semantic item matching
- ✅ Live map with Leaflet + dark tiles
- ✅ AES-256 encrypted owner-finder chat
- ✅ Soulbound Token (SBT) reputation system
- ✅ Police portal with on-chain logging
- ✅ Full blockchain transaction log
- ✅ MetaMask wallet authentication
- ✅ PostgreSQL database with full schema
- ✅ Solidity smart contract (Polygon Amoy)
