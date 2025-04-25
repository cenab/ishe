# CI/CD Setup for Ishe

This guide explains how to set up a Continuous Integration/Continuous Deployment (CI/CD) pipeline for the Ishe application using GitHub Actions.

## GitHub Actions Setup

GitHub Actions will automatically deploy your code to your EC2 instance whenever you push to your main branch.

### Steps to set up GitHub Actions:

1. **Add the SSH key to GitHub Secrets**:
   - Go to your GitHub repository
   - Navigate to Settings > Secrets and variables > Actions
   - Add a new repository secret named `EC2_SSH_KEY`
   - Paste the contents of your `ishe-key-new.pem` file

2. **Create the GitHub Actions workflow file**:
   - The workflow file is already created at `.github/workflows/deploy.yml`
   - This will automatically deploy your application to EC2 when you push to the main branch

3. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Add CI/CD workflow"
   git push origin main
   ```

## How It Works

When you push code to your repository:
1. GitHub Actions automatically starts a workflow
2. It sets up SSH access to your EC2 instance using your private key
3. It copies the project files to your EC2 server
4. It runs Docker commands to rebuild and restart your application

## Debugging Your CI/CD Pipeline

If your GitHub Actions workflow fails:
1. Go to your GitHub repository
2. Click on the "Actions" tab
3. Click on the failed workflow run
4. Examine the logs to find errors

## Security Considerations

- Store your EC2 SSH key securely in GitHub Secrets
- Regularly rotate your SSH keys
- Consider using branch protection rules to prevent direct pushes to main
- Use GitHub's IP allow list feature for additional security 