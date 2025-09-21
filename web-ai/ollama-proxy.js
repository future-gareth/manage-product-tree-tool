#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3001; // Different port from the web server
const OLLAMA_URL = 'http://localhost:11434';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        ollama_url: OLLAMA_URL
    });
});

// Check if Ollama is running
app.get('/api/ollama/status', async (req, res) => {
    try {
        const response = await axios.get(`${OLLAMA_URL}/api/tags`);
        res.json({ 
            status: 'connected',
            models: response.data.models || [],
            ollama_url: OLLAMA_URL
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error',
            message: 'Ollama is not running or not accessible',
            error: error.message,
            ollama_url: OLLAMA_URL
        });
    }
});

// Chat with Ollama
app.post('/api/ollama/chat', async (req, res) => {
    try {
        const { message, model = 'llama3.2:3b', context } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
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

        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
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
        console.error('Ollama API error:', error.message);
        res.status(500).json({ 
            error: 'Failed to communicate with Ollama',
            details: error.message
        });
    }
});

// Get available models
app.get('/api/ollama/models', async (req, res) => {
    try {
        const response = await axios.get(`${OLLAMA_URL}/api/tags`);
        res.json({
            models: response.data.models || [],
            default: 'llama3.2:3b'
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to get models from Ollama',
            details: error.message
        });
    }
});

// Pull a model (if needed)
app.post('/api/ollama/pull', async (req, res) => {
    try {
        const { model } = req.body;
        if (!model) {
            return res.status(400).json({ error: 'Model name is required' });
        }

        const response = await axios.post(`${OLLAMA_URL}/api/pull`, {
            name: model,
            stream: false
        });

        res.json({
            success: true,
            model: model,
            message: 'Model pulled successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to pull model',
            details: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Ollama Proxy Server running on http://localhost:${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
    console.log(`🤖 Connecting to Ollama at ${OLLAMA_URL}`);
    console.log('');
    console.log('Make sure Ollama is running:');
    console.log('  ollama serve');
    console.log('');
    console.log('And you have the model:');
    console.log('  ollama pull llama3.2:3b');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Ollama Proxy Server...');
    process.exit(0);
});
