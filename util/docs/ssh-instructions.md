# SSH Instructions for Setting Up HTTPS

I've created a new script (`nginx-https-config.sh`) in the `ishe-server` directory that combines your existing Nginx configurations and adds HTTPS support with a self-signed certificate.

Follow these steps to implement HTTPS on your server:

## 1. Copy the script to your server

Replace `path/to/your-key.pem` with the actual path to your EC2 private key file:

```bash
scp -i path/to/your-key.pem ishe-server/nginx-https-config.sh ec2-user@3.127.58.246:~/nginx-https-config.sh
```

## 2. SSH into your server

```bash
ssh -i path/to/your-key.pem ec2-user@3.127.58.246
```

## 3. Run the configuration script

Once logged in to the server:

```bash
chmod +x ~/nginx-https-config.sh
sudo ~/nginx-https-config.sh
```

## 4. Testing HTTPS Setup

After the script completes successfully, you can verify the setup by:

- Accessing the HTTPS URL: https://3.127.58.246/ishe.apk
- Your browser will warn about the self-signed certificate (this is normal)
- Accept the certificate warning and verify the download works

## 5. AWS Security Group Update

The script attempts to open port 443 using iptables, but you should also ensure your AWS EC2 security group allows traffic on port 443:

1. Go to AWS Console > EC2 > Security Groups
2. Select the security group attached to your instance
3. Add an inbound rule:
   - Type: HTTPS
   - Protocol: TCP
   - Port Range: 443
   - Source: 0.0.0.0/0 (or restrict to specific IPs for better security)
4. Save rules

## Important Notes

- The script enables HTTPS with a self-signed certificate
- The APK will still be available over HTTP at https://3.127.58.246/ishe.apk for compatibility
- All other URLs will redirect from HTTP to HTTPS
- The certificate will expire after 365 days and will need to be renewed
- For production use, consider using Let's Encrypt with a proper domain name 