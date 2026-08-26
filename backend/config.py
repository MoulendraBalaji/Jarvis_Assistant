import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

OLLAMA_URL = os.getenv("JARVIS_OLLAMA_URL", "http://127.0.0.1:11434")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
DB_PATH = Path(__file__).parent.parent / "jarvis.json"
SERVER_HOST = "127.0.0.1"
SERVER_PORT = 8766
