import json
import os
from filelock import FileLock
from pathlib import Path
import requests
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

DATA_DIR = Path(__file__).parent.parent / "data"
LOG_FILE = DATA_DIR / "logs.json"

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-r1-0528:free")
USE_OPENROUTER = os.getenv("USE_OPENROUTER", "1") == "1"

# --- JSON helpers ---
def _read_json(path):
    with FileLock(str(path) + ".lock"):
        if not path.exists():
            return []
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

def _write_json(path, data):
    with FileLock(str(path) + ".lock"):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

# --- Log helpers ---
def get_logs():
    return _read_json(LOG_FILE)

def add_log_entry(entry):
    log = _read_json(LOG_FILE)
    log.append(entry)
    _write_json(LOG_FILE, log)
    return entry

# --- LLM (DeepSeek R1 via OpenRouter) ---
def openrouter_chat_completion(messages, model=None, temperature=0.7, max_tokens=512, timeout=60):
    if not USE_OPENROUTER:
        return None
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY not set in environment.")
    model = model or OPENROUTER_MODEL
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://threadmind.local",
        "X-Title": "ThreadMind DM Assistant"
    }
    data = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    try:
        response = requests.post(OPENROUTER_URL, headers=headers, json=data, timeout=timeout)
        if response.status_code == 429:
            return "[Rate limited: Please try again later.]"
        response.raise_for_status()
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        return content.strip() if content else "[No response from OpenRouter]"
    except requests.exceptions.Timeout:
        return "[OpenRouter API timeout]"
    except Exception as e:
        return f"[OpenRouter API error: {e}]"

# --- Intent classification (rule-based fallback) ---
def classify_intent(text):
    text = text.lower()
    if any(word in text for word in ["hello", "hi", "hey", "greetings"]):
        return "greeting"
    if any(word in text for word in ["price", "cost", "how much", "rate"]):
        return "pricing_inquiry"
    if any(word in text for word in ["help", "support", "issue", "problem"]):
        return "support_request"
    if any(word in text for word in ["buy", "interested", "purchase", "order"]):
        return "sales_lead"
    if any(word in text for word in ["bad", "complaint", "angry", "disappointed"]):
        return "complaint"
    if any(word in text for word in ["spam", "unsubscribe"]):
        return "spam"
    if text.endswith("?"):
        return "question"
    return "other"