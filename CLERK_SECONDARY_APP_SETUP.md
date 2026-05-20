# Clerk Secondary Application Setup for Merlin

This guide covers setting up Clerk as a **secondary application** with custom domains for API and email.

## Current Configuration

- **Application Type:** Secondary
- **API Domain:** `clerk.merlin.voxislabs.com`
- **Email Domain:** `@merlin.voxislabs.com`
- **Environment Variables:** Already updated in `.env.local`

---

## Step 1: Configure Custom API Domain in Clerk Dashboard

1. **Go to** [Clerk Dashboard](https://dashboard.clerk.com)
2. **Select your application** (or create one if needed)
3. **Navigate to** Configuration → API → Custom Domain
4. **Enter custom domain:** `clerk.merlin.voxislabs.com`
5. **Verify DNS Records:**
   - Clerk will provide CNAME record(s) to add to your DNS
   - Add this CNAME to your DNS provider (voxislabs.com):
     ```
     clerk.merlin.voxislabs.com CNAME <clerk-provided-value>
     ```
   - Wait for DNS propagation (5-30 minutes, check with `nslookup`)

---

## Step 2: Configure Email Domain Verification

1. **In Clerk Dashboard**, go to Configuration → Email
2. **Add sender email domain:** `merlin.voxislabs.com`
3. **Verify domain ownership** via DNS TXT record:
   - Clerk provides a TXT record to add
   - Add to your DNS provider:
     ```
     _clerk.merlin.voxislabs.com TXT "v=clerk1; <verification-key>"
     ```
4. **Configure from email address:**
   - Default: `noreply@merlin.voxislabs.com` (recommended)
   - Or custom: `support@merlin.voxislabs.com`

---

## Step 3: Update Redirect URLs (if needed)

In Clerk Dashboard → Configuration → URLs, ensure these are set:

```
Sign-in URL:           http://localhost:3000/sign-in (dev)
                       https://merlin.voxislabs.com/sign-in (prod)

Sign-up URL:           http://localhost:3000/sign-up (dev)
                       https://merlin.voxislabs.com/sign-up (prod)

After sign-in URL:     http://localhost:3000/dashboard (dev)
                       https://merlin.voxislabs.com/dashboard (prod)

After sign-up URL:     http://localhost:3000/dashboard (dev)
                       https://merlin.voxislabs.com/dashboard (prod)
```

---

## Step 4: Get Your API Keys

1. **In Clerk Dashboard**, go to Configuration → API Keys
2. **Copy and paste into `.env.local`:**
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

✅ **Already done** - Keys are in your `.env.local`

---

## Step 5: DNS Setup Checklist

Add these records to your DNS provider (voxislabs.com):

- [ ] CNAME for API domain: `clerk.merlin.voxislabs.com` → Clerk-provided value
- [ ] TXT for email verification: `_clerk.merlin.voxislabs.com` → `v=clerk1; <key>`
- [ ] Verify propagation: 
  ```bash
  nslookup clerk.merlin.voxislabs.com
  ```

---

## Step 6: Test Configuration

### Local Testing
```bash
npm run dev
# Visit: http://localhost:3000/sign-in
# Should see Clerk sign-in page with custom domain
```

### Production Testing (after DNS propagation)
```bash
# Update .env.local for production
NEXT_PUBLIC_URL=https://merlin.voxislabs.com
# Deploy to production
npm run build
npm run start
```

### Verify Email Sending
1. Sign up for an account at `https://merlin.voxislabs.com/sign-up`
2. Check verification email comes from `noreply@merlin.voxislabs.com`
3. Verify email domain in the "From:" header

---

## Step 7: Webhook Setup (Optional but Recommended)

For handling Clerk events (user created, deleted, updated):

1. **In Clerk Dashboard**, go to Webhooks
2. **Create endpoint:** `https://merlin.voxislabs.com/api/webhooks/clerk`
3. **Select events to subscribe to:**
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `session.created`
   - `session.ended`

---

## Environment Variables Reference

```bash
# In .env.local (already configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_CUSTOM_DOMAIN=clerk.merlin.voxislabs.com
CLERK_EMAIL_DOMAIN=merlin.voxislabs.com
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

---

## Troubleshooting

### "Domain verification failed"
- Check DNS records are correct (wait 30+ minutes for propagation)
- Verify TXT record format exactly matches Clerk's requirement
- Use `dig` to check: `dig _clerk.merlin.voxislabs.com TXT`

### "Email not sending from custom domain"
- Ensure email domain TXT record is verified
- Check "From" address matches verified domain in Clerk Dashboard
- Wait 5-10 minutes after verification before testing

### "Redirects not working"
- Ensure redirect URLs in Clerk Dashboard match your deployment domain
- For dev: Use `http://localhost:3000`
- For prod: Use `https://merlin.voxislabs.com`

### "Custom domain showing error"
- DNS CNAME might not be propagated yet
- Check CNAME target is correct
- Wait 30 minutes and try again

---

## Secondary Application vs Primary

**Key differences for secondary applications:**

| Feature | Primary | Secondary |
|---------|---------|-----------|
| Custom Domain | Optional | Required* |
| Email Domain | Optional | Recommended |
| Auth Flow | Standard | Standard (same) |
| User Management | In main dashboard | In secondary dashboard |
| Webhooks | Yes | Yes |

*For secondary applications, custom domains help avoid subdomain conflicts.

---

## Next Steps

1. ✅ Environment variables configured
2. ⏳ Add DNS records (CNAME + TXT)
3. ⏳ Verify custom domain in Clerk Dashboard
4. ⏳ Test sign-in/sign-up flow
5. ⏳ Monitor email delivery

Once DNS is propagated and verified, your secondary Clerk application will be fully functional!
