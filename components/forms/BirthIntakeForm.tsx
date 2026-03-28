'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import { trackCheckoutStart } from '@/lib/analytics';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface BirthIntakeFormProps {
  redirectTo?: 'dashboard' | 'enhanced-dashboard';
  showPayment?: boolean;
  className?: string;
}

export function BirthIntakeForm({
  redirectTo = 'dashboard',
  showPayment = false,
  className = '',
}: BirthIntakeFormProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    birthDate: '',
    birthTime: '',
    birthCity: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Track checkout initiation
    if (showPayment) {
      trackCheckoutStart(50);
    }

    try {
      if (showPayment) {
        if (!isSignedIn) {
          window.location.href = '/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname + window.location.hash);
          return;
        }

        // Process payment directly
        console.log('Starting payment flow...');
        const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
        console.log('Price ID:', priceId);
        
        if (!priceId) {
          console.error('Missing NEXT_PUBLIC_STRIPE_PRICE_ID');
          alert('Payment not configured. Please contact support.');
          setLoading(false);
          return;
        }

        console.log('Creating checkout session with:', { priceId, formData });
        const response = await fetch('/api/stripe/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            priceId,
            birthData: formData 
          }),
        });

        console.log('Response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error:', errorData);
          throw new Error(errorData.error || 'Payment failed');
        }

        const { sessionId, url } = await response.json();
        console.log('Checkout session created:', { sessionId, url });
        console.log('Checkout session created:', { sessionId, url });

        if (url) {
          console.log('Redirecting to Stripe checkout:', url);
          window.location.href = url;
          return;
        }

        if (!stripePromise) {
          throw new Error('Stripe is not configured. Please contact support.');
        }

        const stripe = await stripePromise;

        if (!stripe) {
          throw new Error('Stripe failed to load');
        }

        const { error } = await stripe.redirectToCheckout({ sessionId });

        if (error) {
          throw error;
        }
      } else {
        // Redirect directly to dashboard
        const params = new URLSearchParams({
          date: formData.birthDate,
          time: formData.birthTime,
          city: formData.birthCity,
        });
        router.push(`/${redirectTo}?${params.toString()}`);
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      console.error('Error details:', { message: error.message, stack: error.stack });
      alert(error.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isValid = formData.birthDate && formData.birthTime && formData.birthCity;

  return (
    <Card className={`border-amber-500/20 bg-gray-900/40 backdrop-blur-sm ${className}`}>
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold text-amber-300">
          {showPayment ? 'Unlock Your Cosmic Blueprint' : 'Enter Your Birth Details'}
        </CardTitle>
        <CardDescription className="text-gray-400">
          {showPayment
            ? 'Get your lifetime access to personalized astrological insights'
            : 'Calculate your birth chart and discover your cosmic profile'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Birth Date */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <Label htmlFor="birthDate" className="text-amber-200 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Birth Date</span>
            </Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleChange('birthDate', e.target.value)}
              required
              className="bg-gray-800/50 border-amber-500/30 text-white focus:border-amber-500 focus:ring-amber-500/20"
            />
          </motion.div>

          {/* Birth Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="birthTime" className="text-amber-200 flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Birth Time</span>
            </Label>
            <Input
              id="birthTime"
              type="time"
              value={formData.birthTime}
              onChange={(e) => handleChange('birthTime', e.target.value)}
              required
              className="bg-gray-800/50 border-amber-500/30 text-white focus:border-amber-500 focus:ring-amber-500/20"
            />
            <p className="text-xs text-gray-400">
              For accurate results, use the exact time from your birth certificate
            </p>
          </motion.div>

          {/* Birth City */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <Label htmlFor="birthCity" className="text-amber-200 flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Birth City</span>
            </Label>
            <Input
              id="birthCity"
              type="text"
              placeholder="e.g., New York"
              value={formData.birthCity}
              onChange={(e) => handleChange('birthCity', e.target.value)}
              required
              className="bg-gray-800/50 border-amber-500/30 text-white placeholder:text-gray-500 focus:border-amber-500 focus:ring-amber-500/20"
            />
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              type="submit"
              disabled={!isValid || loading}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold py-6 text-lg shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : showPayment ? (
                <>{isSignedIn ? 'Pay $50 & Reveal Your Fate' : 'Sign In to Buy Lifetime Access'}</>
              ) : (
                <>Calculate My Chart</>
              )}
            </Button>
          </motion.div>

          {showPayment && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-red-400 font-semibold text-sm animate-pulse"
            >
              ⚡ Only 47 lifetime spots left. Gone forever.
            </motion.p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
