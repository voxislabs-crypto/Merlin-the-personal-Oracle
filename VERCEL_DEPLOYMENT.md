# 🚀 Vercel Deployment Guide for Merlin

This guide provides step-by-step instructions for deploying Merlin (Personal Oracle) to Vercel, with special focus on resolving the `MIDDLEWARE_INVOCATION_FAILED` error caused by missing Clerk environment variables.

---

## 📋 Prerequisites

Before deploying to Vercel, ensure you have:

1. ✅ A [Vercel account](https://vercel.com/signup)
2. ✅ A [Clerk account](https://dashboard.clerk.com) with an application created
3. ✅ A [Stripe account](https://dashboard.stripe.com) (if using payment features)
4. ✅ Your repository pushed to GitHub/GitLab/Bitbucket
5. ✅ All required API keys ready (see below)

---

## 🔑 Required Environment Variables

### Critical: Clerk Authentication Variables

**These are REQUIRED for the application to deploy successfully.** The middleware uses Clerk and will fail with `500: INTERNAL_SERVER_ERROR - MIDDLEWARE_INVOCATION_FAILED` if these are not set.

| Variable | Required | Description | Where to Get It |
|----------|----------|-------------|-----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ YES | Clerk publishable key | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `CLERK_SECRET_KEY` | ✅ YES | Clerk secret key | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | ✅ YES | Sign-in route | Set to `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | ✅ YES | Sign-up route | Set to `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | ✅ YES | Post sign-in redirect | Set to `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | ✅ YES | Post sign-up redirect | Set to `/dashboard` |

### Payment Processing (Stripe)

| Variable | Required | Description | Where to Get It |
|----------|----------|-------------|-----------------|
| `STRIPE_SECRET_KEY` | ⚠️ If using payments | Stripe secret key | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⚠️ If using payments | Stripe publishable key | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ If using webhooks | Webhook signing secret | [Stripe Webhooks](https://dashboard.stripe.com/webhooks) |

### Application Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_URL` | ✅ YES | Your app's base URL | `https://your-app.vercel.app` |

### Database (Optional)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ❌ Optional | PostgreSQL connection URL | `postgresql://user:pass@host:5432/db` |

---

## 🛠️ Step-by-Step Deployment

### Step 1: Get Your Clerk API Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application (or create a new one)
3. Navigate to **API Keys** in the left sidebar
4. Copy both keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

> 💡 **Tip**: Use test keys (`pk_test_` / `sk_test_`) for development and preview deployments, and live keys (`pk_live_` / `sk_live_`) for production.

### Step 2: Configure Clerk Redirect URLs

1. In Clerk Dashboard, go to **Paths**
2. Set the following paths:
   - **Sign-in path**: `/sign-in`
   - **Sign-up path**: `/sign-up`
   - **After sign-in**: `/dashboard`
   - **After sign-up**: `/dashboard`
3. Add your Vercel domain to **Allowed redirect URLs**:
   - `https://your-app.vercel.app/*`
   - `https://your-app-*.vercel.app/*` (for preview deployments)

### Step 3: Get Your Stripe API Keys (If Using Payments)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)
3. For webhooks:
   - Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
   - Create an endpoint: `https://your-app.vercel.app/api/stripe/webhook`
   - Copy the **Signing secret** (starts with `whsec_`)

### Step 4: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your Git repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
5. Click **Deploy** (it will fail initially - this is expected)

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Step 5: Add Environment Variables in Vercel

**CRITICAL**: This step prevents the `MIDDLEWARE_INVOCATION_FAILED` error.

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable one by one:

#### Clerk Variables (REQUIRED)

```plaintext
Name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Environments: ✅ Production ✅ Preview ✅ Development
```

```plaintext
Name: CLERK_SECRET_KEY
Value: sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Environments: ✅ Production ✅ Preview ✅ Development
```

```plaintext
Name: NEXT_PUBLIC_CLERK_SIGN_IN_URL
Value: /sign-in
Environments: ✅ Production ✅ Preview ✅ Development
```

```plaintext
Name: NEXT_PUBLIC_CLERK_SIGN_UP_URL
Value: /sign-up
Environments: ✅ Production ✅ Preview ✅ Development
```

```plaintext
Name: NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
Value: /dashboard
Environments: ✅ Production ✅ Preview ✅ Development
```

```plaintext
Name: NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
Value: /dashboard
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Application URL (REQUIRED)

```plaintext
Name: NEXT_PUBLIC_URL
Value: https://your-app-name.vercel.app
Environments: ✅ Production
```

For Preview environments, use:
```plaintext
Value: https://your-app-git-{branch}-{team}.vercel.app
Environments: ✅ Preview
```

#### Stripe Variables (If Using Payments)

```plaintext
Name: STRIPE_SECRET_KEY
Value: sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Environments: ✅ Production ✅ Preview ✅ Development
```

```plaintext
Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Environments: ✅ Production ✅ Preview ✅ Development
```

```plaintext
Name: STRIPE_WEBHOOK_SECRET
Value: whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Environments: ✅ Production ✅ Preview
```

### Step 6: Redeploy Your Application

After adding all environment variables:

1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Select **Redeploy**
4. ✅ Your application should now deploy successfully!

---

## ✅ Deployment Checklist

Use this checklist to ensure a successful deployment:

- [ ] Clerk application created and API keys obtained
- [ ] Stripe account configured (if using payments)
- [ ] Repository pushed to Git provider
- [ ] Vercel project created
- [ ] ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` added to Vercel
- [ ] ✅ `CLERK_SECRET_KEY` added to Vercel
- [ ] ✅ `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
- [ ] ✅ `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
- [ ] ✅ `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` = `/dashboard`
- [ ] ✅ `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` = `/dashboard`
- [ ] ✅ `NEXT_PUBLIC_URL` set to your Vercel domain
- [ ] `STRIPE_SECRET_KEY` added (if using payments)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` added (if using payments)
- [ ] `STRIPE_WEBHOOK_SECRET` added (if using webhooks)
- [ ] Clerk redirect URLs configured in Clerk Dashboard
- [ ] Vercel domain added to Clerk allowed domains
- [ ] Application redeployed after adding environment variables
- [ ] Deployment successful (check deployment logs)
- [ ] Test authentication flows (`/sign-in`, `/sign-up`, `/profile`)
- [ ] Test payment flows (if applicable)

---

## 🐛 Troubleshooting Common Issues

### Error: `500: INTERNAL_SERVER_ERROR - MIDDLEWARE_INVOCATION_FAILED`

**Cause**: Clerk environment variables are missing or incorrect.

**Solution**:
1. Verify all Clerk environment variables are set in Vercel:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - All redirect URL variables
2. Check that values don't have extra spaces or quotes
3. Ensure variables are enabled for the correct environments (Production/Preview/Development)
4. Redeploy your application after adding/updating variables

**How to verify**:
```bash
# In Vercel deployment logs, look for:
# "Error: Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
# or similar Clerk-related errors
```

### Error: Infinite Redirect Loop

**Cause**: Clerk redirect URLs misconfigured.

**Solution**:
1. Check that `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` is NOT `/sign-in`
2. Verify `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` is NOT `/sign-up`
3. Ensure routes exist (e.g., `/dashboard` page exists)
4. Check `middleware.ts` public routes configuration

### Error: "Clerk: Publishable key not found"

**Cause**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` not set or not visible to client.

**Solution**:
1. Variable name MUST start with `NEXT_PUBLIC_` to be accessible in browser
2. Verify exact spelling (case-sensitive)
3. Redeploy after adding variable
4. Clear browser cache and try again

### Error: Build Fails with "Module not found: sweph"

**Cause**: Swiss Ephemeris native module compilation issues.

**Solution**:
1. This is expected and the app has fallback mechanisms
2. Ensure `sweph` is in `dependencies` (not `devDependencies`)
3. Check `package.json` has correct version: `"sweph": "^2.10.3-b-1"`
4. Build logs showing this warning are normal; app will use fallback calculations

### Error: Stripe Webhook Signature Verification Failed

**Cause**: Incorrect or missing `STRIPE_WEBHOOK_SECRET`.

**Solution**:
1. Get the webhook signing secret from Stripe Dashboard
2. Ensure webhook endpoint URL matches: `https://your-app.vercel.app/api/stripe/webhook`
3. Add `STRIPE_WEBHOOK_SECRET` environment variable in Vercel
4. Webhook secret is different for test vs. live mode
5. Each webhook endpoint has its own unique secret

### Error: Database Connection Issues

**Cause**: `DATABASE_URL` not configured or invalid.

**Solution**:
1. If using Prisma, add `DATABASE_URL` to Vercel environment variables
2. Use Vercel Postgres or external provider (Supabase, Railway, Neon)
3. Ensure connection string format is correct
4. Check database allows connections from Vercel IPs
5. Run `prisma generate` in build command if needed

### Environment Variables Not Updating

**Cause**: Vercel caches environment variables.

**Solution**:
1. After changing environment variables, you MUST redeploy
2. Simply adding/updating variables doesn't trigger automatic redeployment
3. Go to **Deployments** → **Redeploy** or push a new commit
4. Check deployment logs to verify variables are loaded

---

## 🔒 Security Best Practices

### Environment Variable Management

1. ✅ **Use different keys for different environments**:
   - Test keys (`pk_test_`, `sk_test_`) for Preview/Development
   - Live keys (`pk_live_`, `sk_live_`) for Production only

2. ✅ **Never commit secrets to Git**:
   - Keep `.env.local` in `.gitignore`
   - Use `.env.example` as template only
   - Rotate keys if accidentally committed

3. ✅ **Restrict Clerk domain allowlist**:
   - Add only your actual domains
   - Don't use wildcard `*` for production
   - Update when adding new domains

4. ✅ **Enable Vercel environment variable encryption**:
   - Vercel encrypts all environment variables by default
   - Variables are only decrypted during build/runtime

5. ✅ **Audit and rotate keys regularly**:
   - Review active API keys quarterly
   - Rotate compromised keys immediately
   - Remove unused integrations

### Production Recommendations

1. **Enable Vercel Access Protection** for sensitive deployments
2. **Set up Clerk organization-level security** policies
3. **Enable Stripe webhook signature verification** (already implemented in `/api/stripe/webhook/route.ts`)
4. **Monitor error logs** in Vercel dashboard for suspicious activity
5. **Set up alerts** for deployment failures or authentication errors

---

## 📊 Monitoring Your Deployment

### Vercel Analytics

Enable analytics in Vercel dashboard to monitor:
- Page load times
- API route performance
- Error rates
- Traffic patterns

### Clerk Dashboard

Monitor authentication metrics:
- Active users
- Sign-up conversion rates
- Authentication errors
- Session activity

### Stripe Dashboard

Track payment metrics:
- Successful payments
- Failed charges
- Webhook delivery status
- Revenue analytics

---

## 🔄 Updating Your Deployment

### Automatic Deployments

Vercel automatically deploys when you push to your Git repository:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically builds and deploys
```

### Preview Deployments

Every pull request gets a unique preview URL:
- Test changes before merging
- Share with team for review
- Preview environments use Preview environment variables

### Manual Redeployments

Redeploy without code changes:
1. Go to **Deployments** tab
2. Click **⋯** menu
3. Select **Redeploy**
4. Choose **Use existing Build Cache** (faster) or rebuild from scratch

---

## 📚 Additional Resources

### Official Documentation

- [Vercel Documentation](https://vercel.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

### Merlin-Specific Guides

- `CLERK_SETUP_GUIDE.md` - Detailed Clerk integration guide
- `CLERK_IMPLEMENTATION_SUMMARY.md` - Implementation overview
- `STRIPE_IMPLEMENTATION.md` - Stripe integration details
- `.env.example` - Complete environment variable reference
- `README.md` - Project overview and local development

### Getting Help

1. **Check deployment logs** in Vercel dashboard first
2. **Review this troubleshooting section** above
3. **Search existing issues** in the repository
4. **Create a new issue** with deployment logs and error messages
5. **Contact support**:
   - [Vercel Support](https://vercel.com/support)
   - [Clerk Support](https://clerk.com/support)
   - [Stripe Support](https://support.stripe.com)

---

## ✨ Post-Deployment Verification

After successful deployment, verify everything works:

### 1. Test Authentication Flow

```bash
# Visit your deployed app
https://your-app.vercel.app

# Test sign-up
https://your-app.vercel.app/sign-up

# Test sign-in
https://your-app.vercel.app/sign-in

# Test profile page (requires authentication)
https://your-app.vercel.app/profile

# Test dashboard
https://your-app.vercel.app/dashboard
```

### 2. Test Astrology Calculator

```bash
# Test main calculator
https://your-app.vercel.app/astro-calculator

# Test enhanced dashboard
https://your-app.vercel.app/enhanced-dashboard
```

### 3. Test API Endpoints

```bash
# Test birth chart calculation
curl -X POST https://your-app.vercel.app/api/calculate-birth-chart \
  -H "Content-Type: application/json" \
  -d '{
    "birthDate": "1990-01-01",
    "birthTime": "12:00",
    "lat": 40.7128,
    "lon": -74.0060,
    "houseSystem": "Placidus",
    "zodiac": "Tropical"
  }'
```

### 4. Monitor for Errors

1. Open browser DevTools (F12)
2. Check Console for JavaScript errors
3. Check Network tab for failed API calls
4. Verify no 500 errors or authentication failures

---

## 🎉 Success!

If you've followed this guide and completed the checklist, your Merlin application should now be successfully deployed to Vercel with Clerk authentication working properly.

**Key Takeaways**:
- ✅ Clerk environment variables are REQUIRED for middleware
- ✅ Always redeploy after adding/updating environment variables
- ✅ Use test keys for development, live keys for production
- ✅ Monitor deployment logs and analytics

**Next Steps**:
1. Set up custom domain in Vercel
2. Configure production Clerk application
3. Switch to Stripe live mode when ready
4. Set up monitoring and alerts
5. Share your astrology app with the world! 🌟

---

**Need help?** Check the troubleshooting section above or create an issue in the repository.

**Found this helpful?** Share your deployment success story! ⭐
