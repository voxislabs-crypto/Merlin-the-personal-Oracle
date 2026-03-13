'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { BirthIntakeForm } from '@/components/forms/BirthIntakeForm';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { TrustBadges } from '@/components/sections/TrustBadges';
import { StatsSection } from '@/components/sections/StatsSection';
import { PricingSection } from '@/components/sections/PricingSection';
import { FAQSection } from '@/components/sections/FAQSection';
import { ArrowRight, Star, Shield } from 'lucide-react';
import { isStandaloneMobileClient } from '@/lib/runtime-mode';

export const dynamic = 'force-dynamic';

export default function Home() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const primaryHref = isStandaloneMobileClient ? '/dashboard' : isSignedIn ? '/dashboard' : '/sign-in';

  // In standalone mode, skip the marketing landing page and go straight to the app
  useEffect(() => {
    if (isStandaloneMobileClient) {
      router.replace('/dashboard');
    }
  }, [router]);

  if (isStandaloneMobileClient) {
    return null; // Will redirect immediately
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Cosmic swirl background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-transparent to-transparent"></div>
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 1000">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <circle cx="500" cy="500" r="400" fill="none" stroke="url(#grad1)" strokeWidth="2" opacity="0.3" filter="url(#glow)">
            <animateTransform attributeName="r" values="400;450;400" dur="8s" repeatCount="indefinite"/>
          </circle>
          <circle cx="500" cy="500" r="300" fill="none" stroke="url(#grad2)" strokeWidth="1.5" opacity="0.2" filter="url(#glow)">
            <animateTransform attributeName="r" values="300;350;300" dur="10s" repeatCount="indefinite"/>
          </circle>
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor: '#ec4899', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 1}} />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor: '#a855f7', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: '#6d28d9', stopOpacity: 1}} />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Twinkling stars */}
        <div className="absolute top-20 left-20 w-1 h-1 bg-purple-300 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-32 w-1.5 h-1.5 bg-pink-300 rounded-full animate-ping"></div>
        <div className="absolute bottom-32 left-1/3 w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 right-1/4 w-1 h-1 bg-pink-300 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Merlin Logo */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 flex justify-center"
          >
            <Image
              src="/merlin-logo.png"
              alt="Merlin Oracle"
              width={200}
              height={200}
              className="w-48 h-48 object-contain"
              priority
            />
          </motion.div>

          {/* Main title */}
          <motion.h1 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="text-7xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-2xl"
            style={{
              textShadow: '0 0 30px rgba(236, 72, 153, 0.5), 0 0 60px rgba(168, 85, 247, 0.3)',
              fontWeight: '900',
              letterSpacing: '0.1em'
            }}
          >
            MERLIN
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-3xl md:text-4xl font-light mb-6 text-purple-200"
          >
            Your Personal Oracle
          </motion.p>

          {/* Description */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-lg md:text-xl mb-4 text-gray-300 max-w-2xl mx-auto leading-relaxed"
          >
            I built Merlin because astrology shouldn't lie. Input your birth, get the real map. No fluff. No ads.
          </motion.p>

          {/* Beta notice */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-sm md:text-base mb-8 text-purple-300 italic max-w-2xl mx-auto"
          >
            Still in beta. Bugs happen. But the stars? They don't.
          </motion.p>

          {/* Pricing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mb-8 text-xl font-semibold text-purple-200"
          >
            {isStandaloneMobileClient ? (
              <>
                <p className="mb-2">Android standalone build</p>
                <p className="text-sm text-gray-400">No sign-in. No Stripe. Open the dashboard directly.</p>
              </>
            ) : (
              <>
                <p className="mb-2">$10/month or $50 forever</p>
                <p className="text-sm text-gray-400">7 days free—card required, cancel anytime</p>
              </>
            )}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href={primaryHref}>
              <button className="relative group px-8 py-4 font-bold text-lg rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-pink-500/50">
                {isStandaloneMobileClient ? 'Open Dashboard' : 'Start Free Trial'}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
              </button>
            </Link>
            
            <Link href="#faq">
              <button className="px-8 py-4 font-bold text-lg rounded-lg border-2 border-purple-400/50 text-purple-200 hover:border-purple-300 hover:text-purple-100 transition-all duration-300 hover:bg-purple-900/20">
                Questions?
              </button>
            </Link>
          </motion.div>

          {/* Bottom glow element */}
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-4xl opacity-30"
          >
            🔮
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <FeaturesSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* FAQ Section */}
      <FAQSection />

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
