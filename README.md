# Manage Product Tree

A comprehensive product tree management system that provides tools for creating, editing, and managing product hierarchies. This tool includes web interfaces, AI-powered assistance, and deployment options.

## 🚀 Features

- **Product Tree Editor**: Visual editor for creating and managing product trees
- **AI-Powered Assistance**: Integration with AI services for intelligent suggestions
- **Multiple Interfaces**: Web UI, AI-enhanced UI, and deployment-ready versions
- **XML Management**: Import/export product trees in XML format
- **Real-time Collaboration**: Multiple users can work on the same product tree
- **Version Control**: Track changes and maintain product tree history
- **Deployment Ready**: Docker and PM2 deployment configurations

## 📋 Prerequisites

- Node.js 16+
- Python 3.8+ (for AI features)
- npm or yarn
- Modern web browser

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/manage-product-tree.git
   cd manage-product-tree
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Set up Python environment (for AI features):**
   ```bash
   cd dot
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# AI Service Configuration (optional)
AI_SERVICE_URL=http://localhost:4000
AI_ENABLED=true

# Database Configuration
DB_PATH=product_trees.db
```

## 🚀 Usage

### 1. Basic Web Interface

```bash
npm start
# Navigate to http://localhost:3000
```

### 2. AI-Enhanced Interface

```bash
# Start the AI service first
cd dot
source venv/bin/activate
python main.py

# In another terminal, start the web interface
cd web-ai
npm start
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
manage-product-tree/
├── ui/                    # Basic web interface
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── web/                   # Enhanced web interface
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── web-ai/               # AI-enhanced interface
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── ollama-proxy.js
├── web-deploy/           # Production deployment
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── ecosystem.config.js
├── dot/                  # Python AI service
│   ├── main.py
│   ├── requirements.txt
│   └── venv/
└── docker-compose.yml   # Docker deployment
```

## 🔧 API Endpoints

### Product Tree Management
```http
GET /api/trees                    # List all product trees
POST /api/trees                   # Create new product tree
GET /api/trees/:id                # Get specific product tree
PUT /api/trees/:id                # Update product tree
DELETE /api/trees/:id             # Delete product tree
```

### AI Integration
```http
POST /api/ai/suggest              # Get AI suggestions
POST /api/ai/generate             # Generate product tree content
GET /api/ai/status                # Check AI service status
```

### Health Check
```http
GET /health                       # Service health check
```

## 🤖 AI Features

The AI-enhanced version includes:

- **Smart Suggestions**: AI-powered recommendations for product tree structure
- **Content Generation**: Automatic generation of product descriptions
- **Pattern Recognition**: Identify common patterns in product hierarchies
- **Optimization Suggestions**: Recommendations for improving product tree organization

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
- File upload restrictions
- CORS configuration
- Rate limiting
- Error handling

## 📊 Monitoring

Health check endpoint for monitoring:

```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "Manage Product Tree",
  "version": "1.0.0",
  "uptime": "2h 30m"
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
- AI integration
- Multiple deployment options
- RESTful API
- Docker support