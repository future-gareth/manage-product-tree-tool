module.exports = {
  apps: [{
    name: 'product-tree-manager',
    script: 'server.js',
    cwd: '/var/www/garethapi/tools/manage-product-tree/web-deploy',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/pm2/product-tree-manager-error.log',
    out_file: '/var/log/pm2/product-tree-manager-out.log',
    log_file: '/var/log/pm2/product-tree-manager.log'
  }]
};
