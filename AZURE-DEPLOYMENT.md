# Deploying Lookbook to Azure Static Web Apps

This document outlines the process for deploying the Lookbook Fashion Social Network application to Azure Static Web Apps.

## Prerequisites

- An Azure account with an active subscription
- GitHub repository with the Lookbook application code
- Node.js installed locally

## Local Development and Testing

1. Install the Azure Static Web Apps CLI:
   ```bash
   npm install -g @azure/static-web-apps-cli
   ```

2. Run the application locally:
   ```bash
   npm run dev
   ```

3. Test with Azure Static Web Apps CLI:
   ```bash
   swa start --configuration lookbook-app
   ```

## Deployment Process

### Setting up Azure Static Web Apps

1. Go to the Azure Portal (https://portal.azure.com/)
2. Create a new Static Web App resource
3. Connect to your GitHub repository
4. Configure the build settings:
   - Build Preset: `Next.js`
   - App location: `/`
   - Api location: `api`
   - Output location: `.next`

### GitHub Actions Workflow

The repository includes a GitHub Actions workflow file at `.github/workflows/azure-static-web-apps.yml` that automatically builds and deploys the application when changes are pushed to the main branch.

To set this up:

1. Get your Azure Static Web Apps API token from the Azure Portal
2. Add it as a secret in your GitHub repository with the name `AZURE_STATIC_WEB_APPS_API_TOKEN`

### Environment Variables

Make sure to configure the following environment variables in the Azure Static Web Apps configuration:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- Any other required environment variables for your application

## Configuration Files

The repository includes the following configuration files for Azure Static Web Apps:

- `swa-cli.config.json`: Configuration for the SWA CLI
- `staticwebapp.config.json`: Routes and settings for Azure Static Web Apps

## Authentication

The application uses Supabase for authentication. Azure Static Web Apps authentication is disabled to allow Supabase to handle user management.

## Troubleshooting

If you encounter any issues during deployment, check:

1. GitHub Actions workflow logs for build errors
2. Azure Static Web Apps logs in the Azure Portal
3. Ensure environment variables are correctly set
4. Verify that Supabase is properly configured and accessible

## Further Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.io/docs) 