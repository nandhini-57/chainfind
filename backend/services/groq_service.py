from groq import AsyncGroq
from config import get_settings
import json, re

settings = get_settings()
client = AsyncGroq(api_key=settings.groq_api_key)

MATCH_SYSTEM = """You are an AI item-matching engine for a lost and found registry.
Given a description of a found item and a list of lost item reports, return a JSON array
of matches ranked by similarity. Each match must have:
- token_id: string
- score: integer 0-100
- reasons: list of 2-3 specific matching attributes
- confidence: "high" | "medium" | "low"

Return ONLY valid JSON, no explanation text."""

async def match_found_to_lost(found_description: str, found_location: str, lost_items: list[dict]) -> list[dict]:
    if not lost_items:
        return []
    items_str = json.dumps([{
        "token_id": i["token_id"],
        "name": i["name"],
        "category": i["category"],
        "description": i["description"],
        "location": i.get("location", ""),
    } for i in lost_items], indent=2)

    prompt = f"""Found item description: "{found_description}"
Found at location: "{found_location}"

Active lost reports:
{items_str}

Return top 3 matches as JSON array."""

    response = await client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[
            {"role": "system", "content": MATCH_SYSTEM},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1,
        max_tokens=800,
    )
    raw = response.choices[0].message.content.strip()
    # Extract JSON from response
    match = re.search(r'\[.*\]', raw, re.DOTALL)
    if match:
        return json.loads(match.group())
    return []

async def generate_similarity_explanation(item1: dict, item2: dict) -> str:
    prompt = f"""Compare these two items and explain in 1-2 sentences why they might be the same item:
Item A (found): {item1.get('description','')}
Item B (lost): {item2.get('description','')}
Be specific about matching attributes."""

    response = await client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=150,
    )
    return response.choices[0].message.content.strip()
