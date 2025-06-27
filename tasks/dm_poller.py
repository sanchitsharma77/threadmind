import time
import logging
from utils.mcp_client import (
    _read_json, _write_json, TEMPLATES_FILE, TARGETS_FILE, LOG_FILE,
    list_chats, list_messages, send_message, mark_message_seen, add_log_entry
)
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def classify(text):
    """Classify message intent based on keywords"""
    text = text.lower()
    if any(word in text for word in ["price", "cost", "how much", "pricing"]):
        return "pricing"
    if any(word in text for word in ["problem", "issue", "help", "support", "broken"]):
        return "complaint"
    if any(word in text for word in ["hello", "hi", "hey", "greeting"]):
        return "greeting"
    return "general"

def poll_and_respond():
    """Main polling function that processes DMs and sends responses"""
    try:
        logger.info("Starting DM poll cycle...")
        
        targets = _read_json(TARGETS_FILE)
        templates = _read_json(TEMPLATES_FILE)
        
        if not targets:
            logger.info("No targets configured. Skipping poll cycle.")
            return
            
        if not templates:
            logger.info("No templates configured. Skipping poll cycle.")
            return
        
        logger.info(f"Polling for {len(targets)} targets with {len(templates)} templates")
        
        # Get chats from MCP
        chats_response = list_chats()
        if not chats_response.get("success"):
            logger.error(f"Failed to get chats: {chats_response.get('error', 'Unknown error')}")
            return
            
        chats = chats_response.get("threads", [])
        logger.info(f"Found {len(chats)} chat threads")
        
        processed_count = 0
        
        for chat in chats:
            thread_id = chat.get("thread_id")
            users = [u.get("username") for u in chat.get("users", [])]
            
            # Check if any user in this chat is a target
            target_users = [t["username"] for t in targets]
            if not any(u in target_users for u in users):
                continue
                
            logger.info(f"Processing thread {thread_id} with users: {users}")
            
            # Get messages for this thread
            messages_response = list_messages(thread_id)
            if not messages_response.get("success"):
                logger.error(f"Failed to get messages for thread {thread_id}")
                continue
                
            messages = messages_response.get("messages", [])
            
            for msg in messages:
                if msg.get("item_type") == "text" and not msg.get("handled", False):
                    message_text = msg.get("text", "")
                    sender = msg.get("from", "")
                    
                    logger.info(f"Processing message from {sender}: {message_text[:50]}...")
                    
                    # Classify the message
                    intent = classify(message_text)
                    logger.info(f"Classified as: {intent}")
                    
                    # Find matching template
                    template = next((t for t in templates if t["intent"] == intent), None)
                    if not template:
                        logger.warning(f"No template found for intent: {intent}")
                        continue
                    
                    # Mark message as seen
                    seen_response = mark_message_seen(thread_id, msg["id"])
                    if not seen_response.get("success"):
                        logger.error(f"Failed to mark message as seen: {seen_response.get('error')}")
                        continue
                    
                    # Send response
                    send_response = send_message(sender, template["content"])
                    if not send_response.get("success"):
                        logger.error(f"Failed to send message: {send_response.get('error')}")
                        continue
                    
                    # Log the interaction
                    log_entry = {
                        "timestamp": datetime.utcnow().isoformat(),
                        "username": sender,
                        "thread_id": thread_id,
                        "message_id": msg["id"],
                        "original_message": message_text,
                        "intent": intent,
                        "template_used": template["id"],
                        "template_title": template["title"],
                        "template_content": template["content"],
                        "resolved": True,
                        "response_time": 1.0  # Placeholder - could calculate actual time
                    }
                    
                    add_log_entry(log_entry)
                    processed_count += 1
                    
                    logger.info(f"Successfully processed message from {sender}")
        
        logger.info(f"Poll cycle completed. Processed {processed_count} messages.")
        
    except Exception as e:
        logger.error(f"Error in poll_and_respond: {str(e)}", exc_info=True)

def run_poller():
    """Run the poller continuously"""
    logger.info("Starting Instagram DM Concierge poller...")
    logger.info("Press Ctrl+C to stop")
    
    try:
        while True:
            poll_and_respond()
            logger.info("Waiting 2 minutes before next poll...")
            time.sleep(120)  # 2 minutes for demo
    except KeyboardInterrupt:
        logger.info("Poller stopped by user")
    except Exception as e:
        logger.error(f"Poller crashed: {str(e)}", exc_info=True)

if __name__ == "__main__":
    run_poller()