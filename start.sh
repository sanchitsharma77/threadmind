#!/bin/bash

echo "🚀 Starting Instagram DM Concierge..."

# Start FastAPI backend
echo "📡 Starting FastAPI backend on port 8000..."
uvicorn main:app --reload --port 8000 --host 0.0.0.0 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "🎨 Starting Vite frontend on port 5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 3

echo ""
echo "✅ Instagram DM Concierge is running!"
echo "📡 Backend API: http://localhost:8000"
echo "🎨 Frontend UI: http://localhost:5173"
echo "📊 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for background processes
wait