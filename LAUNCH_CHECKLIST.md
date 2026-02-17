# ✅ Merlin Launch Checklist

## 🎯 **Your Path to First Sale in 7 Days**

Follow this checklist step-by-step to launch Merlin and start generating revenue.

---

## 📋 **PRE-LAUNCH (Day 1-2)**

### Technical Setup

#### ☐ **1. Environment Configuration** (30 minutes)
```bash
□ Copy .env.example to .env.local
□ Sign up for Clerk (free): https://dashboard.clerk.com
□ Get Clerk publishable key
□ Get Clerk secret key
□ Add both to .env.local

□ Sign up for Stripe (free test mode): https://dashboard.stripe.com
□ Get Stripe publishable key (test mode)
□ Get Stripe secret key (test mode)
□ Add both to .env.local

□ Set NEXT_PUBLIC_DEV_MODE=true (for testing)
□ Set NEXT_PUBLIC_URL=http://localhost:3000
```

#### ☐ **2. Test Locally** (15 minutes)
```bash
□ Run: npm install
□ Run: npm run dev
□ Open http://localhost:3000
□ Test birth chart calculation
□ Test with: Date=1990-01-15, Time=14:30, City=New York
□ Verify chart displays correctly
```

#### ☐ **3. Set Up Stripe Product** (20 minutes)
```bash
□ Go to Stripe Dashboard → Products
□ Click "Add Product"
□ Name: "Merlin Lifetime Access"
□ Description: "Lifetime access to professional astrology tools"
□ Price: $50 USD (one-time payment)
□ Click "Save product"
□ Copy the Price ID (starts with "price_")
□ Add to .env.local: NEXT_PUBLIC_STRIPE_PRICE_ID=price_xxxxx
```

#### ☐ **4. Test Payment Flow** (15 minutes)
```bash
□ Set NEXT_PUBLIC_DEV_MODE=false in .env.local
□ Restart dev server
□ Go to homepage
□ Fill birth data form
□ Click payment button
□ Use test card: 4242 4242 4242 4242
□ Use any future expiry date
□ Use any 3 digit CVC
□ Complete test payment
□ Verify redirect to dashboard
□ Check Stripe Dashboard → Payments (should show test payment)
```

#### ☐ **5. Create OG Image** (30 minutes)
```bash
□ Use Figma, Canva, or https://www.opengraph.xyz/
□ Size: 1200x630 pixels
□ Include: Merlin logo, tagline, sample chart visual
□ Save as: /public/og-image.png
□ Test on Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
```

---

## 🚀 **DEPLOYMENT (Day 2-3)**

#### ☐ **6. Deploy to Vercel** (30 minutes)
```bash
□ Create Vercel account: https://vercel.com
□ Install Vercel CLI: npm i -g vercel
□ Run: vercel --prod
□ Follow prompts to link GitHub repo
□ Copy production URL

□ Go to Vercel Dashboard → Your Project → Settings → Environment Variables
□ Add all variables from .env.local:
  □ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  □ CLERK_SECRET_KEY
  □ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  □ STRIPE_SECRET_KEY
  □ STRIPE_WEBHOOK_SECRET (leave blank for now)
  □ NEXT_PUBLIC_STRIPE_PRICE_ID
  □ NEXT_PUBLIC_URL (your vercel.app URL)
  □ NEXT_PUBLIC_DEV_MODE=false (important!)

□ Redeploy: vercel --prod
□ Test production site
```

#### ☐ **7. Set Up Stripe Webhook (Production)** (20 minutes)
```bash
□ Go to Stripe Dashboard → Developers → Webhooks
□ Click "Add endpoint"
□ URL: https://your-domain.vercel.app/api/stripe/webhook
□ Events: Select "checkout.session.completed"
□ Click "Add endpoint"
□ Copy webhook signing secret
□ Add to Vercel: STRIPE_WEBHOOK_SECRET=whsec_xxxxx
□ Redeploy
```

#### ☐ **8. Switch Stripe to Live Mode** (When Ready)
```bash
⚠️ Only do this when you're ready to accept real payments!

□ Go to Stripe Dashboard → Toggle "Test mode" OFF
□ Complete Stripe account verification
□ Submit business information
□ Get live API keys
□ Update Vercel environment variables with live keys
□ Update price ID with live product
□ Test with small real payment ($1)
```

---

## 📊 **ANALYTICS (Day 3)**

#### ☐ **9. Google Analytics Setup** (20 minutes)
```bash
□ Create Google Analytics account: https://analytics.google.com
□ Create property for Merlin
□ Get Measurement ID (starts with G-)
□ Add to Vercel: NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
□ Redeploy
□ Test: Visit site, wait 24 hours, check Google Analytics
```

#### ☐ **10. Facebook Pixel (Optional)** (15 minutes)
```bash
□ Go to Facebook Business Manager
□ Create Pixel
□ Copy Pixel ID
□ Add to Vercel: NEXT_PUBLIC_FB_PIXEL_ID=123456789
□ Redeploy
□ Install Facebook Pixel Helper extension
□ Test: Visit site, check if pixel fires
```

---

## 📧 **EMAIL MARKETING (Day 4)**

#### ☐ **11. Choose Email Provider**
Pick ONE:

**Option A: Mailchimp** (Easiest, free up to 500 subscribers)
```bash
□ Sign up: https://mailchimp.com
□ Create audience
□ Go to Account → Extras → API keys
□ Create key
□ Note your server prefix (e.g., us6)
□ Update: app/api/email-capture/route.ts (follow comments)
```

**Option B: ConvertKit** (Best for creators, $29/mo)
```bash
□ Sign up: https://convertkit.com
□ Go to Settings → Advanced → API
□ Copy API Key
□ Update: app/api/email-capture/route.ts
```

**Option C: Skip for now**
```bash
□ Email captures will be logged to console
□ Export later from server logs
□ Set up proper integration when you have budget
```

---

## 🎨 **CONTENT (Day 4-5)**

#### ☐ **12. Customize Content**
```bash
□ Update testimonials in: components/sections/TestimonialsSection.tsx
□ Update features if needed: components/sections/FeaturesSection.tsx
□ Update FAQ: components/sections/FAQSection.tsx
□ Add your social media links: components/layout/Footer.tsx
□ Update privacy policy: app/privacy/page.tsx
□ Update terms of service: app/terms/page.tsx
```

#### ☐ **13. Create Social Media Accounts**
```bash
□ Twitter/X: @merlinoracle (or your brand name)
□ Instagram: @merlinoracle
□ TikTok: @merlinoracle
□ Link bio to your site
□ Post announcement: "Launching soon!"
```

---

## 🚀 **LAUNCH (Day 6-7)**

#### ☐ **14. Pre-Launch Marketing**
```bash
□ Email friends/family: "I built this, would love feedback"
□ Post in your networks (Facebook, LinkedIn)
□ Share on Twitter with #buildinpublic
□ Post on Reddit:
  □ r/SideProject (share your journey)
  □ r/astrology (value-first: "I built a free calculator")
  □ r/MBTI (MBTI + astrology angle)
□ Product Hunt: Schedule launch (2 weeks out ideal)
```

#### ☐ **15. First Sales Push**
```bash
□ Offer early bird discount: "$10 off - first 10 customers"
□ Create urgency: "Only 50 lifetime spots at $50"
□ Share discount code on social media
□ Email your list (if you have one)
□ Ask first customers for testimonials
```

#### ☐ **16. Set Up Monitoring**
```bash
□ Check Stripe Dashboard daily
□ Check Google Analytics daily
□ Monitor error logs in Vercel
□ Respond to user feedback within 24 hours
□ Track key metrics:
  □ Daily visitors
  □ Conversion rate (sales / visitors)
  □ Revenue
  □ Email captures
```

---

## 💰 **POST-LAUNCH (Week 2+)**

#### ☐ **17. First Ad Campaign** (When you have budget)
```bash
□ Allocate $50-100 for testing
□ Choose platform: Facebook/Instagram recommended
□ Target: Astrology, personality tests, spirituality
□ Age: 25-45
□ Creative: Show calculator + benefits
□ Track ROI: Cost per acquisition should be < $25
```

#### ☐ **18. Content Marketing**
```bash
□ Write blog post: "Complete guide to birth charts"
□ Create YouTube video: "How to read your birth chart"
□ Share on Pinterest (huge astrology audience)
□ Guest post on astrology blogs
□ Answer questions on Quora about astrology
```

#### ☐ **19. Optimization**
```bash
□ A/B test pricing ($50 vs $79)
□ Test different headlines
□ Add exit-intent popup
□ Improve testimonials
□ Add video demo
□ Track what's working, do more of it
```

---

## 🎯 **SUCCESS METRICS**

### Week 1 Goals:
- [ ] 5-10 sales
- [ ] $250-500 revenue
- [ ] 50-100 email captures
- [ ] 500-1000 visitors

### Month 1 Goals:
- [ ] 20-50 sales
- [ ] $1,000-2,500 revenue
- [ ] 200-500 email captures
- [ ] 2,000-5,000 visitors

### Month 3 Goals:
- [ ] 100-300 sales
- [ ] $5,000-15,000 revenue
- [ ] 1,000+ email captures
- [ ] 10,000+ visitors

---

## 🆘 **TROUBLESHOOTING**

### "No sales yet"
```
□ Check: Are you getting traffic?
  → If no: Focus on marketing first
  → If yes: Improve conversion rate

□ Check: Is payment working?
  → Test yourself with real card
  → Check Stripe logs for errors

□ Check: Is messaging clear?
  → Show to 5 people, ask for honest feedback
  → Test different headlines
```

### "Getting traffic but no conversions"
```
□ Add social proof (reviews, user count)
□ Add urgency (limited spots, price increase)
□ Add guarantee (30-day refund)
□ Simplify form (less fields)
□ Test different price point
□ Add live chat support
```

### "Payments failing"
```
□ Check Stripe webhook is working
□ Verify all API keys are correct
□ Check Stripe Dashboard → Logs
□ Test in incognito mode
□ Try different payment method
```

---

## 📞 **SUPPORT RESOURCES**

### Documentation:
- [MONETIZATION_GUIDE.md](MONETIZATION_GUIDE.md) - Complete strategy
- [PERFORMANCE_GUIDE.md](PERFORMANCE_GUIDE.md) - Technical optimization
- [IMPROVEMENTS_SUMMARY.md](IMPROVEMENTS_SUMMARY.md) - What's new

### Communities:
- [Indie Hackers](https://indiehackers.com) - Share progress, get feedback
- [r/SaaS](https://reddit.com/r/saas) - SaaS-specific advice
- [r/EntrepreneurRideAlong](https://reddit.com/r/EntrepreneurRideAlong) - Motivation

### Tools:
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Google Analytics](https://analytics.google.com)

---

## ✅ **FINAL CHECKLIST**

Before announcing to the world:

- [ ] Production site works (test yourself)
- [ ] Payment processing works (real test payment)
- [ ] Analytics tracking (verified in GA)
- [ ] Email capture works (test and verify)
- [ ] All links work (privacy, terms, social)
- [ ] Mobile-friendly (test on phone)
- [ ] Fast loading (< 3 seconds)
- [ ] No console errors (check browser)
- [ ] Testimonials updated (real or realistic)
- [ ] FAQ answers your questions
- [ ] CTA is clear ("Get Lifetime Access")
- [ ] Price is visible ($50)
- [ ] Guarantee is mentioned (30-day refund)

---

## 🎉 **READY TO LAUNCH?**

Once you've checked off everything above:

1. **Announce on social media**
2. **Email your network** 
3. **Post on Reddit** (value-first)
4. **Celebrate your first sale!** 🎊

---

## 💡 **PRO TIP**

**Don't wait for perfection.** Launch with 80% complete. Get real user feedback. Iterate quickly.

Your first version doesn't need to be perfect. It needs to be **out there**.

---

## 📈 **TRACK YOUR PROGRESS**

Mark your milestones:

- [ ] ✅ First 5 sales
- [ ] ✅ First $500 revenue
- [ ] ✅ First happy customer testimonial
- [ ] ✅ First social media share
- [ ] ✅ First 100 email subscribers
- [ ] ✅ First $1000 revenue
- [ ] ✅ First profitable ad campaign
- [ ] ✅ First $5000 month

---

**You've got this! Now go build your cosmic empire!** 🚀

*Questions? Check the docs or reach out to the indie hacker community.*
