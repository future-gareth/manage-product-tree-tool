#!/bin/bash

# Product Tree Manager with Local AI - Startup Script
echo "🚀 Starting Product Tree Manager with Local AI..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   Visit: https://nodejs.org/"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed. Please install Ollama first:"
    echo "   Visit: https://ollama.ai/"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if Ollama is running
if ! pgrep -x "ollama" > /dev/null; then
    echo "🔧 Starting Ollama service..."
    ollama serve &
    sleep 3
    echo "✅ Ollama service started"
else
    echo "✅ Ollama is already running"
fi

# Check if the model is available
MODEL_NAME="llama3.2:3b"
if ! ollama list | grep -q "$MODEL_NAME"; then
    echo "📥 Downloading AI model: $MODEL_NAME (this may take a few minutes)..."
    ollama pull "$MODEL_NAME"
    echo "✅ Model $MODEL_NAME downloaded"
else
    echo "✅ Model $MODEL_NAME is already available"
fi

# Install Node.js dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
    echo "✅ Dependencies installed"
fi

# Start the Ollama proxy server
echo "🌐 Starting Ollama proxy server..."
node ollama-proxy.js &
PROXY_PID=$!

# Wait a moment for the server to start
sleep 3

# Check if the server started successfully
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Ollama proxy server is running on http://localhost:3001"
else
    echo "❌ Failed to start Ollama proxy server"
    kill $PROXY_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 Everything is ready!"
echo ""
echo "📱 Open your browser and go to:"
echo "   http://localhost:3001"
echo ""
echo "🤖 AI Model: $MODEL_NAME running on Ollama"
echo "🔧 Proxy Server: http://localhost:3001"
echo ""
echo "🛑 To stop everything, press Ctrl+C"

# Keep the script running to keep background processes alive
wait $PROXY_PID
