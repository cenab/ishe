#!/bin/bash

# Create Nginx configuration file
cat > /tmp/ishe.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Set appropriate headers
    add_header Content-Language tr;
    
    # Increase buffer sizes for better handling of characters
    client_body_buffer_size 128k;
    client_max_body_size 50M;
    
    # Configure proper character encoding
    charset utf-8;

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
sudo mv /tmp/ishe.conf /etc/nginx/conf.d/

# Test the Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx if configuration test passed
if [ $? -eq 0 ]; then
    echo "Reloading Nginx..."
    sudo systemctl reload nginx
    echo "Nginx configuration has been updated successfully!"
else
    echo "Nginx configuration test failed. Please check the configuration."
    exit 1
fi 