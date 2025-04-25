# Setting up HTTPS on EC2 Server

## Prerequisites
- SSH access to the EC2 instance
- `sudo` privileges on the server
- A domain name pointing to the server (recommended, but we can use IP address with self-signed certificates)

## Step 1: Install Certbot (Let's Encrypt client)
```bash
# Connect to your EC2 instance
ssh ec2-user@3.127.58.246

# Install Certbot and Nginx plugin
sudo amazon-linux-extras install epel
sudo yum install certbot python-certbot-nginx -y
```

## Step 2: Obtain SSL Certificate
If you have a domain name pointing to your server:
```bash
sudo certbot --nginx -d yourdomain.com
```

If you're using the IP address directly (self-signed certificate):
```bash
# Create a self-signed certificate
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/ssl/server.key -out /etc/nginx/ssl/server.crt
```

## Step 3: Configure Nginx for HTTPS
Edit the Nginx configuration file:
```bash
sudo nano /etc/nginx/conf.d/default.conf
```

Add or modify the server block to include HTTPS:
```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name 3.127.58.246;
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl;
    server_name 3.127.58.246;
    
    # If using Let's Encrypt, certbot will have added these lines
    # If using self-signed certificate, add these manually:
    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    
    # Set root directory
    root /var/www;
    
    # Handle APK downloads
    location /ishe.apk {
        alias /var/www/downloads/ishe.apk;
        default_type application/vnd.android.package-archive;
        add_header Content-Disposition 'attachment; filename=ishe.apk';
    }
    
    # Other locations as needed
}
```

## Step 4: Test and Restart Nginx
```bash
# Test the Nginx configuration
sudo nginx -t

# If the test passes, restart Nginx
sudo systemctl restart nginx
```

## Step 5: Open HTTPS Port on AWS Security Group
1. Go to AWS Console > EC2 > Security Groups
2. Select the security group attached to your instance
3. Add an inbound rule:
   - Type: HTTPS
   - Protocol: TCP
   - Port Range: 443
   - Source: 0.0.0.0/0 (or restrict to specific IPs if needed)
4. Save rules

## Step 6: Test HTTPS Connection
Once set up, test your HTTPS connection by visiting:
```
https://3.127.58.246/ishe.apk
```

## Troubleshooting
- Check Nginx error logs: `sudo cat /var/log/nginx/error.log`
- Check SSL certificate: `sudo certbot certificates` (for Let's Encrypt)
- Verify permissions: `sudo ls -la /etc/nginx/ssl/` (for self-signed) 