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

# --- Enhanced Intent Classification ---
def classify_intent(text):
    """
    Enhanced intent classification with 12 categories
    Returns one of: greeting, pricing_inquiry, support_request, sales_lead, 
    complaint, spam, question, appointment, feedback, partnership, 
    general_inquiry, other
    """
    text = text.lower().strip()
    
    # Greeting patterns
    greeting_words = ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening", "sup", "yo"]
    if any(word in text for word in greeting_words):
        return "greeting"
    
    # Pricing inquiry patterns
    pricing_words = ["price", "cost", "how much", "rate", "pricing", "fee", "charge", "budget", "afford", "expensive", "cheap"]
    if any(word in text for word in pricing_words):
        return "pricing_inquiry"
    
    # Support request patterns
    support_words = ["help", "support", "issue", "problem", "trouble", "broken", "not working", "error", "fix", "resolve"]
    if any(word in text for word in support_words):
        return "support_request"
    
    # Sales lead patterns
    sales_words = ["buy", "interested", "purchase", "order", "sign up", "subscribe", "get started", "book", "reserve", "want to buy"]
    if any(word in text for word in sales_words):
        return "sales_lead"
    
    # Complaint patterns
    complaint_words = ["bad", "complaint", "angry", "disappointed", "upset", "frustrated", "terrible", "awful", "hate", "worst", "unhappy"]
    if any(word in text for word in complaint_words):
        return "complaint"
    
    # Spam patterns
    spam_words = ["spam", "unsubscribe", "stop", "remove", "delete", "block", "report"]
    if any(word in text for word in spam_words):
        return "spam"
    
    # Appointment/booking patterns
    appointment_words = ["appointment", "schedule", "book", "reserve", "meeting", "call", "consultation", "session"]
    if any(word in text for word in appointment_words):
        return "appointment"
    
    # Feedback patterns
    feedback_words = ["feedback", "review", "rating", "opinion", "thoughts", "suggestions", "improve", "better"]
    if any(word in text for word in feedback_words):
        return "feedback"
    
    # Partnership/collaboration patterns
    partnership_words = ["partnership", "collaborate", "work together", "joint", "team up", "business", "opportunity", "deal"]
    if any(word in text for word in partnership_words):
        return "partnership"
    
    # General inquiry patterns (questions that don't fit other categories)
    if text.endswith("?") or any(word in text for word in ["what", "when", "where", "why", "how", "who", "which"]):
        return "general_inquiry"
    
    # Default fallback
    return "other"

def get_intent_categories():
    """
    Get all available intent categories with descriptions
    """
    return {
        "greeting": {
            "name": "Greeting",
            "description": "Initial contact, hellos, introductions",
            "keywords": ["hello", "hi", "hey", "greetings", "good morning"]
        },
        "pricing_inquiry": {
            "name": "Pricing Inquiry", 
            "description": "Questions about costs, rates, pricing",
            "keywords": ["price", "cost", "how much", "rate", "pricing"]
        },
        "support_request": {
            "name": "Support Request",
            "description": "Help requests, technical issues, problems",
            "keywords": ["help", "support", "issue", "problem", "trouble"]
        },
        "sales_lead": {
            "name": "Sales Lead",
            "description": "Purchase interest, buying intent, orders",
            "keywords": ["buy", "interested", "purchase", "order", "sign up"]
        },
        "complaint": {
            "name": "Complaint",
            "description": "Negative feedback, complaints, dissatisfaction",
            "keywords": ["bad", "complaint", "angry", "disappointed", "upset"]
        },
        "spam": {
            "name": "Spam",
            "description": "Unwanted messages, unsubscribe requests",
            "keywords": ["spam", "unsubscribe", "stop", "remove", "block"]
        },
        "appointment": {
            "name": "Appointment",
            "description": "Scheduling requests, bookings, meetings",
            "keywords": ["appointment", "schedule", "book", "meeting", "call"]
        },
        "feedback": {
            "name": "Feedback",
            "description": "Reviews, ratings, suggestions, opinions",
            "keywords": ["feedback", "review", "rating", "opinion", "thoughts"]
        },
        "partnership": {
            "name": "Partnership",
            "description": "Business opportunities, collaborations, deals",
            "keywords": ["partnership", "collaborate", "work together", "business"]
        },
        "general_inquiry": {
            "name": "General Inquiry",
            "description": "General questions, information requests",
            "keywords": ["what", "when", "where", "why", "how", "who"]
        },
        "other": {
            "name": "Other",
            "description": "Miscellaneous messages, unclear intent",
            "keywords": ["fallback", "miscellaneous", "unclear"]
        }
    }