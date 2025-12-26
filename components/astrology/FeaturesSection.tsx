"use client";

import { motion } from 'framer-motion';
import { Sparkles, Eye, Moon, Gem } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: "Celestial Vision",
    description: "Peer into the cosmic tapestry with advanced astrological chart calculations powered by ancient wisdom and modern algorithms.",
    color: "#8F00FF"
  },
  {
    icon: Sparkles,
    title: "Neural Divination",
    description: "AI-enhanced interpretations merge with traditional astrology to reveal profound insights about your cosmic blueprint.",
    color: "#EE82EE"
  },
  {
    icon: Moon,
    title: "Lunar Synchrony",
    description: "Track celestial cycles and planetary transits in real-time, syncing your journey with the rhythms of the cosmos.",
    color: "#9400D3"
  },
  {
    icon: Gem,
    title: "Crystal Clarity",
    description: "Interactive visualizations transform complex astronomical data into beautiful, intuitive cosmic mandalas.",
    color: "#FFD700"
  }
];

export function FeaturesSection() {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-mystic-darker via-mystic-deep to-mystic-darker"></div>
      
      {/* Geometric patterns */}
      <div className="absolute inset-0 opacity-5">
        <img 
          src="https://pixabay.com/get/gd799397836d8e4b0073fb365c868f4f8754952a2ebea3a9feb2cd7ed04bd542ac4c75194ca76de40fd6b2338f36fac9c.jpg"
          alt="cosmic nebula by ausbitbank on Pixabay"
          className="w-full h-full object-cover"
          style={{ backgroundColor: '#1a0933' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cosmic-violet via-cosmic-light to-cyber-gold bg-clip-text text-transparent">
            Arcane Technologies
          </h2>
          <p className="font-body text-xl text-gray-400 max-w-3xl mx-auto">
            Ancient mysticism powered by cybernetic precision
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="group relative"
              >
                <div className="glass-strong rounded-2xl p-8 h-full transition-all duration-300 group-hover:shadow-neon">
                  {/* Decorative corner elements */}
                  <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cosmic-violet rounded-tl-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cosmic-violet rounded-br-2xl"></div>

                  {/* Icon */}
                  <motion.div 
                    className="mb-6 relative inline-block"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="relative z-10">
                      <Icon className="w-12 h-12" style={{ color: feature.color }} />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full blur-xl opacity-50"
                      style={{ backgroundColor: feature.color }}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.7, 0.5],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>

                  {/* Content */}
                  <h3 className="font-display text-2xl sm:text-3xl font-bold mb-4 text-cosmic-light">
                    {feature.title}
                  </h3>
                  <p className="font-body text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover effect line */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-cosmic-violet to-cyber-gold"
                    initial={{ width: 0 }}
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}