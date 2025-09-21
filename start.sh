#!/bin/bash

# Start the standalone Product Tree Manager
echo "Starting Standalone Product Tree Manager..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed."
    exit 1
fi

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "pip3 is required but not installed."
    exit 1
fi

# Install Python dependencies for Dot service
echo "Installing Python dependencies..."
cd dot
pip3 install -r requirements.txt

# Start the Dot service in the background
echo "Starting Dot service on port 8081..."
python3 main.py &
DOT_PID=$!

# Wait a moment for the service to start
sleep 3

# Check if the service started successfully
if curl -s http://localhost:8081/health > /dev/null; then
    echo "✅ Dot service is running on http://localhost:8081"
else
    echo "❌ Failed to start Dot service"
    kill $DOT_PID 2>/dev/null
    exit 1
fi

# Start a simple HTTP server for the UI
echo "Starting UI server on port 3000..."
cd ../ui

# Check if we can start a simple server
if command -v python3 &> /dev/null; then
    echo "✅ UI available at http://localhost:3000"
    echo "Press Ctrl+C to stop both services"
    python3 -m http.server 3000
elif command -v node &> /dev/null; then
    echo "✅ UI available at http://localhost:3000"
    echo "Press Ctrl+C to stop both services"
    npx serve . -p 3000
else
    echo "⚠️  No suitable web server found. You can:"
    echo "   1. Open ui/index.html directly in your browser"
    echo "   2. Use any web server to serve the ui/ directory"
    echo "   3. Install Python or Node.js for automatic serving"
fi

# Cleanup function
cleanup() {
    echo "Stopping services..."
    kill $DOT_PID 2>/dev/null
    exit 0
}

# Set up signal handling
trap cleanup SIGINT SIGTERM

# Wait for the user to stop
wait
