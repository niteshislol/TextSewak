# Netlify Deployment Guide for Textसेवक

This guide will help you deploy your Textसेवक application to Netlify.

## Prerequisites

1. A Netlify account (sign up at https://netlify.com)
2. Your Firebase project credentials
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Repository

Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

## Step 2: Set Up Environment Variables

You need to set the following environment variables in Netlify:

### Firebase Configuration (Required)
- `VITE_FIREBASE_API_KEY` - Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Your Firebase app ID

### Optional Environment Variables
- `PING_MESSAGE` - Custom ping message (defaults to "ping")

## Step 3: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard (Recommended)

1. **Go to Netlify Dashboard**
   - Visit https://app.netlify.com
   - Click "Add new site" → "Import an existing project"

2. **Connect Your Repository**
   - Choose your Git provider (GitHub, GitLab, or Bitbucket)
   - Authorize Netlify to access your repositories
   - Select your repository

3. **Configure Build Settings**
   - **Build command**: `npm run build:client`
   - **Publish directory**: `dist/spa`
   - **Functions directory**: `netlify/functions`

4. **Add Environment Variables**
   - Go to Site settings → Environment variables
   - Add all the Firebase environment variables listed above
   - Make sure to add them for "Production" environment

5. **Deploy**
   - Click "Deploy site"
   - Wait for the build to complete

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize Netlify**
   ```bash
   netlify init
   ```
   - Follow the prompts to link your site
   - Choose "Create & configure a new site"
   - Select your team
   - Choose a site name

4. **Set Environment Variables**
   ```bash
   netlify env:set VITE_FIREBASE_API_KEY "your-api-key"
   netlify env:set VITE_FIREBASE_AUTH_DOMAIN "your-auth-domain"
   netlify env:set VITE_FIREBASE_PROJECT_ID "your-project-id"
   netlify env:set VITE_FIREBASE_STORAGE_BUCKET "your-storage-bucket"
   netlify env:set VITE_FIREBASE_MESSAGING_SENDER_ID "your-sender-id"
   netlify env:set VITE_FIREBASE_APP_ID "your-app-id"
   ```

5. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Step 4: Verify Deployment

1. **Check Build Logs**
   - Go to your site's Deploys tab
   - Check if the build completed successfully

2. **Test Your Site**
   - Visit your Netlify URL (e.g., `https://your-site.netlify.app`)
   - Test the login functionality
   - Test OCR features

3. **Check API Endpoints**
   - Test `/api/ping` endpoint
   - Verify serverless functions are working

## Important Notes

### Build Configuration
- The build command only builds the client (`build:client`)
- Serverless functions are automatically built by Netlify
- The publish directory is `dist/spa` (client build output)

### Serverless Functions
- API routes are handled by Netlify Functions
- All `/api/*` routes are redirected to `/.netlify/functions/api`
- Functions are located in `netlify/functions/api.ts`

### File Uploads
- File uploads are handled client-side for images
- Document processing (PDF/Word) uses serverless functions
- Make sure your Firebase Storage is configured correctly

### Firebase Configuration
- All Firebase config must be set as environment variables
- Variables must start with `VITE_` to be accessible in the client
- Never commit `.env` files with real credentials

## Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Netlify uses Node 18 by default)

### Environment Variables Not Working
- Make sure variables start with `VITE_` for client-side access
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

### API Routes Not Working
- Verify serverless function is deployed
- Check function logs in Netlify dashboard
- Ensure `netlify.toml` redirects are correct

### Firebase Errors
- Verify all Firebase environment variables are set
- Check Firebase project settings
- Ensure Firebase Storage rules allow uploads

## Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Follow the instructions to configure DNS

## Continuous Deployment

Once connected to Git, Netlify will automatically deploy:
- Every push to the main branch (production)
- Pull requests get preview deployments

## Support

For issues, check:
- Netlify documentation: https://docs.netlify.com
- Netlify community: https://answers.netlify.com

