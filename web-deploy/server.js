#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve the landing page as default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

// Serve the Product Tree Manager
app.get('/product-tree', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        ollama_running: isOllamaRunning()
    });
});

// Global variables for Ollama process
let ollamaProcess = null;
let ollamaRunning = false;

// Function to check if Ollama is running
function isOllamaRunning() {
    return ollamaRunning;
}

// Function to start Ollama
function startOllama() {
    return new Promise((resolve, reject) => {
        console.log('🔧 Starting Ollama service...');
        
        ollamaProcess = spawn('ollama', ['serve'], {
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false
        });

        ollamaProcess.stdout.on('data', (data) => {
            console.log(`Ollama: ${data}`);
        });

        ollamaProcess.stderr.on('data', (data) => {
            console.error(`Ollama Error: ${data}`);
        });

        ollamaProcess.on('close', (code) => {
            console.log(`Ollama process exited with code ${code}`);
            ollamaRunning = false;
        });

        ollamaProcess.on('error', (error) => {
            console.error('Failed to start Ollama:', error);
            ollamaRunning = false;
            reject(error);
        });

        // Wait a moment for Ollama to start
        setTimeout(() => {
            ollamaRunning = true;
            console.log('✅ Ollama service started');
            resolve();
        }, 3000);
    });
}

// Function to check if model exists
async function checkModel(modelName = 'llama3.2:3b') {
    try {
        const response = await axios.get('http://localhost:11434/api/tags');
        const models = response.data.models || [];
        return models.some(model => model.name === modelName);
    } catch (error) {
        return false;
    }
}

// Function to pull model if it doesn't exist
async function pullModel(modelName = 'llama3.2:3b') {
    try {
        console.log(`📥 Pulling model: ${modelName}`);
        const response = await axios.post('http://localhost:11434/api/pull', {
            name: modelName,
            stream: false
        });
        console.log(`✅ Model ${modelName} pulled successfully`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to pull model ${modelName}:`, error.message);
        return false;
    }
}

// Initialize Ollama on startup
async function initializeOllama() {
    try {
        // Check if Ollama is already running
        try {
            await axios.get('http://localhost:11434/api/tags');
            ollamaRunning = true;
            console.log('✅ Ollama is already running');
        } catch (error) {
            // Ollama not running, start it
            await startOllama();
        }

        // Check if model exists
        const modelName = 'llama3.2:3b';
        const modelExists = await checkModel(modelName);
        
        if (!modelExists) {
            console.log(`📥 Model ${modelName} not found, pulling...`);
            await pullModel(modelName);
        } else {
            console.log(`✅ Model ${modelName} is available`);
        }

    } catch (error) {
        console.error('❌ Failed to initialize Ollama:', error.message);
    }
}

// API Routes

// Check AI status
app.get('/api/ai/status', async (req, res) => {
    try {
        if (!ollamaRunning) {
            return res.status(500).json({ 
                status: 'error',
                message: 'Ollama is not running'
            });
        }

        const response = await axios.get('http://localhost:11434/api/tags');
        res.json({ 
            status: 'connected',
            models: response.data.models || [],
            ollama_running: true
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error',
            message: 'Ollama is not accessible',
            error: error.message
        });
    }
});

// Chat with AI
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message, model = 'llama3.2:3b', context } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!ollamaRunning) {
            return res.status(500).json({ 
                error: 'Ollama is not running. Please restart the server.'
            });
        }

        // Build the prompt with context
        let prompt = message;
        if (context && context.productTree) {
            prompt = `You are analyzing a product tree with ${context.productTree.nodes.length} nodes and ${context.productTree.edges.length} relationships.

Product Tree Context:
${JSON.stringify(context.productTree, null, 2)}

User Question: ${message}

Please provide a detailed analysis focusing on the product tree structure, relationships, and any insights or recommendations.`;
        }

        const response = await axios.post('http://localhost:11434/api/generate', {
            model: model,
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 1000
            }
        });

        res.json({
            response: response.data.response,
            model: model,
            done: response.data.done
        });

    } catch (error) {
        console.error('AI API error:', error.message);
        res.status(500).json({ 
            error: 'Failed to communicate with AI',
            details: error.message
        });
    }
});

// Get available models
app.get('/api/ai/models', async (req, res) => {
    try {
        if (!ollamaRunning) {
            return res.status(500).json({ 
                error: 'Ollama is not running'
            });
        }

        const response = await axios.get('http://localhost:11434/api/tags');
        res.json({
            models: response.data.models || [],
            default: 'llama3.2:3b'
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to get models',
            details: error.message
        });
    }
});

// Pull a new model
app.post('/api/ai/pull-model', async (req, res) => {
    try {
        const { model } = req.body;
        if (!model) {
            return res.status(400).json({ error: 'Model name is required' });
        }

        if (!ollamaRunning) {
            return res.status(500).json({ 
                error: 'Ollama is not running'
            });
        }

        const success = await pullModel(model);
        
        if (success) {
            res.json({
                success: true,
                model: model,
                message: 'Model pulled successfully'
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to pull model'
            });
        }
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to pull model',
            details: error.message
        });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Product Tree Manager Server running on http://localhost:${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
    console.log('');
    
    // Initialize Ollama
    await initializeOllama();
    
    console.log('');
    console.log('🎉 Server is ready!');
    console.log(`🤖 AI: Ollama with llama3.2:3b model`);
    console.log(`🌐 Web: http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    
    if (ollamaProcess) {
        console.log('🛑 Stopping Ollama...');
        ollamaProcess.kill('SIGTERM');
    }
    
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    
    if (ollamaProcess) {
        ollamaProcess.kill('SIGTERM');
    }
    
    process.exit(0);
});
