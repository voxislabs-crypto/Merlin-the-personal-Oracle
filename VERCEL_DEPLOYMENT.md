# Merlin - Personal Oracle Deployment Guide

## 🚀 Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)
- Clerk account (sign up at https://clerk.com)
- Stripe account (optional, for payments)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel will auto-detect Next.js settings
4. Add environment variables (see below)
5. Click "Deploy"

### Step 3: Environment Variables
In Vercel dashboard, add these environment variables:

#### Required for Authentication
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
```

#### Required for Payments (if using Stripe)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### Optional
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Step 4: Configure Clerk
1. Go to https://dashboard.clerk.com
2. Navigate to your application
3. Under "Paths", configure:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/dashboard`
   - After sign-up URL: `/dashboard`
4. Add your Vercel domain to allowed domains

### Step 5: Configure Stripe Webhooks (if using)
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-app.vercel.app/api/stripe/webhook`
3. Select events to listen for
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## 🏗️ Build Configuration

The app uses:
- **Framework**: Next.js 15 (App Router)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x or higher

## 🧪 Test Production Build Locally

```bash
npm run build
npm start
```

## 📦 Key Features
- ✅ Birth chart calculations
- ✅ Daily forecasts
- ✅ Transit analysis
- ✅ Chart interpretations
- ✅ User authentication (Clerk)
- ✅ Payment processing (Stripe)

## 🔒 Security Headers
The app includes production-ready security headers:
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- DNS Prefetch Control

## 📱 Responsive Design
Fully responsive and optimized for:
- Desktop
- Tablet
- Mobile

## 🐛 Troubleshooting

### Build fails on Vercel
- Check environment variables are set correctly
- Ensure all dependencies are in `package.json`
- Review build logs in Vercel dashboard

### Clerk authentication not working
- Verify publishable and secret keys
- Check allowed domains in Clerk dashboard
- Ensure middleware is properly configured

### Stripe webhooks failing
- Verify webhook secret
- Check endpoint URL is correct
- Review webhook logs in Stripe dashboard

## 📄 License
Private project

## 🤝 Support
For issues, contact support or check documentation.
