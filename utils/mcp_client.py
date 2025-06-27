import json
import sys
import os
from filelock import FileLock
from pathlib import Path

# Add the MCP server path to sys.path for direct imports
MCP_PATH = Path(__file__).parent.parent.parent / "instagram_dm_mcp"
if MCP_PATH.exists():
    sys.path.insert(0, str(MCP_PATH / "src"))

DATA_DIR = Path(__file__).parent.parent / "data"
TEMPLATES_FILE = DATA_DIR / "templates.json"
TARGETS_FILE = DATA_DIR / "targets.json"
LOG_FILE = DATA_DIR / "logs.json"
TAGS_FILE = DATA_DIR / "tags.json"

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

# --- Templates CRUD ---
def get_templates():
    templates = _read_json(TEMPLATES_FILE)
    for t in templates:
        if 'tags' not in t:
            t['tags'] = []
    return templates

def add_template(template):
    templates = _read_json(TEMPLATES_FILE)
    template["id"] = (max([int(t.get("id", 0)) for t in templates]) + 1) if templates else 1
    # Ensure all required fields
    for field in ["intent", "title", "content"]:
        if field not in template:
            template[field] = ""
    if 'tags' not in template:
        template['tags'] = []
    templates.append(template)
    _write_json(TEMPLATES_FILE, templates)
    return template

def update_template(template_id, template):
    templates = _read_json(TEMPLATES_FILE)
    for idx, t in enumerate(templates):
        if int(t.get("id")) == int(template_id):
            # Always keep tags, or set to [] if missing
            tags = template.get('tags', t.get('tags', []))
            templates[idx] = {**t, **template, "id": int(template_id), "tags": tags}
            _write_json(TEMPLATES_FILE, templates)
            return templates[idx]
    raise Exception("Template not found")

def delete_template(template_id):
    templates = _read_json(TEMPLATES_FILE)
    templates = [t for t in templates if int(t.get("id")) != int(template_id)]
    _write_json(TEMPLATES_FILE, templates)
    return {"deleted": template_id}

# --- Targets CRUD ---
def get_targets():
    return _read_json(TARGETS_FILE)

def add_target(target):
    targets = _read_json(TARGETS_FILE)
    if target["username"] not in [t["username"] for t in targets]:
        targets.append(target)
        _write_json(TARGETS_FILE, targets)
    return target

# --- Log ---
def get_log():
    return _read_json(LOG_FILE)

def add_log_entry(entry):
    log = _read_json(LOG_FILE)
    log.append(entry)
    _write_json(LOG_FILE, log)
    return entry

# --- Stats ---
def get_stats():
    log = _read_json(LOG_FILE)
    responses_sent = len(log)
    unresolved = sum(1 for entry in log if not entry.get("resolved", True))
    avg_response_time = (
        sum(entry.get("response_time", 0) for entry in log) / responses_sent
        if responses_sent else 0
    )
    return {
        "messages_processed": responses_sent,
        "avg_latency": round(avg_response_time, 2),
        "unresolved": unresolved,
        "total_messages": responses_sent,
        "success_rate": round((responses_sent - unresolved) / responses_sent * 100, 1) if responses_sent > 0 else 0
    }

# --- Tags CRUD ---
def get_tags():
    tags = _read_json(TAGS_FILE)
    return tags

def add_tag(tag):
    tags = _read_json(TAGS_FILE)
    if tag not in tags:
        tags.append(tag)
        _write_json(TAGS_FILE, tags)
    return tag

def delete_tag(tag):
    tags = _read_json(TAGS_FILE)
    tags = [t for t in tags if t != tag]
    _write_json(TAGS_FILE, tags)
    return {"deleted": tag}

# --- MCP Tool Wrappers ---
# These functions will be called by Claude Desktop MCP integration
# For now, return mock data for testing
def list_chats():
    """Get list of Instagram DM chats"""
    try:
        # This would be called via Claude Desktop MCP
        # For testing, return mock data
        return {
            "success": True,
            "threads": [
                {
                    "thread_id": "123456",
                    "users": [{"username": "test_user", "full_name": "Test User"}],
                    "last_activity_at": "2024-01-01T12:00:00Z"
                }
            ]
        }
    except Exception as e:
        return {"success": False, "error": str(e), "threads": []}

def list_messages(thread_id):
    """Get messages from a specific thread"""
    try:
        # This would be called via Claude Desktop MCP
        return {
            "success": True,
            "messages": [
                {
                    "id": "msg_123",
                    "text": "Hello, what's your pricing?",
                    "from": "test_user",
                    "item_type": "text",
                    "handled": False,
                    "timestamp": "2024-01-01T12:00:00Z"
                }
            ]
        }
    except Exception as e:
        return {"success": False, "error": str(e), "messages": []}

def send_message(username, text):
    """Send a message to a user"""
    try:
        # This would be called via Claude Desktop MCP
        print(f"Sending message to {username}: {text}")
        return {"success": True, "message": "Message sent successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def mark_message_seen(thread_id, message_id):
    """Mark a message as seen"""
    try:
        # This would be called via Claude Desktop MCP
        print(f"Marking message {message_id} in thread {thread_id} as seen")
        return {"success": True, "message": "Message marked as seen"}
    except Exception as e:
        return {"success": False, "error": str(e)}