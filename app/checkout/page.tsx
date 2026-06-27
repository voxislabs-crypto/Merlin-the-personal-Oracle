'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Shield, Check } from 'lucide-react';

const features = [
  'Complete Birth Chart Analysis',
  'Daily Forecasts & Transit Intelligence',
  'Oracle Chat & Atmosphere Engine',
  'Life Timeline & Storm Radar',
  'MBTI Integration & Weekly Whispers',
  'Lifetime updates — pay once, keep forever',
];

export default function CheckoutLifetimePage() {
  const [loading, setLoading] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();

  const handleCheckout = async () => {
    if (!isSignedIn) {
      window.location.href = '/sign-in?redirect_url=' + encodeURIComponent('/checkout');
      return;
    }

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    if (!priceId) {
      alert('Lifetime checkout is not configured. Please contact support.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, birthData: {} }),
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed. Please try again.');
      }
      if (!data.url) {
        throw new Error('Stripe checkout URL was not returned.');
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('Lifetime checkout error:', err);
      alert(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-amber-400">Loading checkout...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-16">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-amber-500/30 bg-slate-900/80 backdrop-blur">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
                <Crown className="h-6 w-6 text-amber-300" />
              </div>
              <CardTitle className="text-2xl text-amber-100">Lifetime Access</CardTitle>
              <CardDescription className="text-slate-300">
                One payment. Full Oracle forever. Founder pricing while in beta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-5xl font-bold text-white">$50</span>
                <span className="ml-2 text-slate-400 line-through">$299</span>
              </div>

              <ul className="space-y-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => void handleCheckout()}
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                {loading ? 'Redirecting to Stripe...' : 'Get Lifetime Access — $50'}
              </Button>

              <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Shield className="h-3.5 w-3.5" />
                Secure payment via Stripe
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}