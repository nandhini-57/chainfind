from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from database import get_db
from models.item import Item, LostReport
from services.groq_service import match_found_to_lost

router = APIRouter(prefix="/api/ai", tags=["AI Matching"])

class MatchRequest(BaseModel):
    description: str
    location: str
    category: str = ""

@router.post("/match")
async def ai_match(req: MatchRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Item, LostReport).join(LostReport, Item.token_id == LostReport.token_id)
        .where(Item.status == "lost").where(LostReport.active == True)
    )
    rows = result.all()
    lost_items = [{
        "token_id": r[0].token_id, "name": r[0].name, "category": r[0].category,
        "description": r[0].description, "location": r[1].location,
        "reward_amount": float(r[0].reward_amount or 0),
        "latitude": float(r[0].latitude) if r[0].latitude else None,
        "longitude": float(r[0].longitude) if r[0].longitude else None,
    } for r in rows]

    if not lost_items:
        return {"matches": [], "message": "No active lost reports to match against"}

    matches = await match_found_to_lost(req.description, req.location, lost_items)

    # Enrich with item details
    enriched = []
    for m in matches:
        item_data = next((i for i in lost_items if i["token_id"] == m.get("token_id")), {})
        enriched.append({**m, **{k: item_data.get(k) for k in ["name","category","description","reward_amount","latitude","longitude"]}})
    return {"matches": enriched, "total_checked": len(lost_items)}

@router.get("/map-markers")
async def get_map_markers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item).where(Item.latitude != None))
    items = result.scalars().all()
    return [{"token_id": i.token_id, "name": i.name, "category": i.category, "status": i.status,
             "reward_amount": float(i.reward_amount or 0), "latitude": float(i.latitude), "longitude": float(i.longitude)} for i in items]
