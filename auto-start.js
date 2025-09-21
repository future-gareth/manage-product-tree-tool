#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = 3000;
const DOT_PORT = 8081;
const DOT_DIR = path.join(__dirname, 'dot');

// Function to check if a port is in use
function checkPort(port) {
    return new Promise((resolve) => {
        const server = require('http').createServer();
        server.listen(port, () => {
            server.close(() => resolve(false)); // Port is free
        });
        server.on('error', () => resolve(true)); // Port is in use
    });
}

// Function to start Dot service
async function startDotService() {
    console.log('🔧 Starting Dot service...');
    
    return new Promise((resolve, reject) => {
        // Change to dot directory and start the service
        const child = spawn('python3', ['main.py'], {
            cwd: DOT_DIR,
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: true
        });
        
        child.unref(); // Allow parent to exit
        
        // Store PID for cleanup
        fs.writeFileSync(path.join(__dirname, 'dot.pid'), child.pid.toString());
        
        // Wait a moment for startup
        setTimeout(async () => {
            const isRunning = await checkPort(DOT_PORT);
            if (isRunning) {
                console.log('✅ Dot service started successfully');
                resolve(true);
            } else {
                console.log('❌ Dot service failed to start');
                reject(new Error('Dot service failed to start'));
            }
        }, 3000);
    });
}

// Function to serve the HTML file
function serveHTML(req, res) {
    // Add CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.url === '/' || req.url === '/index.html') {
        const htmlPath = path.join(__dirname, 'ui', 'index.html');
        fs.readFile(htmlPath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading HTML file');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (req.url.startsWith('/api/start-services')) {
        // API endpoint to start services
        startDotService()
            .then(() => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Services started successfully' }));
            })
            .catch((error) => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: error.message }));
            });
    } else if (req.url.startsWith('/api/check-services')) {
        // API endpoint to check service status
        checkPort(DOT_PORT)
            .then((isRunning) => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    dotService: isRunning,
                    port: DOT_PORT
                }));
            });
    } else {
        // Serve static files from ui directory
        const filePath = path.join(__dirname, 'ui', req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            
            let contentType = 'text/html';
            if (filePath.endsWith('.css')) contentType = 'text/css';
            if (filePath.endsWith('.js')) contentType = 'application/javascript';
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    }
}

// Main function
async function main() {
    console.log('🚀 Starting Product Tree Manager Auto-Starter...');
    
    // Check if Dot service is already running
    const dotRunning = await checkPort(DOT_PORT);
    if (dotRunning) {
        console.log('✅ Dot service is already running on port', DOT_PORT);
    } else {
        console.log('🔧 Dot service not running, will start on demand...');
    }
    
    // Start the web server
    const server = http.createServer(serveHTML);
    server.listen(PORT, () => {
        console.log(`🌐 Web server running on http://localhost:${PORT}`);
        console.log(`📱 Open http://localhost:${PORT} in your browser`);
        console.log('💡 Services will auto-start when you open the page');
    });
    
    // Handle cleanup on exit
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down...');
        
        // Kill Dot service if we started it
        try {
            const pidFile = path.join(__dirname, 'dot.pid');
            if (fs.existsSync(pidFile)) {
                const pid = fs.readFileSync(pidFile, 'utf8').trim();
                process.kill(parseInt(pid), 'SIGTERM');
                fs.unlinkSync(pidFile);
                console.log('✅ Dot service stopped');
            }
        } catch (error) {
            console.log('⚠️  Could not stop Dot service:', error.message);
        }
        
        process.exit(0);
    });
}

main().catch(console.error);
