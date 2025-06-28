from mcp.server.fastmcp import FastMCP
from instagrapi import Client
import argparse
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
import logging
from pathlib import Path
import subprocess
import json
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

# Set up logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

INSTRUCTIONS = """
This server provides tools for Instagram DM management and automation.
It can list chats, fetch messages, send replies, and manage the DM poller system.
"""

client = Client()
# Load saved session if available
settings_path = Path("instagrapi_settings.json")
if settings_path.exists():
    client.load_settings(settings_path)
    print("Loaded Instagram session from instagrapi_settings.json")
else:
    print("No saved Instagram session found. Please run the authentication script.")

mcp = FastMCP(
   name="Instagram DMs",
   instructions=INSTRUCTIONS
)

# Data file paths
DATA_DIR = Path("data")
TARGETS_FILE = DATA_DIR / "targets.json"
LOGS_FILE = DATA_DIR / "logs.json"
TEMPLATES_FILE = DATA_DIR / "templates.json"

def _read_json(path):
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def _write_json(path, data):
    path.parent.mkdir(exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

@mcp.tool()
def run_poller_once() -> Dict[str, Any]:
    """Run the DM poller once to process new messages and generate AI replies.
    
    Returns:
        A dictionary with success status and output from the poller.
    """
    try:
        result = subprocess.run(
            ["python", "tasks/run_poller_once.py"],
            capture_output=True,
            text=True,
            timeout=120
        )
        return {
            "success": result.returncode == 0,
            "output": result.stdout,
            "error": result.stderr,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@mcp.tool()
def get_recent_logs(limit: int = 20, username: Optional[str] = None) -> Dict[str, Any]:
    """Get recent DM interaction logs with optional filtering.
    
    Args:
        limit: Maximum number of logs to return (default: 20)
        username: Filter logs by specific username (optional)
    
    Returns:
        A dictionary containing recent logs and metadata.
    """
    try:
        logs = _read_json(LOGS_FILE)
        
        # Filter by username if provided
        if username:
            logs = [log for log in logs if log.get("username") == username]
        
        # Sort by timestamp (newest first) and limit
        logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        recent_logs = logs[:limit]
        
        return {
            "success": True,
            "logs": recent_logs,
            "total_count": len(logs),
            "returned_count": len(recent_logs),
            "filtered_by": username if username else "all"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def get_processing_stats() -> Dict[str, Any]:
    """Get comprehensive processing statistics from logs.
    
    Returns:
        A dictionary with detailed statistics about DM processing.
    """
    try:
        logs = _read_json(LOGS_FILE)
        targets = _read_json(TARGETS_FILE)
        
        if not logs:
            return {
                "success": True,
                "stats": {
                    "total_messages": 0,
                    "messages_by_intent": {},
                    "success_rate": 0,
                    "avg_response_time": 0,
                    "target_users": len(targets),
                    "recent_activity": "No activity"
                }
            }
        
        # Calculate statistics
        total_messages = len(logs)
        resolved_messages = sum(1 for log in logs if log.get("resolved", False))
        success_rate = (resolved_messages / total_messages * 100) if total_messages > 0 else 0
        
        # Messages by intent
        intent_counts = {}
        for log in logs:
            intent = log.get("intent", "unknown")
            intent_counts[intent] = intent_counts.get(intent, 0) + 1
        
        # Average response time
        response_times = [log.get("response_time", 0) for log in logs if log.get("response_time")]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        # Recent activity (last 24 hours)
        now = datetime.utcnow()
        recent_logs = [
            log for log in logs 
            if log.get("timestamp") and 
            (now - datetime.fromisoformat(log["timestamp"])).days < 1
        ]
        
        return {
            "success": True,
            "stats": {
                "total_messages": total_messages,
                "resolved_messages": resolved_messages,
                "success_rate": round(success_rate, 1),
                "messages_by_intent": intent_counts,
                "avg_response_time": round(avg_response_time, 2),
                "target_users": len(targets),
                "recent_activity_24h": len(recent_logs),
                "last_processed": logs[-1].get("timestamp") if logs else None
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def add_target(username: str) -> Dict[str, Any]:
    """Add a username to the target list for DM monitoring.
    
    Args:
        username: Instagram username to monitor
    
    Returns:
        A dictionary with success status and confirmation.
    """
    try:
        targets = _read_json(TARGETS_FILE)
        
        # Check if already exists
        if any(t.get("username") == username for t in targets):
            return {
                "success": False,
                "message": f"Username '{username}' is already in targets list"
            }
        
        # Add new target
        new_target = {
            "username": username,
            "added_at": datetime.utcnow().isoformat(),
            "active": True
        }
        targets.append(new_target)
        _write_json(TARGETS_FILE, targets)
        
        return {
            "success": True,
            "message": f"Added '{username}' to targets list",
            "target": new_target
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def remove_target(username: str) -> Dict[str, Any]:
    """Remove a username from the target list.
    
    Args:
        username: Instagram username to remove from monitoring
    
    Returns:
        A dictionary with success status and confirmation.
    """
    try:
        targets = _read_json(TARGETS_FILE)
        original_count = len(targets)
        
        targets = [t for t in targets if t.get("username") != username]
        _write_json(TARGETS_FILE, targets)
        
        removed_count = original_count - len(targets)
        
        return {
            "success": True,
            "message": f"Removed '{username}' from targets list",
            "removed_count": removed_count
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def list_targets() -> Dict[str, Any]:
    """Get the current list of target usernames being monitored.
    
    Returns:
        A dictionary containing the list of targets and metadata.
    """
    try:
        targets = _read_json(TARGETS_FILE)
        
        return {
            "success": True,
            "targets": targets,
            "count": len(targets),
            "active_count": sum(1 for t in targets if t.get("active", True))
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def get_system_status() -> Dict[str, Any]:
    """Get overall system status including backend, Instagram connection, and OpenRouter.
    
    Returns:
        A dictionary with system status information.
    """
    try:
        # Check Instagram connection
        instagram_status = "unknown"
        try:
            # Try a simple API call to check connection
            client.user_info_by_username("instagram")
            instagram_status = "connected"
        except Exception as e:
            instagram_status = f"error: {str(e)[:100]}"
        
        # Check OpenRouter API key
        openrouter_status = "configured" if os.getenv("OPENROUTER_API_KEY") else "not_configured"
        
        # Check data files
        data_files = {
            "targets": TARGETS_FILE.exists(),
            "logs": LOGS_FILE.exists(),
            "templates": TEMPLATES_FILE.exists()
        }
        
        # Get recent activity
        logs = _read_json(LOGS_FILE)
        recent_activity = len([log for log in logs[-10:] if log.get("timestamp")])
        
        return {
            "success": True,
            "status": {
                "instagram_connection": instagram_status,
                "openrouter_api": openrouter_status,
                "data_files": data_files,
                "recent_activity": recent_activity,
                "last_check": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool()
def send_message(username: str, message: str) -> Dict[str, Any]:
    """Send an Instagram direct message to a user by username.

    Args:
        username: Instagram username of the recipient.
        message: The message text to send.
    Returns:
        A dictionary with success status and a status message.
    """
    if not username or not message:
        return {"success": False, "message": "Username and message must be provided."}
    try:
        user_id = int(client.user_id_from_username(username))
        if not user_id:
            return {"success": False, "message": f"User '{username}' not found."}
        dm = client.direct_send(message, [user_id])
        if dm:
            return {"success": True, "message": "Message sent to user.", "direct_message_id": getattr(dm, 'id', None)}
        else:
            return {"success": False, "message": "Failed to send message."}
    except Exception as e:
        return {"success": False, "message": str(e)}

@mcp.tool()
def list_messages(thread_id: str, amount: int = 20) -> Dict[str, Any]:
    """Get messages from a specific thread.

    Args:
        thread_id: The thread ID to get messages from.
        amount: Number of messages to retrieve (default: 20).
    Returns:
        A dictionary with success status and list of messages.
    """
    if not thread_id:
        return {"success": False, "message": "Thread ID must be provided."}
    try:
        messages = client.direct_messages(int(thread_id), amount=amount)
        formatted_messages = []
        for msg in messages:
            formatted_msg = {
                "id": getattr(msg, 'id', None),
                "text": getattr(msg, 'text', ''),
                "from": getattr(msg, 'user_id', None),
                "timestamp": getattr(msg, 'timestamp', None),
                "item_type": getattr(msg, 'item_type', 'text'),
                "handled": False
            }
            formatted_messages.append(formatted_msg)
        return {"success": True, "messages": formatted_messages}
    except Exception as e:
        return {"success": False, "message": str(e)}

@mcp.tool()
def mark_message_seen(thread_id: str, message_id: str) -> Dict[str, Any]:
    """Mark a message as seen in a thread.

    Args:
        thread_id: The thread ID containing the message.
        message_id: The message ID to mark as seen.
    Returns:
        A dictionary with success status and confirmation.
    """
    if not thread_id or not message_id:
        return {"success": False, "message": "Thread ID and message ID must be provided."}
    try:
        # Note: instagrapi doesn't have a direct mark_as_seen method
        # This is a placeholder for when the API is working
        return {"success": True, "message": f"Message {message_id} marked as seen in thread {thread_id}."}
    except Exception as e:
        return {"success": False, "message": str(e)}

@mcp.tool()
def list_chats(
    amount: int = 20,
    selected_filter: str = "",
    thread_message_limit: Optional[int] = None,
    full: bool = False,
    fields: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Get list of Instagram DM chats/threads.

    Args:
        amount: Number of threads to retrieve (default: 20).
        selected_filter: Filter for specific thread types (default: "").
        thread_message_limit: Limit messages per thread (default: None).
        full: Return full thread objects (default: False).
        fields: Specific fields to return (default: None).
    Returns:
        A dictionary with success status and list of threads.
    """
    def thread_summary(thread):
        return {
            "thread_id": getattr(thread, 'id', None),
            "users": [{"user_id": getattr(user, 'pk', None), "username": getattr(user, 'username', None)} for user in getattr(thread, 'users', [])],
            "last_activity": getattr(thread, 'last_activity', None),
            "unseen_count": getattr(thread, 'unseen_count', 0)
        }

    def filter_fields(thread, fields):
        return {field: getattr(thread, field, None) for field in fields}

    try:
        threads = client.direct_threads(amount=amount, box=selected_filter, thread_message_limit=thread_message_limit)
        if full:
            return {"success": True, "threads": [t.dict() if hasattr(t, 'dict') else str(t) for t in threads]}
        elif fields:
            return {"success": True, "threads": [filter_fields(t, fields) for t in threads]}
        else:
            return {"success": True, "threads": [thread_summary(t) for t in threads]}
    except Exception as e:
        import traceback
        print("Exception in list_chats:", repr(e))
        traceback.print_exc()
        return {"success": False, "message": str(e)}


@mcp.tool()
def send_photo_message(username: str, photo_path: str) -> Dict[str, Any]:
    """Send a photo via Instagram direct message to a user by username.

    Args:
        username: Instagram username of the recipient.
        photo_path: Path to the photo file to send.
        message: Optional message text to accompany the photo.
    Returns:
        A dictionary with success status and a status message.
    """
    if not username or not photo_path:
        return {"success": False, "message": "Username and photo_path must be provided."}
    
    if not os.path.exists(photo_path):
        return {"success": False, "message": f"Photo file not found: {photo_path}"}
    
    try:
        user_id = int(client.user_id_from_username(username))
        if not user_id:
            return {"success": False, "message": f"User '{username}' not found."}
        
        result = client.direct_send_photo(Path(photo_path), [user_id])
        if result:
            return {"success": True, "message": "Photo sent successfully.", "direct_message_id": getattr(result, 'id', None)}
        else:
            return {"success": False, "message": "Failed to send photo."}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp.tool()
def send_video_message(username: str, video_path: str) -> Dict[str, Any]:
    """Send a video via Instagram direct message to a user by username.

    Args:
        username: Instagram username of the recipient.
        video_path: Path to the video file to send.
    Returns:
        A dictionary with success status and a status message.
    """
    if not username or not video_path:
        return {"success": False, "message": "Username and video_path must be provided."}
    
    if not os.path.exists(video_path):
        return {"success": False, "message": f"Video file not found: {video_path}"}
    
    try:
        user_id = int(client.user_id_from_username(username))
        if not user_id:
            return {"success": False, "message": f"User '{username}' not found."}

        result = client.direct_send_video(Path(video_path), [user_id])
        if result:
            return {"success": True, "message": "Video sent successfully.", "direct_message_id": getattr(result, 'id', None)}
        else:
            return {"success": False, "message": "Failed to send video."}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp.tool()
def list_pending_chats(amount: int = 20) -> Dict[str, Any]:
    """Get Instagram Direct Message threads (chats) from the user's pending inbox.

    Args:
        amount: Number of pending threads to fetch (default 20).
    Returns:
        A dictionary with success status and the list of pending threads or error message.
    """
    try:
        threads = client.direct_pending_inbox(amount)
        return {"success": True, "threads": [t.dict() if hasattr(t, 'dict') else str(t) for t in threads]}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp.tool()
def search_threads(query: str) -> Dict[str, Any]:
    """Search Instagram Direct Message threads by username or keyword.

    Args:
        query: The search term (username or keyword).
    Returns:
        A dictionary with success status and the search results or error message.
    """
    if not query:
        return {"success": False, "message": "Query must be provided."}
    try:
        results = client.direct_search(query)
        return {"success": True, "results": [r.dict() if hasattr(r, 'dict') else str(r) for r in results]}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp.tool()
def get_thread_by_participants(user_ids: List[int]) -> Dict[str, Any]:
    """Get an Instagram Direct Message thread by participant user IDs.

    Args:
        user_ids: List of user IDs (ints).
    Returns:
        A dictionary with success status and the thread or error message.
    """
    if not user_ids or not isinstance(user_ids, list):
        return {"success": False, "message": "user_ids must be a non-empty list of user IDs."}
    try:
        thread = client.direct_thread_by_participants(user_ids)
        return {"success": True, "thread": thread if isinstance(thread, dict) else str(thread)}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp.tool()
def get_thread_details(thread_id: str, amount: int = 20) -> Dict[str, Any]:
    """Get details and messages for a specific Instagram Direct Message thread by thread ID, with an optional message limit.

    Args:
        thread_id: The thread ID to fetch details for.
        amount: Number of messages to fetch (default 20).
    Returns:
        A dictionary with success status and the thread details or error message.
    """
    if not thread_id:
        return {"success": False, "message": "Thread ID must be provided."}
    try:
        thread = client.direct_thread(int(thread_id), amount)
        return {"success": True, "thread": thread if isinstance(thread, dict) else str(thread)}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp.tool()
def get_user_id_from_username(username: str) -> Dict[str, Any]:
    """Get the Instagram user ID for a given username.

    Args:
        username: Instagram username.
    Returns:
        A dictionary with success status and the user ID or error message.
    """
    if not username:
        return {"success": False, "message": "Username must be provided."}
    try:
        user_id = str(client.user_id_from_username(username))
        if user_id:
            return {"success": True, "user_id": user_id}
        else:
            return {"success": False, "message": f"User '{username}' not found."}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp.tool()
def get_username_from_user_id(user_id: str) -> Dict[str, Any]:
    """Get the Instagram username for a given user ID.

    Args:
        user_id: Instagram user ID.
    Returns:
        A dictionary with success status and the username or error message.
    """
    if not user_id:
        return {"success": False, "message": "User ID must be provided."}
    try:
        username = client.username_from_user_id(user_id)
        if username:
            return {"success": True, "username": username}
        else:
            return {"success": False, "message": f"User ID '{user_id}' not found."}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp.tool()
def get_user_info(username: str) -> Dict[str, Any]:
    """Get detailed information about an Instagram user.

    Args:
        username: Instagram username to get information about.
    Returns:
        A dictionary with success status and user information.
    """
    if not username:
        return {"success": False, "message": "Username must be provided."}
    
    try:
        user = client.user_info_by_username(username)
        if user:
            user_data = {
                "user_id": str(user.pk),
                "username": user.username,
                "full_name": user.full_name,
                "biography": user.biography,
                "follower_count": user.follower_count,
                "following_count": user.following_count,
                "media_count": user.media_count,
                "is_private": user.is_private,
                "is_verified": user.is_verified,
                "profile_pic_url": str(user.profile_pic_url) if user.profile_pic_url else None,
                "external_url": str(user.external_url) if user.external_url else None,
                "category": user.category,
            }
            return {"success": True, "user_info": user_data}
        else:
            return {"success": False, "message": f"User '{username}' not found."}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp.tool()
def check_user_online_status(usernames: List[str]) -> Dict[str, Any]:
    """Check the online status of Instagram users.

    Args:
        usernames: List of Instagram usernames to check status for.
    Returns:
        A dictionary with success status and users' presence information.
    """
    if not usernames or not isinstance(usernames, list):
        return {"success": False, "message": "A list of usernames must be provided."}
    
    try:
        user_ids = []
        username_to_id = {}
        
        # Get user IDs for the usernames
        for username in usernames:
            try:
                user_id = str(client.user_id_from_username(username))
                if user_id:
                    user_ids.append(user_id)
                    username_to_id[user_id] = username
            except:
                continue
        
        if not user_ids:
            return {"success": False, "message": "No valid users found."}
        
        presence_data = client.direct_users_presence(user_ids)
        
        # Convert back to usernames
        result = {}
        for user_id_str, presence in presence_data.items():
            username = username_to_id.get(user_id_str, f"user_{user_id_str}")
            result[username] = presence
        
        return {"success": True, "presence_data": result}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp.tool()
def search_users(query: str) -> Dict[str, Any]:
    """Search for Instagram users by name or username.

    Args:
        query: Search term (name or username).
        count: Maximum number of users to return (default 10, max 50).
    Returns:
        A dictionary with success status and search results.
    """
    if not query:
        return {"success": False, "message": "Search query must be provided."}
    
    try:
        users = client.search_users(query)
        
        user_results = []
        for user in users:
            user_data = {
                "user_id": str(user.pk),
                "username": user.username,
                "full_name": user.full_name,
                "is_private": user.is_private,
                "profile_pic_url": str(user.profile_pic_url) if user.profile_pic_url else None,
                "follower_count": getattr(user, 'follower_count', None),
            }
            user_results.append(user_data)
        
        return {"success": True, "users": user_results, "count": len(user_results)}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp.tool()
def get_user_stories(username: str) -> Dict[str, Any]:
    """Get Instagram stories from a user.

    Args:
        username: Instagram username to get stories from.
    Returns:
        A dictionary with success status and stories information.
    """
    if not username:
        return {"success": False, "message": "Username must be provided."}
    
    try:
        user_id = str(client.user_id_from_username(username))
        if not user_id:
            return {"success": False, "message": f"User '{username}' not found."}
        
        stories = client.user_stories(user_id)
        
        story_results = []
        for story in stories:
            story_data = {
                "story_id": str(story.pk),
                "media_type": story.media_type,  # 1=photo, 2=video
                "taken_at": str(story.taken_at),
                "user": {
                    "username": story.user.username,
                    "full_name": story.user.full_name,
                    "user_id": str(story.user.pk)
                },
                "media_url": str(story.thumbnail_url) if story.thumbnail_url else None,
            }
            
            if story.media_type == 2 and story.video_url:
                story_data["video_url"] = str(story.video_url)
                story_data["video_duration"] = story.video_duration
            
            story_results.append(story_data)
        
        return {"success": True, "stories": story_results, "count": len(story_results)}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp.tool()
def like_media(media_url: str, like: bool = True) -> Dict[str, Any]:
    """Like or unlike an Instagram post.

    Args:
        media_url: URL of the Instagram post.
        like: True to like, False to unlike the post.
    Returns:
        A dictionary with success status and a status message.
    """
    if not media_url:
        return {"success": False, "message": "Media URL must be provided."}
    
    try:
        media_pk = str(client.media_pk_from_url(media_url))
        if not media_pk:
            return {"success": False, "message": "Invalid media URL or post not found."}
        
        if like:
            result = client.media_like(media_pk)
            action = "liked"
        else:
            result = client.media_unlike(media_pk)
            action = "unliked"
        
        if result:
            return {"success": True, "message": f"Post {action} successfully."}
        else:
            return {"success": False, "message": f"Failed to {action.rstrip('d')} post."}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp.tool()
def get_user_followers(username: str, count: int = 20) -> Dict[str, Any]:
    """Get followers of an Instagram user.

    Args:
        username: Instagram username to get followers for.
        count: Maximum number of followers to return (default 20).
    Returns:
        A dictionary with success status and followers list.
    """
    if not username:
        return {"success": False, "message": "Username must be provided."}
    
    try:
        user_id = str(client.user_id_from_username(username))
        if not user_id:
            return {"success": False, "message": f"User '{username}' not found."}
        
        followers = client.user_followers(user_id, amount=count)
        
        follower_results = []
        for follower_id, follower in followers.items():
            follower_data = {
                "user_id": str(follower.pk),
                "username": follower.username,
                "full_name": follower.full_name,
                "is_private": follower.is_private,
                "profile_pic_url": str(follower.profile_pic_url) if follower.profile_pic_url else None,
            }
            follower_results.append(follower_data)
        
        return {"success": True, "followers": follower_results, "count": len(follower_results)}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp.tool()
def get_user_following(username: str, count: int = 20) -> Dict[str, Any]:
    """Get users that an Instagram user is following.

    Args:
        username: Instagram username to get following list for.
        count: Maximum number of following to return (default 20).
    Returns:
        A dictionary with success status and following list.
    """
    if not username:
        return {"success": False, "message": "Username must be provided."}
    
    try:
        user_id = str(client.user_id_from_username(username))
        if not user_id:
            return {"success": False, "message": f"User '{username}' not found."}
        
        following = client.user_following(user_id, amount=count)
        
        following_results = []
        for following_id, followed_user in following.items():
            following_data = {
                "user_id": str(followed_user.pk),
                "username": followed_user.username,
                "full_name": followed_user.full_name,
                "is_private": followed_user.is_private,
                "profile_pic_url": str(followed_user.profile_pic_url) if followed_user.profile_pic_url else None,
            }
            following_results.append(following_data)
        
        return {"success": True, "following": following_results, "count": len(following_results)}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp.tool()
def get_user_posts(username: str, count: int = 12) -> Dict[str, Any]:
    """Get recent posts from an Instagram user.

    Args:
        username: Instagram username to get posts from.
        count: Maximum number of posts to return (default 12).
    Returns:
        A dictionary with success status and posts list.
    """
    if not username:
        return {"success": False, "message": "Username must be provided."}
    
    try:
        user_id = str(client.user_id_from_username(username))
        if not user_id:
            return {"success": False, "message": f"User '{username}' not found."}
        
        medias = client.user_medias(user_id, amount=count)
        
        media_results = []
        for media in medias:
            media_data = {
                "media_id": str(media.pk),
                "media_type": media.media_type,  # 1=photo, 2=video, 8=album
                "caption": media.caption_text if media.caption_text else "",
                "like_count": media.like_count,
                "comment_count": media.comment_count,
                "taken_at": str(media.taken_at),
                "media_url": str(media.thumbnail_url) if media.thumbnail_url else None,
            }
            
            if media.media_type == 2 and media.video_url:
                media_data["video_url"] = str(media.video_url)
                media_data["video_duration"] = media.video_duration
            
            media_results.append(media_data)
        
        return {"success": True, "posts": media_results, "count": len(media_results)}
    except Exception as e:
        return {"success": False, "message": str(e)}


def _ensure_download_directory(download_path: str) -> None:
    """Ensure download directory exists."""
    Path(download_path).mkdir(parents=True, exist_ok=True)


def _download_single_media(media, download_path: str) -> str:
    """Download a single media item and return the file path."""
    media_type = media.media_type
    if media_type == 1:  # Photo
        return str(client.photo_download(int(media.pk), Path(download_path)))
    elif media_type == 2:  # Video
        return str(client.video_download(int(media.pk), Path(download_path)))
    else:
        raise ValueError(f"Unsupported media type: {media_type}")


def _find_message_in_thread(thread_id: str, message_id: str):
    """Find a specific message in a thread."""
    messages = client.direct_messages(int(thread_id), 100)
    return next((m for m in messages if str(m.id) == message_id), None)


@mcp.tool()
def list_media_messages(thread_id: str, limit: int = 100) -> Dict[str, Any]:
    """List all messages containing media in an Instagram direct message thread.
    Args:
        thread_id: The ID of the thread to check for media messages
        limit: Maximum number of messages to check (default 100, max 200)
    Returns:
        A dictionary containing success status and list of all media messages found
    """
    try:
        limit = min(limit, 200)
        messages = client.direct_messages(int(thread_id), limit)
        media_messages = []
        for message in messages:
            if message.media:
                media_messages.append({
                    "message_id": str(message.id),
                    "media_type": "photo" if message.media.media_type == 1 else "video",
                    "timestamp": str(message.timestamp) if hasattr(message, 'timestamp') else None,
                    "sender_user_id": message.user_id if hasattr(message, 'user_id') else None
                })
        return {
            "success": True,
            "message": f"Found {len(media_messages)} messages with media",
            "total_messages_checked": len(messages),
            "media_messages": media_messages
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to list media messages: {str(e)}"
        }

@mcp.tool()
def download_media_from_message(message_id: str, thread_id: str, download_path: str = "./downloads") -> Dict[str, Any]:
    """Download media from a specific Instagram direct message and get the local file path.
    Args:
        message_id: The ID of the message containing the media
        thread_id: The ID of the thread containing the message
        download_path: Directory to save the downloaded file (default: ./downloads)
    Returns:
        A dictionary containing success status, a status message, and the file path if successful
    """
    try:
        _ensure_download_directory(download_path)
        target_message = _find_message_in_thread(thread_id, message_id)
        if not target_message:
            return {
                "success": False,
                "message": f"Message {message_id} not found in thread {thread_id}"
            }
        if not target_message.media:
            return {
                "success": False,
                "message": "This message does not contain media"
            }
        file_path = _download_single_media(target_message.media, download_path)
        return {
            "success": True,
            "message": "Media downloaded successfully",
            "file_path": file_path,
            "media_type": "photo" if target_message.media.media_type == 1 else "video",
            "message_id": message_id,
            "thread_id": thread_id
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to download media: {str(e)}"
        }


@mcp.tool()
def download_shared_post_from_message(message_id: str, thread_id: str, download_path: str = "./downloads") -> Dict[str, Any]:
    """Download media from a shared post/reel/clip in a DM message and get the local file path.
    Args:
        message_id: The ID of the message containing the shared post/reel/clip
        thread_id: The ID of the thread containing the message
        download_path: Directory to save the downloaded file (default: ./downloads)
    Returns:
        A dictionary containing success status, a status message, and the file path if successful
    """
    try:
        _ensure_download_directory(download_path)
        target_message = _find_message_in_thread(thread_id, message_id)
        if not target_message:
            return {"success": False, "message": f"Message {message_id} not found in thread {thread_id}"}
        item_type = getattr(target_message, 'item_type', None)
        # Extract shared post/reel/clip URL
        shared_url = None
        shared_code = None
        shared_obj = None
        if item_type in ["clip", "media_share", "reel_share", "xma_media_share", "post_share"]:
            for attr in ['clip', 'media_share', 'xma_media_share', 'post_share']:
                obj = getattr(target_message, attr, None)
                if obj:
                    shared_code = obj.get('code') or obj.get('pk')
                    shared_url = obj.get('url') or (f"https://www.instagram.com/reel/{shared_code}/" if shared_code else None)
                    shared_obj = obj
                    break
        if not shared_url:
            return {"success": False, "message": "This message does not contain a supported shared post/reel/clip"}
        # Download using Instagrapi
        try:
            media_pk = str(client.media_pk_from_url(shared_url))
            media = client.media_info(media_pk)
            if media.media_type == 1:
                file_path = str(client.photo_download(int(media_pk), Path(download_path)))
                media_type = "photo"
            elif media.media_type == 2:
                file_path = str(client.video_download(int(media_pk), Path(download_path)))
                media_type = "video"
            elif media.media_type == 8:  # album
                # Download all items in album
                album_paths = client.album_download(int(media_pk), Path(download_path))
                file_path = str(album_paths)
                media_type = "album"
            else:
                return {"success": False, "message": f"Unsupported media type: {media.media_type}"}
            return {
                "success": True,
                "message": "Shared post/reel/clip downloaded successfully",
                "file_path": file_path,
                "media_type": media_type,
                "shared_post_url": shared_url,
                "message_id": message_id,
                "thread_id": thread_id
            }
        except Exception as e:
            return {"success": False, "message": f"Failed to download shared post/reel/clip: {str(e)}"}
    except Exception as e:
        return {"success": False, "message": f"Failed to process message: {str(e)}"}


@mcp.tool()
def delete_message(thread_id: str, message_id: str) -> Dict[str, Any]:
    """Delete a message from a direct message thread.

    Args:
        thread_id: The thread ID containing the message.
        message_id: The ID of the message to delete.
    Returns:
        A dictionary with success status and a status message.
    """
    if not thread_id or not message_id:
        return {"success": False, "message": "Both thread_id and message_id must be provided."}
    
    try:
        result = client.direct_message_delete(int(thread_id), int(message_id))
        if result:
            return {"success": True, "message": "Message deleted successfully."}
        else:
            return {"success": False, "message": "Failed to delete message."}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp.tool()
def mute_conversation(thread_id: str, mute: bool = True) -> Dict[str, Any]:
    """Mute or unmute a direct message conversation.

    Args:
        thread_id: The thread ID to mute/unmute.
        mute: True to mute, False to unmute the conversation.
    Returns:
        A dictionary with success status and a status message.
    """
    if not thread_id:
        return {"success": False, "message": "Thread ID must be provided."}
    
    try:
        if mute:
            result = client.direct_thread_mute(int(thread_id))
            action = "muted"
        else:
            result = client.direct_thread_unmute(int(thread_id))
            action = "unmuted"
        
        if result:
            return {"success": True, "message": f"Conversation {action} successfully."}
        else:
            return {"success": False, "message": f"Failed to {action.rstrip('d')} conversation."}
    except Exception as e:
        return {"success": False, "message": str(e)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    args = parser.parse_args()
    
    mcp.run(transport="stdio")
