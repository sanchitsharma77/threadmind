#!/usr/bin/env python3
"""
Simple API test script for AI-Powered DM Automation
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def test_ping():
    """Test the ping endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/ping")
        if response.status_code == 200:
            print("✅ Ping endpoint working")
            return True
        else:
            print(f"❌ Ping failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ping error: {e}")
        return False

def test_logs():
    """Test the logs endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/logs")
        if response.status_code == 200:
            logs = response.json()
            print(f"✅ Logs endpoint working ({len(logs)} logs)")
            return True
        else:
            print(f"❌ Logs failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Logs error: {e}")
        return False

def test_stats():
    """Test the stats endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/stats")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Stats endpoint working (Total messages: {stats.get('totalMessages', 0)})")
            return True
        else:
            print(f"❌ Stats failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Stats error: {e}")
        return False

def test_process_messages():
    """Test the process_messages endpoint"""
    test_messages = [
        {
            "id": "test_1",
            "thread_id": "test_thread",
            "from_user": "test_user",
            "text": "Hello, what's your pricing?"
        }
    ]
    
    try:
        response = requests.post(
            f"{BASE_URL}/process_messages",
            headers={"Content-Type": "application/json"},
            json=test_messages
        )
        if response.status_code == 200:
            processed = response.json()
            print(f"✅ Process messages endpoint working ({len(processed)} processed)")
            return True
        else:
            print(f"❌ Process messages failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Process messages error: {e}")
        return False

def main():
    """Run all API tests"""
    print("🧪 Testing AI-Powered DM Automation API")
    print("=" * 50)
    
    # Wait for server to start
    print("⏳ Waiting for server to start...")
    time.sleep(2)
    
    tests = [
        ("Ping", test_ping),
        ("Logs", test_logs),
        ("Stats", test_stats),
        ("Process Messages", test_process_messages)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} test failed")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed! API is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the server logs.")
    
    return passed == total

if __name__ == "__main__":
    main() 