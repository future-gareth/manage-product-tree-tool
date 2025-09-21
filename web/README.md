# Product Tree Manager - Web Version

A browser-only version of the Product Tree Manager that works entirely in the browser without requiring any backend services.

## 🌐 Web Deployment

This version is designed for easy web deployment and works entirely in the browser.

### 🚀 Quick Deploy Options

**Option 1: GitHub Pages**
1. Upload the `web/` folder to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Access via `https://yourusername.github.io/repository-name`

**Option 2: Netlify**
1. Drag and drop the `web/` folder to [Netlify](https://netlify.com)
2. Get instant deployment URL
3. Automatic HTTPS and CDN

**Option 3: Vercel**
1. Upload to [Vercel](https://vercel.com)
2. Instant deployment with custom domain support

**Option 4: Any Web Server**
1. Upload the `web/` folder to any web server
2. Access via HTTP/HTTPS
3. Works with any static hosting provider

## ✨ Features

### 🌳 Product Tree Management
- **XML Import**: Drag and drop or browse to import Product Tree XML files
- **Tree Visualization**: Interactive tree view with expand/collapse functionality
- **Search**: Real-time search through nodes by title and description
- **Node Details**: Click any node to view detailed information

### 📊 Analysis & Export
- **AI-Powered Analysis**: Browser-based intelligent analysis of your product tree
- **Duplicate Detection**: Automatically find duplicate or similar nodes
- **Hierarchy Analysis**: Analyze structure depth and organization
- **Gap Detection**: Find orphaned or disconnected nodes
- **Dependency Analysis**: Identify high-dependency components

### 📤 Export Options
- **XML Export**: Export back to XML format
- **Jira CSV Export**: Export in Jira-compatible CSV format
- **Debug Tools**: Comprehensive debugging and analysis tools

### 🤖 AI Analysis (Browser-Based)
- **Smart Insights**: Ask questions about your product tree
- **Duplicate Detection**: "Find duplicates in my product tree"
- **Hierarchy Analysis**: "Analyze the structure of my product tree"
- **Gap Finding**: "Are there any gaps or missing components?"
- **Dependency Analysis**: "What are the key dependencies?"

## 🎯 How to Use

1. **Open the Application**: Navigate to the deployed URL
2. **Import XML**: Drag and drop your Product Tree XML file
3. **Explore**: Click nodes to view details, expand/collapse branches
4. **Search**: Use the search box to find specific nodes
5. **Analyze**: Ask the AI questions about your product tree
6. **Export**: Export to XML or Jira CSV format
7. **Debug**: Use debug tools to identify issues

## 🔧 Technical Details

### Browser Compatibility
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### File Format Support
- **Input**: XML files with Product Tree structure
- **Output**: XML, CSV (Jira-compatible)

### No Backend Required
- All processing happens in the browser
- No server-side dependencies
- No database required
- No API keys needed

## 📁 File Structure

```
web/
├── index.html          # Main application page
├── styles.css          # Application styling
├── app.js             # Application logic
└── README.md          # This file
```

## 🚀 Deployment Examples

### GitHub Pages
```bash
# Clone your repository
git clone https://github.com/yourusername/product-tree-manager.git
cd product-tree-manager

# Copy web files to root
cp -r web/* .

# Commit and push
git add .
git commit -m "Deploy web version"
git push origin main

# Enable GitHub Pages in repository settings
# Access via: https://yourusername.github.io/product-tree-manager
```

### Netlify
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `web/` folder
3. Get instant deployment URL
4. Optional: Connect to GitHub for automatic deployments

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd web
vercel

# Follow prompts for configuration
```

## 🔒 Security & Privacy

- **No Data Collection**: All processing happens locally in your browser
- **No Server Storage**: Files are not uploaded to any server
- **No Tracking**: No analytics or tracking code included
- **Client-Side Only**: Complete privacy and data control

## 🆚 Web vs Local Version

| Feature | Web Version | Local Version |
|---------|-------------|---------------|
| **Setup** | Just open URL | Requires local services |
| **AI Analysis** | Browser-based | Real Ollama AI |
| **CRUD Operations** | View-only | Full create/edit/delete |
| **File Storage** | Session only | Persistent database |
| **Performance** | Good for analysis | Full functionality |
| **Deployment** | Any web host | Local machine only |

## 🎨 Customization

The web version is fully customizable:

- **Styling**: Modify `styles.css` for custom appearance
- **Features**: Extend `app.js` for additional functionality
- **AI Analysis**: Enhance browser-based analysis logic
- **Export Formats**: Add new export options

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Ensure XML file format is correct
3. Try different browsers if issues persist
4. Verify file size is reasonable (< 10MB recommended)

## 🔄 Updates

To update the web version:
1. Replace files with new versions
2. Clear browser cache
3. Test functionality
4. Redeploy if using hosting service

---

**Ready to deploy?** Choose your preferred hosting method and start using the Product Tree Manager on the web!
