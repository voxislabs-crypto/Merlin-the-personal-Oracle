'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

const premiumFeatures = [
  'Life weather · daily intensity & tone',
  'Life weather · forecast, storms & pressure radar',
  'Life weather · reality check (felt mood vs chart)',
  'Life weather · weekly horizon & today\'s move',
  'Self · full birth chart & interactive wheel',
  'Self · dual MBTI from your placements',
  'Oracle chat with weather + identity context',
  'Swiss Ephemeris precision',
  'Unlimited chart calculations',
  'PWA · install on your phone',
];

const freeFeatures = [
  'Basic birth chart peek',
  'Limited interpretations',
];

const freeNotIncluded = [
  'Full life weather engine',
  'Storm radar & pressure windows',
  'Daily / weekly forecast depth',
  'Dual MBTI personality layers',
  'Oracle with full context',
  'Priority support',
];

export function PricingSection() {
  const { isSignedIn } = useAuth();

  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[11px] uppercase tracking-[0.28em] text-sky-300/80 mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-300 bg-clip-text text-transparent mb-4">
            Your life weather, every day
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Pay for the life-weather habit. Keep the Self chart as depth. Try monthly, own it forever, or peek free.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Monthly */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-sky-950/90 to-slate-900/90 backdrop-blur-sm border-2 border-sky-500/45 rounded-2xl p-8 hover:border-sky-400/70 transition-all"
          >
            <div className="mb-6">
              <div className="inline-block bg-sky-500/20 text-sky-200 text-xs font-bold px-3 py-1 rounded-full mb-3">
                7-DAY FREE TRIAL
              </div>
              <h3 className="text-2xl font-bold text-sky-100 mb-2">Monthly</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-white">$9.99</span>
                <span className="text-slate-400">/month</span>
              </div>
              <p className="text-sky-200/90 text-sm mb-2">Full life weather + Self access</p>
              <p className="text-slate-500 text-sm">Card required · Cancel anytime</p>
            </div>

            <Link
              href="/checkout-subscription"
              onClick={(e) => {
                if (typeof window !== 'undefined') {
                  if (!isSignedIn) {
                    e.preventDefault();
                    window.location.href =
                      '/sign-in?redirect_url=' + encodeURIComponent('/checkout-subscription');
                    return;
                  }
                }
              }}
              className="block w-full py-3 px-6 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-lg font-semibold text-center transition-all duration-300 mb-6 transform hover:scale-105"
            >
              Start free trial
            </Link>

            <div className="space-y-3">
              {premiumFeatures.slice(0, 8).map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-sky-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Lifetime */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gradient-to-br from-amber-950/90 to-slate-900/90 backdrop-blur-sm border-2 border-amber-400/60 rounded-2xl p-8 relative transform md:scale-105 shadow-2xl shadow-amber-500/15"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                BEST VALUE
              </div>
            </div>

            <div className="mb-6 mt-2">
              <h3 className="text-2xl font-bold text-amber-100 mb-2">Lifetime</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-white">$50</span>
                <span className="text-slate-500 line-through text-xl">$299</span>
              </div>
              <p className="text-amber-200/90 text-sm mb-2">One-time · lifetime access</p>
              <p className="text-amber-300 text-sm font-semibold">Founder pricing while in beta</p>
            </div>

            <Link
              href="#intake-form"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('intake-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="block w-full py-3 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg font-semibold text-center transition-all duration-300 mb-6 transform hover:scale-105 shadow-lg"
            >
              Get lifetime access
            </Link>

            <div className="space-y-3">
              {premiumFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-200 text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-amber-500/30">
              <p className="text-amber-200 text-sm text-center font-semibold">
                Save vs monthly · keep every weather update
              </p>
            </div>
          </motion.div>

          {/* Free */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-slate-950/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-300 mb-2">Free peek</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-slate-400">$0</span>
              </div>
              <p className="text-slate-500 text-sm">Sample the Self map · limited life weather</p>
            </div>

            <Link
              href="/dashboard"
              onClick={(e) => {
                if (typeof window !== 'undefined' && !isSignedIn) {
                  e.preventDefault();
                  window.location.href =
                    '/sign-up?redirect_url=' + encodeURIComponent('/dashboard');
                }
              }}
              className="block w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold text-center transition-all duration-300 mb-6"
            >
              Try free
            </Link>

            <div className="space-y-3">
              {freeFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-400 text-sm">{feature}</span>
                </div>
              ))}
              {freeNotIncluded.map((feature) => (
                <div key={feature} className="flex items-start gap-3 opacity-50">
                  <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600 text-sm line-through">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-slate-400 text-sm">
            <span className="text-sky-300 font-semibold">30-day money-back guarantee</span>
            {' · '}
            If the life weather doesn&apos;t earn a place in your day, we&apos;ll refund you.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
