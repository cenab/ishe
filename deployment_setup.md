# Dementia Real Talk - AWS Deployment Guide

This guide provides step-by-step instructions for deploying the Dementia Real Talk application on AWS. The setup is optimized for a small-scale deployment (10 users) running for 3-4 months, balancing cost-effectiveness with reliability.

## Prerequisites

- AWS Account
- Registered domain name
- Supabase Pro account (already set up)
- Sentry account (already set up)
- OpenAI API key

## Table of Contents

1. [Initial AWS Setup](#1-initial-aws-setup)
2. [EC2 Instance Creation](#2-ec2-instance-creation)
3. [Server Configuration](#3-server-configuration)
4. [Application Deployment](#4-application-deployment)
5. [Nginx and SSL Configuration](#5-nginx-and-ssl-configuration)
6. [DNS Configuration](#6-dns-configuration)
7. [Monitoring and Health Checks](#7-monitoring-and-health-checks)
8. [Backup Strategy](#8-backup-strategy)
9. [Application Updates](#9-application-updates)
10. [Troubleshooting](#10-troubleshooting)

## 1. Initial AWS Setup

### 1.1 Create IAM User for Administration

```bash
# Login to AWS Console and navigate to IAM
# Create a new IAM user with programmatic access and console access
# Attach the "AdministratorAccess" policy (for simplicity in this small deployment)
# Save the access key and secret key securely
```

### 1.2 Configure AWS CLI (Optional, but recommended)

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
# Enter your Access Key ID, Secret Access Key, default region (e.g., us-east-1), and output format (json)
```

## 2. EC2 Instance Creation

### 2.1 Create Key Pair

1. Go to EC2 Dashboard in AWS Console
2. Navigate to "Key Pairs" in the left sidebar
3. Click "Create key pair"
4. Name: `dementia-real-talk-key`
5. Format: `.pem` (for macOS/Linux) or `.ppk` (for Windows/PuTTY)
6. Download and securely store the key file

### 2.2 Create Security Group

1. Navigate to "Security Groups" in the EC2 Dashboard
2. Click "Create security group"
3. Basic details:
   - Security group name: `dementia-real-talk-sg`
   - Description: `Security group for Dementia Real Talk application`
4. Inbound rules:
   - SSH (22): Your IP only
   - HTTP (80): Anywhere (0.0.0.0/0)
   - HTTPS (443): Anywhere (0.0.0.0/0)
5. Click "Create security group"

### 2.3 Launch EC2 Instance

1. Go to EC2 Dashboard
2. Click "Launch instance"
3. Name: `dementia-real-talk-server`
4. Application and OS Images:
   - Amazon Machine Image: `Ubuntu Server 22.04 LTS`
5. Instance type: `t3.small` (2 vCPU, 2GB RAM - sufficient for 10 users)
6. Key pair: Select `dementia-real-talk-key`
7. Network settings:
   - VPC: Default
   - Subnet: Any
   - Auto-assign public IP: Enable
   - Security group: Select existing `dementia-real-talk-sg`
8. Configure storage:
   - 20 GB gp3 volume
9. Advanced details:
   - Leave defaults
10. Click "Launch instance"

### 2.4 Allocate Elastic IP

1. In EC2 Dashboard, navigate to "Elastic IPs"
2. Click "Allocate Elastic IP address"
3. Leave defaults and click "Allocate"
4. Select the newly allocated IP, click "Actions", then "Associate Elastic IP address"
5. Select:
   - Resource type: Instance
   - Instance: `dementia-real-talk-server`
   - Private IP: Leave default
6. Click "Associate"
7. Note down this Elastic IP - you'll use it for DNS configuration

## 3. Server Configuration

### 3.1 Connect to Your EC2 Instance

```bash
# For macOS/Linux
chmod 400 path/to/dementia-real-talk-key.pem
ssh -i path/to/dementia-real-talk-key.pem ubuntu@your-elastic-ip

# For Windows with PuTTY:
# 1. Open PuTTY
# 2. Enter your Elastic IP in the Host Name field
# 3. In the Category panel, navigate to Connection > SSH > Auth > Credentials
# 4. Browse for your .ppk file in the "Private key file for authentication" field
# 5. Click Open to connect
```

### 3.2 Update System and Install Dependencies

```bash
# Update package lists and upgrade existing packages
sudo apt update && sudo apt upgrade -y

# Install necessary packages
sudo apt install -y git curl wget vim unzip software-properties-common gnupg2

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 8.x.x or above

# Install PM2
sudo npm install -g pm2

# Install Nginx and Certbot for SSL
sudo apt install -y nginx certbot python3-certbot-nginx
```

## 4. Application Deployment

### 4.1 Clone Repository and Set Up Directory Structure

```bash
# Create app directory
mkdir -p ~/dementia-real-talk
cd ~/dementia-real-talk

# Clone your repository
git clone https://github.com/yourusername/demantia-real-talk.git .
cd dementia-real-talk-server

# Install dependencies
npm install --production
```

### 4.2 Configure Environment Variables

```bash
# Create .env file
cat > .env <<EOL
PORT=3000
OPENAI_API_KEY=your-openai-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
EOL

# Ensure proper permissions
chmod 600 .env
```

### 4.3 Update CORS Configuration

Update the CORS configuration in server.js to allow your domain:

```bash
# If you're comfortable with sed, you can use this command:
sed -i "s/origin: \[\([^]]*\)\]/origin: \[\1, \"https:\/\/yourdomain.com\"\]/" server.js

# Otherwise, manually edit server.js and add your domain to the CORS origins list
```

### 4.4 Set Up PM2 Configuration

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js <<EOL
module.exports = {
  apps: [{
    name: "dementia-real-talk",
    script: "server.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production"
    },
    error_file: "logs/err.log",
    out_file: "logs/out.log",
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
  }]
};
EOL

# Create logs directory
mkdir -p logs

# Start the application
pm2 start ecosystem.config.js
pm2 save

# Configure PM2 to start on system boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save
```

## 5. Nginx and SSL Configuration

### 5.1 Configure Nginx as Reverse Proxy

```bash
# Create Nginx server block configuration
sudo tee /etc/nginx/sites-available/dementia-real-talk <<EOL
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL

# Enable the site by creating a symbolic link
sudo ln -s /etc/nginx/sites-available/dementia-real-talk /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If the test is successful, restart Nginx
sudo systemctl restart nginx
```

### 5.2 Set Up SSL with Let's Encrypt

```bash
# Make sure your domain is pointed to your server's IP before running this command
# (See DNS Configuration section)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the interactive prompts
# - Enter your email address for renewal notifications
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommended)

# Test automatic renewal
sudo certbot renew --dry-run
```

## 6. DNS Configuration

### 6.1 Configure DNS Records

1. Log in to your domain registrar's website
2. Navigate to the DNS management section
3. Add/update the following records:
   - Type: A
   - Name: @ (or yourdomain.com)
   - Value: Your Elastic IP address
   - TTL: 3600 (or 1 hour)
4. Add/update another record for www subdomain:
   - Type: A
   - Name: www
   - Value: Your Elastic IP address
   - TTL: 3600 (or 1 hour)
5. Save changes

### 6.2 Verify DNS Propagation

```bash
# Check DNS propagation (may take up to 48 hours but usually quicker)
dig yourdomain.com
dig www.yourdomain.com

# Both should eventually return your Elastic IP in the answer section
```

## 7. Monitoring and Health Checks

### 7.1 Create Basic Health Check Script

```bash
# Create health check script
cat > ~/health-check.sh <<EOL
#!/bin/bash

# Check if server is responding
if ! curl -s http://localhost:3000/health | grep -q "status.*ok"; then
  echo "Server down at \$(date), restarting..."
  pm2 restart dementia-real-talk
  
  # Send email notification (optional)
  echo "Dementia Real Talk server was down and has been restarted at \$(date)." | mail -s "Server Alert" your-email@example.com
fi
EOL

# Make script executable
chmod +x ~/health-check.sh

# Install mailutils for email alerts (optional)
sudo apt install -y mailutils

# Configure mail server (optional)
# Follow prompts to set up a mail server

# Add health check to crontab to run every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/health-check.sh") | crontab -
```

### 7.2 Set Up Simple Server Monitoring

```bash
# Create a script to monitor system resources
cat > ~/monitor.sh <<EOL
#!/bin/bash

# Get current date and time
DATE=\$(date +"%Y-%m-%d %H:%M:%S")

# Get memory usage
MEM=\$(free -m | awk 'NR==2{printf "%.2f%%", \$3*100/\$2}')

# Get disk usage
DISK=\$(df -h | awk '\$NF=="/"{printf "%s", \$5}')

# Get CPU load
CPU=\$(top -bn1 | grep load | awk '{printf "%.2f%%", \$(NF-2)}')

# Write to log file
echo "\$DATE - Memory: \$MEM, Disk: \$DISK, CPU: \$CPU" >> ~/logs/system_monitor.log

# Alert if memory or CPU usage is too high
if [[ \${MEM%.*} -gt 85 ]]; then
  echo "High memory usage alert: \$MEM at \$DATE" | mail -s "High Memory Alert" your-email@example.com
fi

if [[ \${CPU%.*} -gt 85 ]]; then
  echo "High CPU usage alert: \$CPU at \$DATE" | mail -s "High CPU Alert" your-email@example.com
fi
EOL

# Make script executable
chmod +x ~/monitor.sh

# Create log directory if it doesn't exist
mkdir -p ~/logs

# Add to crontab to run every 15 minutes
(crontab -l 2>/dev/null; echo "*/15 * * * * ~/monitor.sh") | crontab -
```

## 8. Backup Strategy

### 8.1 Configure EC2 Snapshot Backups

1. Go to AWS EC2 Console
2. Navigate to "Elastic Block Store" > "Lifecycle Manager"
3. Click "Create snapshot lifecycle policy"
4. Policy type: EBS snapshot policy
5. Resource type: Instance
6. Target with tags: Add tag key "Name" and value "dementia-real-talk-server"
7. Schedule name: "daily-backup"
8. Frequency: Daily
9. Every: 1 day(s)
10. Starting at: Choose a time during low usage (e.g., 2:00 AM)
11. Retention rule: Count-based, keep 14 snapshots
12. IAM role: Default
13. Click "Create policy"

### 8.2 Set Up Local Configuration Backup

```bash
# Create backup script for configuration files
cat > ~/backup-config.sh <<EOL
#!/bin/bash

BACKUP_DIR=~/backups
mkdir -p \$BACKUP_DIR
TIMESTAMP=\$(date +%Y%m%d-%H%M%S)

# Backup environment variables and configuration files
tar -czf \$BACKUP_DIR/config-\$TIMESTAMP.tar.gz \
    ~/dementia-real-talk/dementia-real-talk-server/.env \
    ~/dementia-real-talk/dementia-real-talk-server/ecosystem.config.js \
    /etc/nginx/sites-available/dementia-real-talk

# Backup logs
tar -czf \$BACKUP_DIR/logs-\$TIMESTAMP.tar.gz \
    ~/dementia-real-talk/dementia-real-talk-server/logs

# Keep only last 7 backups
find \$BACKUP_DIR -name "config-*.tar.gz" -type f -mtime +7 -delete
find \$BACKUP_DIR -name "logs-*.tar.gz" -type f -mtime +7 -delete
EOL

# Make script executable
chmod +x ~/backup-config.sh

# Add to crontab to run daily at 1AM
(crontab -l 2>/dev/null; echo "0 1 * * * ~/backup-config.sh") | crontab -
```

## 9. Application Updates

### 9.1 Create Deployment Script

```bash
# Create a deployment script for updates
cat > ~/deploy.sh <<EOL
#!/bin/bash

set -e  # Exit immediately if a command exits with non-zero status

echo "Deploying Dementia Real Talk updates at \$(date)"

# Navigate to application directory
cd ~/dementia-real-talk

# Backup current version before updating
TIMESTAMP=\$(date +%Y%m%d-%H%M%S)
mkdir -p ~/backups
tar -czf ~/backups/app-before-deploy-\$TIMESTAMP.tar.gz dementia-real-talk-server

# Pull latest changes
git pull

# Install dependencies
cd dementia-real-talk-server
npm install --production

# Restart application
pm2 restart dementia-real-talk

# Check if application is running
echo "Waiting for application to start..."
sleep 5
if curl -s http://localhost:3000/health | grep -q "status.*ok"; then
  echo "Deployment successful: Application is running"
else
  echo "Deployment may have issues: Application health check failed"
fi
EOL

# Make script executable
chmod +x ~/deploy.sh
```

### 9.2 Usage Instructions

To deploy updates:

1. Push changes to your repository
2. SSH into your server
3. Run `~/deploy.sh`

## 10. Troubleshooting

### 10.1 Common Issues and Solutions

#### Application Not Starting

```bash
# Check PM2 logs
pm2 logs dementia-real-talk

# Check if Node.js is working
node -v

# Verify environment variables
cat ~/dementia-real-talk/dementia-real-talk-server/.env
```

#### Nginx Issues

```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Restart Nginx
sudo systemctl restart nginx
```

#### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew
```

### 10.2 Recovery Procedures

#### Restore from EC2 Snapshot

1. Go to AWS EC2 Console
2. Navigate to "Elastic Block Store" > "Snapshots"
3. Select the appropriate snapshot
4. Click "Actions" > "Create volume"
5. Choose the same availability zone as your instance
6. Click "Create volume"
7. After the volume is created, select it
8. Click "Actions" > "Attach volume"
9. Select your instance, specify device name (e.g., /dev/sdf)
10. SSH into your instance
11. Mount the volume: `sudo mount /dev/xvdf /mnt`
12. Copy data as needed: `sudo cp -r /mnt/path/to/data /path/to/destination`

#### Restore Configuration Files

```bash
# List available backups
ls -la ~/backups/

# Extract configuration backup
tar -xzf ~/backups/config-TIMESTAMP.tar.gz -C /tmp/

# Copy files to their original locations
cp /tmp/home/ubuntu/dementia-real-talk/dementia-real-talk-server/.env ~/dementia-real-talk/dementia-real-talk-server/
cp /tmp/home/ubuntu/dementia-real-talk/dementia-real-talk-server/ecosystem.config.js ~/dementia-real-talk/dementia-real-talk-server/
sudo cp /tmp/etc/nginx/sites-available/dementia-real-talk /etc/nginx/sites-available/

# Restart services
pm2 restart dementia-real-talk
sudo systemctl restart nginx
```

## Final Verification

After completing all steps, verify your deployment:

1. Visit https://yourdomain.com in a browser
2. Test the application functionality with a test user
3. Verify SSL is working properly (lock icon in browser)
4. Check that health monitoring is working as expected
5. Test backup and restore procedures

Congratulations! You've successfully deployed the Dementia Real Talk application on AWS. 