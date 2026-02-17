'use client';

import { motion } from 'framer-motion';
import { Check, X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

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
            Simple, Lifetime Pricing
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            One payment. Lifetime access. No subscriptions, no hidden fees.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-300 mb-2">Free Trial</h3>
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

          {/* Lifetime Access */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gradient-to-br from-amber-900/60 to-purple-900/40 backdrop-blur-sm border-2 border-amber-500/50 rounded-2xl p-8 relative overflow-hidden"
          >
            <div className="absolute top-4 right-4">
              <div className="bg-amber-400 text-slate-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                BEST VALUE
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-amber-300 mb-2">Lifetime Access</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-bold text-white">$50</span>
                <span className="text-gray-400 line-through text-xl">$299</span>
              </div>
              <p className="text-amber-200 text-sm font-semibold mb-2">83% OFF - Limited Time</p>
              
              {!isLoading && spotsLeft !== null && (
                <div className="inline-block bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-1.5">
                  <p className="text-red-300 text-xs font-bold">
                    ⚠️ Only {spotsLeft} spots remaining at this price
                  </p>
                </div>
              )}
            </div>

            <Link
              href="/#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="block w-full py-4 px-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-lg font-bold text-center shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 mb-6"
            >
              Get Lifetime Access Now
            </Link>

            <div className="space-y-3">
              {lifetimeFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-200 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-amber-500/30">
              <p className="text-gray-400 text-xs text-center">
                ✨ One-time payment. No recurring charges. Ever.
              </p>
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
