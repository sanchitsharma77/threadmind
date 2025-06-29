﻿# AI-Powered DM Automation

A privacy-first, AI-powered Instagram DM automation system that provides intelligent reply suggestions while maintaining complete user control. Built with Claude Desktop integration, local data storage, and analytics.

## Overview

AI-Powered DM Automation is a comprehensive solution for managing Instagram direct messages with AI assistance. The system processes messages on-demand, generates contextual replies using DeepSeek R1, and provides detailed analytics—all while keeping your data private and local.

### Key Principles

- **Privacy-First**: No background polling, no automated responses, no external databases
- **User Control**: Manual review and approval of all AI suggestions
- **Local Storage**: All data stored in JSON files on your machine
- **Claude Integration**: Seamless integration with Claude Desktop via MCP
- **Enterprise Analytics**: Comprehensive dashboard with intent classification and performance metrics

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude Desktop│    │   Backend API   │    │   Frontend      │
│   (MCP Client)  │◄──►│   (FastAPI)     │◄──►│   (React)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Instagram     │    │   DeepSeek R1   │    │   Local Storage │
│   (via MCP)     │    │   (OpenRouter)  │    │   (JSON Files)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### System Components

- **MCP Server**: Handles Instagram access via Claude Desktop
- **Backend API**: Processes messages and generates AI suggestions
- **Frontend Dashboard**: Analytics, logs, and management interface
- **Local Storage**: JSON-based data persistence
- **Automation Scripts**: Full-cycle DM processing capabilities

## Features

### Core Functionality
- **Message Processing**: Intelligent classification and intent analysis
- **AI Reply Generation**: Contextual suggestions using DeepSeek R1
- **Manual Review**: Complete control over all responses
- **Analytics Dashboard**: Real-time statistics and performance metrics
- **Log Management**: Comprehensive activity tracking and export capabilities

### Advanced Features
- **Intent Classification**: Automatic categorization of message types
- **Response Time Tracking**: Performance monitoring and optimization
- **Custom Prompts**: Configurable AI behavior and tone
- **MCP Integration**: Seamless Claude Desktop workflow
- **Data Export**: CSV export for external analysis
- **Full Automation**: Optional script-based end-to-end processing

### Security & Privacy
- **Local Data Storage**: No external databases or cloud storage
- **Environment-Based Configuration**: Secure credential management
- **No Background Processes**: On-demand processing only
- **Transparent Operations**: All actions logged and visible

## Installation

### Prerequisites

- Python 3.8+
- Node.js 16+
- Claude Desktop
- Instagram account
- OpenRouter API key

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-dm-automation
   cd ai-dm-automation
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Start the system**
   ```bash
   ./start.sh
   ```

## Configuration

### Environment Variables

Create a `.env` file with the following configuration:

```bash
# OpenRouter Configuration (Required)
OPENROUTER_API_KEY=your_openrouter_api_key
USE_OPENROUTER=1
OPENROUTER_MODEL=deepseek/deepseek-r1

# Instagram Configuration (Choose one method)
# Method 1: Username/Password
INSTAGRAM_USERNAME=your_username
INSTAGRAM_PASSWORD=your_password

# Method 2: Session Cookies (Recommended)
INSTAGRAM_SESSIONID=your_sessionid_cookie
INSTAGRAM_DS_USER_ID=your_ds_user_id_cookie
INSTAGRAM_CSRFTOKEN=your_csrftoken_cookie
INSTAGRAM_MID=your_mid_cookie
INSTAGRAM_RUR=your_rur_cookie
```

### Data Files

The system uses the following local data files:

- `data/logs.json` - Message history and AI suggestions
- `data/tags.json` - Intent classification data
- `data/templates.json` - Response templates (if used)

## Usage

### Manual Workflow

1. **Start the system**
   ```bash
   ./start.sh
   ```

2. **Access the dashboard**
   - Open `http://localhost:5173` in your browser
   - Navigate to the "Chat" tab for active conversations

3. **Process messages via Claude Desktop**
   ```bash
   # In Claude Desktop:
   list_chats()                    # Get all DM threads
   list_messages("thread_id")      # Get messages from specific thread
   send_message("user", "reply")   # Send a reply
   mark_message_seen("thread_id")  # Mark messages as seen
   ```

4. **Review and manage**
   - Check the "Stats Overview" for analytics
   - Use the "Logs" tab for historical data
   - Export data as needed

### Automated Workflow

For full automation, use the provided script:

```bash
python scripts/auto_dm_full_cycle.py
```

This script will:
- Fetch all DM threads
- Process new messages
- Generate AI replies
- Send responses automatically
- Update logs and statistics

### API Endpoints

The backend provides the following REST API endpoints:

- `GET /api/ping` - Health check
- `GET /api/logs` - Retrieve message logs
- `GET /api/stats` - Get analytics data
- `POST /api/process_messages` - Process messages and get suggestions
- `GET /api/prompt` - Retrieve current AI prompt
- `POST /api/prompt` - Update AI prompt

## Dashboard Features

### Stats Overview
- **Message Analytics**: Total messages, response times, categorization
- **Intent Breakdown**: Visual representation of message types
- **Performance Metrics**: Response time tracking and optimization
- **LLM Prompt Builder**: Customize AI behavior and tone

### Logs Management
- **Search & Filter**: Find messages by content, date, or intent
- **Export Capabilities**: CSV export for external analysis
- **MCP Commands**: One-click copy for Claude Desktop integration
- **Activity Tracking**: Comprehensive audit trail

### Chat Interface
- **Thread Management**: View and manage all conversations
- **AI Suggestions**: Real-time reply recommendations
- **Quick Actions**: Copy commands and send replies
- **Conversation History**: Complete message context

### Playground
- **Testing Environment**: Safe testing of AI responses
- **Prompt Experimentation**: Try different AI configurations
- **Response Evaluation**: Assess AI reply quality
- **Training Tool**: Learn system capabilities

## Development

### Project Structure

```
ai-dm-automation/
├── api/
│   └── routes.py              # Backend API endpoints
├── frontend/
│   ├── src/
│   │   ├── pages/             # React components
│   │   ├── components/        # UI components
│   │   └── types/             # TypeScript definitions
│   └── package.json
├── src/
│   ├── mcp_server.py          # Claude Desktop MCP tools
│   └── authenticate_instagram.py
├── scripts/
│   ├── auto_dm_full_cycle.py  # Full automation script
│   ├── auto_reply.py          # Reply automation
│   └── normalize_logs.py      # Data normalization
├── data/                      # Local JSON storage
├── utils/
│   └── mcp_client.py          # LLM and data utilities
├── main.py                    # FastAPI server
├── start.sh                   # Startup script
└── requirements.txt
```

### Adding Features

#### Backend Development
- **New API endpoints**: Add to `api/routes.py`
- **LLM integration**: Modify `utils/mcp_client.py`
- **Data processing**: Extend existing functions or add new modules

#### Frontend Development
- **New pages**: Add to `frontend/src/pages/`
- **UI components**: Create in `frontend/src/components/`
- **Types**: Update `frontend/src/types/`

#### MCP Tools
- **Instagram functions**: Add to `src/mcp_server.py`
- **New commands**: Extend the MCP server interface

#### Automation
- **New scripts**: Add to `scripts/` directory
- **Workflow automation**: Create new automation patterns

### Testing

#### Backend Testing
```bash
# Test API endpoints
curl http://localhost:8000/api/ping
curl http://localhost:8000/api/stats
```

#### Frontend Testing
```bash
# Start frontend in development mode
cd frontend && npm run dev
# Visit http://localhost:5173
```

#### MCP Testing
```bash
# Test MCP server
python src/mcp_server.py
# Use Claude Desktop to test Instagram commands
```

#### Automation Testing
```bash
# Test full automation
python scripts/auto_dm_full_cycle.py
```

## Troubleshooting

### Common Issues

#### Backend Connection Issues
- **Problem**: Frontend can't connect to backend
- **Solution**: Ensure `python main.py` is running on port 8000
- **Check**: Verify no other services are using port 8000

#### MCP Connection Issues
- **Problem**: Claude Desktop can't connect to MCP server
- **Solution**: Ensure MCP server is running: `python src/mcp_server.py`
- **Check**: Verify Claude Desktop MCP configuration

#### Instagram Authentication Issues
- **Problem**: Can't access Instagram via MCP
- **Solution**: Check Instagram credentials in `.env`
- **Alternative**: Use session cookies instead of username/password

#### OpenRouter API Issues
- **Problem**: AI suggestions not generating
- **Solution**: Verify OpenRouter API key in `.env`
- **Check**: Ensure `USE_OPENROUTER=1` and correct model name

### Performance Optimization

#### System Performance
- **Regular log cleanup**: Export and clear old logs periodically
- **Prompt optimization**: Use concise, focused prompts
- **Service restarts**: Restart services weekly for optimal performance

#### Data Management
- **Backup strategy**: Regular exports of important data
- **Storage monitoring**: Monitor JSON file sizes
- **Data validation**: Use normalization scripts for data integrity

## Security Considerations

### Data Protection
- **Local storage**: All data remains on your machine
- **No external databases**: No cloud storage or third-party databases
- **Environment variables**: Sensitive data stored in `.env` file
- **Session management**: Secure Instagram session handling

### Access Control
- **Manual processing**: No automated responses without user approval
- **Audit trails**: Complete logging of all activities
- **Transparent operations**: All actions visible and traceable

### Best Practices
- **Regular updates**: Keep dependencies updated
- **Credential rotation**: Periodically update Instagram session
- **Backup procedures**: Regular data exports
- **Monitoring**: Regular review of logs and analytics

## Contributing

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

### Code Standards

- **Python**: Follow PEP 8 guidelines
- **JavaScript/TypeScript**: Use ESLint configuration
- **Documentation**: Update README and inline comments
- **Testing**: Include tests for new features

### Pull Request Process

1. **Describe the change**: Clear description of what was changed
2. **Include tests**: Add tests for new functionality
3. **Update documentation**: Modify README if needed
4. **Check compatibility**: Ensure changes work with existing features

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

1. **Check the documentation**: Review this README and inline documentation
2. **Use the dashboard**: The Documentation tab provides comprehensive guides
3. **Review logs**: Check system logs for error information
4. **Test in playground**: Use the Playground tab for safe experimentation

## Roadmap

### Planned Features
- **Enhanced Analytics**: More detailed performance metrics
- **Template System**: Pre-defined response templates
- **Multi-language Support**: Internationalization capabilities
- **Advanced Automation**: More sophisticated automation patterns
- **Integration APIs**: Third-party service integrations

### Performance Improvements
- **Caching System**: Improved response times
- **Batch Processing**: Efficient bulk operations
- **Data Compression**: Optimized storage usage
- **Async Processing**: Better concurrency handling

---

**AI-Powered DM Automation** - Empowering users with intelligent, privacy-first Instagram management tools.
