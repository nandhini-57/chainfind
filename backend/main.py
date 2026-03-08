from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config import get_settings
from database import init_db
from routers import items, lost, found, ai_match, chat, reputation, police, auth, txlog

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="ChainFind API",
    description="Decentralised Lost & Found Registry — BC-03 Hackathon",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(items.router)
app.include_router(lost.router)
app.include_router(found.router)
app.include_router(ai_match.router)
app.include_router(chat.router)
app.include_router(reputation.router)
app.include_router(police.router)
app.include_router(txlog.router)

@app.get("/")
async def root():
    return {"message": "ChainFind API", "version": "1.0.0", "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ChainFind API"}
