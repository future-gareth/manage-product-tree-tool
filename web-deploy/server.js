#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        ai_service: 'centralised-ai-service'
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint called');
    res.json({ status: 'ok', message: 'Server is responding' });
});

// Test API endpoint
app.get('/api/test', (req, res) => {
    console.log('🧪 Test API endpoint called');
    res.json({ 
        message: 'API routing is working!',
        timestamp: new Date().toISOString()
    });
});

// Function to call the Centralised AI Service
async function callCentralisedAI(prompt, context = '') {
    try {
        // Use environment variable for AI service port, default to 4000 for server
        const aiServicePort = process.env.AI_SERVICE_PORT || '4000';
        const response = await axios.post(`http://127.0.0.1:${aiServicePort}/internal/ai/generate`, {
            prompt: prompt,
            context: context,
            task_type: 'product_tree_analysis',
            max_tokens: 2048,
            temperature: 0.7,
            top_p: 0.9
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000  // Reduced timeout since we're sending smaller requests
        });

        if (response.status === 200) {
            return response.data.response;
        } else {
            throw new Error(`AI service returned status ${response.status}`);
        }
    } catch (error) {
        console.error('Error calling Centralised AI Service:', error.message);
        console.error('Full error:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}

// API Routes

// Check AI status
app.get('/api/ai/status', async (req, res) => {
    try {
        // Test connection to Centralised AI Service
        // Use environment variable for AI service port, default to 4000 for server
        const aiServicePort = process.env.AI_SERVICE_PORT || '4000';
        const response = await axios.get(`http://127.0.0.1:${aiServicePort}/health`, { timeout: 5000 });
        
        res.json({ 
            status: 'connected',
            ai_service: 'centralised-ai-service',
            service_status: response.data.status || 'unknown'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error',
            message: 'Centralised AI Service is not accessible',
            error: error.message
        });
    }
});

// Chat with AI
app.post('/api/ai/chat', async (req, res) => {
    console.log('📨 Received AI chat request:', req.body);
    try {
        const { message, context } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Build the prompt with context
        let prompt = message;
        
        // Handle different context formats
        if (context) {
            if (typeof context === 'string') {
                try {
                    // Try to parse as JSON first (detailed context)
                    const contextObj = JSON.parse(context);
                    if (contextObj.selectedItem) {
                        // Detailed context from frontend
                        prompt = `You are analyzing the product tree item "${contextObj.selectedItem.title}" (${contextObj.selectedItem.type}).

CURRENT ITEM DETAILS:
- Title: ${contextObj.selectedItem.title}
- Type: ${contextObj.selectedItem.type}
- Status: ${contextObj.selectedItem.status || 'Not specified'}
- Priority: ${contextObj.selectedItem.priority || 'Not specified'}
- Team: ${contextObj.selectedItem.team || 'Not specified'}
- Summary: ${contextObj.selectedItem.summary || 'No summary available'}
- Description: ${contextObj.selectedItem.description || 'No description available'}

CHILDREN (${contextObj.children.length} items):
${contextObj.children.map(child => `- ${child.title} (${child.type}, Status: ${child.status || 'Not specified'}, Priority: ${child.priority || 'Not specified'})`).join('\n')}

PARENT CONTEXT:
${contextObj.parent ? `- Parent: ${contextObj.parent.title} (${contextObj.parent.type}, Status: ${contextObj.parent.status || 'Not specified'})` : 'No parent (root level)'}

SIBLINGS (${contextObj.siblings.length} items):
${contextObj.siblings.map(sibling => `- ${sibling.title} (${sibling.type}, Status: ${sibling.status || 'Not specified'})`).join('\n')}

User Question: ${message}

Please provide specific, actionable analysis based on the actual data above. Focus on:
1. Current progress and status of the selected item
2. Progress of child items and their impact
3. Dependencies and relationships
4. Specific recommendations for improvement
5. Risk factors and bottlenecks

Be specific and reference the actual items mentioned above.`;
                    } else {
                        // Fallback to simple string context
                        prompt = `${context}

User Question: ${message}

Please provide helpful analysis and recommendations.`;
                    }
                } catch (e) {
                    // Not JSON, treat as simple string
                    prompt = `${context}

User Question: ${message}

Please provide helpful analysis and recommendations.`;
                }
            } else if (context.productTree) {
                // Context is an object with productTree (from other tools)
                const treeSummary = {
                    totalNodes: context.productTree.nodes?.length || 0,
                    totalEdges: context.productTree.edges?.length || 0,
                    rootNodes: context.productTree.children?.map(child => ({
                        id: child.id,
                        title: child.title,
                        type: child.type,
                        childrenCount: child.children?.length || 0
                    })) || []
                };
                
                prompt = `You are analyzing a product tree with ${treeSummary.totalNodes} nodes and ${treeSummary.totalEdges} relationships.

Product Tree Summary:
${JSON.stringify(treeSummary, null, 2)}

User Question: ${message}

Please provide a detailed analysis focusing on the product tree structure, relationships, and any insights or recommendations.`;
            }
        }

        console.log('Calling Centralised AI Service with prompt:', prompt.substring(0, 100) + '...');
        
        const aiResponse = await callCentralisedAI(prompt, context);
        console.log('AI Response received:', aiResponse ? 'Success' : 'Empty response');

        res.json({
            response: aiResponse,
            model: 'centralised-ai-service',
            done: true
        });

    } catch (error) {
        console.error('AI API error:', error.message);
        console.error('Full error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to communicate with Centralised AI Service',
            details: error.message
        });
    }
});

// Get available models (redirect to Centralised AI Service)
app.get('/api/ai/models', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:4000/models', { timeout: 5000 });
        
        res.json({
            models: response.data.models || [],
            default: 'centralised-ai-service',
            service: 'centralised-ai-service'
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to get models from Centralised AI Service',
            details: error.message
        });
    }
});

// Pull a new model (not applicable for Centralised AI Service)
app.post('/api/ai/pull-model', async (req, res) => {
    res.status(400).json({ 
        error: 'Model management is handled by the Centralised AI Service',
        message: 'Please use the Centralised AI Service interface to manage models'
    });
});

// Serve index.html for all other routes (SPA routing)
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Product Tree Manager Server running on http://localhost:${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
    console.log('');
    console.log('🎉 Server is ready!');
    console.log(`🤖 AI: Centralised AI Service`);
    console.log(`🌐 Web: http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});