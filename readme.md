# Instagram DM Concierge

A **local, privacy-first Instagram DM automation system** powered by Claude Desktop and Gala Labs MCP. Automatically responds to Instagram DMs using customizable templates, all running locally on your machine.

## 🚀 Features

- **🤖 Automated DM Responses**: Polls Instagram DMs every 5 minutes and auto-replies using templates
- **🎯 Smart Classification**: Rule-based message classification (no LLMs needed)
- **📝 Editable Templates**: Manage response templates via beautiful dashboard
- **👥 Target Management**: Track specific users for auto-responses
- **📊 Real-time Stats**: Monitor response rates, latency, and success metrics
- **🔒 Privacy First**: Everything runs locally - no cloud, no external APIs
- **🎨 Beautiful UI**: Modern dashboard built with React + Tailwind CSS

## 🛠 Tech Stack

- **Backend**: FastAPI (Python 3.11+)
- **Frontend**: React + Vite + Tailwind CSS
- **Instagram Integration**: Gala Labs MCP (Model Context Protocol)
- **Storage**: Local JSON files (no database)
- **AI Agent**: Claude Desktop for MCP execution

## 📁 Project Structure

```
project/
├── main.py                 # FastAPI server entrypoint
├── api/
│   └── routes.py          # REST API endpoints
├── tasks/
│   └── dm_poller.py       # DM polling and response logic
├── utils/
│   └── mcp_client.py      # MCP tool wrappers
├── data/
│   ├── templates.json     # Response templates
│   ├── targets.json       # Tracked users
│   └── logs.json          # Interaction history
├── frontend/              # React dashboard
├── start.sh               # Startup script
└── README.md
```

## ⚡️ Quick Start

### Prerequisites

1. **Python 3.11+** installed
2. **Node.js 18+** installed
3. **Claude Desktop** with MCP configured
4. **Gala Labs MCP** (https://github.com/trypeggy/instagram_dm_mcp) cloned and working

### Installation

1. **Clone this repository**:
   ```bash
   git clone <your-repo-url>
   cd instagram-dm-concierge
   ```

2. **Install Python dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

3. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```
   
4. **Configure Claude Desktop MCP**:
   - Ensure Gala Labs MCP is running in Claude Desktop
   - Test Instagram login via MCP
   
### Running the System
   
1. **Start everything with one command**:
   ```bash
   bash start.sh
   ```

2. **Open your browser**:
   - **Dashboard**: http://localhost:5173
   - **API Docs**: http://localhost:8000/docs
   - **Backend**: http://localhost:8000

3. **Run the DM poller** (in a separate terminal):
   ```bash
   python tasks/dm_poller.py
   ```

## 🎯 How It Works

### 1. DM Polling
- The `dm_poller.py` runs every 5 minutes
- Fetches recent DMs using Gala Labs MCP
- Classifies messages using keyword rules
- Matches with response templates
- Sends auto-replies and logs everything

### 2. Message Classification
Messages are classified based on keywords:
- **Pricing**: "price", "cost", "how much"
- **Support**: "problem", "issue", "help", "broken"
- **Greeting**: "hello", "hi", "hey"
- **General**: Everything else

### 3. Template System
- Create templates with tags (pricing, support, etc.)
- Templates are matched to classified messages
- All responses are logged with metadata

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ping` | GET | Health check |
| `/api/stats` | GET | Dashboard statistics |
| `/api/templates` | GET/POST | Manage response templates |
| `/api/templates/{id}` | PUT/DELETE | Update/delete templates |
| `/api/targets` | GET/POST | Manage tracked users |
| `/api/log` | GET | View interaction history |

## 🎨 Dashboard Features

- **Stats Overview**: Real-time metrics and performance data
- **Template Manager**: Create, edit, and organize response templates
- **Target Management**: Add/remove users to track for auto-responses
- **Activity Log**: View all DM interactions and responses

## 🔧 Configuration

### Adding Templates
1. Go to the Templates tab in the dashboard
2. Click "Add Template"
3. Set a tag (pricing, support, greeting, general)
4. Write your response text
5. Save and it's ready to use

### Adding Targets
1. Go to the Targets tab
2. Add Instagram usernames to track
3. Only DMs from these users will trigger auto-responses

### Customizing Classification
Edit the `classify()` function in `tasks/dm_poller.py` to add your own keywords and tags.

## 🧪 Testing

### Test the Backend
```bash
# Test health check
curl http://localhost:8000/api/ping

# Test stats endpoint
curl http://localhost:8000/api/stats

# Add a template
curl -X POST http://localhost:8000/api/templates \
  -H "Content-Type: application/json" \
  -d '{"tag": "pricing", "text": "Our pricing starts at $99/month"}'
```

### Test the Poller
```bash
# Run poller manually
python tasks/dm_poller.py

# Check logs
cat data/logs.json
```

## 🚨 Troubleshooting

### Common Issues

1. **MCP Connection Failed**
   - Ensure Claude Desktop is running
   - Check MCP configuration in Claude Desktop
   - Verify Instagram credentials are set up

2. **Frontend Not Loading**
   - Check if Vite is running on port 5173
   - Ensure all frontend dependencies are installed
   - Check browser console for errors

3. **Backend API Errors**
   - Verify FastAPI is running on port 8000
   - Check API documentation at http://localhost:8000/docs
   - Review backend logs for errors

4. **Poller Not Working**
   - Ensure you have templates and targets configured
   - Check poller logs for MCP errors
   - Verify Instagram login is working

### Debug Mode
Run the poller with verbose logging:
```bash
python -u tasks/dm_poller.py
```

## 🔒 Privacy & Security

- **Local Only**: All data stays on your machine
- **No Cloud**: No external APIs or cloud services
- **No Database**: Simple JSON file storage
- **No Authentication**: Local machine access only
- **File Locking**: Prevents data corruption during writes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Gala Labs** for the Instagram MCP server
- **Anthropic** for Claude Desktop
- **FastAPI** for the backend framework
- **Vite + React** for the frontend

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Open an issue on GitHub

---

**Ready to automate your Instagram DMs? Start with `bash start.sh` and enjoy your new DM concierge! 🚀** 