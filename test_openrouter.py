#!/usr/bin/env python3
"""
Test script for OpenRouter DeepSeek R1 integration
"""

import os
from dotenv import load_dotenv
from utils.mcp_client import openrouter_chat_completion

def test_openrouter():
    """Test OpenRouter DeepSeek R1 integration"""
    load_dotenv()
    
    print("🧪 Testing OpenRouter DeepSeek R1 Integration")
    print("=" * 50)
    
    # Test 1: Simple greeting
    print("\n1. Testing simple greeting...")
    messages = [
        {"role": "user", "content": "Hello, what is your pricing?"}
    ]
    
    try:
        response = openrouter_chat_completion(messages)
        print(f"✅ Response: {response}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Instagram DM context
    print("\n2. Testing Instagram DM context...")
    messages = [
        {"role": "system", "content": "You are an Instagram DM assistant. Classify intent and provide a helpful response."},
        {"role": "user", "content": "user: Hi there\nassistant: Hello! How can I help you today?\nuser: What services do you offer?"}
    ]
    
    try:
        response = openrouter_chat_completion(messages)
        print(f"✅ Response: {response}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Test completed!")

if __name__ == "__main__":
    test_openrouter() 