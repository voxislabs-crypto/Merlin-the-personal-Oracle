'use client';

import { motion } from 'framer-motion';
import { Sparkles, Target, Compass, Zap } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'Precise Birth Charts',
    description: 'Swiss Ephemeris calculations for accuracy down to the second. Your chart, exactly as the cosmos intended.',
  },
  {
    icon: Target,
    title: 'MBTI Integration',
    description: 'Unique fusion of astrology and personality typing. Discover how the stars shape your psyche.',
  },
  {
    icon: Compass,
    title: 'Daily Whispers',
    description: 'Personalized daily guidance based on current transits and your natal chart. The oracle speaks daily.',
  },
  {
    icon: Zap,
    title: 'Transit Tracking',
    description: 'Real-time planetary movements and their influence on your chart. Know when the cosmos shifts.',
  },
];

export function FeaturesSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section className="py-20 px-4 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
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
            Why Merlin?
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Professional-grade astrology meets modern insights. No fluff, no generalizations, just the truth written in the stars.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative bg-gray-900/40 backdrop-blur-sm border border-amber-500/20 rounded-xl p-6 hover:border-amber-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative">
                <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-amber-400" />
                </div>
                
                <h3 className="text-xl font-bold text-amber-300 mb-2">
                  {feature.title}
                </h3>
                
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
