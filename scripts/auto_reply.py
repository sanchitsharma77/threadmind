import requests
import subprocess
import sys
import json
import time

# --- CONFIG ---
BACKEND_URL = "http://localhost:8000/api/process_messages"
MCP_SERVER_CMD = [sys.executable, "src/mcp_server.py"]  # Adjust if needed

# --- Fetch new/unread messages using MCP tool ---
def list_new_messages(thread_id=None):
    # You may want to list all threads first, then fetch messages for each
    # For demo, we'll assume you know the thread_id(s) you want to check
    # Replace this with logic to enumerate all threads if needed
    if not thread_id:
        print("[!] Please provide a thread_id or implement thread listing.")
        return []
    try:
        # Call MCP tool: list_messages(thread_id)
        cmd = MCP_SERVER_CMD + ["--tool", "list_messages", "--thread_id", thread_id]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            print(f"[ERROR] MCP list_messages failed: {result.stderr}")
            return []
        # Expecting JSON output
        data = json.loads(result.stdout)
        if not data.get("success"):
            print(f"[ERROR] MCP list_messages: {data.get('message')}")
            return []
        # Filter for unread messages (customize as needed)
        messages = data.get("messages", [])
        new_msgs = [
            {
                "id": m.get("id"),
                "thread_id": thread_id,
                "from_user": m.get("username"),
                "text": m.get("text")
            }
            for m in messages if not m.get("seen", False)
        ]
        return new_msgs
    except Exception as e:
        print(f"[ERROR] Exception in list_new_messages: {e}")
        return []

# --- Call backend to get AI reply suggestions ---
def get_ai_replies(messages):
    try:
        response = requests.post(BACKEND_URL, json=messages)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"[ERROR] Backend returned {response.status_code}: {response.text}")
            return []
    except Exception as e:
        print(f"[ERROR] Failed to contact backend: {e}")
        return []

# --- Send reply using MCP tool ---
def send_reply(username, reply):
    try:
        cmd = MCP_SERVER_CMD + ["--tool", "send_message", "--username", username, "--message", reply]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            print(f"[MCP] Sent to {username}: {reply}")
        else:
            print(f"[ERROR] MCP send_message failed: {result.stderr}")
    except Exception as e:
        print(f"[ERROR] Exception in send_reply: {e}")

# --- Main auto-reply logic ---
def main():
    # TODO: Replace with logic to enumerate all relevant thread_ids
    thread_ids = ["YOUR_THREAD_ID_HERE"]  # Replace with real thread IDs
    for thread_id in thread_ids:
        messages = list_new_messages(thread_id)
        if not messages:
            print(f"No new messages to process in thread {thread_id}.")
            continue
        ai_replies = get_ai_replies(messages)
        for reply_obj in ai_replies:
            username = reply_obj.get("from_user")
            reply = reply_obj.get("suggestion")
            if username and reply:
                print(f"Auto-replying to {username}: {reply}")
                send_reply(username, reply)
            else:
                print(f"[WARN] Missing username or reply in: {reply_obj}")
    print("Done. Stats and logs are updated by the backend automatically.")

if __name__ == "__main__":
    main() 