# 🚀 Merlin Stripe Integration - Quick Start

## Live Demo
**Checkout Page:** http://localhost:5000/checkout  
**Test Card:** `4242 4242 4242 4242` + any future date + any CVC

---

## API Endpoints

### Check Spots
```bash
curl http://localhost:5000/api/spots
# { "spotsLeft": 46 }
```

### Decrement Spots (after payment)
```bash
curl -X POST http://localhost:5000/api/spots
# { "spotsLeft": 45 }
```

### Create Stripe Session
```bash
curl -X POST http://localhost:5000/api/stripe/create-session \
  -H "Content-Type: application/json" \
  -d '{"priceId":"any-price-id"}'
# { "sessionId": "cs_test_..." }
```

---

## Pricing
- **Product:** Merlin Lifetime Access
- **Price:** $50.00 USD
- **Payment:** One-time
- **Available:** 47 spots

---

## Key Files
| File | Purpose |
|------|---------|
| `/app/checkout/page.tsx` | Checkout UI (80 lines) |
| `/app/api/stripe/create-session/route.ts` | Session creation |
| `/app/api/spots/route.ts` | Spots counter API |
| `/.env.local` | Stripe credentials |

---

## Flow
1. User visits `/checkout`
2. Sees price, spots remaining, benefits
3. Clicks "Pay $50 Now"
4. Stripe.js redirects to Stripe modal
5. User enters test card details
6. Completes payment
7. Redirected to `/dashboard?success=true`
8. *(TODO: Call POST /api/spots via webhook)*

---

## Status
✅ Build passes  
✅ API working  
✅ Checkout page live  
✅ Stripe integration complete  
✅ Test flow verified  

---

## Next Steps
1. Set up Stripe webhook → auto-decrement spots
2. Migrate spots to database
3. Add user tracking (Clerk)
4. Dashboard integration

See `STRIPE_READY.md` for full details.
