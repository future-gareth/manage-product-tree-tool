#!/bin/bash

# Product Tree Manager - Auto Starter
# Double-click this file to start everything

echo "🚀 Starting Product Tree Manager..."
echo ""

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

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first:"
    echo "   Visit: https://python.org/"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama is not installed. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install ollama
    else
        echo "❌ Homebrew is not installed. Please install Ollama manually:"
        echo "   Visit: https://ollama.ai/"
        echo ""
        read -p "Press Enter to exit..."
        exit 1
    fi
fi

# Start Ollama if not running
if ! pgrep -x "ollama" > /dev/null; then
    echo "🔧 Starting Ollama service..."
    ollama serve &
    sleep 3
fi

# Pull a lightweight model if not present
MODEL_NAME="llama3.2:3b"
if ! ollama list | grep -q "$MODEL_NAME"; then
    echo "📥 Downloading AI model: $MODEL_NAME (this may take a few minutes)..."
    ollama pull "$MODEL_NAME"
fi

# Set up Python virtual environment for Dot service
echo "🔧 Setting up Python environment..."
cd dot
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
cd ..

# Start the auto-starter
echo "🌐 Starting web server and auto-starter..."
echo ""
echo "📱 The application will open in your browser automatically"
echo "💡 If it doesn't open, go to: http://localhost:3000"
echo ""
echo "🛑 To stop everything, close this window or press Ctrl+C"
echo ""

# Start the auto-starter and open browser
node auto-start.js &
AUTO_START_PID=$!

# Wait a moment for the server to start
sleep 2

# Open browser
if command -v open &> /dev/null; then
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
fi

# Keep the script running
wait $AUTO_START_PID
