# Deploy Textसेवक to Netlify - Step by Step Guide

## Quick Start

### Method 1: Deploy via Netlify Dashboard (Easiest)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Go to Netlify Dashboard**
   - Visit https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider and select your repository

3. **Configure Build Settings**
   - **Build command**: `npm run build:client`
   - **Publish directory**: `dist/spa`
   - **Functions directory**: `netlify/functions`

4. **Add Environment Variables**
   Go to Site settings → Environment variables and add:
   
   **Required Firebase Variables:**
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete (usually 2-5 minutes)

### Method 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```

3. **Initialize**
   ```bash
   netlify init
   ```
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

## Configuration Files

The project already includes:
- ✅ `netlify.toml` - Netlify configuration
- ✅ `netlify/functions/api.ts` - Serverless function wrapper

## Important Notes

### Build Process
- Only the client is built (`build:client`)
- Serverless functions are automatically built by Netlify
- Output goes to `dist/spa`

### API Routes
- All `/api/*` routes are handled by Netlify Functions
- Functions are located in `netlify/functions/api.ts`
- File uploads use memory storage in serverless environment

### Environment Variables
- Must start with `VITE_` to be accessible in client code
- Set them in Netlify Dashboard → Site settings → Environment variables
- Redeploy after adding new variables

## Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Ensure Node.js version is 18 (set in netlify.toml)
- Verify all dependencies are in package.json

### Firebase Not Working
- Verify all `VITE_FIREBASE_*` variables are set
- Check Firebase project settings
- Ensure Firebase Storage rules allow uploads

### API Routes Not Working
- Check function logs in Netlify dashboard
- Verify `netlify.toml` redirects are correct
- Test `/api/ping` endpoint first

## After Deployment

1. Test your site at `https://your-site.netlify.app`
2. Test login functionality
3. Test OCR features
4. Check API endpoints

## Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Follow DNS configuration instructions

