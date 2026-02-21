'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight, Star, Shield } from 'lucide-react';

export default function Home() {
  const { isSignedIn } = useAuth();

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

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="max-w-3xl mx-auto"
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
                <button
                  onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    
                    // Track click
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', 'trial_click', { location: 'hero' });
                    }
                    
                    // Check if user is signed in
                    if (!isSignedIn) {
                      window.location.href = '/sign-in?redirect_url=/checkout-subscription';
                      return;
                    }
                    
                    // Call API to create Stripe session
                    try {
                      // Get saved birth data if available (for better checkout experience)
                      const savedBirth = localStorage.getItem('merlin_birth_data');
                      const birthData = savedBirth ? JSON.parse(savedBirth) : {};
                      
                      const response = await fetch('/api/create-checkout-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          birthDate: birthData.date || '',
                          birthTime: birthData.time || '',
                          birthCity: birthData.city || '',
                        }),
                      });
                      
                      if (response.ok) {
                        const { url } = await response.json();
                        window.location.href = url;
                      } else {
                        console.error('Failed to create checkout session');
                      }
                    } catch (error) {
                      console.error('Error:', error);
                    }
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
                >
                  Start Free Trial
                </button>
              </div>

              {/* Lifetime Button */}
              <div className="bg-gradient-to-br from-amber-900/80 to-orange-900/80 backdrop-blur-sm border-2 border-amber-500/50 rounded-2xl p-8 shadow-2xl hover:border-amber-400/70 transition-all">
                <div className="text-center mb-4">
                  <p className="text-amber-300 text-sm font-semibold mb-2">LIFETIME ACCESS</p>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-4xl font-bold text-white">$50</span>
                    <span className="text-gray-400 line-through text-lg">$299</span>
                  </div>
                  <p className="text-sm text-amber-200">One-time payment</p>
                </div>
                <button
                  onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    
                    // Track click
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', 'lifetime_click', { location: 'hero' });
                    }
                    
                    // Check if user is signed in
                    if (!isSignedIn) {
                      window.location.href = '/sign-in?redirect_url=/checkout-subscription';
                      return;
                    }
                    
                    // Call API to create Stripe session
                    try {
                      // Get saved birth data if available (for better checkout experience)
                      const savedBirth = localStorage.getItem('merlin_birth_data');
                      const birthData = savedBirth ? JSON.parse(savedBirth) : {};
                      
                      const response = await fetch('/api/create-checkout-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          birthDate: birthData.date || '',
                          birthTime: birthData.time || '',
                          birthCity: birthData.city || '',
                          lifetime: true,
                        }),
                      });
                      
                      if (response.ok) {
                        const { url } = await response.json();
                        window.location.href = url;
                      } else {
                        console.error('Failed to create checkout session');
                      }
                    } catch (error) {
                      console.error('Error:', error);
                    }
                  }}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 transform hover:scale-105"
                >
                  Get Lifetime Access
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

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
