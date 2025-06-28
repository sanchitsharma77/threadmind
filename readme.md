# AI-Powered DM Automation

A privacy-first Instagram DM assistant that puts you in control. No background polling, no automated responses—just you, Claude Desktop, and your data.

## What It Is

AI-Powered DM Automation processes Instagram DMs on-demand using Claude Desktop commands. You fetch messages, get AI-powered reply suggestions, and send responses when you're ready. Everything stays local and private.

## How It Works

1. **Fetch DMs** via Claude Desktop: `list_chats()` → `list_messages(thread_id)`
2. **Process messages** via API: Send message list to `/process_messages`
3. **Get suggestions** from DeepSeek R1 (free LLM)
4. **Review & send** via Claude Desktop: `send_message(username, reply)`

## Architecture

```
Claude Desktop MCP → Instagram (via MCP)
                              ↓
                        Backend API → DeepSeek R1 (OpenRouter) → Logs
                              ↓
                        Dashboard (Stats + Logs)
```

- **No background jobs**
- **No automated responses** 
- **No data leaves your machine** (except LLM API calls)
- **JSON file storage** (portable, simple)
- **Instagram access via MCP only** (backend is API-only)

## Quick Start

### 1. Setup Environment

```bash
# Clone and install
git clone https://github.com/yourusername/ai-dm-automation
cd ai-dm-automation

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..

# Configure
cp env.example .env
# Edit .env with your OpenRouter API key
```

### 2. Start the System

```bash
# Use the start script (recommended)
./start.sh

# Or start manually:
# Terminal 1: Backend
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: MCP Server (for Claude Desktop)
python src/mcp_server.py
```

### 3. Use Claude Desktop

```bash
# In Claude Desktop, use:
list_chats()                    # Get all DM threads
list_messages("thread_id")      # Get messages from thread
send_message("user", "reply")   # Send a reply
mark_message_seen("thread_id")  # Mark messages as seen
```

### 4. Process Messages

```bash
# Send message list to backend for processing
curl -X POST http://localhost:8000/api/process_messages \
  -H "Content-Type: application/json" \
  -d '[{"id":"1","thread_id":"123","from_user":"john","text":"Hello"}]'
```

## API Endpoints

- `GET /api/ping` - Health check
- `GET /api/logs` - View processed messages and suggestions
- `GET /api/stats` - Get message statistics
- `POST /api/process_messages` - Process messages, get suggestions

## Frontend Dashboard

Visit `http://localhost:5173` to:
- **Stats Overview**: View message counts, response times, and intent breakdown
- **Logs**: Browse processed messages with AI suggestions
- **Copy MCP Commands**: One-click copy for Claude Desktop commands

## Configuration

### Environment Variables

```bash
# OpenRouter (for DeepSeek R1)
OPENROUTER_API_KEY=your_key
USE_OPENROUTER=1
OPENROUTER_MODEL=deepseek/deepseek-r1-0528:free

# Instagram credentials (for MCP server only)
INSTAGRAM_USERNAME=your_username
INSTAGRAM_PASSWORD=your_password
```

### Data Files

- `data/logs.json` - Message history and suggestions
- `data/targets.json` - User monitoring list (optional)

## Workflow Example

```bash
# 1. Get DM threads
Claude: list_chats()

# 2. Get messages from a thread  
Claude: list_messages("123456")

# 3. Process messages via API
curl -X POST http://localhost:8000/api/process_messages \
  -d '[{"id":"1","thread_id":"123","from_user":"alice","text":"What's your pricing?"}]'

# 4. Send reply
Claude: send_message("alice", "Our pricing starts at $99/month...")
```

## Features

- **Manual control** - No automation, you decide when to respond
- **AI suggestions** - DeepSeek R1 generates contextual replies
- **Local storage** - All data in JSON files on your machine
- **Privacy-first** - No external databases or tracking
- **Free LLM** - Uses DeepSeek R1 via OpenRouter (no cost)
- **MCP-only Instagram access** - Backend is API-only, Instagram via Claude Desktop
- **Simple dashboard** - Stats and logs with copy-to-clipboard MCP commands

## Development

### Project Structure

```
ai-dm-automation/
├── api/routes.py          # Backend API endpoints (no Instagram access)
├── utils/mcp_client.py    # LLM and data helpers
├── src/mcp_server.py      # Claude Desktop MCP tools (Instagram access)
├── frontend/              # React dashboard (Stats + Logs only)
├── data/                  # JSON storage
├── main.py               # FastAPI server
└── start.sh              # Startup script
```

### Adding Features

- **New MCP tools**: Add to `src/mcp_server.py`
- **API endpoints**: Add to `api/routes.py`
- **LLM integration**: Modify `utils/mcp_client.py`
- **Frontend**: Edit React components in `frontend/`

## For Contributors

### Fork and Setup

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/yourusername/ai-dm-automation
   cd ai-dm-automation
   ```

3. **Install dependencies**:
   ```bash
   # Python dependencies
   pip install -r requirements.txt
   
   # Frontend dependencies
   cd frontend && npm install && cd ..
   ```

4. **Configure environment**:
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

5. **Start development**:
   ```bash
   ./start.sh
   ```

### Making Changes

- **Backend changes**: Edit `api/routes.py` or `utils/mcp_client.py`
- **Frontend changes**: Edit `frontend/src/pages/Index.tsx`
- **MCP tools**: Edit `src/mcp_server.py`
- **Configuration**: Update `env.example` and README

### Testing

- **Backend**: `curl http://localhost:8000/api/ping`
- **Frontend**: Visit `http://localhost:5173`
- **MCP**: Use Claude Desktop to test Instagram commands

## Troubleshooting

### Instagram API Issues
- Instagram access is handled by MCP server, not backend
- Check `get_system_status()` for connection details
- Consider browser automation as alternative

### OpenRouter Issues
- Verify API key in `.env`
- Check model name is correct
- Ensure `USE_OPENROUTER=1`

### MCP Connection
- Ensure MCP server is running: `python src/mcp_server.py`
- Check Claude Desktop MCP configuration
- Verify transport is set to "stdio"

### Frontend Issues
- Check if backend is running on port 8000
- Verify npm dependencies are installed
- Check browser console for errors

## Why This Approach

- **Control**: You decide when and how to respond
- **Privacy**: No background processes, no external databases
- **Simplicity**: JSON files, clear API, minimal dependencies
- **Reliability**: No polling, no cron jobs, no automation failures
- **Transparency**: All logic is explicit and visible
- **Separation**: Backend handles LLM, MCP handles Instagram

## License

MIT License - see LICENSE file for details.

---

Built for developers who want control over their automation tools. Fork, modify, and make it your own! 