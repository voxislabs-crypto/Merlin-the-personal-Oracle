/**
 * Analytics utility functions for tracking user behavior and conversions
 * Supports Google Analytics 4 and Facebook Pixel
 */

// Type definitions for analytics events
export interface AnalyticsEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
}

export interface ConversionEvent {
  currency?: string;
  value?: number;
  transaction_id?: string;
}

/**
 * Track a generic event to Google Analytics
 */
export function trackEvent({ action, category, label, value }: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;
  
  // Google Analytics 4
  if ((window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

/**
 * Track a page view to Google Analytics
 */
export function trackPageView(url: string): void {
  if (typeof window === 'undefined') return;
  
  if ((window as any).gtag) {
    (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: url,
    });
  }
}

/**
 * Track a conversion/purchase event
 */
export function trackConversion({ currency = 'USD', value, transaction_id }: ConversionEvent): void {
  if (typeof window === 'undefined') return;
  
  // Google Analytics purchase event
  if ((window as any).gtag) {
    (window as any).gtag('event', 'purchase', {
      currency,
      value,
      transaction_id,
    });
  }
  
  // Facebook Pixel purchase event
  if ((window as any).fbq) {
    (window as any).fbq('track', 'Purchase', {
      currency,
      value,
    });
  }
}

/**
 * Track when user starts checkout process
 */
export function trackCheckoutStart(value?: number): void {
  if (typeof window === 'undefined') return;
  
  // Google Analytics
  if ((window as any).gtag) {
    (window as any).gtag('event', 'begin_checkout', {
      value,
      currency: 'USD',
    });
  }
  
  // Facebook Pixel
  if ((window as any).fbq) {
    (window as any).fbq('track', 'InitiateCheckout', {
      value,
      currency: 'USD',
    });
  }
}

/**
 * Track email capture lead generation
 */
export function trackLead(): void {
  if (typeof window === 'undefined') return;
  
  // Google Analytics
  if ((window as any).gtag) {
    (window as any).gtag('event', 'generate_lead');
  }
  
  // Facebook Pixel
  if ((window as any).fbq) {
    (window as any).fbq('track', 'Lead');
  }
}

/**
 * Track when user views pricing
 */
export function trackViewPricing(): void {
  if (typeof window === 'undefined') return;
  
  trackEvent({
    action: 'view_pricing',
    category: 'engagement',
  });
}

/**
 * Track signup/registration
 */
export function trackSignup(): void {
  if (typeof window === 'undefined') return;
  
  // Google Analytics
  if ((window as any).gtag) {
    (window as any).gtag('event', 'sign_up', {
      method: 'clerk',
    });
  }
  
  // Facebook Pixel
  if ((window as any).fbq) {
    (window as any).fbq('track', 'CompleteRegistration');
  }
}

/**
 * Track birth chart calculation (key engagement metric)
 */
export function trackChartCalculation(): void {
  if (typeof window === 'undefined') return;
  
  trackEvent({
    action: 'calculate_chart',
    category: 'engagement',
    label: 'birth_chart',
  });
}

/**
 * Track content views (features, testimonials, etc.)
 */
export function trackContentView(contentName: string): void {
  if (typeof window === 'undefined') return;
  
  trackEvent({
    action: 'view_content',
    category: 'engagement',
    label: contentName,
  });
}
