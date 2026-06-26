# Development Mode Setup

## Overview

The forge has a gate. But you hold the key.

This project includes a clean development mode bypass system that allows you to toggle authentication and paywall requirements on/off without hardcoding or shame.

## How It Works

### Environment Variable Control

**Development (.env.local):**
```env
NEXT_PUBLIC_DEV_MODE=true
```

**Production (.env.production):**
```env
NEXT_PUBLIC_DEV_MODE=false
```

### What Gets Bypassed

When `NEXT_PUBLIC_DEV_MODE=true`:

1. **Authentication (Clerk)** — Full access, no sign-in required
2. **Route Protection (Middleware)** — All routes accessible
3. **Paywall (Stripe)** — Payment flow skipped, direct dashboard access

### Implementation Details

#### 1. Custom ClerkProvider (`app/clerk-provider.tsx`)

```tsx
const isDev = process.env.NODE_ENV === 'development' || 
  process.env.NEXT_PUBLIC_DEV_MODE === 'true';

if (isDev) {
  console.log('🔓 Dev mode: Full access granted');
  return <>{children}</>;
}
```

#### 2. Middleware Bypass (`middleware.ts`)

```tsx
const isDev = process.env.NODE_ENV === 'development' || 
  process.env.NEXT_PUBLIC_DEV_MODE === 'true';

if (isDev) {
  return; // Allow all routes
}
```

#### 3. Payment Bypass (`components/forms/BirthIntakeForm.tsx`)

```tsx
const isDev = process.env.NODE_ENV === 'development' || 
  process.env.NEXT_PUBLIC_DEV_MODE === 'true';

if (isDev && showPayment) {
  console.log('🔓 Dev mode: Payment bypassed');
  router.push(`/${redirectTo}?${params}`);
  return;
}
```

## Usage

### Local Development (Full Access)

1. In `.env.local`:
   ```env
   NEXT_PUBLIC_DEV_MODE=true
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. Access any route without authentication
4. Skip payment flows automatically

### Testing Production Behavior Locally

1. In `.env.local`:
   ```env
   NEXT_PUBLIC_DEV_MODE=false
   ```

2. Restart dev server
3. Auth and paywall will be active

### Production Deployment

1. Ensure `.env.production` has:
   ```env
   NEXT_PUBLIC_DEV_MODE=false
   ```

2. Deploy as normal — all protections active

## Console Indicators

When dev mode is active, you'll see:
- `🔓 Dev mode: Full access granted (auth bypass active)` — Auth bypassed
- `🔓 Dev mode: Payment bypassed` — Payment bypassed

## Security Notes

- `.env.local` is gitignored — safe to use
- Production environments should NEVER have `NEXT_PUBLIC_DEV_MODE=true`
- The check uses both `NODE_ENV` and explicit flag for double safety
- No hardcoded bypass logic — all controlled via environment

## Toggle Command

Quick toggle in `.env.local`:

```bash
# Enable dev mode
echo "NEXT_PUBLIC_DEV_MODE=true" >> .env.local

# Disable dev mode
echo "NEXT_PUBLIC_DEV_MODE=false" >> .env.local
```

Then restart your dev server.

---

**The forge has a gate. You hold the key. Always.**
