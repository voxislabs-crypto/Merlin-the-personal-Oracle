'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BirthIntakeForm } from '@/components/forms/BirthIntakeForm';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { PricingSection } from '@/components/sections/PricingSection';
import { FAQSection } from '@/components/sections/FAQSection';
import { CloudSun, Compass, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white relative overflow-hidden">
      {/* Sky atmosphere background — matches dashboard language */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.14),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(251,191,36,0.08),_transparent_45%)]" />
        <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 1000 1000" aria-hidden>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#38bdf8', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <circle
            cx="500"
            cy="420"
            r="400"
            fill="none"
            stroke="url(#grad1)"
            strokeWidth="2"
            opacity="0.35"
            filter="url(#glow)"
          >
            <animate attributeName="r" values="400;440;400" dur="10s" repeatCount="indefinite" />
          </circle>
          <circle
            cx="500"
            cy="420"
            r="280"
            fill="none"
            stroke="url(#grad2)"
            strokeWidth="1.5"
            opacity="0.25"
            filter="url(#glow)"
          >
            <animate attributeName="r" values="280;320;280" dur="12s" repeatCount="indefinite" />
          </circle>
        </svg>
        <div className="absolute top-24 left-16 h-1 w-1 rounded-full bg-sky-300/80 animate-pulse" />
        <div className="absolute top-40 right-28 h-1.5 w-1.5 rounded-full bg-amber-200/70 animate-pulse" />
        <div
          className="absolute bottom-40 left-1/3 h-1 w-1 rounded-full bg-cyan-300/60 animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute bottom-28 right-1/4 h-1 w-1 rounded-full bg-violet-300/50 animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />
      </div>

      {/* Hero */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-28 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-6 flex justify-center"
          >
            <Image
              src="/merlin-logo.png"
              alt="Merlin"
              width={160}
              height={160}
              className="w-36 h-36 md:w-40 md:h-40 object-contain"
              priority
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-4 text-[11px] md:text-xs font-semibold uppercase tracking-[0.32em] text-sky-300/85"
          >
            Personalized life weather
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold mb-5 bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-300 bg-clip-text text-transparent tracking-tight"
          >
            Know how today feels — for you
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-3"
          >
            Personal friction radar for your chart: when disruption risk is elevated, when it isn&apos;t,
            and one clear move — grounded in Swiss Ephemeris, not a generic horoscope.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32 }}
            className="text-sm md:text-base text-slate-400 max-w-xl mx-auto mb-8"
          >
            Still in beta. The weather math is the product. Chart + dual MBTI are how it gets personal.
          </motion.p>

          {/* Two-pillar preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.38 }}
            className="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left"
          >
            <div className="rounded-2xl border border-sky-500/35 bg-sky-950/40 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <CloudSun className="h-4 w-4 text-sky-300" />
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-sky-300/90">
                  Life weather · primary
                </span>
              </div>
              <p className="text-sm font-semibold text-sky-50">Today + storm radar</p>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Friction score, disruption risk, day chart, and a single high-leverage move.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/25 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Compass className="h-4 w-4 text-amber-300" />
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/90">
                  Self · depth
                </span>
              </div>
              <p className="text-sm font-semibold text-amber-50">Who you are in that weather</p>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Birth chart, wheel, and dual MBTI — how Merlin personalizes every forecast.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mb-6 text-base md:text-lg text-slate-300"
          >
            <p className="font-semibold text-sky-100/90">$10/month or $50 forever</p>
            <p className="text-sm text-slate-500 mt-1">7 days free · card required · cancel anytime</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <Link href="/checkout-subscription">
              <button
                type="button"
                className="group inline-flex items-center gap-2 px-8 py-4 font-bold text-lg rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 text-white hover:from-sky-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-sky-900/40 hover:shadow-sky-500/30 hover:scale-[1.02]"
              >
                Start free trial
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Link>
            <Link href="/dashboard">
              <button
                type="button"
                className="px-8 py-4 font-semibold text-lg rounded-xl border border-slate-600/80 text-slate-200 hover:border-sky-400/50 hover:text-sky-100 hover:bg-sky-950/30 transition-all duration-300"
              >
                See my weather
              </button>
            </Link>
            <Link href="#faq">
              <button
                type="button"
                className="px-6 py-4 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Questions?
              </button>
            </Link>
          </motion.div>
        </div>
      </div>

      <FeaturesSection />
      <PricingSection />

      <section id="intake-form" className="relative z-10 px-4 py-16">
        <div className="mx-auto max-w-3xl text-center mb-8">
          <p className="text-[11px] uppercase tracking-[0.28em] text-amber-300/80 mb-2">Self · birth data</p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
            Your chart is how life weather gets personal
          </h2>
          <p className="mt-2 text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            Enter birth details once. Merlin uses them to read <span className="text-sky-300">your</span> life weather —
            then you can explore the full Self map anytime.
          </p>
        </div>
        <div className="mx-auto max-w-3xl">
          <BirthIntakeForm showPayment className="w-full" />
        </div>
      </section>

      <FAQSection />

      <footer className="relative z-10 border-t border-white/10 bg-slate-950/60 px-4 py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 text-center text-sm text-slate-400">
          <p>
            Merlin provides astrological insights for entertainment and self-reflection only and is not a
            substitute for professional, medical, legal, or financial advice.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sky-300/90">
            <Link href="/terms" className="hover:text-sky-200 transition-colors">
              Terms of Service
            </Link>
            <span className="text-slate-600">•</span>
            <Link href="/privacy" className="hover:text-sky-200 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
