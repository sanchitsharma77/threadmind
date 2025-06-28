from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from utils.mcp_client import (
    get_logs, add_log_entry,
    openrouter_chat_completion, classify_intent, get_intent_categories
)
from datetime import datetime
import re
import subprocess
import sys
import json

router = APIRouter()

class MessageModel(BaseModel):
    id: str
    thread_id: str
    from_user: str
    text: str
    timestamp: Optional[str] = None

class ProcessedMessageModel(BaseModel):
    id: str
    thread_id: str
    from_user: str
    text: str
    timestamp: Optional[str] = None
    intent: str
    suggestion: str
    used_template: bool

PROMPT_FILE = 'data/prompt.txt'

@router.get("/ping")
def ping():
    return {"status": "ok"}

@router.get("/logs")
def logs():
    return get_logs()

@router.get("/stats")
def stats():
    """Calculate statistics from logs"""
    logs_data = get_logs()
    
    if not logs_data:
        return {
            "totalMessages": 0,
            "averageResponseTime": 0,
            "messagesByIntent": {}
        }
    
    # Count messages by intent
    intent_counts = {}
    for log in logs_data:
        intent = log.get("intent", "unknown")
        intent_counts[intent] = intent_counts.get(intent, 0) + 1
    
    # Calculate average response time (placeholder - would need actual timing data)
    avg_response_time = 5  # Default 5 minutes
    
    return {
        "totalMessages": len(logs_data),
        "averageResponseTime": avg_response_time,
        "messagesByIntent": intent_counts
    }

@router.get("/intents")
def intents():
    """Get all available intent categories with descriptions"""
    return get_intent_categories()

@router.get('/prompt')
def get_prompt():
    try:
        with open(PROMPT_FILE, 'r', encoding='utf-8') as f:
            return {'prompt': f.read()}
    except FileNotFoundError:
        return {'prompt': ''}

@router.post('/prompt')
def set_prompt(data: dict):
    prompt = data.get('prompt', '')
    with open(PROMPT_FILE, 'w', encoding='utf-8') as f:
        f.write(prompt)
    return {'success': True, 'prompt': prompt}

@router.post("/process_messages", response_model=List[ProcessedMessageModel])
def process_messages(messages: List[MessageModel]):
    processed = []
    for msg in messages:
        # Load custom prompt if present
        try:
            with open(PROMPT_FILE, 'r', encoding='utf-8') as f:
                custom_prompt = f.read().strip()
            if custom_prompt:
                system_prompt = custom_prompt
        except Exception:
            pass
        # 1. Classify intent using enhanced classification
        intent = classify_intent(msg.text)
        # 2. Try LLM suggestion
        suggestion = None
        used_template = False
        try:
            system_prompt = (
                "You are an Instagram DM assistant. Analyze the following message and respond appropriately.\n"
                "INSTRUCTIONS:\n"
                "1. Classify the intent of the message into one of these categories:\n"
                "   - greeting: Initial contact, hellos, introductions\n"
                "   - pricing_inquiry: Questions about costs, rates, pricing\n"
                "   - support_request: Help requests, technical issues, problems\n"
                "   - sales_lead: Purchase interest, buying intent, orders\n"
                "   - complaint: Negative feedback, complaints, dissatisfaction\n"
                "   - spam: Unwanted messages, unsubscribe requests\n"
                "   - appointment: Scheduling requests, bookings, meetings\n"
                "   - feedback: Reviews, ratings, suggestions, opinions\n"
                "   - partnership: Business opportunities, collaborations, deals\n"
                "   - general_inquiry: General questions, information requests\n"
                "   - other: Miscellaneous messages, unclear intent\n"
                "2. Provide a helpful, friendly, and professional response in context\n"
                "3. Keep responses concise but warm\n"
                "4. If it's a pricing question, mention starting at $99/month\n"
                "5. If it's a greeting, be welcoming and ask how you can help\n"
                "6. If it's a support request, be empathetic and offer assistance\n"
                "7. If it's a sales lead, be enthusiastic and provide next steps\n"
                "8. If it's a complaint, be apologetic and offer solutions\n"
                "9. If it's an appointment request, offer scheduling options\n"
                "10. If it's feedback, thank them and ask for more details\n"
                "11. If it's a partnership inquiry, show interest and ask for details\n"
                "RESPONSE FORMAT:\nIntent: [classified_intent]\nReply: [your_response]"
            )
            messages_llm = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": msg.text}
            ]
            llm_response = openrouter_chat_completion(messages_llm)
            if not isinstance(llm_response, str):
                llm_response = str(llm_response) if llm_response is not None else ""
            # Try to parse LLM response
            if llm_response:
                # Strategy 1: Look for "Reply:" format
                reply_match = re.search(r'Reply:\s*(.+)', llm_response, re.IGNORECASE | re.DOTALL)
                if reply_match:
                    suggestion = reply_match.group(1).strip()
                else:
                    # Strategy 2: Look for text after "Intent:" line
                    lines = llm_response.strip().split('\n')
                    reply_lines = []
                    found_intent = False
                    for line in lines:
                        if line.lower().startswith('intent:'):
                            found_intent = True
                        elif found_intent and line.strip():
                            reply_lines.append(line)
                    suggestion = ' '.join(reply_lines).strip() if reply_lines else llm_response.strip()
            else:
                suggestion = ""
        except Exception:
            suggestion = None
        # 3. Fallback to simple response if LLM fails
        if not suggestion or suggestion.startswith("["):
            suggestion = "Thank you for your message! I'm here to help. How can I assist you today?"
            used_template = True
        # 4. Log
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "id": msg.id,
            "thread_id": msg.thread_id,
            "username": msg.from_user,
            "original_message": msg.text,
            "intent": intent,
            "suggestion": suggestion,
            "used_template": used_template,
            "outcome": "responded",  # Default outcome
        }
        add_log_entry(log_entry)
        processed.append(ProcessedMessageModel(
            id=msg.id,
            thread_id=msg.thread_id,
            from_user=msg.from_user,
            text=msg.text,
            timestamp=msg.timestamp,
            intent=intent,
            suggestion=suggestion,
            used_template=used_template
        ))
    return processed

@router.get("/thread/{thread_id}/messages")
def get_thread_messages(thread_id: str):
    """
    Fetch all messages for a given thread_id using MCP tool.
    """
    try:
        cmd = [sys.executable, "src/mcp_server.py", "--tool", "list_messages", "--thread_id", thread_id]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            return {"success": False, "error": result.stderr}
        data = json.loads(result.stdout)
        return data
    except Exception as e:
        return {"success": False, "error": str(e)}