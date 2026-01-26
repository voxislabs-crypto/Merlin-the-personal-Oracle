'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BirthIntakeForm } from '@/components/forms/BirthIntakeForm';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { ArrowRight, Star } from 'lucide-react';

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
            className="text-xl md:text-2xl mb-8 text-amber-200"
          >
            Your chart. Your type. Your whisper.
          </motion.p>

          <motion.p 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-3xl md:text-4xl font-semibold mb-4 text-amber-300"
          >
            Lifetime.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-gray-300 text-lg mb-12 max-w-2xl mx-auto"
          >
            Swiss Ephemeris precision meets MBTI insights. One payment, lifetime access to your cosmic blueprint.
          </motion.p>
        </div>

        {/* Birth Intake Form */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="max-w-md mx-auto mb-16"
        >
          <BirthIntakeForm showPayment redirectTo="dashboard" />
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

      {/* Features Section */}
      <FeaturesSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 py-20 px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-amber-900/40 to-amber-900/10 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-amber-300 mb-4">
              Ready to unlock your cosmic truth?
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Join the select few with lifetime access to professional-grade astrological insights.
            </p>
            <Link
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-lg rounded-lg shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all duration-300"
            >
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
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
