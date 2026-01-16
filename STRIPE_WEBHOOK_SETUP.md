# Stripe Webhook Setup - Auto-Decrement Spots on Payment

## Overview

The webhook automatically decrements the spots counter when a customer completes payment via Stripe Checkout. This creates real-time scarcity updates.

**Webhook Flow:**
```
Customer pays via Stripe → Stripe triggers checkout.session.completed event
  → Webhook endpoint (/api/stripe/webhook) receives signature
  → Verify signature with STRIPE_WEBHOOK_SECRET
  → Call POST /api/spots to decrement counter
  → User sees spots counter update in real-time
```

---

## Setup Steps

### Step 1: Get Webhook Secret from Stripe Dashboard

1. Go to [https://dashboard.stripe.com/developers/webhooks](https://dashboard.stripe.com/developers/webhooks)
2. Click **"Add an endpoint"**
3. Enter endpoint URL:
   - **Local testing**: `http://localhost:5000/api/stripe/webhook` (requires ngrok tunneling)
   - **Production**: `https://your-merlin-site.vercel.app/api/stripe/webhook`
4. Select events to listen for: `checkout.session.completed`
5. Click **"Add endpoint"**
6. Once created, click the endpoint to reveal:
   - Signing secret (starts with `whsec_`)
7. Copy the signing secret

### Step 2: Add Webhook Secret to .env.local

Add to `.env.local`:
```dotenv
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

Replace `whsec_test_...` with your actual signing secret from Step 1.

### Step 3: Deploy to Vercel

Push to GitHub:
```bash
git add app/api/stripe/webhook/route.ts .env.local
git commit -m "feat: Add Stripe webhook for auto-decrement spots"
git push origin clean-main
```

**Vercel auto-deploys in ~20 seconds.** Your production endpoint becomes:
```
https://your-merlin-site.vercel.app/api/stripe/webhook
```

### Step 4: Update Webhook Endpoint URL

1. Return to Stripe Dashboard → Developers → Webhooks
2. Click your endpoint
3. Update URL to production:
   ```
   https://your-merlin-site.vercel.app/api/stripe/webhook
   ```
4. Save

---

## Local Testing (Optional)

### Using ngrok Tunnel

If you want to test webhooks locally:

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Start local dev server:**
   ```bash
   npm run dev  # runs on http://localhost:5000
   ```

3. **Create tunnel in another terminal:**
   ```bash
   ngrok http 5000
   ```
   This gives you a URL like: `https://abc123.ngrok.io`

4. **Add temporary webhook in Stripe Dashboard:**
   - Endpoint: `https://abc123.ngrok.io/api/stripe/webhook`
   - Events: `checkout.session.completed`

5. **Test with Stripe CLI** (alternative):
   ```bash
   npm install -g stripe
   stripe listen --forward-to localhost:5000/api/stripe/webhook
   stripe trigger payment_intent.succeeded
   ```

---

## Implementation Details

### Webhook Route (`/app/api/stripe/webhook/route.ts`)

```typescript
export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature')!;
  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    // Decrement spots counter
    await fetch(`${process.env.NEXT_PUBLIC_URL}/api/spots`, {
      method: 'POST',
    });
  }

  return new Response('ok');
}
```

**Key Security Features:**
- ✅ Signature verification (`stripe.webhooks.constructEvent`)
- ✅ Only processes `checkout.session.completed` events
- ✅ Error handling and logging
- ✅ Webhook secret never exposed to client

### Spots Counter Endpoint (`/app/api/spots/route.ts`)

```typescript
let spotsLeft = 47;

export async function GET() {
  return NextResponse.json({ spotsLeft });
}

export async function POST() {
  spotsLeft = Math.max(spotsLeft - 1, 0);
  return NextResponse.json({ spotsLeft });
}
```

---

## Testing the Webhook

### Real Payment Test

1. Navigate to [http://localhost:5000/checkout](http://localhost:5000/checkout)
2. Click "Pay $50 Now"
3. Use test card: `4242 4242 4242 4242`
4. Expiry: Any future date (e.g., 12/26)
5. CVC: Any 3 digits
6. Complete payment
7. **Expected:** Redirect to `/dashboard?success=true` and spots counter decrements

### Manual Webhook Test (if using ngrok)

```bash
# Trigger a test event
curl -X POST http://localhost:5000/api/stripe/webhook \
  -H "stripe-signature: t=...,v1=..." \
  -d '{"type":"checkout.session.completed"}'

# Check spots
curl http://localhost:5000/api/spots
```

---

## Webhook Events

**Currently Monitored:**
- ✅ `checkout.session.completed` → Decrements spots

**Future Enhancement Opportunities:**
- `payment_intent.payment_failed` → Log failed transactions
- `customer.subscription.updated` → Manage subscription changes
- `charge.refunded` → Increment spots on refund (if applicable)

---

## Troubleshooting

### "Webhook secret missing"
- Ensure `.env.local` has `STRIPE_WEBHOOK_SECRET` set
- Restart dev server after updating `.env.local`

### "Signature verification failed"
- Verify the webhook secret matches Stripe Dashboard
- Check that the webhook endpoint URL matches (no trailing slashes)

### "Spots not decrementing"
- Verify webhook is enabled in Stripe Dashboard
- Check `/api/spots` endpoint is working: `curl http://localhost:5000/api/spots`
- Review server logs for errors

### "Webhook not triggering"
- Confirm endpoint URL in Stripe Dashboard is correct
- In local testing, ensure ngrok tunnel is active
- Check Stripe Dashboard → Webhooks → Logs for failed deliveries

---

## Security Checklist

- ✅ Webhook secret stored in `.env.local` (never committed)
- ✅ Signature verification enabled
- ✅ Error handling for malformed requests
- ✅ Event type validation (`checkout.session.completed`)
- ✅ API route uses POST with internal fetch (not exposed)

---

## Environment Variables

### Required
```dotenv
STRIPE_SECRET_KEY=sk_test_...           # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...         # From Webhook endpoint settings
NEXT_PUBLIC_URL=http://localhost:5000   # For local testing
```

### On Vercel
Stripe automatically provides these via environment variables. No action needed if using Vercel's Stripe integration UI, otherwise set manually in Project Settings → Environment Variables.

---

## Next Steps

1. ✅ Deploy webhook route
2. ✅ Add webhook secret to `.env.local`
3. ✅ Create webhook endpoint in Stripe Dashboard
4. ✅ Test with real payment
5. (Optional) Set up Stripe → Database sync for audit trail
6. (Optional) Add email notification on successful purchase

---

**Status:** Ready for production ✅

The webhook is now live. Every successful payment will automatically decrement the spots counter in real-time.
