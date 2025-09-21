#!/bin/bash

# Start Everything Script for Standalone Product Tree Manager
echo "🚀 Starting Standalone Product Tree Manager..."

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "⚠️  Ollama is not running. Starting Ollama..."
    ollama serve &
    sleep 3
    echo "✅ Ollama started"
else
    echo "✅ Ollama is already running"
fi

# Check if we have a model
if ! ollama list | grep -q "llama3.2"; then
    echo "📥 Downloading llama3.2:3b model..."
    ollama pull llama3.2:3b
    echo "✅ Model downloaded"
else
    echo "✅ Model already available"
fi

# Start the Dot service
echo "🔧 Starting Dot service..."
cd dot

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

# Start the service
python main.py &
DOT_PID=$!

# Wait for service to start
sleep 3

# Check if service started successfully
if curl -s http://localhost:8081/health > /dev/null; then
    echo "✅ Dot service is running on http://localhost:8081"
else
    echo "❌ Failed to start Dot service"
    kill $DOT_PID 2>/dev/null
    exit 1
fi

# Go back to parent directory
cd ..

echo ""
echo "🎉 Everything is ready!"
echo ""
echo "📱 To use the Product Tree Manager:"
echo "   1. Open: ui/index.html in your browser"
echo "   2. Or visit: http://localhost:3000 (if you start a web server)"
echo ""
echo "🤖 AI Model: llama3.2:3b running on Ollama"
echo "🔧 Dot Service: http://localhost:8081"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $DOT_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Set up signal handling
trap cleanup SIGINT SIGTERM

# Wait for the user to stop
wait
