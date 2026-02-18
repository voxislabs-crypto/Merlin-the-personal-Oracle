# Stripe Payment Link Integration

## Overview
This document describes the integration of Stripe's hosted payment links into Merlin for streamlined subscription checkout.

## Payment Link
- **URL:** `https://buy.stripe.com/9B614pafUcD736N90a7bW00`
- **Type:** Monthly subscription with 7-day free trial
- **Price:** $9.99/month

## Implementation

### 1. Environment Variable
Added to `.env.local` and `.env.example`:
```bash
NEXT_PUBLIC_STRIPE_PAYMENT_LINK=https://buy.stripe.com/9B614pafUcD736N90a7bW00
```

### 2. Updated Components

#### Homepage (`app/page.tsx`)
- Hero CTA button now uses direct Stripe link
- Falls back to `/checkout-subscription` if env var not set
- Changed from Next.js `Link` to regular `<a>` tag for external redirect

#### Checkout Page (`app/checkout-subscription/page.tsx`)
- Simplified `handleSubscribe()` to redirect directly to Stripe
- Removed custom session creation API call
- Added analytics tracking before redirect
- Faster UX - no backend API call required

#### Pricing Section (`components/sections/PricingSection.tsx`)
- Updated "Start Free Trial" button to use direct link
- Consistent with homepage implementation

### 3. Benefits

✅ **Faster checkout** - No backend API call needed  
✅ **Simpler code** - Less error handling required  
✅ **Stripe-hosted** - More secure, PCI compliant  
✅ **Mobile optimized** - Stripe's responsive checkout  
✅ **No session management** - Stripe handles it all  

### 4. Testing Checklist

- [x] Environment variable added to `.env.local`
- [ ] Test homepage "Start 7-Day Free Trial" button
- [ ] Test pricing section "Start Free Trial" button
- [ ] Test `/checkout-subscription` page button
- [ ] Verify redirect to Stripe checkout
- [ ] Complete test purchase (use test card)
- [ ] Verify webhook receives `checkout.session.completed` event
- [ ] Confirm user gets access after payment
- [ ] Test trial cancellation flow

### 5. Test Cards (Stripe Test Mode)
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```
Use any future expiry date and any 3-digit CVC.

### 6. Vercel Deployment

Add to Vercel environment variables:
```
NEXT_PUBLIC_STRIPE_PAYMENT_LINK = https://buy.stripe.com/9B614pafUcD736N90a7bW00
```

Then redeploy.

### 7. Fallback Behavior

If `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` is not set:
- Homepage redirects to `/checkout-subscription`
- Checkout page shows alert: "Subscription not configured"

### 8. Analytics Integration

The payment link click is tracked with Google Analytics:
```javascript
gtag('event', 'begin_checkout', {
  currency: 'USD',
  value: 9.99,
  items: [{ item_name: 'Merlin Monthly Subscription' }]
});
```

### 9. Success/Cancel URLs

Stripe payment link should be configured with:
- **Success URL:** `https://your-domain.com/dashboard?success=true&trial=true`
- **Cancel URL:** `https://your-domain.com/?canceled=true`

Configure these in Stripe Dashboard → Payment Links → Edit.

## Alternative: Custom Checkout Sessions

The old implementation using `/api/stripe/create-subscription-session` is still available as a fallback. To use it, simply don't set `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` and the system will create custom Stripe sessions via the API.

## Production Checklist

- [ ] Payment link created in Stripe **production** dashboard
- [ ] Success URL points to production domain
- [ ] Cancel URL points to production domain
- [ ] Environment variable set in Vercel
- [ ] Test purchase in production mode
- [ ] Webhook endpoint configured and tested
- [ ] Customer Portal link in dashboard working

## Support

For issues with the Stripe integration, check:
1. Stripe Dashboard → Logs (for webhook errors)
2. Vercel logs (for deployment issues)
3. Browser console (for client-side errors)
4. Stripe API logs (for session creation errors)
