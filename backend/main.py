from __future__ import annotations

import base64
import hashlib
import json
import secrets
import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

import uvicorn
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "chainfind.db"
UTC = timezone.utc


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


def db_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def badge_list(score: int) -> list[str]:
    badges = []
    if score >= 500:
        badges.append("Gold Finder")
    elif score >= 200:
        badges.append("Silver Finder")
    elif score > 0:
        badges.append("Bronze Finder")
    return badges


def serialize_user(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if not row:
        return None
    return {
        "wallet_address": row["wallet_address"],
        "display_name": row["display_name"] or row["wallet_address"],
        "total_score": row["total_score"],
        "avg_rating": row["avg_rating"],
        "return_count": row["return_count"],
        "badges": badge_list(row["total_score"]),
        "sbt_token_id": row["sbt_token_id"],
    }


def ensure_user(conn: sqlite3.Connection, wallet_address: str) -> sqlite3.Row:
    wallet = wallet_address.lower()
    existing = conn.execute(
        "SELECT * FROM users WHERE wallet_address = ?",
        (wallet,),
    ).fetchone()
    if existing:
        return existing

    display = f"User {wallet[2:8].upper()}" if wallet.startswith("0x") else wallet
    conn.execute(
        """
        INSERT INTO users (
            wallet_address, display_name, total_score, avg_rating, return_count, sbt_token_id, created_at
        ) VALUES (?, ?, 0, 0, 0, ?, ?)
        """,
        (wallet, display, f"BADGE-{wallet[2:8].upper()}", now_iso()),
    )
    conn.commit()
    return conn.execute(
        "SELECT * FROM users WHERE wallet_address = ?",
        (wallet,),
    ).fetchone()


def make_token(wallet_address: str) -> str:
    payload = {"wallet_address": wallet_address.lower(), "nonce": secrets.token_hex(8)}
    return base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()


def wallet_from_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")

    token = authorization.split(" ", 1)[1]
    try:
        decoded = base64.urlsafe_b64decode(token.encode()).decode()
        payload = json.loads(decoded)
        wallet = payload["wallet_address"]
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=401, detail="Invalid token") from exc

    if not wallet:
        raise HTTPException(status_code=401, detail="Invalid token")
    return wallet.lower()


def row_to_item(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "token_id": row["token_id"],
        "wallet_address": row["wallet_address"],
        "name": row["name"],
        "category": row["category"],
        "description": row["description"],
        "serial_number": row["serial_number"],
        "status": row["status"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "reward_amount": row["reward_amount"] or 0,
        "ipfs_hash": row["ipfs_hash"],
        "ipfs_url": row["ipfs_url"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "expires_at": row["expires_at"],
    }


def add_tx(conn: sqlite3.Connection, tx_type: str, description: str) -> None:
    tx_hash = "0x" + hashlib.sha256(f"{tx_type}:{description}:{now_iso()}".encode()).hexdigest()[:40]
    conn.execute(
        "INSERT INTO txlog (tx_type, description, tx_hash, created_at) VALUES (?, ?, ?, ?)",
        (tx_type, description, tx_hash, now_iso()),
    )


def init_db() -> None:
    conn = db_conn()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            wallet_address TEXT PRIMARY KEY,
            display_name TEXT,
            total_score INTEGER NOT NULL DEFAULT 0,
            avg_rating REAL NOT NULL DEFAULT 0,
            return_count INTEGER NOT NULL DEFAULT 0,
            sbt_token_id TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS items (
            token_id TEXT PRIMARY KEY,
            wallet_address TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            serial_number TEXT,
            status TEXT NOT NULL DEFAULT 'registered',
            latitude REAL,
            longitude REAL,
            reward_amount REAL NOT NULL DEFAULT 0,
            ipfs_hash TEXT,
            ipfs_url TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            expires_at TEXT
        );

        CREATE TABLE IF NOT EXISTS lost_reports (
            id TEXT PRIMARY KEY,
            token_id TEXT NOT NULL,
            location TEXT NOT NULL,
            details TEXT,
            reward_amount REAL NOT NULL DEFAULT 0,
            lost_at TEXT,
            created_at TEXT NOT NULL,
            active INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS found_reports (
            id TEXT PRIMARY KEY,
            finder_wallet TEXT,
            location TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            matched_token TEXT,
            image TEXT,
            ai_match_score INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            resolved INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS chats (
            id TEXT PRIMARY KEY,
            case_id TEXT NOT NULL,
            role TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS police_logs (
            id TEXT PRIMARY KEY,
            station_id TEXT NOT NULL,
            station_name TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            location TEXT NOT NULL,
            case_number TEXT NOT NULL,
            image TEXT,
            ipfs_hash TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS txlog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tx_type TEXT NOT NULL,
            description TEXT NOT NULL,
            tx_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """
    )
    conn.commit()
    conn.close()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


init_db()


app = FastAPI(title="ChainFind API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5178",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5178",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AuthData(BaseModel):
    wallet_address: str
    message: str | None = None
    signature: str | None = None


class ItemCreate(BaseModel):
    name: str
    category: str
    description: str
    token_id: str
    serial_number: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    ipfs_hash: str | None = None
    ipfs_url: str | None = None


class LostReportCreate(BaseModel):
    token_id: str
    location: str
    details: str | None = None
    reward_amount: float = 0
    lost_at: str | None = None


class FoundReportCreate(BaseModel):
    location: str
    description: str
    category: str
    matched_token: str | None = None
    image: str | None = None


class MatchRequest(BaseModel):
    description: str
    location: str | None = None
    category: str | None = None


class ChatMessageCreate(BaseModel):
    case_id: str
    message: str


class ConfirmReturnRequest(BaseModel):
    token_id: str


class PoliceLogCreate(BaseModel):
    station_id: str
    station_name: str
    description: str
    category: str
    location: str
    case_number: str
    image: str | None = None


def score_match(input_text: str, item: sqlite3.Row, location: str | None, category: str | None) -> tuple[int, list[str]]:
    haystack = f"{item['name']} {item['description']} {item['category']}".lower()
    tokens = {token for token in input_text.lower().split() if len(token) > 2}
    hits = [token for token in tokens if token in haystack]
    score = min(95, len(hits) * 18)
    reasons = []

    if hits:
        reasons.append(f"Shared keywords: {', '.join(hits[:4])}")
    if category and category.lower() == item["category"].lower():
        score += 20
        reasons.append("Category match")
    if location:
        reasons.append(f"Compared against reports near {location}")
        score += 5

    score = max(25 if item["status"] == "lost" else 0, min(score, 99))
    if not reasons:
        reasons.append("Description similarity")
    return score, reasons


@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/auth/login")
def login(auth_data: AuthData):
    conn = db_conn()
    user = ensure_user(conn, auth_data.wallet_address)
    token = make_token(user["wallet_address"])
    conn.close()
    return {"access_token": token}


@app.post("/api/auth/dev-login")
def dev_login(data: AuthData | dict[str, Any]):
    wallet_address = data.wallet_address if isinstance(data, AuthData) else data.get("wallet_address")
    if not wallet_address:
        raise HTTPException(status_code=400, detail="wallet_address is required")
    conn = db_conn()
    user = ensure_user(conn, wallet_address)
    token = make_token(user["wallet_address"])
    conn.close()
    return {"access_token": token}


@app.post("/api/items/register")
def register_item(item: ItemCreate, authorization: str | None = Header(default=None)):
    wallet = wallet_from_token(authorization)
    conn = db_conn()
    ensure_user(conn, wallet)

    existing = conn.execute("SELECT token_id FROM items WHERE token_id = ?", (item.token_id,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Token ID already exists")

    created_at = now_iso()
    conn.execute(
        """
        INSERT INTO items (
            token_id, wallet_address, name, category, description, serial_number, status,
            latitude, longitude, reward_amount, ipfs_hash, ipfs_url, created_at, updated_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'registered', ?, ?, 0, ?, ?, ?, ?, NULL)
        """,
        (
            item.token_id,
            wallet,
            item.name.strip(),
            item.category,
            item.description.strip(),
            item.serial_number,
            item.latitude,
            item.longitude,
            item.ipfs_hash,
            item.ipfs_url,
            created_at,
            created_at,
        ),
    )
    add_tx(conn, "mint", f"Registered item {item.token_id} ({item.name.strip()})")
    conn.commit()
    row = conn.execute("SELECT * FROM items WHERE token_id = ?", (item.token_id,)).fetchone()
    conn.close()
    return {"status": "success", "item": row_to_item(row)}


@app.get("/api/items/my")
def my_items(authorization: str | None = Header(default=None)):
    wallet = wallet_from_token(authorization)
    conn = db_conn()
    rows = conn.execute(
        "SELECT * FROM items WHERE wallet_address = ? ORDER BY datetime(created_at) DESC",
        (wallet,),
    ).fetchall()
    conn.close()
    return [row_to_item(row) for row in rows]


@app.get("/api/items")
def list_items(status: str | None = None):
    conn = db_conn()
    query = "SELECT * FROM items"
    params: tuple[Any, ...] = ()
    if status:
        query += " WHERE status = ?"
        params = (status,)
    query += " ORDER BY datetime(created_at) DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [row_to_item(row) for row in rows]


@app.get("/api/items/stats")
def item_stats():
    conn = db_conn()
    total_registered = conn.execute("SELECT COUNT(*) FROM items").fetchone()[0]
    active_lost = conn.execute("SELECT COUNT(*) FROM items WHERE status = 'lost'").fetchone()[0]
    returned = conn.execute("SELECT COUNT(*) FROM items WHERE status = 'returned'").fetchone()[0]
    rewards_paid = conn.execute("SELECT COALESCE(SUM(reward_amount), 0) FROM items WHERE status = 'returned'").fetchone()[0]
    conn.close()
    return {
        "total_registered": total_registered,
        "active_lost": active_lost,
        "returned": returned,
        "total_rewards_paid": rewards_paid,
    }


@app.post("/api/lost/report")
def create_lost_report(data: LostReportCreate, authorization: str | None = Header(default=None)):
    wallet = wallet_from_token(authorization)
    conn = db_conn()
    item = conn.execute("SELECT * FROM items WHERE token_id = ? AND wallet_address = ?", (data.token_id, wallet)).fetchone()
    if not item:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found for this wallet")

    if item["status"] == "lost":
        conn.close()
        raise HTTPException(status_code=400, detail="Item is already marked as lost")

    report_id = f"LOST-{uuid4().hex[:10].upper()}"
    expires_at = (datetime.now(UTC) + timedelta(days=90)).isoformat()
    conn.execute(
        """
        INSERT INTO lost_reports (id, token_id, location, details, reward_amount, lost_at, created_at, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        """,
        (
            report_id,
            data.token_id,
            data.location.strip(),
            data.details,
            data.reward_amount or 0,
            data.lost_at or now_iso(),
            now_iso(),
        ),
    )
    conn.execute(
        """
        UPDATE items
        SET status = 'lost', reward_amount = ?, expires_at = ?, updated_at = ?
        WHERE token_id = ?
        """,
        (data.reward_amount or 0, expires_at, now_iso(), data.token_id),
    )
    add_tx(conn, "lost", f"Lost report created for {data.token_id} at {data.location.strip()}")
    conn.commit()
    conn.close()
    return {"status": "success", "report_id": report_id}


@app.get("/api/lost/active")
def active_lost_reports():
    conn = db_conn()
    rows = conn.execute(
        """
        SELECT i.*, lr.location, lr.details, lr.reward_amount AS report_reward, lr.lost_at, lr.created_at AS report_created_at
        FROM lost_reports lr
        JOIN items i ON i.token_id = lr.token_id
        WHERE lr.active = 1
        ORDER BY datetime(lr.created_at) DESC
        """
    ).fetchall()
    conn.close()
    return [
        {
            "item": row_to_item(row),
            "report": {
                "location": row["location"],
                "details": row["details"],
                "reward_amount": row["report_reward"],
                "lost_at": row["lost_at"],
                "created_at": row["report_created_at"],
            },
        }
        for row in rows
    ]


@app.post("/api/found/report")
def create_found_report(data: FoundReportCreate, authorization: str | None = Header(default=None)):
    wallet = None
    if authorization:
        try:
            wallet = wallet_from_token(authorization)
        except HTTPException:
            wallet = None

    conn = db_conn()
    report_id = f"FOUND-{uuid4().hex[:10].upper()}"
    score = 0
    if data.matched_token:
        matched_item = conn.execute("SELECT * FROM items WHERE token_id = ?", (data.matched_token,)).fetchone()
        if matched_item:
            match_score, _ = score_match(data.description, matched_item, data.location, data.category)
            score = match_score
            conn.execute(
                "UPDATE items SET status = 'found', updated_at = ? WHERE token_id = ?",
                (now_iso(), data.matched_token),
            )
            existing_chat = conn.execute("SELECT id FROM chats WHERE case_id = ?", (data.matched_token,)).fetchone()
            if not existing_chat:
                conn.execute(
                    "INSERT INTO chats (id, case_id, role, message, timestamp) VALUES (?, ?, 'finder', ?, ?)",
                    (
                        str(uuid4()),
                        data.matched_token,
                        "A finder reported a possible match. You can chat here to coordinate the return.",
                        now_iso(),
                    ),
                )

    conn.execute(
        """
        INSERT INTO found_reports (
            id, finder_wallet, location, description, category, matched_token, image, ai_match_score, created_at, resolved
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        """,
        (
            report_id,
            wallet,
            data.location.strip(),
            data.description.strip(),
            data.category,
            data.matched_token or None,
            data.image,
            score,
            now_iso(),
        ),
    )
    add_tx(conn, "found", f"Found report created at {data.location.strip()}")
    conn.commit()
    conn.close()
    return {"status": "success", "id": report_id}


@app.get("/api/found")
def found_reports():
    conn = db_conn()
    rows = conn.execute(
        "SELECT * FROM found_reports ORDER BY datetime(created_at) DESC"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.post("/api/found/confirm-return")
def confirm_return(data: ConfirmReturnRequest, authorization: str | None = Header(default=None)):
    wallet = wallet_from_token(authorization)
    conn = db_conn()
    item = conn.execute("SELECT * FROM items WHERE token_id = ? AND wallet_address = ?", (data.token_id, wallet)).fetchone()
    if not item:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found for this wallet")

    report = conn.execute(
        """
        SELECT * FROM found_reports
        WHERE matched_token = ? AND resolved = 0
        ORDER BY ai_match_score DESC, datetime(created_at) DESC
        LIMIT 1
        """,
        (data.token_id,),
    ).fetchone()
    if not report:
        conn.close()
        raise HTTPException(status_code=400, detail="No active found report exists for this item")

    conn.execute(
        "UPDATE items SET status = 'returned', updated_at = ? WHERE token_id = ?",
        (now_iso(), data.token_id),
    )
    conn.execute(
        "UPDATE found_reports SET resolved = 1 WHERE id = ?",
        (report["id"],),
    )
    conn.execute(
        "UPDATE lost_reports SET active = 0 WHERE token_id = ?",
        (data.token_id,),
    )

    if report["finder_wallet"]:
        finder = ensure_user(conn, report["finder_wallet"])
        new_returns = finder["return_count"] + 1
        new_score = finder["total_score"] + 50
        current_avg = finder["avg_rating"] or 0
        new_avg = round(((current_avg * finder["return_count"]) + 5) / new_returns, 1)
        conn.execute(
            """
            UPDATE users
            SET total_score = ?, return_count = ?, avg_rating = ?
            WHERE wallet_address = ?
            """,
            (new_score, new_returns, new_avg, report["finder_wallet"]),
        )

    conn.execute(
        "INSERT INTO chats (id, case_id, role, message, timestamp) VALUES (?, ?, 'owner', ?, ?)",
        (
            str(uuid4()),
            data.token_id,
            "Return confirmed. Reward released and case closed.",
            now_iso(),
        ),
    )
    add_tx(conn, "reward", f"Reward released for {data.token_id}")
    conn.commit()
    conn.close()
    return {"status": "success"}


@app.post("/api/ai/match")
def ai_match(data: MatchRequest):
    conn = db_conn()
    rows = conn.execute(
        "SELECT * FROM items WHERE status = 'lost' ORDER BY datetime(updated_at) DESC"
    ).fetchall()
    matches = []
    for row in rows:
        score, reasons = score_match(data.description, row, data.location, data.category)
        if score >= 25:
            match = row_to_item(row)
            match["score"] = score
            match["reasons"] = reasons
            matches.append(match)

    matches.sort(key=lambda match: match["score"], reverse=True)
    conn.close()
    return {"matches": matches[:5], "total_checked": len(rows)}


@app.get("/api/ai/map-markers")
def map_markers():
    conn = db_conn()
    rows = conn.execute(
        """
        SELECT * FROM items
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        ORDER BY datetime(updated_at) DESC
        """
    ).fetchall()
    conn.close()
    return [row_to_item(row) for row in rows]


@app.get("/api/chat/{case_id}")
def get_chat(case_id: str):
    conn = db_conn()
    rows = conn.execute(
        "SELECT * FROM chats WHERE case_id = ? ORDER BY datetime(timestamp) ASC",
        (case_id,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.post("/api/chat/send")
def send_chat_message(data: ChatMessageCreate, authorization: str | None = Header(default=None)):
    wallet = None
    if authorization:
        try:
            wallet = wallet_from_token(authorization)
        except HTTPException:
            wallet = None

    conn = db_conn()
    item = conn.execute("SELECT * FROM items WHERE token_id = ?", (data.case_id,)).fetchone()
    if not item:
        conn.close()
        raise HTTPException(status_code=404, detail="Case not found")

    role = "owner" if wallet and wallet == item["wallet_address"] else "finder"
    message_id = str(uuid4())
    conn.execute(
        "INSERT INTO chats (id, case_id, role, message, timestamp) VALUES (?, ?, ?, ?, ?)",
        (message_id, data.case_id, role, data.message.strip(), now_iso()),
    )
    conn.commit()
    conn.close()
    return {"status": "success", "id": message_id}


@app.get("/api/reputation/leaderboard")
def reputation_leaderboard():
    conn = db_conn()
    rows = conn.execute(
        """
        SELECT * FROM users
        ORDER BY total_score DESC, return_count DESC, datetime(created_at) ASC
        LIMIT 20
        """
    ).fetchall()
    conn.close()
    return [serialize_user(row) for row in rows]


@app.get("/api/reputation/me")
def reputation_me(authorization: str | None = Header(default=None)):
    wallet = wallet_from_token(authorization)
    conn = db_conn()
    row = ensure_user(conn, wallet)
    conn.commit()
    conn.close()
    return serialize_user(row)


@app.get("/api/police/log")
def police_logs():
    conn = db_conn()
    rows = conn.execute(
        "SELECT * FROM police_logs ORDER BY datetime(created_at) DESC"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.post("/api/police/log")
def create_police_log(data: PoliceLogCreate):
    conn = db_conn()
    log_id = f"POL-{uuid4().hex[:10].upper()}"
    image_hash = hashlib.sha256((data.image or data.description).encode()).hexdigest()[:32]
    conn.execute(
        """
        INSERT INTO police_logs (
            id, station_id, station_name, description, category, location, case_number, image, ipfs_hash, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            log_id,
            data.station_id,
            data.station_name,
            data.description.strip(),
            data.category,
            data.location.strip(),
            data.case_number.strip(),
            data.image,
            f"Qm{image_hash}",
            now_iso(),
        ),
    )
    add_tx(conn, "police_log", f"Police log created for case {data.case_number.strip()}")
    conn.commit()
    conn.close()
    return {"status": "success", "id": log_id}


@app.get("/api/txlog")
def tx_log():
    conn = db_conn()
    rows = conn.execute(
        "SELECT * FROM txlog ORDER BY datetime(created_at) DESC"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.post("/ipfs/upload")
async def ipfs_upload(file: UploadFile = File(...)):
    content = await file.read()
    ext = (file.filename or "jpg").split(".")[-1].lower()
    mime = file.content_type or f"image/{ext}"
    b64 = base64.b64encode(content).decode()
    fake_hash = "Qm" + hashlib.sha1(content).hexdigest()[:32]
    return {
        "hash": fake_hash,
        "url": f"data:{mime};base64,{b64}",
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
