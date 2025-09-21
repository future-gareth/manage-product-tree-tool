# Manage Product Tree

A comprehensive product tree management system that provides tools for creating, editing, and managing product hierarchies. This tool includes a web interface with AI-powered assistance using Ollama for intelligent suggestions.

## 🚀 Features

- **Product Tree Editor**: Visual editor for creating and managing product trees
- **AI-Powered Assistance**: Integration with Ollama for intelligent suggestions
- **XML Management**: Import/export product trees in XML format
- **Real-time Collaboration**: Multiple users can work on the same product tree
- **Version Control**: Track changes and maintain product tree history
- **Deployment Ready**: Docker and PM2 deployment configurations
- **Health Monitoring**: Built-in health check and Ollama status monitoring

## 📋 Prerequisites

- Node.js 16+
- Ollama (for AI features)
- npm or yarn
- Modern web browser

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/future-gareth/manage-product-tree-tool.git
   cd manage-product-tree-tool
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Install Ollama (for AI features):**
   ```bash
   # macOS
   brew install ollama

   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh

   # Windows
   # Download from https://ollama.ai/download
   ```

4. **Pull a model for AI features:**
   ```bash
   ollama pull llama2
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama2
```

## 🚀 Usage

### 1. Basic Web Interface

```bash
npm start
# Navigate to http://localhost:3000
```

### 2. AI-Enhanced Interface

The AI features are automatically available when Ollama is running:

```bash
# Start Ollama (if not already running)
ollama serve

# Start the web interface
npm start
# Navigate to http://localhost:3000/product-tree
```

### 3. Production Deployment

```bash
# Using PM2
pm2 start ecosystem.config.js

# Using Docker
docker-compose up -d
```

## 📁 File Structure

```
manage-product-tree-tool/
├── web-deploy/           # Production deployment
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   ├── ecosystem.config.js
│   ├── landing.html
│   └── public/           # Frontend interface
│       ├── index.html
│       ├── styles.css
│       ├── app.js
│       └── fonts/
├── dot/                  # Python AI service (legacy)
│   ├── main.py
│   ├── requirements.txt
│   └── venv/
└── docker-compose.yml   # Docker deployment
```

## 🔧 API Endpoints

### Product Tree Management
```http
GET /product-tree          # Product tree editor interface
GET /                      # Landing page
```

### AI Integration
```http
POST /api/ollama/generate  # Generate AI suggestions using Ollama
GET /api/ollama/status     # Check Ollama service status
```

### Health Check
```http
GET /health                # Service health check
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "ollama_running": true
}
```

## 🤖 AI Features

The AI-enhanced version includes:

- **Smart Suggestions**: AI-powered recommendations for product tree structure
- **Content Generation**: Automatic generation of product descriptions
- **Pattern Recognition**: Identify common patterns in product hierarchies
- **Optimization Suggestions**: Recommendations for improving product tree organization

### Ollama Integration

The system integrates with Ollama for AI features:

- **Automatic Detection**: Detects if Ollama is running
- **Model Management**: Supports different Ollama models
- **Real-time Generation**: Generate AI suggestions on demand
- **Health Monitoring**: Monitors Ollama service status

## 🚀 Deployment Options

### 1. PM2 (Recommended for production)
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2. Docker
```bash
docker-compose up -d
```

### 3. Manual Node.js
```bash
npm start
```

## 🔧 Configuration Files

### PM2 Configuration (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'manage-product-tree',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### Docker Compose
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
```

## 🔒 Security

- Input validation and sanitization
- CORS configuration
- Error handling
- Health monitoring

## 📊 Monitoring

Health check endpoint for monitoring:

```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "ollama_running": true
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

## 🔄 Changelog

### v1.0.0
- Initial release
- Product tree editor
- Ollama AI integration
- Multiple deployment options
- RESTful API
- Docker support