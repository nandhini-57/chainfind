import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = "sqlite+aiosqlite:///./chainfind.db"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PINATA_JWT = os.getenv("PINATA_JWT")

