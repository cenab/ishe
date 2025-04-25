#!/bin/bash

# Create downloads directory if it doesn't exist
sudo mkdir -p /var/www/downloads

# Set proper permissions
sudo chown -R nginx:nginx /var/www/downloads
sudo chmod -R 755 /var/www/downloads

# Create Nginx configuration file for downloads
cat > /tmp/downloads.conf << 'EOF'
# Static file server configuration
server {
    listen 80;
    server_name _;
    
    # Location for APK and other downloadable files
    location ~ ^/(.*\.apk)$ {
        root /var/www/downloads;
        try_files /$1 =404;
        
        # Set proper content type for APK files
        types {
            application/vnd.android.package-archive apk;
        }
        
        # Set headers for downloads
        add_header Content-Disposition "attachment; filename=$1";
        add_header Content-Type application/vnd.android.package-archive;
        
        # Enable caching for downloaded files
        expires 1d;
        add_header Cache-Control "public";
    }
}
EOF

# Move the configuration file to Nginx directory
sudo mv /tmp/downloads.conf /etc/nginx/conf.d/

# Test the Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx if configuration test passed
if [ $? -eq 0 ]; then
    echo "Reloading Nginx..."
    sudo systemctl reload nginx
    echo "Nginx download configuration has been updated successfully!"
else
    echo "Nginx configuration test failed. Please check the configuration."
    exit 1
fi

echo "You can now download the APK at http://3.127.58.246/ishe.apk" 