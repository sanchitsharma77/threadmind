from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from utils.mcp_client import (
    get_logs, add_log_entry,
    openrouter_chat_completion, classify_intent
)
from datetime import datetime

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

@router.post("/process_messages", response_model=List[ProcessedMessageModel])
def process_messages(messages: List[MessageModel]):
    processed = []
    for msg in messages:
        # 1. Classify intent
        intent = classify_intent(msg.text)
        # 2. Try LLM suggestion
        suggestion = None
        used_template = False
        try:
            system_prompt = (
                "You are an Instagram DM assistant. Analyze the following message and respond appropriately.\n"
                "INSTRUCTIONS:\n"
                "1. Classify the intent of the message: [greeting, question, pricing_inquiry, support_request, sales_lead, complaint, spam, other]\n"
                "2. Provide a helpful, friendly, and professional response in context\n"
                "3. Keep responses concise but warm\n"
                "4. If it's a pricing question, mention starting at $99/month\n"
                "5. If it's a greeting, be welcoming and ask how you can help\n"
                "6. If it's a support request, be empathetic and offer assistance\n"
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
            import re
            reply_match = re.search(r'Reply:\s*(.+)', llm_response, re.IGNORECASE | re.DOTALL) if llm_response else None
            if reply_match:
                suggestion = reply_match.group(1).strip()
            else:
                suggestion = llm_response.strip() if llm_response else ""
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