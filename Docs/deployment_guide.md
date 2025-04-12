# Lookbook Application Deployment Guide

This document outlines the deployment process for the Lookbook fashion social network application.

## Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- PostgreSQL 14.x or later
- Supabase account (for production deployment)
- Google AI Studio API key
- Vercel or Netlify account (for frontend hosting)

## Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/lookbook-app.git
   cd lookbook-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Google AI Studio API
   GOOGLE_AI_STUDIO_API_KEY=your_google_ai_studio_api_key
   
   # Klingai API (for virtual try-on)
   KLINGAI_API_KEY=your_klingai_api_key
   
   # Application Settings
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Set up the database:
   ```bash
   # Apply the initial migration
   psql -U your_postgres_user -d your_database_name -f migrations/0001_initial.sql
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Production Deployment

### Database Setup with Supabase

1. Create a new project in Supabase
2. Go to the SQL Editor in the Supabase dashboard
3. Run the migration script from `migrations/0001_initial.sql`
4. Set up Row Level Security (RLS) policies for each table to ensure data security

### Frontend Deployment with Vercel

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Configure the environment variables in the Vercel dashboard:
   - Add all the environment variables listed in the local development setup
   - Make sure to set `NEXT_PUBLIC_APP_URL` to your production URL
4. Deploy the application

### Frontend Deployment with Netlify (Alternative)

1. Push your code to a GitHub repository
2. Connect your repository to Netlify
3. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Configure the environment variables in the Netlify dashboard
5. Deploy the application

## Continuous Integration/Continuous Deployment (CI/CD)

### GitHub Actions Setup

Create a `.github/workflows/ci.yml` file with the following content:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.x'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Database Migrations

For future database schema changes, follow these steps:

1. Create a new migration file in the `migrations` directory with a sequential number prefix (e.g., `0002_add_notifications.sql`)
2. Apply the migration locally for testing
3. Apply the migration to the production database through the Supabase SQL Editor

## Monitoring and Maintenance

1. Set up logging with a service like Datadog or Sentry
2. Configure alerts for critical errors
3. Regularly backup the database
4. Monitor API usage and performance
5. Schedule regular security audits

## Scaling Considerations

1. Use Supabase's built-in caching for frequently accessed data
2. Implement pagination for all list endpoints
3. Use image optimization and CDN for media assets
4. Consider implementing server-side rendering (SSR) for critical pages
5. Set up rate limiting for API endpoints

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check that the Supabase URL and keys are correct
   - Verify network connectivity to the Supabase instance

2. **API Rate Limiting**
   - Implement exponential backoff for API calls
   - Cache responses where appropriate

3. **Image Upload Failures**
   - Check file size limits
   - Verify storage bucket permissions

4. **AI Feature Errors**
   - Verify API keys for Google AI Studio
   - Check request format and parameters
   - Implement fallback mechanisms for when AI services are unavailable

## Security Considerations

1. Implement proper authentication and authorization
2. Use HTTPS for all communications
3. Sanitize user inputs
4. Regularly update dependencies
5. Follow the principle of least privilege for database access
6. Implement CORS policies
7. Set up Content Security Policy (CSP)
