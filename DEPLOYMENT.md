# Vercel Deployment Guide

## Quick Setup

### Option 1: Deploy from Root Directory (Recommended)

1. **In Vercel Dashboard:**
   - Go to your project settings
   - Set **Root Directory** to `client`
   - Set **Build Command** to `npm run build`
   - Set **Output Directory** to `dist`
   - Set **Install Command** to `npm install`

2. **Environment Variables:**
   Add these in Vercel Dashboard → Settings → Environment Variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Deploy:**
   - Connect your GitHub repository
   - Vercel will auto-detect Vite and deploy

### Option 2: Deploy Client Directory Directly

If deploying from the `client` directory:

1. **In Vercel Dashboard:**
   - Root Directory: Leave empty (or set to `.`)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

2. The `client/vercel.json` will handle routing automatically.

## Important Notes

- **SPA Routing**: The `vercel.json` includes rewrites to handle React Router routes
- **Environment Variables**: Make sure to add your Supabase credentials in Vercel
- **Build Output**: Vite builds to `dist/` directory by default

## Troubleshooting

### 404 Errors
- Ensure `vercel.json` has the rewrite rule for SPA routing
- Check that the output directory is set to `dist`

### Build Failures
- Verify Node.js version (Vercel uses Node 18+ by default)
- Check that all dependencies are in `package.json`
- Review build logs in Vercel dashboard

### Environment Variables Not Working
- Ensure variables start with `VITE_` prefix
- Redeploy after adding new environment variables
- Check variable names match exactly in code

