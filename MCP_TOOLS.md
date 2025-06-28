# Claude Desktop MCP Tools for Instagram DM Management

This document describes all the MCP tools available in Claude Desktop for managing your Instagram DM automation system.

## 🚀 Quick Start

1. **Start the MCP server:**
   ```bash
   python src/mcp_server.py
   ```

2. **In Claude Desktop, you can now use these commands:**
   - `list_chats()` - List Instagram DM chats/threads
   - `list_messages(thread_id)` - Get messages from a specific thread
   - `send_message(username, message)` - Send a DM to a user
   - `mark_message_seen(thread_id)` - Mark messages as seen
   - `get_recent_logs(limit=20, username=None)` - Get recent DM interaction logs
   - `get_processing_stats()` - Get system statistics
   - `get_system_status()` - Check system health

## 📋 Available Tools

### **DM Processing**
- `get_recent_logs(limit=20, username=None)` - Get recent DM interaction logs
- `get_processing_stats()` - Get comprehensive processing statistics

### **System Monitoring**
- `get_system_status()` - Check overall system status
- `list_chats(amount=20)` - List Instagram DM chats/threads
- `list_messages(thread_id, amount=20)` - Get messages from a specific thread
- `send_message(username, message)` - Send a DM to a user
- `mark_message_seen(thread_id, message_id)` - Mark message as seen

## 💡 Usage Examples

### **Check System Status**
```
Claude: Check the system status
System: get_system_status()
```

### **View Recent Activity**
```
Claude: Show me the last 10 DM interactions
System: get_recent_logs(limit=10)
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
OPENROUTER_MODEL=deepseek/deepseek-r1
```

#### **OpenRouter Model Details**
- **Default Model:** `deepseek/deepseek-r1`
- **Other Available:** `deepseek/deepseek-v3`

**DeepSeek R1**
- Parameters: 236B
- License: Apache 2.0
- Availability: Free-tier (may be rate-limited during peak hours)
- Pricing: $0.10 per 1M input tokens, $0.20 per 1M output tokens (subject to change)
- Use: General-purpose, fast, and accurate for most DM tasks

**DeepSeek V3**
- Parameters: 236B (improved architecture)
- License: Apache 2.0
- Availability: Free-tier and paid (may be rate-limited during peak hours)
- Pricing: $0.15 per 1M input tokens, $0.30 per 1M output tokens (subject to change)
- Use: More advanced reasoning, better for complex conversations

**Free-Tier Access:**
- Both models are available for free via OpenRouter, but you may experience delays or rate limits during peak traffic.
- If you hit a limit, try again later or consider upgrading your OpenRouter plan.

**Switching Models:**
- To use a different model, set `OPENROUTER_MODEL` in your `.env` file. Example:
  ```bash
  OPENROUTER_MODEL=deepseek/deepseek-v3
  ```
- Restart the backend after changing the model.

**Monitor Usage:**
- Check your [OpenRouter dashboard](https://openrouter.ai/dashboard) for usage limits, token consumption, and tier restrictions.
- Free-tier users may be subject to stricter rate limits and slower response times during high demand.

### **Data Files**
The system uses these JSON files:
- `data/logs.json` - Array of log objects with standardized schema (see schema section)

**Note:** These files are automatically created with empty arrays if they don't exist.

## 📊 Response Formats

All tools return structured JSON responses with:
- `success`: Boolean indicating if the operation succeeded
- `message`/`error`: Human-readable status or error message
- Additional data specific to each tool

## 🔄 Integration with Frontend

- **Logs:** Use MCP tools for programmatic access to logs
- **Stats:** Use MCP tools for real-time statistics

---

**Happy DM Automation! 🎉** 