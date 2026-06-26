# Merlin Frontend - User Guide

## Overview

A modern, responsive frontend for the Merlin astrology application built with Next.js 14, React, Tailwind CSS, and shadcn components. The wheel visualization remains untouched as requested.

## New Components

### Layout Components

#### Navigation (`components/layout/Navigation.tsx`)
- Responsive navigation bar with mobile menu
- User authentication status integration with Clerk
- Smooth scroll animations and transitions
- Active route highlighting

#### Footer (`components/layout/Footer.tsx`)
- Site-wide footer with quick links
- Organized into Brand, Quick Links, Account, and Legal sections
- Consistent styling with the rest of the application

### Form Components

#### BirthIntakeForm (`components/forms/BirthIntakeForm.tsx`)
- Reusable birth data collection form
- Two modes: with payment (`showPayment`) or direct dashboard redirect
- Built-in validation
- Animated form fields with Framer Motion
- Accepts `redirectTo` prop to choose destination ('dashboard' or 'enhanced-dashboard')

### Section Components

#### FeaturesSection (`components/sections/FeaturesSection.tsx`)
- Showcases key features of Merlin
- Grid layout with hover effects
- Icon-based feature cards
- Staggered animations

#### TestimonialsSection (`components/sections/TestimonialsSection.tsx`)
- Social proof section with user testimonials
- Rating display
- MBTI type integration

#### HeroSection (`components/sections/HeroSection.tsx`)
- Reusable hero component for any page
- Animated star background
- Customizable title, subtitle, and description

### UI Components

#### LoadingSpinner (`components/ui/loading-spinner.tsx`)
- Consistent loading states across the app
- Configurable sizes (sm, md, lg, xl)
- Optional text display

## Updated Pages

### Landing Page (`app/page.tsx`)
- Modern hero section with gradient background
- Integrated BirthIntakeForm for easy user onboarding
- Features section highlighting Merlin's capabilities
- Testimonials for social proof
- Strong CTA sections
- Quick access links for existing users

### Checkout Page (`app/checkout/page.tsx`)
- Professional payment interface
- Clear display of birth data
- Feature list showing what users get
- Prominent pricing display
- Secure payment messaging
- Animated elements for engagement

### Root Layout (`app/layout.tsx`)
- Includes Navigation component in header
- Includes Footer component at bottom
- Proper flex layout for sticky footer
- Consistent across all pages

## Design System

### Colors
- Primary: Amber (#F59E0B variants)
- Background: Gradient from purple to blue to indigo
- Text: White and gray variants
- Accents: Amber for highlights and CTAs

### Typography
- Modern sans-serif font stack
- Gradient text effects for headlines
- Clear hierarchy with size variations

### Animations
- Framer Motion for smooth transitions
- Staggered animations for lists
- Hover effects on interactive elements
- Subtle background star animations

## Features

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Collapsible navigation on mobile
- Grid layouts adapt to screen size

### Accessibility
- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Focus states on interactive elements

### Performance
- Lazy loading of components
- Optimized animations
- Efficient re-renders with React best practices

## Pages Overview

### 1. Home (`/`)
- Landing page with BirthIntakeForm
- Features and testimonials
- Multiple CTAs

### 2. Dashboard (`/dashboard`)
- User's personalized chart
- Uses WheelVisualization (unchanged)
- Daily oracle/whisper
- MBTI personality type

### 3. Enhanced Dashboard (`/enhanced-dashboard`)
- Comprehensive birth chart interface
- Tabbed navigation
- Chart interpretations
- Daily forecast
- Active transits

### 4. Birth Chart Calculator (`/astro-calculator`)
- Raw calculation tool
- Location search with real geocoding
- JSON output for developers

### 5. Profile (`/profile`)
- User account information
- Clerk integration
- Quick navigation to other sections

### 6. Checkout (`/checkout`)
- Payment processing
- Birth data confirmation
- Feature highlights
- Secure payment via Stripe

### 7. Sign In/Up (`/sign-in`, `/sign-up`)
- Clerk authentication
- Themed to match Merlin design
- Animated backgrounds

## Component Usage Examples

### Using BirthIntakeForm

```tsx
// With payment (redirects to checkout)
<BirthIntakeForm showPayment redirectTo="dashboard" />

// Without payment (direct to dashboard)
<BirthIntakeForm redirectTo="enhanced-dashboard" />
```

### Using HeroSection

```tsx
<HeroSection
  title="Your Title"
  subtitle="Your Subtitle"
  description="Your description"
  showStars={true}
>
  <YourCallToAction />
</HeroSection>
```

### Using LoadingSpinner

```tsx
<LoadingSpinner size="lg" text="Loading your fate..." />
```

## Navigation Structure

```
Home
├── Dashboard (requires auth)
├── Birth Chart (enhanced-dashboard)
├── Calculator (astro-calculator)
└── Profile (requires auth)

Auth
├── Sign In
└── Sign Up
```

## Key Files Modified

- `app/layout.tsx` - Added Navigation and Footer
- `app/page.tsx` - Complete redesign with new components
- `app/checkout/page.tsx` - Redesigned checkout flow
- `components/layout/` - New layout components
- `components/forms/` - New form components
- `components/sections/` - New section components
- `components/ui/` - New utility components

## Key Files NOT Modified (as requested)

- `components/astrology/WheelVisualization.tsx` - Untouched
- All astrology calculation logic - Untouched
- Backend APIs - Untouched
- Database schema - Untouched

## Running the Application

```bash
# Development
npm run dev

# Build
npm run build

# Start production server
npm start
```

## Environment Variables Required

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

Consider adding:
- Dark/light mode toggle
- Additional animation presets
- More testimonial content
- FAQ section
- Blog/content pages
- User settings page
- Chart sharing functionality
- Social media integration

## Notes

- The wheel visualization component remains completely untouched
- All new components follow shadcn/ui patterns
- Tailwind CSS v3 is used throughout
- Animations are optimized for performance
- Mobile experience is prioritized
