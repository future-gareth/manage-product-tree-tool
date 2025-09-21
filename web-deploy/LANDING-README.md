# GarethAPI.com Landing Page

A professional landing page for your personal API and tools platform.

## 🌐 What This Is

This is the **main landing page** for GarethAPI.com that showcases:

- **Your Personal Brand** - Professional introduction and skills
- **Tool Portfolio** - Featured tools with descriptions and links
- **Contact Information** - LinkedIn, GitHub, email links
- **Professional Design** - Modern, responsive, and accessible

## 📁 File Structure

```
web-deploy/
├── landing.html          # Main landing page
├── landing.css           # Landing page styles
├── landing.js            # Landing page interactions
├── public/               # Product Tree Manager app
│   ├── index.html       # Product Tree Manager
│   ├── styles.css       # App styles
│   └── app.js           # App functionality
├── server.js            # Main server (serves both)
└── package.json         # Dependencies
```

## 🚀 How It Works

**Default Route (`/`):**
- Shows the landing page with your info and tool listings
- Professional introduction and contact details
- Links to individual tools

**Tool Routes (`/product-tree`):**
- Direct access to the Product Tree Manager
- Full AI-powered functionality
- All the features we built

## 🎨 Customization

### Personal Information
Edit `landing.html` to update:
- Your name and bio
- Skills and expertise
- Contact information
- Social media links

### Tool Listings
Add new tools by copying the tool card structure:
```html
<div class="tool-card">
    <div class="tool-header">
        <div class="tool-icon">
            <i class="fas fa-your-icon"></i>
        </div>
        <div class="tool-badge">Live</div>
    </div>
    <div class="tool-content">
        <h3>Your Tool Name</h3>
        <p>Tool description...</p>
        <div class="tool-actions">
            <a href="/your-tool" class="btn-primary">Try It Now</a>
        </div>
    </div>
</div>
```

### Styling
Modify `landing.css` to change:
- Colors and themes
- Typography
- Layout and spacing
- Responsive breakpoints

## 🔗 Current Links

**Update these in `landing.html`:**
- LinkedIn: `https://linkedin.com/in/gareth` (update with your actual profile)
- GitHub: `https://github.com/gareth` (update with your actual profile)
- Email: `gareth@garethapi.com` (update with your actual email)

## 📱 Features

### Responsive Design
- Mobile-first approach
- Works on all screen sizes
- Touch-friendly interactions

### Accessibility
- Keyboard navigation
- Screen reader friendly
- High contrast support
- Focus management

### Performance
- Optimized images
- Minimal JavaScript
- Fast loading
- SEO friendly

## 🚀 Deployment

Deploy this entire `web-deploy/` folder to your server:

1. **Upload files** to your web server
2. **Install dependencies**: `npm install`
3. **Start server**: `npm start`
4. **Access**: `http://your-domain.com`

## 🎯 Next Steps

1. **Update personal info** with your actual details
2. **Add your LinkedIn/GitHub** links
3. **Customize the design** to match your brand
4. **Add more tools** as you build them
5. **Deploy to your domain**

## 🔧 Technical Details

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js with Express
- **AI**: Ollama integration
- **Deployment**: Any Node.js hosting platform

---

**Ready to launch?** Update your personal information and deploy to make GarethAPI.com live!
