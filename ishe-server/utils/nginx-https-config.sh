#!/bin/bash

# Install required packages for SSL
echo "Installing SSL prerequisites..."
sudo amazon-linux-extras install epel -y
sudo yum install certbot python-certbot-nginx -y

# Create SSL directory and generate self-signed certificate
echo "Generating self-signed SSL certificate..."
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/server.key \
    -out /etc/nginx/ssl/server.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=3.127.58.246"

# Ensure downloads directory exists
sudo mkdir -p /var/www/downloads
sudo chmod 755 /var/www/downloads
sudo chown -R nginx:nginx /var/www/downloads

# Create Nginx configuration file with HTTPS support
cat > /tmp/ishe-https.conf << 'EOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name _;
    
    # Redirect all HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
    
    # Keep direct APK download available on HTTP for compatibility
    location = /ishe.apk {
        alias /var/www/downloads/ishe.apk;
        add_header Content-Disposition "attachment; filename=ishe.apk";
        add_header Content-Type application/vnd.android.package-archive;
        try_files $uri =404;
    }
}

# HTTPS server
server {
    listen 443 ssl;
    server_name _;
    
    # SSL configuration
    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    
    # Set appropriate headers
    add_header Content-Language tr;
    
    # Increase buffer sizes for better handling of characters
    client_body_buffer_size 128k;
    client_max_body_size 50M;
    
    # Configure proper character encoding
    charset utf-8;

    # Serve APK file
    location = /ishe.apk {
        alias /var/www/downloads/ishe.apk;
        add_header Content-Disposition "attachment; filename=ishe.apk";
        add_header Content-Type application/vnd.android.package-archive;
        try_files $uri =404;
    }

    # API and other routes
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Add headers for WebRTC to work better
        proxy_set_header Accept-Encoding "";
    }
}
EOF

# Move the configuration file to Nginx directory
sudo mv /tmp/ishe-https.conf /etc/nginx/conf.d/
sudo rm -f /etc/nginx/conf.d/ishe.conf /etc/nginx/conf.d/downloads.conf

# Test the Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx if configuration test passed
if [ $? -eq 0 ]; then
    echo "Opening HTTPS port (443) in firewall..."
    sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
    sudo service iptables save
    
    echo "Reloading Nginx..."
    sudo systemctl reload nginx
    echo "HTTPS configuration has been successfully applied!"
    echo "You can now access your API at https://3.127.58.246/"
    echo "You can download the APK at both https://3.127.58.246/ishe.apk and https://3.127.58.246/ishe.apk"
else
    echo "Nginx configuration test failed. Please check the configuration."
    exit 1
fi 