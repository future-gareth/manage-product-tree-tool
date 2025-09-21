# Use Ubuntu as base image
FROM ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=18

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs

# Install Ollama
RUN curl -fsSL https://ollama.ai/install.sh | sh

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy application files
COPY . .

# Create public directory if it doesn't exist
RUN mkdir -p public

# Expose port
EXPOSE 3000

# Create startup script
RUN echo '#!/bin/bash\n\
echo "🚀 Starting Product Tree Manager with AI..."\n\
echo "📦 Installing dependencies..."\n\
npm install\n\
echo "🤖 Starting Ollama..."\n\
ollama serve &\n\
sleep 5\n\
echo "📥 Pulling AI model..."\n\
ollama pull llama3.2:3b\n\
echo "🌐 Starting web server..."\n\
node server.js' > start.sh && chmod +x start.sh

# Start the application
CMD ["./start.sh"]
