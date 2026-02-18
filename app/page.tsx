'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BirthIntakeForm } from '@/components/forms/BirthIntakeForm';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { TrustBadges } from '@/components/sections/TrustBadges';
import { StatsSection } from '@/components/sections/StatsSection';
import { PricingSection } from '@/components/sections/PricingSection';
import { FAQSection } from '@/components/sections/FAQSection';
import { ArrowRight, Star, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-amber-300 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-20 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-2 h-2 bg-amber-200 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-amber-400 rounded-full animate-ping"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 pt-32 pb-20 px-4">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <Star className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-pulse" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent"
          >
            Merlin
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-2xl md:text-3xl mb-4 text-gray-200"
          >
            The astrology that doesn&apos;t lie.
          </motion.p>

          <motion.p 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-xl md:text-2xl mb-6 text-amber-200"
          >
            Your chart. Your type. Your whisper.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-900/60 to-purple-900/40 backdrop-blur-sm border-2 border-amber-500/50 rounded-full px-6 py-3 mb-4">
              <Shield className="w-5 h-5 text-amber-400" />
              <span className="text-xl md:text-2xl font-bold text-amber-300">
                $50 Lifetime Access
              </span>
              <span className="text-gray-400 line-through text-lg">$299</span>
            </div>
            
            <p className="text-red-300 text-sm font-semibold animate-pulse">
              ⚠️ Limited spots available - Price increases soon
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto"
          >
            Swiss Ephemeris precision meets MBTI insights. Calculate your birth chart, track transits, and receive daily cosmic guidance.
            <span className="block mt-2 text-amber-300 font-semibold">
              Try 7 days free (card required) or own it forever for $50
            </span>
          </motion.p>
          
          <TrustBadges />
        </div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="max-w-3xl mx-auto mb-12"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Trial Button */}
            <div className="bg-gradient-to-br from-purple-900/80 to-blue-900/80 backdrop-blur-sm border-2 border-purple-500/50 rounded-2xl p-8 shadow-2xl hover:border-purple-400/70 transition-all">
              <div className="text-center mb-4">
                <p className="text-purple-300 text-sm font-semibold mb-2">MONTHLY PLAN</p>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-4xl font-bold text-white">$9.99</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-sm text-purple-200">7-day free trial</p>
              </div>
              <a
                href={process.env.NEXT_PUBLIC_DEV_MODE === 'true' ? '/dashboard' : (process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || '/checkout-subscription')}
                onClick={(e) => {
                  // In dev mode, go straight to dashboard
                  if (typeof window !== 'undefined') {
                    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
                    
                    if (isDevMode) {
                      e.preventDefault();
                      window.location.href = '/dashboard';
                      return;
                    }
                    
                    // Production mode: check if user is signed in first
                    const isSignedIn = document.cookie.includes('__clerk');
                    if (!isSignedIn) {
                      e.preventDefault();
                      // Redirect to sign-in first, with return URL to checkout
                      window.location.href = '/sign-in?redirect_url=' + encodeURIComponent(process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || '/checkout-subscription');
                      return;
                    }
                    
                    if ((window as any).gtag) {
                      (window as any).gtag('event', 'trial_click', { location: 'hero' });
                    }
                  }
                }}
                className="block w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 text-center"
              >
                {process.env.NEXT_PUBLIC_DEV_MODE === 'true' ? 'Start Free (Dev Mode)' : 'Start 7-Day Free Trial'}
              </a>
              <p className="text-gray-400 text-xs text-center mt-3">Card required · Cancel anytime</p>
            </div>

            {/* Lifetime Button */}
            <div className="bg-gradient-to-br from-amber-900/80 to-orange-900/80 backdrop-blur-sm border-2 border-amber-500/50 rounded-2xl p-8 shadow-2xl hover:border-amber-400/70 transition-all">
              <div className="text-center mb-4">
                <p className="text-amber-300 text-sm font-semibold mb-2">BEST VALUE</p>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-4xl font-bold text-white">$50</span>
                  <span className="text-gray-400 line-through">$299</span>
                </div>
                <p className="text-sm text-amber-200">One-time payment</p>
              </div>
              <Link
                href="#intake-form"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('intake-form')?.scrollIntoView({ behavior: 'smooth' });
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'lifetime_click', { location: 'hero' });
                  }
                }}
                className="block w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 text-center"
              >
                Get Lifetime Access
              </Link>
              <p className="text-gray-400 text-xs text-center mt-3">Save $249 · Lifetime updates</p>
            </div>
          </div>
        </motion.div>

        {/* Birth Intake Form */}
        <motion.div
          id="intake-form"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="max-w-md mx-auto mb-12"
        >
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-amber-300 mb-2 text-center">
              Start Your Cosmic Journey
            </h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              Enter your birth details to unlock your complete astrological profile
            </p>
            <BirthIntakeForm showPayment redirectTo="dashboard" />
          </div>
        </motion.div>

        {/* Quick Access for Existing Users */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="text-center"
        >
          <p className="text-gray-400 mb-4">Already have an account?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-gray-800/50 hover:bg-gray-800/70 text-amber-300 rounded-lg font-semibold transition-all duration-300 border border-amber-500/30 hover:border-amber-500/50 group"
            >
              View Dashboard
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/enhanced-dashboard"
              className="inline-flex items-center px-6 py-3 bg-gray-800/50 hover:bg-gray-800/70 text-amber-300 rounded-lg font-semibold transition-all duration-300 border border-amber-500/30 hover:border-amber-500/50 group"
            >
              Calculate Birth Chart
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Stats Section */}
      <StatsSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 py-20 px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-amber-900/60 to-purple-900/40 backdrop-blur-sm border-2 border-amber-500/50 rounded-3xl p-12 shadow-2xl">
            <motion.div
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-amber-300 mb-4">
                Your Cosmic Truth Awaits
              </h2>
              <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
                Join 2,400+ seekers who discovered their authentic path through the stars.
              </p>
              <div className="bg-amber-400/10 border border-amber-500/30 rounded-xl p-6 mb-8">
                <p className="text-amber-200 text-2xl font-bold mb-2">
                  🎁 Early Adopter Pricing: $50
                </p>
                <p className="text-gray-400">
                  Regular price: <span className="line-through">$299</span>
                  {' · '}
                  <span className="text-red-300 font-semibold">Save $249</span>
                </p>
              </div>
              <Link
                href="#top"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  // Track CTA click
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'cta_click', {
                      location: 'bottom_cta'
                    });
                  }
                }}
                className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-xl rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 transform hover:scale-105"
              >
                Claim Your Lifetime Access
                <ArrowRight className="ml-3 w-6 h-6" />
              </Link>
              <p className="text-gray-400 text-sm mt-6">
                <Shield className="w-4 h-4 inline mr-1" />
                30-day money-back guarantee · Secure payment · Instant access
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Footer Disclaimer */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-950/40 px-4 py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 text-center text-sm text-gray-300">
          <p>
            Merlin provides astrological insights for entertainment and self-reflection only and is not
            a substitute for professional, medical, legal, or financial advice.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-amber-300">
            <Link href="/terms" className="hover:text-amber-200 transition-colors">
              Terms of Service
            </Link>
            <span className="text-gray-500">•</span>
            <Link href="/privacy" className="hover:text-amber-200 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
