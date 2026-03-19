# 🌟 Merlin - Your Personal Oracle

## Professional Astrology Birth Chart Calculator with Lifetime Access

Merlin combines Swiss Ephemeris precision with MBTI personality insights to deliver professional-grade astrological analysis. Built with Next.js 15, TypeScript, and modern web technologies.

---

## 🚀 **Live Demo**

[Visit Merlin](https://merlin-the-personal-oracle-a2ay.vercel.app/)

---

## ✨ **Features**

### Core Functionality:
- ✅ **Swiss Ephemeris Calculations** - NASA-grade astronomical precision
- ✅ **Complete Birth Charts** - Planets, houses, aspects, angles
- ✅ **Daily Forecasts** - Personalized cosmic guidance
- ✅ **Transit Tracking** - Real-time planetary movements
- ✅ **7-Day Predictive Transit Intelligence** - 6-hour sampling with intensity/confidence/volatility scoring
- ✅ **Lunar Timing Engine** - phase-aware action bias with void-of-course caution windows
- ✅ **Progressed Moon Overlay** - domain emphasis boosts integrated into predictive scoring
- ✅ **MBTI Integration** - Personality type overlays
- ✅ **Life Timeline** - Major life events and timing
- ✅ **Weekly Whispers** - 7-day forecasts
- ✅ **Interactive Wheel Visualization** - D3.js rendering

### Business Features:
- ✅ **One-Time Payment** - Lifetime access model ($50)
- ✅ **Stripe Integration** - Secure payment processing
- ✅ **Clerk Authentication** - User management
- ✅ **Email Capture** - Lead generation
- ✅ **Analytics Tracking** - Conversion optimization
- ✅ **SEO Optimized** - Organic traffic ready
- ✅ **PWA Support** - Install as mobile app

---

## 🏗️ **Recent Improvements (v2.0)**

### 1. **Enhanced Landing Page**
- Professional conversion-optimized design
- Trust badges and social proof
- Pricing comparison section
- FAQ section (8 common questions)
- Detailed testimonials (6 real users)
- Clear CTAs with urgency messaging

### 2. **SEO & Analytics**
- Comprehensive meta tags
- Open Graph & Twitter Card support
- Structured data (Schema.org)
- Google Analytics 4 integration
- Facebook Pixel support
- Conversion tracking on all key events

### 3. **Lead Generation**
- Email capture component
- Multiple display variants
- Ready for Mailchimp/ConvertKit/Klaviyo
- Analytics tracking for leads

### 4. **Enhanced UX**
- Professional loading states
- Comprehensive error handling
- Smooth animations
- Mobile-optimized layouts
- Accessible design

### 5. **Documentation**
- Complete monetization guide
- Performance optimization guide
- Environment setup instructions
- Deployment checklist
- Growth strategies

### 6. **Forecast Intelligence Layer**
- Persistent resonance learning via API feedback (user context + thumbs/collector inputs)
- Deterministic predictive transit bundle exposed from `/api/transits`
- Dashboard surfaces include:
  - **Daily Transit Forecast** snapshot card (lunar timing, progressed Moon, top signal)
  - **Active Transits** clairvoyance panel (context read, lunar read, score explainability)
  - **Action Signal** badges (`DO NOW` / `DELAY NOW`) for top predictive events

---

## 📦 **Tech Stack**

```typescript
Frontend:
- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- D3.js

Backend:
- Next.js API Routes
- Swiss Ephemeris (sweph)
- Node.js

Services:
- Clerk (Authentication)
- Stripe (Payments)
- Vercel (Hosting)
- Google Analytics (Tracking)
```

---

## 🚀 **Quick Start**

### Prerequisites:
- Node.js 18+ 
- npm or yarn
- Clerk account (free)
- Stripe account (test mode free)

### Installation:

```bash
# Clone repository
git clone https://github.com/voxislabs-crypto/Merlin-the-personal-Oracle.git
cd Merlin-the-personal-Oracle

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev

# Open http://localhost:3000
```

### Minimum Required Environment Variables:

```env
# Clerk Authentication (free at dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Stripe Payment (test mode free at dashboard.stripe.com)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID=price_xxxxx

# Development mode (bypasses payment)
NEXT_PUBLIC_DEV_MODE=true
```

Full configuration options in [`.env.example`](.env.example)

---

## 📚 **Documentation**

### For Developers:
- [**Copilot Instructions**](.github/copilot-instructions.md) - Architecture & patterns
- [**Performance Guide**](PERFORMANCE_GUIDE.md) - Optimization strategies
- [**API Documentation**](docs/API.md) - Endpoint reference

### For Business:
- [**Monetization Guide**](MONETIZATION_GUIDE.md) - Complete launch strategy
- [**Improvements Summary**](IMPROVEMENTS_SUMMARY.md) - What's new in v2.0
- [**Deployment Checklist**](DEPLOY.md) - Production deployment

---

## 💰 **Monetization**

### Current Model: **Lifetime Access**
- **Price**: $50 one-time payment
- **Value**: Professional tools typically $299+
- **No subscriptions** - Buy once, use forever

### Revenue Potential:
```
Month 1: 10-30 sales = $500-1,500
Month 2: 30-100 sales = $1,500-5,000
Month 3: 100-300 sales = $5,000-15,000

At scale: $5k-10k+ monthly
```

See [MONETIZATION_GUIDE.md](MONETIZATION_GUIDE.md) for complete strategy.

---

## 🔧 **Development**

### Commands:

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Run production build
npm run lint             # ESLint
npm run test             # Jest tests
npm run test:watch       # Jest watch mode

# Database (if using Prisma)
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema to DB
npm run prisma:studio    # Open Prisma Studio
```

### Project Structure:

```
app/
  api/              # API endpoints
  (routes)/         # Page routes
  layout.tsx        # Root layout
  page.tsx          # Landing page

components/
  sections/         # Landing page sections
  astrology/        # Chart components
  forms/            # Input forms
  ui/               # Base UI components
  layout/           # Header, footer, nav

lib/
  astrology/        # Calculation engine
  analytics.ts      # Tracking utilities
  cache-service.ts  # Caching layer

hooks/
  useBirthChart.tsx    # Chart state management
  useInterpretations.tsx
  useForecast.tsx
  useTransits.tsx

types/
  astrology.ts      # Type definitions
```

---

## 🚀 **Deployment**

### Deploy to Vercel (Recommended):

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

### Environment Variables to Set:
1. All Clerk keys
2. All Stripe keys (live mode)
3. Google Analytics ID
4. Facebook Pixel ID (optional)
5. Email marketing API keys (optional)
6. Set `NEXT_PUBLIC_DEV_MODE=false`

Full deployment guide: [DEPLOY.md](DEPLOY.md)

---

## 📊 **Analytics & Tracking**

### Key Metrics:
- **Page Views** - Google Analytics
- **Sign Ups** - Clerk dashboard
- **Chart Calculations** - Custom event
- **Checkout Initiations** - Stripe + GA
- **Purchases** - Stripe + GA + Facebook
- **Email Captures** - Lead generation

### Conversion Funnel:
```
Homepage → Calculator Form → Payment → Dashboard
Target: 2-5% conversion rate (visitors to buyers)
```

### Setup:
1. Add Google Analytics ID to `.env.local`
2. Add Facebook Pixel ID (optional)
3. Import and use tracking functions from `lib/analytics.ts`

---

## 🎨 **Customization**

### Branding:
```typescript
// Update colors in tailwind.config.js
colors: {
  primary: '#fcd34d',    // Amber
  secondary: '#0f172a',  // Slate
  accent: '#7c3aed',     // Purple
}
```

### Content:
- **Landing page copy**: `app/page.tsx`
- **Testimonials**: `components/sections/TestimonialsSection.tsx`
- **Features**: `components/sections/FeaturesSection.tsx`
- **FAQ**: `components/sections/FAQSection.tsx`
- **Pricing**: `components/sections/PricingSection.tsx`

### Assets:
- **Logo**: `/public/icon.svg`
- **OG Image**: `/public/og-image.png` (create 1200x630px)
- **Manifest**: `/public/manifest.json`

---

## 🧪 **Testing**

### Manual Testing:

1. **Birth Chart Calculation**:
```bash
# Test data:
Date: 1990-01-15
Time: 14:30
Location: New York, NY (40.7128, -74.0060)
```

2. **Payment Flow** (Test Mode):
```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

3. **Email Capture**:
- Test form submission
- Check server logs
- Verify analytics event fires

### Automated Testing:
```bash
npm run test
# Tests in /tests/
```

---

## 🐛 **Troubleshooting**

### Build Warnings:
- Unused imports = Normal, won't affect production
- Missing dependencies in useEffect = Expected, controlled behavior
- Swisseph import error = Uses fallback calculations

### Common Issues:

**"Payment not working"**
- Check Stripe keys in `.env.local`
- Verify `NEXT_PUBLIC_STRIPE_PRICE_ID` is set
- Ensure dev mode is off: `NEXT_PUBLIC_DEV_MODE=false`

**"Charts not calculating"**
- Check browser console for errors
- Verify API endpoint: `/api/calculate-birth-chart`
- Check Swiss Ephemeris fallback is working

**"Analytics not tracking"**
- Verify Google Analytics ID is correct
- Check `window.gtag` exists in browser console
- Test in incognito mode (extensions can block)

---

## 📖 **API Reference**

### Core Endpoints:

```typescript
POST /api/calculate-birth-chart
Body: { birthDate, birthTime, latitude, longitude }
Response: { success, data: BirthChartData }

POST /api/interpret
Body: { birthData, mode: 'grok' | 'traditional' }
Response: { success, data: Interpretations }

POST /api/forecast
Body: { birthData }
Response: { success, data: DailyForecast }

POST /api/transits
Body: { birthData }
Response: { success, data: AspectMatch[] }

GET /api/spots
Response: { spotsLeft: number }
```

Full API documentation: [docs/API.md](docs/API.md)

---

## 🤝 **Contributing**

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 **License**

This project is private/proprietary. All rights reserved.

*(Or specify your license: MIT, Apache 2.0, etc.)*

---

## 🙏 **Acknowledgments**

- **Swiss Ephemeris** - Astronomical calculations
- **Astrodienst** - Astrological reference
- **MBTI Foundation** - Personality typing framework
- **Indie Hackers Community** - Business guidance

---

## 📞 **Support & Contact**

### For Technical Issues:
- GitHub Issues: [Create issue](https://github.com/voxislabs-crypto/Merlin-the-personal-Oracle/issues)
- Email: dev@merlin-oracle.com

### For Business/Sales:
- Email: hello@merlin-oracle.com
- Twitter: [@merlinoracle](https://twitter.com/merlinoracle)

---

## 🗺️ **Roadmap**

### Q1 2026:
- [ ] Launch Product Hunt
- [ ] Implement affiliate program
- [ ] Add synastry (relationship compatibility)
- [ ] iOS/Android app wrappers

### Q2 2026:
- [ ] AI voice readings
- [ ] Professional tier ($299)
- [ ] API for developers
- [ ] White-label licensing

### Q3 2026:
- [ ] Marketplace: Third-party integrations
- [ ] Team/business features
- [ ] Advanced forecasting engine
- [ ] Mobile native apps

---

## ⭐ **Star History**

If this project helped you, please give it a star! ⭐

---

## 📈 **Stats**

```
Lines of Code: ~15,000
Components: 50+
API Endpoints: 20+
Tests: 15+
Documentation Pages: 8
```

---

**Built with ❤️ for the cosmic truth-seekers.**

*The astrology that doesn't lie.*

---

## 📝 **Changelog**

### v2.0.0 (Current)
- ✅ Complete landing page redesign
- ✅ SEO optimization
- ✅ Analytics integration
- ✅ Email capture system
- ✅ Enhanced UX components
- ✅ Comprehensive documentation
- ✅ Monetization features

### v1.0.0
- ✅ Core birth chart calculations
- ✅ Dashboard interface
- ✅ Stripe payment integration
- ✅ Clerk authentication
- ✅ Basic features

---

*Last updated: February 2026*
