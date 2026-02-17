# 🚀 Performance Optimization Guide for Merlin

## Current Performance Status

### ✅ Already Optimized:
- Next.js 15 with App Router (automatic code splitting)
- Static generation where possible
- Image optimization (if using next/image)
- CSS-in-JS with Tailwind (minimal runtime overhead)

### 🎯 Additional Optimizations to Implement:

---

## 1. **Image Optimization**

### Create an OG (Open Graph) Image
This dramatically improves social media sharing and CTR.

**Tool**: [https://www.opengraph.xyz/](https://www.opengraph.xyz/) or Figma

**Specs:**
- Size: 1200x630px
- Format: PNG or JPG
- File size: < 300KB
- Content: Merlin logo + tagline + sample chart visualization

Save as: `/public/og-image.png`

### LazyLoad Components
```tsx
// Instead of:
import { HeavyComponent } from '@/components/heavy'

// Use:
const HeavyComponent = dynamic(() => import('@/components/heavy'), {
  loading: () => <LoadingState />,
  ssr: false // if not needed for SEO
})
```

Apply to:
- WheelVisualization (D3.js is heavy)
- ChartInterpretation (when not visible)
- ActiveTransits
- DailyForecast

---

## 2. **Code Splitting**

### Route-Based Splitting (Automatic ✅)
Next.js already does this. Each page in `/app` is a separate bundle.

### Component-Based Splitting
```tsx
// pages that don't need immediate load:
import dynamic from 'next/dynamic';

const EnhancedDashboard = dynamic(() => import('@/app/enhanced-dashboard/page'), {
  loading: () => <LoadingState message="Loading dashboard..." />
});
```

---

## 3. **API Response Caching**

### Implement Redis or In-Memory Cache
```typescript
// lib/cache.ts (already exists - enhance it)
import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 60, // 1 hour
});

export function getCached<T>(key: string): T | undefined {
  return cache.get(key) as T;
}

export function setCache<T>(key: string, value: T): void {
  cache.set(key, value);
}
```

**Cache these API calls:**
- Birth chart calculations (same date/time/location = same result)
- Interpretations (planet positions don't change)
- Daily forecasts (cache for 12 hours)

### Implementation:
```typescript
// app/api/calculate-birth-chart/route.ts
import { getCached, setCache } from '@/lib/cache';

export async function POST(request: Request) {
  const body = await request.json();
  const cacheKey = `chart_${body.birthDate}_${body.birthTime}_${body.latitude}_${body.longitude}`;
  
  // Check cache first
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, data: cached, cached: true });
  }
  
  // Calculate...
  const result = await calculateBirthChart(body);
  
  // Store in cache
  setCache(cacheKey, result);
  
  return NextResponse.json({ success: true, data: result, cached: false });
}
```

---

## 4. **Database Optimization**

### If Using Prisma:

**Add Indexes:**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now()) @db.Timestamp(0)
  
  @@index([email]) // Speed up lookups
  @@index([createdAt])
}

model BirthChart {
  id        String   @id @default(cuid())
  userId    String
  birthData Json
  chartData Json
  createdAt DateTime @default(now())
  
  @@index([userId]) // Speed up user's chart queries
  @@index([createdAt])
}
```

**Connection Pooling:**
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

---

## 5. **Frontend Optimization**

### Reduce JavaScript Bundle Size

**Check current size:**
```bash
npm run build
# Look for: "First Load JS"
```

**Target:**
- Homepage: < 100KB
- Dashboard: < 200KB

**How to reduce:**

1. **Remove unused dependencies:**
```bash
npm install -g depcheck
depcheck
# Remove anything unused
```

2. **Use lighter alternatives:**
```tsx
// Instead of full Framer Motion:
import { motion } from 'framer-motion'

// Use specific imports:
import { motion } from 'framer-motion/dist/framer-motion'
```

3. **Defer non-critical scripts:**
```tsx
<Script src="analytics.js" strategy="lazyOnload" />
```

### Optimize Animations
```tsx
// Bad: Causes layout reflow
<motion.div animate={{ width: 300 }}>

// Good: GPU-accelerated
<motion.div animate={{ transform: 'translateX(300px)' }}>
```

---

## 6. **Asset Optimization**

### Fonts
```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Prevent invisible text
  preload: true
})
```

### Icons
```tsx
// Instead of importing all icons:
import * as Icons from 'lucide-react'

// Import only what you need:
import { Star, Moon, Sun } from 'lucide-react'
```

---

## 7. **Monitoring & Metrics**

### Add Performance Monitoring

**Option A: Vercel Analytics (Easiest)**
```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

<body>
  {children}
  <Analytics />
</body>
```

**Option B: Web Vitals**
```typescript
// lib/web-vitals.ts
export function reportWebVitals(metric) {
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    });
  }
}
```

**Track:**
- **LCP** (Largest Contentful Paint) < 2.5s
- **FID** (First Input Delay) < 100ms
- **CLS** (Cumulative Layout Shift) < 0.1

---

## 8. **SEO Performance**

### Core Web Vitals Optimization

1. **Preload Critical Resources:**
```tsx
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
```

2. **Optimize Images:**
```tsx
import Image from 'next/image'

<Image
  src="/wheel-preview.png"
  alt="Birth chart wheel"
  width={600}
  height={600}
  priority // For above-the-fold images
  loading="lazy" // For below-the-fold
/>
```

3. **Implement ISR (Incremental Static Regeneration):**
```tsx
// For pages that change occasionally but not per-user
export const revalidate = 3600 // Revalidate every hour
```

---

## 9. **Progressive Enhancement**

### Optimize for Slow Networks

**Implement skeleton screens:**
```tsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
</div>
```

**Use optimistic UI updates:**
```tsx
const [data, setData] = useState(null);

async function handleSubmit() {
  // Show success immediately
  setData({ /* optimistic data */ });
  
  try {
    const result = await fetch('/api/calculate');
    setData(result); // Update with real data
  } catch (error) {
    setData(null); // Revert on error
    showError();
  }
}
```

---

## 10. **Specific Optimizations for Merlin**

### Birth Chart Calculation
```typescript
// Cache Swiss Ephemeris calculations
// Same birth data = same results always

const chartCache = new Map();

export function calculateBirthChart(data: BirthData) {
  const key = `${data.date}_${data.time}_${data.latitude}_${data.longitude}`;
  
  if (chartCache.has(key)) {
    return chartCache.get(key);
  }
  
  const result = heavyCalculation(data);
  chartCache.set(key, result);
  return result;
}
```

### D3 Wheel Visualization
```tsx
// Lazy load D3 only when needed
const WheelVisualization = dynamic(() => import('./WheelVisualization'), {
  loading: () => <div className="w-[600px] h-[600px] animate-pulse bg-gray-800 rounded-full" />,
  ssr: false,
});
```

### Transit Calculations
```typescript
// Calculate transits in Web Worker (non-blocking)
const transitWorker = new Worker('/workers/transits.js');

transitWorker.postMessage({ birthData });
transitWorker.onmessage = (e) => {
  setTransits(e.data);
};
```

---

## 🎯 Quick Wins (Implement Today)

1. **Add OG image** → Improves social CTR by 30%+
2. **Lazy load D3** → Reduces initial bundle by 50KB
3. **Enable caching** → 10x faster repeat calculations
4. **Add loading skeletons** → Perceived performance boost
5. **Compress images** → Use https://tinypng.com/

---

## 📊 Before/After Benchmarks

### Test Performance:
```bash
# Lighthouse (built into Chrome DevTools)
# Run in Incognito mode
# Target scores:
# Performance: 90+
# Accessibility: 95+
# Best Practices: 95+
# SEO: 100
```

### Tools:
- **GTmetrix**: https://gtmetrix.com/
- **PageSpeed Insights**: https://pagespeed.web.dev/
- **WebPageTest**: https://www.webpagetest.org/

---

## 🚀 Expected Results

After implementing these optimizations:

- **Load time**: < 2 seconds (was 3-5s)
- **Time to Interactive**: < 3 seconds (was 5-8s)
- **Bundle size**: 30-40% smaller
- **Cache hit rate**: 70%+ for repeat visitors
- **Lighthouse score**: 90+ across all metrics

**Impact on Business:**
- 1 second faster = 7% higher conversion rate
- Better SEO ranking
- Lower bounce rate
- Higher user satisfaction

---

*Implement these progressively. Start with quick wins, measure impact, then tackle bigger optimizations.*
