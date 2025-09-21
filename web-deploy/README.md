# Product Tree Manager - Web Deployable with AI

A complete web-deployable version of the Product Tree Manager that runs Ollama and the AI model on the same server.

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Build and run with Docker
docker build -t product-tree-manager .
docker run -p 3000:3000 product-tree-manager
```

### Option 2: Manual Setup

```bash
# Install dependencies
npm install

# Start the server (includes Ollama)
npm start
```

Then open: http://localhost:3000

## 🌐 Deployment Options

### 1. Cloud Platforms

**Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Railway:**
```bash
# Connect GitHub repo to Railway
# Railway will auto-detect and deploy
```

**DigitalOcean App Platform:**
```bash
# Connect GitHub repo
# Set build command: npm install
# Set run command: npm start
```

### 2. VPS/Server Deployment

```bash
# On your server
git clone <your-repo>
cd product-tree-manager
npm install
npm start
```

### 3. Docker Deployment

```bash
# Build image
docker build -t product-tree-manager .

# Run container
docker run -d -p 3000:3000 --name product-tree product-tree-manager
```

## 🤖 AI Model Management

### Default Model
- **Model**: `llama3.2:3b` (3 billion parameters)
- **Size**: ~2GB download
- **Performance**: Good for analysis tasks

### Changing Models

**Via API:**
```bash
# Pull a new model
curl -X POST http://localhost:3000/api/ai/pull-model \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.1:8b"}'
```

**Available Models:**
- `llama3.2:3b` - Fast, lightweight
- `llama3.1:8b` - Better quality
- `mistral:7b` - Alternative option
- `codellama:7b` - Code-focused

### Model Configuration

Edit `server.js` to change default model:
```javascript
const DEFAULT_MODEL = 'llama3.1:8b'; // Change this
```

## 📁 Project Structure

```
web-deploy/
├── server.js              # Main server with Ollama integration
├── package.json           # Node.js dependencies
├── Dockerfile            # Docker configuration
├── .env.example          # Environment variables template
├── public/               # Frontend files
│   ├── index.html       # Main HTML page
│   ├── styles.css       # Styling
│   └── app.js           # Frontend JavaScript
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:
```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# AI Model Configuration
DEFAULT_MODEL=llama3.2:3b
OLLAMA_URL=http://localhost:11434
```

### Customizing AI Behavior

Edit the prompt in `server.js`:
```javascript
// In the /api/ai/chat endpoint
let prompt = `You are a product management expert analyzing a product tree...`;
```

## 🚀 Features

### ✅ What's Included
- **Full AI Integration** - Real Ollama LLM on same server
- **Model Management** - Pull/switch models via API
- **Web Interface** - Complete product tree management
- **XML Import/Export** - Full file handling
- **Jira Export** - CSV format for Jira import
- **Debug Tools** - Comprehensive analysis
- **Docker Support** - Easy deployment

### 🎯 AI Capabilities
- **Deep Analysis** - Understands product hierarchies
- **Pattern Recognition** - Finds duplicates and issues
- **Strategic Insights** - Provides recommendations
- **Context Awareness** - Uses full product tree data

## 📊 Performance

### Resource Requirements
- **RAM**: 4GB minimum (8GB recommended)
- **CPU**: 2+ cores
- **Storage**: 5GB+ (for models)
- **Network**: Standard web hosting

### Model Performance
- **llama3.2:3b**: ~2GB RAM, fast responses
- **llama3.1:8b**: ~8GB RAM, better quality
- **mistral:7b**: ~7GB RAM, good alternative

## 🔒 Security

- **No API Keys** - Uses local Ollama
- **No External Calls** - Everything runs on your server
- **CORS Enabled** - Configurable for your domain
- **Environment Variables** - Secure configuration

## 🛠️ Troubleshooting

### Common Issues

**Ollama won't start:**
```bash
# Check if Ollama is installed
ollama --version

# Manually start Ollama
ollama serve
```

**Model download fails:**
```bash
# Check disk space
df -h

# Try pulling model manually
ollama pull llama3.2:3b
```

**Server won't start:**
```bash
# Check Node.js version
node --version

# Install dependencies
npm install
```

### Logs

Check server logs for detailed error information:
```bash
# Docker logs
docker logs product-tree

# Manual server logs
npm start
```

## 🔄 Updates

### Updating the Application
```bash
git pull origin main
npm install
npm start
```

### Updating AI Models
```bash
# Pull latest model version
curl -X POST http://localhost:3000/api/ai/pull-model \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.2:3b"}'
```

## 📞 Support

For issues:
1. Check server logs
2. Verify Ollama is running
3. Check model availability
4. Ensure sufficient resources

---

**Ready to deploy?** Choose your preferred method and start using the Product Tree Manager with real AI!
