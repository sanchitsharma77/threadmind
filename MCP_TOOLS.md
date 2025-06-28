# Claude Desktop MCP Tools for Instagram DM Management

This document describes all the MCP tools available in Claude Desktop for managing your Instagram DM automation system.

## 🚀 Quick Start

1. **Start the MCP server:**
   ```bash
   python src/mcp_server.py
   ```

2. **In Claude Desktop, you can now use these commands:**
   - `run_poller_once()` - Process new DMs
   - `get_recent_logs()` - View recent interactions
   - `get_processing_stats()` - Get system statistics
   - `add_target("username")` - Add someone to monitor
   - `get_system_status()` - Check system health

## 📋 Available Tools

### **DM Processing**
- `run_poller_once()` - Run the DM poller once to process new messages
- `get_recent_logs(limit=20, username=None)` - Get recent DM interaction logs
- `get_processing_stats()` - Get comprehensive processing statistics

### **Target Management**
- `add_target(username)` - Add a username to monitor for DMs
- `remove_target(username)` - Remove a username from monitoring
- `list_targets()` - Get current list of target usernames

### **System Monitoring**
- `get_system_status()` - Check overall system status
- `list_chats(amount=20)` - List Instagram DM chats/threads
- `list_messages(thread_id, amount=20)` - Get messages from a specific thread
- `send_message(username, message)` - Send a DM to a user

### **Instagram API (when working)**
- `mark_message_seen(thread_id, message_id)` - Mark message as seen
- `send_photo_message(username, photo_path)` - Send photo via DM
- `send_video_message(username, video_path)` - Send video via DM

## 💡 Usage Examples

### **Check System Status**
```
Claude: Check the system status
System: get_system_status()
```

### **Process New DMs**
```
Claude: Run the poller to process new messages
System: run_poller_once()
```

### **View Recent Activity**
```
Claude: Show me the last 10 DM interactions
System: get_recent_logs(limit=10)
```

### **Add a Target**
```
Claude: Add "john_doe" to the target list
System: add_target("john_doe")
```

### **Get Statistics**
```
Claude: Show me processing statistics
System: get_processing_stats()
```

## 🔧 Configuration

### **Environment Variables**
Make sure your `.env` file contains:
```bash
INSTAGRAM_USERNAME=your_username
INSTAGRAM_PASSWORD=your_password
OPENROUTER_API_KEY=your_openrouter_key
USE_OPENROUTER=1
OPENROUTER_MODEL=deepseek/deepseek-r1-0528:free
```

### **Data Files**
The system uses these JSON files:
- `data/targets.json` - List of usernames to monitor
- `data/logs.json` - DM interaction history
- `data/templates.json` - Response templates (managed via frontend)

## 🎯 Workflow

1. **Setup:** Add target usernames using `add_target()`
2. **Monitor:** Use `get_system_status()` to check everything is working
3. **Process:** Run `run_poller_once()` to handle new DMs
4. **Review:** Use `get_recent_logs()` to see what happened
5. **Analyze:** Use `get_processing_stats()` to track performance

## 🚨 Troubleshooting

### **Instagram API Issues**
- If you get 404 errors, Instagram's private API may be broken
- Check `get_system_status()` for connection details
- Wait for instagrapi updates or use browser automation

### **OpenRouter Issues**
- Check `get_system_status()` for API key status
- Ensure `OPENROUTER_API_KEY` is set in `.env`
- Verify the model name is correct

### **Data Issues**
- Check if JSON files exist using `get_system_status()`
- Files are automatically created when needed
- Use the frontend for template management

## 📊 Response Formats

All tools return structured JSON responses with:
- `success`: Boolean indicating if the operation succeeded
- `message`/`error`: Human-readable status or error message
- Additional data specific to each tool

## 🔄 Integration with Frontend

- **Templates:** Use the React frontend for easy template editing
- **Logs:** Use MCP tools for programmatic access to logs
- **Targets:** Use MCP tools for quick target management
- **Stats:** Use MCP tools for real-time statistics

---

**Happy DM Automation! 🎉** 