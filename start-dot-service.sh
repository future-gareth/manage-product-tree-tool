#!/bin/bash

# Auto-start script for Dot service
# This script will be called by the HTML page to start services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOT_DIR="$SCRIPT_DIR/dot"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to start Dot service
start_dot_service() {
    echo "Starting Dot service..."
    cd "$DOT_DIR"
    
    # Activate virtual environment if it exists
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi
    
    # Start the service in background
    python3 main.py > /dev/null 2>&1 &
    echo $! > "$SCRIPT_DIR/dot.pid"
    
    # Wait a moment for startup
    sleep 3
    
    # Check if it started successfully
    if check_port 8081; then
        echo "✅ Dot service started successfully on port 8081"
        return 0
    else
        echo "❌ Failed to start Dot service"
        return 1
    fi
}

# Main logic
if check_port 8081; then
    echo "✅ Dot service is already running on port 8081"
    exit 0
else
    echo "🔧 Dot service not running, starting it..."
    if start_dot_service; then
        echo "🎉 Dot service is now running!"
        exit 0
    else
        echo "💥 Failed to start Dot service"
        exit 1
    fi
fi
