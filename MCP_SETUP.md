# MCP Server Setup Guide

## Current Status
Your system is currently running with **mock data** for testing. To use **real Instagram DMs**, you need to set up the MCP server authentication.

## Quick Test
The system works with mock data:
```bash
python tasks/run_poller_once.py
```
This will process mock messages and generate AI responses.

## Setup Real Instagram Integration

### 1. Install Dependencies
```bash
pip install instagrapi python-dotenv
```

### 2. Create Environment File
Create `.env` file in the root directory:
```env
INSTAGRAM_USERNAME=your_instagram_username
INSTAGRAM_PASSWORD=your_instagram_password
```

### 3. Authenticate Instagram Client
Run the authentication script:
```bash
python src/authenticate_instagram.py
```

### 4. Test MCP Server
```bash
python src/mcp_server.py
```

### 5. Verify Integration
Once authenticated, your poller will use real Instagram DMs instead of mock data.

## Troubleshooting

### Authentication Issues
- **2FA Required**: If you have 2FA enabled, you may need to generate an app password
- **Session Expired**: Delete session files and re-authenticate
- **Rate Limits**: Instagram may temporarily block requests if too frequent

### MCP Server Issues
- **Import Errors**: Ensure all dependencies are installed
- **Connection Issues**: Check if Instagram is accessible from your network

## Current Configuration
- **Mock Mode**: ✅ Working (for testing)
- **Real MCP Mode**: ⚠️ Requires authentication setup

## Next Steps
1. Set up Instagram authentication
2. Test with real DMs
3. Monitor for rate limits and errors

## Fallback Behavior
If MCP authentication fails, the system automatically falls back to mock data, so your testing can continue uninterrupted. 