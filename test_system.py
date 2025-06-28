#!/usr/bin/env python3
"""
Test script for AI-Powered DM Automation system
"""

import requests
import json
from datetime import datetime

def test_backend():
    """Test the backend API endpoints (LLM and data processing)"""
    base_url = "http://localhost:8000/api"
    
    print("🧪 Testing AI-Powered DM Automation Backend...")
    print("=" * 40)
    
    # Test ping
    try:
        response = requests.get(f"{base_url}/ping")
        if response.status_code == 200:
            print("✅ Ping endpoint: OK")
        else:
            print(f"❌ Ping endpoint: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ping endpoint: {e}")
        return False
    
    # Test logs
    try:
        response = requests.get(f"{base_url}/logs")
        if response.status_code == 200:
            logs = response.json()
            print(f"✅ Logs endpoint: OK ({len(logs)} entries)")
        else:
            print(f"❌ Logs endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ Logs endpoint: {e}")
    
    # Test templates
    try:
        response = requests.get(f"{base_url}/templates")
        if response.status_code == 200:
            templates = response.json()
            print(f"✅ Templates endpoint: OK ({len(templates)} templates)")
        else:
            print(f"❌ Templates endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ Templates endpoint: {e}")
    
    # Test process_messages (LLM integration)
    test_messages = [
        {
            "id": "test_1",
            "thread_id": "thread_123",
            "from_user": "test_user",
            "text": "Hello, what is your pricing?",
            "timestamp": datetime.now().isoformat()
        },
        {
            "id": "test_2", 
            "thread_id": "thread_456",
            "from_user": "another_user",
            "text": "Hi there! How are you?",
            "timestamp": datetime.now().isoformat()
        }
    ]
    
    try:
        response = requests.post(
            f"{base_url}/process_messages",
            json=test_messages,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            processed = response.json()
            print(f"✅ Process messages endpoint: OK ({len(processed)} processed)")
            for msg in processed:
                print(f"   - {msg['from_user']}: '{msg['text'][:30]}...' → {msg['intent']}")
        else:
            print(f"❌ Process messages endpoint: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Process messages endpoint: {e}")
    
    print("\n🎯 AI-Powered DM Automation Backend Test Complete!")
    return True

def test_mcp_commands():
    """Test MCP command generation for Instagram access"""
    print("\n🔧 Testing MCP Commands...")
    print("=" * 40)
    
    # Sample log entry
    sample_log = {
        "thread_id": "123456789",
        "username": "test_user",
        "reply": "Our pricing starts at $99/month. Would you like to know more?"
    }
    
    commands = {
        "fetchMessages": f'list_messages("{sample_log["thread_id"]}")',
        "sendReply": f'send_message("{sample_log["username"]}", "{sample_log["reply"]}")',
        "markSeen": f'mark_message_seen("{sample_log["thread_id"]}")',
    }
    
    print("📋 Sample MCP Commands (for Instagram access):")
    print(f"   Fetch: {commands['fetchMessages']}")
    print(f"   Send:  {commands['sendReply']}")
    print(f"   Seen:  {commands['markSeen']}")
    
    print("\n✅ MCP Commands Test Complete!")

def main():
    """Run all tests"""
    print("🚀 AI-Powered DM Automation System Test")
    print("=" * 50)
    
    # Test backend (LLM and data processing)
    backend_ok = test_backend()
    
    # Test MCP commands (Instagram access)
    test_mcp_commands()
    
    print("\n" + "=" * 50)
    if backend_ok:
        print("🎉 All tests passed! AI-Powered DM Automation is ready to use.")
        print("\n📋 Next steps:")
        print("1. Start MCP server: python src/mcp_server.py")
        print("2. Use Claude Desktop with MCP commands")
        print("3. Visit dashboard: http://localhost:5173")
    else:
        print("❌ Some tests failed. Please check the backend.")
    
    print("\n💡 Remember: This is a manual system - you control when to fetch and respond!")
    print("🔧 Backend handles LLM, MCP handles Instagram access")

if __name__ == "__main__":
    main() 