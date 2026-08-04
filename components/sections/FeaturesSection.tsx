'use client';

import { motion } from 'framer-motion';
import { CloudSun, Radar, HeartPulse, Compass, Layers, MessageCircle } from 'lucide-react';

const skyFeatures = [
  {
    icon: CloudSun,
    pillar: 'Sky',
    title: "Today's life weather",
    description:
      'One clear read on how life feels for your chart today — intensity, tone, and why — not a sun-sign blurb.',
  },
  {
    icon: Radar,
    pillar: 'Sky',
    title: 'Forecast & storm radar',
    description:
      'Pressure windows, storms, and weekly horizon so you can see what’s building before it hits.',
  },
  {
    icon: HeartPulse,
    pillar: 'Sky',
    title: 'Felt vs sky check-in',
    description:
      'Tell Merlin how you actually feel. Reality-check guidance when your mood and the chart diverge.',
  },
];

const selfFeatures = [
  {
    icon: Compass,
    pillar: 'Self',
    title: 'Real birth chart & wheel',
    description:
      'Swiss Ephemeris precision. Your natal map is the foundation under every forecast — not the whole product.',
  },
  {
    icon: Layers,
    pillar: 'Self',
    title: 'Dual MBTI from the chart',
    description:
      'Personality layers derived from placements, used as a lens on weather and Oracle tone.',
  },
  {
    icon: MessageCircle,
    pillar: 'Self',
    title: 'Oracle that knows both',
    description:
      'Ask Merlin about today or about who you are. Chat sees your life weather and your identity context.',
  },
];

export function FeaturesSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45 },
    },
  };

  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="text-[11px] uppercase tracking-[0.28em] text-sky-300/80 mb-3">Two pillars</p>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-300 bg-clip-text text-transparent mb-4">
            Life weather first. Identity underneath.
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Most apps sell a chart and sprinkle a horoscope. Merlin sells a daily life-weather habit —
            then lets you fall into the Self map when you want depth.
          </p>
        </motion.div>

        {/* Sky block */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200">
              Life weather · what we sell
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-sky-500/40 to-transparent" />
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {skyFeatures.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group relative rounded-2xl border border-sky-500/25 bg-slate-950/50 p-6 backdrop-blur-sm hover:border-sky-400/45 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/10"
              >
                <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center mb-4 group-hover:bg-sky-500/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-sky-300" />
                </div>
                <h3 className="text-lg font-bold text-sky-100 mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Self block */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
              Self · what you discover
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-amber-500/35 to-transparent" />
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {selfFeatures.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group relative rounded-2xl border border-amber-500/20 bg-slate-950/50 p-6 backdrop-blur-sm hover:border-amber-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-amber-300" />
                </div>
                <h3 className="text-lg font-bold text-amber-100 mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
