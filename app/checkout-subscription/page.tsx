'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Shield, Check } from 'lucide-react';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const features = [
  'Complete Birth Chart Analysis',
  'Swiss Ephemeris Precision',
  'Daily Personalized Forecasts',
  'Real-Time Transit Tracking',
  'MBTI Personality Integration',
  'Life Timeline & Major Events',
  'Weekly Cosmic Whispers',
  'Unlimited Chart Calculations',
  'Mobile App Access (PWA)',
  'Grok AI Interpretations',
];

export default function CheckoutSubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSignedIn = document.cookie.includes('__clerk');
      if (!isSignedIn) {
        // Redirect to sign-in if not authenticated
        const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || '/checkout-subscription';
        router.push('/sign-in?redirect_url=' + encodeURIComponent(paymentLink));
      }
    }
  }, [router]);

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      // Use direct Stripe payment link (simpler, faster, no backend required)
      const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;
      
      if (!paymentLink) {
        console.error('Stripe payment link not configured');
        alert('Subscription not configured. Please contact support.');
        setLoading(false);
        return;
      }

      console.log('Redirecting to Stripe payment link...');
      // Track subscription attempt
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'begin_checkout', {
          currency: 'USD',
          value: 9.99,
          items: [{ item_name: 'Merlin Monthly Subscription' }]
        });
      }
      
      // Redirect directly to Stripe-hosted checkout
      window.location.href = paymentLink;
    } catch (err) {
      console.error('Subscription error:', err);
      alert(err instanceof Error ? err.message : 'Subscription failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 text-white pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
            Start Your 7-Day Free Trial
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Experience the full power of Merlin for 7 days, absolutely free. Cancel anytime before the trial ends.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Pricing Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-purple-900/80 to-blue-900/80 backdrop-blur-sm border-purple-500/50 text-white">
              <CardHeader>
                <CardTitle className="text-3xl text-purple-300">Monthly Plan</CardTitle>
                <CardDescription className="text-gray-300">
                  Full access to all features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold">$9.99</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  <p className="text-purple-200 font-semibold">First 7 days free</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Then $9.99/month. Cancel anytime before trial ends.
                  </p>
                </div>

                <Button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-6 text-lg"
                >
                  {loading ? 'Processing...' : 'Start Free Trial'}
                </Button>

                <div className="mt-6 space-y-2 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span>Credit card required (not charged for 7 days)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span>Cancel anytime from your dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span>Secure payment via Stripe</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border-amber-500/30 text-white h-full">
              <CardHeader>
                <CardTitle className="text-2xl text-amber-300">What You Get</CardTitle>
                <CardDescription className="text-gray-300">
                  Full access to all premium features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Lifetime Option */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center"
        >
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-6 inline-block">
            <p className="text-amber-300 font-semibold mb-2">
              Or get lifetime access for just $50
            </p>
            <p className="text-gray-400 text-sm mb-4">
              One-time payment · Save $249 compared to regular price
            </p>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
            >
              View Lifetime Option
            </Button>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 max-w-2xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-center mb-6 text-purple-300">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4 text-gray-300">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-white">When will I be charged?</h4>
              <p className="text-sm">
                Your card will be charged $9.99 on the 8th day after you start your trial. You can cancel anytime before that to avoid charges.
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-white">How do I cancel?</h4>
              <p className="text-sm">
                Go to your dashboard and click on "Manage Subscription". You can cancel with one click, no questions asked.
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-white">What happens after I cancel?</h4>
              <p className="text-sm">
                You'll retain access until the end of your current billing period. No refunds for partial months.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
