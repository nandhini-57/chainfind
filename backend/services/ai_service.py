import json, re
from groq import Groq
from config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

def run_ai_match(query_description: str, query_location: str, lost_items: list) -> list:
    if not lost_items:
        return []
    items_text = "\n".join([f"[{i['id']}] Name: {i['name']} | Category: {i['category']} | Description: {i['description'][:100]} | Reward: ₹{i.get('reward',0)}" for i in lost_items])
    prompt = f"""You are an expert item matching system for a lost and found registry.
Found item description: "{query_description}"
Found at: "{query_location}"
Active lost reports:
{items_text}
Return TOP 3 matches. Respond ONLY in this JSON format, no other text:
{{"matches": [{{"item_id": "NFT-001","score": 87,"matching_attributes": ["black","wallet","leather"],"confidence": "High","reasoning": "Brief explanation"}}]}}"""
    try:
        response = client.chat.completions.create(model=settings.GROQ_MODEL,
            messages=[{"role":"user","content":prompt}], temperature=0.1, max_tokens=600)
        raw = response.choices[0].message.content.strip()
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m:
            return json.loads(m.group()).get("matches", [])
    except Exception as e:
        print(f"Groq error: {e}")
    return _fallback_match(query_description, query_location, lost_items)

def _fallback_match(query, location, items):
    words = set(query.lower().split())
    results = []
    for item in items:
        text = f"{item['name']} {item['description']} {item['category']}".lower()
        overlap = len(words & set(text.split()))
        score = min(int((overlap/max(len(words),1))*100), 95)
        if score > 10:
            results.append({"item_id":item["id"],"score":score,
                "matching_attributes":list(words & set(text.split()))[:3],
                "confidence":"High" if score>70 else "Medium" if score>40 else "Low",
                "reasoning":f"Matched {overlap} keywords"})
    return sorted(results, key=lambda x:x["score"], reverse=True)[:3]

def generate_counter_message(description, verdict):
    try:
        r = client.chat.completions.create(model=settings.GROQ_MODEL,
            messages=[{"role":"user","content":f"Write a short WhatsApp message (3 lines max) to tell a lost item owner their {description} was found. Warm and professional."}],
            temperature=0.7, max_tokens=100)
        return r.choices[0].message.content.strip()
    except:
        return f"Hi! I found your {description} and would like to return it. Please contact me through ChainFind."
