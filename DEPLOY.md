# 🚀 Quick Deploy to Vercel

## Steps (5 minutes)

### 1. Push to GitHub
```bash
git add .
git commit -m "Production ready"
git push
```

### 2. Deploy on Vercel
1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository
4. Vercel auto-detects Next.js ✅

### 3. Add Environment Variables
Click "Environment Variables" and add:

**Required:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

Get from: https://dashboard.clerk.com → API Keys

**Optional (for Stripe):**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Click "Deploy"
Vercel will:
- Install dependencies
- Run `npm run build`
- Deploy to production URL

### 5. Configure Clerk
After deployment, go to https://dashboard.clerk.com:
1. Select your app
2. Go to "Paths" section
3. Set:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`
4. Go to "Domains" section
5. Add your Vercel domain (e.g., `your-app.vercel.app`)

## ✅ Done!

Your app is live at: `https://your-app.vercel.app`

## What was fixed:
- ✅ Middleware updated for Clerk v5 + Next.js 15
- ✅ Production security headers added
- ✅ Build configuration optimized
- ✅ All routes properly protected

Build status: **PASSING** ✅

Need help? Check `PRODUCTION_CHECKLIST.md` for detailed guide.
