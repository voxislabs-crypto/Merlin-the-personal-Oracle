'use client';

import { motion } from 'framer-motion';
import { Check, X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

const lifetimeFeatures = [
  'Complete Birth Chart Analysis',
  'Swiss Ephemeris Precision',
  'Daily Personalized Forecasts',
  'Real-Time Transit Tracking',
  'MBTI Personality Integration',
  'Life Timeline & Major Events',
  'Weekly Cosmic Whispers',
  'Unlimited Chart Calculations',
  'Mobile App Access (PWA)',
  'Lifetime Updates',
];

const freeFeatures = [
  'Basic Birth Chart',
  'Limited Interpretations',
];

const freeNotIncluded = [
  'Daily Forecasts',
  'Transit Tracking',
  'MBTI Integration',
  'Life Timeline',
  'Weekly Whispers',
  'Priority Support',
];

export function PricingSection() {
  const { isSignedIn } = useAuth();
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/spots')
      .then((res) => res.json())
      .then((data) => {
        setSpotsLeft(data.spotsLeft || 47);
        setIsLoading(false);
      })
      .catch(() => {
        setSpotsLeft(47);
        setIsLoading(false);
      });
  }, []);

  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent mb-4">
            Choose Your Pricing Path
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Try monthly with a 7-day free trial, own it forever for $50, or explore for free.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Monthly Subscription */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-purple-900/80 to-blue-900/80 backdrop-blur-sm border-2 border-purple-500/50 rounded-2xl p-8 hover:border-purple-400/70 transition-all"
          >
            <div className="mb-6">
              <div className="inline-block bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full mb-3">
                7-DAY FREE TRIAL
              </div>
              <h3 className="text-2xl font-bold text-purple-200 mb-2">Monthly</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-white">$9.99</span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-purple-200 text-sm mb-2">Try 7 days free</p>
              <p className="text-gray-400 text-sm">Card required · Cancel anytime</p>
            </div>

            <a
              href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || '/checkout-subscription'}
              onClick={(e) => {
                if (typeof window !== 'undefined') {
                  // Production mode: check if user is signed in first
                  if (!isSignedIn) {
                    e.preventDefault();
                    window.location.href = '/sign-in?redirect_url=' + encodeURIComponent(process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || '/checkout-subscription');
                    return;
                  }
                }
              }}
              className="block w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold text-center transition-all duration-300 mb-6 transform hover:scale-105"
            >
              Start Free Trial
            </a>

            <div className="space-y-3">
              {lifetimeFeatures.slice(0, 8).map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Lifetime Access - FEATURED */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gradient-to-br from-amber-900/90 to-orange-900/90 backdrop-blur-sm border-2 border-amber-400/70 rounded-2xl p-8 relative transform md:scale-105 shadow-2xl shadow-amber-500/20"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                ⭐ BEST VALUE
              </div>
            </div>

            <div className="mb-6 mt-2">
              <h3 className="text-2xl font-bold text-amber-200 mb-2">Lifetime Access</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-white">$50</span>
                <span className="text-gray-400 line-through text-xl">$299</span>
              </div>
              <p className="text-amber-200 text-sm mb-2">One-time payment</p>
              <p className="text-red-300 text-sm font-semibold">
                {!isLoading && spotsLeft && `Only ${spotsLeft} spots left`}
              </p>
            </div>

            <Link
              href="#intake-form"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('intake-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="block w-full py-3 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-semibold text-center transition-all duration-300 mb-6 transform hover:scale-105 shadow-lg"
            >
              Get Lifetime Access
            </Link>

            <div className="space-y-3">
              {lifetimeFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-200 text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-amber-500/30">
              <p className="text-amber-200 text-sm text-center font-semibold">
                💰 Save $249 compared to regular price
              </p>
            </div>
          </motion.div>

          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-300 mb-2">Free Explorer</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-gray-400">$0</span>
              </div>
              <p className="text-gray-500 text-sm">Limited features to explore</p>
            </div>

            <Link
              href="/dashboard"
              className="block w-full py-3 px-6 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-semibold text-center transition-all duration-300 mb-6"
            >
              Try Free Version
            </Link>

            <div className="space-y-3">
              {freeFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400 text-sm">{feature}</span>
                </div>
              ))}
              {freeNotIncluded.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 opacity-50">
                  <X className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm line-through">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Money-back guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 text-sm">
            <span className="text-amber-400 font-semibold">30-Day Money-Back Guarantee</span>
            {' · '}
            If you're not completely satisfied, we'll refund you. No questions asked.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
