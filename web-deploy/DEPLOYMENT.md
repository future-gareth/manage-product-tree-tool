# SSH Key for Web Server Deployment

## 🔑 SSH Key Generated

I've created a dedicated SSH key pair for your web server deployment:

- **Private Key**: `product_tree_web_server` (keep this secure!)
- **Public Key**: `product_tree_web_server.pub` (add this to your server)

## 📋 Public Key (Copy This)

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEiLj+RqdzMAbPTjIZkXQbRiaXWgDx/4pYJjEISDXGWr product-tree-web-server
```

## 🚀 Deployment Instructions

### Option 1: VPS/Server Deployment

1. **Add Public Key to Server:**
   ```bash
   # On your server, add the public key to authorized_keys
   echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEiLj+RqdzMAbPTjIZkXQbRiaXWgDx/4pYJjEISDXGWr product-tree-web-server" >> ~/.ssh/authorized_keys
   ```

2. **Connect to Server:**
   ```bash
   # From your local machine
   ssh -i product_tree_web_server user@your-server-ip
   ```

3. **Deploy Application:**
   ```bash
   # On the server
   git clone <your-repo-url>
   cd manage-product-tree/web-deploy
   npm install
   npm start
   ```

### Option 2: Cloud Platform Deployment

#### DigitalOcean Droplet
1. Create a new droplet
2. Add the public key during droplet creation
3. SSH in and deploy:
   ```bash
   ssh -i product_tree_web_server root@your-droplet-ip
   ```

#### AWS EC2
1. Create EC2 instance
2. Add the public key to EC2 key pairs
3. SSH in and deploy:
   ```bash
   ssh -i product_tree_web_server ec2-user@your-ec2-ip
   ```

#### Linode
1. Create Linode instance
2. Add SSH key in Linode dashboard
3. SSH in and deploy:
   ```bash
   ssh -i product_tree_web_server root@your-linode-ip
   ```

### Option 3: Docker Deployment

1. **Build Docker Image:**
   ```bash
   docker build -t product-tree-manager .
   ```

2. **Run Container:**
   ```bash
   docker run -d -p 3000:3000 --name product-tree product-tree-manager
   ```

3. **Access Application:**
   - Open: http://your-server-ip:3000

## 🔒 Security Notes

- **Private Key**: Keep `product_tree_web_server` secure and never share it
- **Public Key**: Safe to share, add to server's `~/.ssh/authorized_keys`
- **Permissions**: Ensure private key has correct permissions (600)
- **Backup**: Keep a backup of both keys in a secure location

## 🛠️ Server Requirements

### Minimum Requirements:
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: 4GB (8GB recommended for larger models)
- **CPU**: 2+ cores
- **Storage**: 10GB+ free space
- **Network**: Standard internet connection

### Software Requirements:
- **Node.js**: 18+ (will be installed automatically)
- **Ollama**: Will be installed automatically
- **Docker**: Optional, for containerized deployment

## 📱 Access Your Application

Once deployed, your Product Tree Manager will be available at:
- **Local**: http://localhost:3000
- **Server**: http://your-server-ip:3000
- **Domain**: http://your-domain.com (if you set up DNS)

## 🔧 Troubleshooting

### SSH Connection Issues:
```bash
# Check key permissions
chmod 600 product_tree_web_server

# Test SSH connection
ssh -i product_tree_web_server -v user@your-server-ip
```

### Application Issues:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Check application logs
npm start
```

### Port Issues:
```bash
# Check if port 3000 is open
netstat -tlnp | grep 3000

# Open firewall (Ubuntu)
sudo ufw allow 3000
```

## 📞 Support

If you encounter issues:
1. Check server logs
2. Verify SSH key is correctly added
3. Ensure all dependencies are installed
4. Check firewall settings

---

**Ready to deploy?** Choose your preferred method and get your Product Tree Manager running on the web!
