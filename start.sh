#!/bin/bash

echo "🚀 Starting AI-Powered DM Automation"
echo "=================================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Please copy env.example to .env and configure your settings:"
    echo "   cp env.example .env"
    echo "   # Edit .env with your OpenRouter API key"
    exit 1
fi

# Safely load environment variables from .env
set -a
while IFS='=' read -r key value; do
  # Ignore comments and empty lines
  if [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] && [[ ! "$key" =~ ^# ]]; then
    export "$key"="${value%\"}"
  fi
done < .env
set +a

# Check OpenRouter API key
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "❌ OPENROUTER_API_KEY not set in .env"
    echo "🔑 Get your free API key from: https://openrouter.ai"
    exit 1
fi

echo "✅ Environment configured"
echo "🔑 OpenRouter API key: ${OPENROUTER_API_KEY:0:8}..."

# Initialize data files if they don't exist
echo "📁 Initializing data files..."
mkdir -p data
[ ! -f data/logs.json ] && echo '[]' > data/logs.json
[ ! -f data/targets.json ] && echo '[]' > data/targets.json

echo "✅ Data files ready"

# Check if Python dependencies need installation
echo "🔍 Checking Python dependencies..."
if ! python -c "import fastapi, uvicorn, requests, mcp" 2>/dev/null; then
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
    echo "✅ Python dependencies installed"
else
    echo "✅ Python dependencies already installed"
fi

# Check if frontend dependencies need installation
echo "🔍 Checking frontend dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi

echo ""
echo "🎯 AI-Powered DM Automation is ready!"
echo "======================"

# Auto-start both backend and frontend
echo ""
echo "🚀 Starting Backend and Frontend..."
echo "📡 API: http://localhost:8000"
echo "🌐 Dashboard: http://localhost:5173"
echo "Press Ctrl+C to stop both"
echo ""

# Start backend in background
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Verify backend started successfully
echo "⏳ Waiting for backend to start..."
for i in {1..10}; do
    if curl -s http://localhost:8000/api/ping > /dev/null 2>&1; then
        echo "✅ Backend started successfully"
        break
    fi
    sleep 1
    if [ $i -eq 10 ]; then
        echo "❌ Backend failed to start"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
done

# Wait a moment for backend to start
sleep 3

# Start frontend
cd frontend && npm run dev

# Kill backend when frontend stops
kill $BACKEND_PID 2>/dev/null