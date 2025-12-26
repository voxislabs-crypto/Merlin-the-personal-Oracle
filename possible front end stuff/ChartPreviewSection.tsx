"use client";

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export function ChartPreviewSection() {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background with mystical image */}
      <div className="absolute inset-0">
        <img 
          src="https://pixabay.com/get/g1555fefdb450d63172fa4d21eea1955770c917704ac4710da633c8c0671c5e5f4d5035bbf007e7c2d5d653093e45485c.jpg"
          alt="cosmic nebula by ausbitbank on Pixabay"
          className="w-full h-full object-cover opacity-20"
          style={{ backgroundColor: '#0d0419' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-mystic-darker via-transparent to-mystic-darker"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-display text-5xl sm:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyber-gold via-cosmic-light to-cosmic-violet bg-clip-text text-transparent">
                Your Cosmic Blueprint
              </span>
            </h2>
            <p className="font-body text-xl text-gray-300 mb-8 leading-relaxed">
              Witness the convergence of ancient astrological wisdom and cutting-edge visualization technology. 
              Your birth chart becomes a living, breathing mandala of cosmic energies.
            </p>
            
            <div className="space-y-4 mb-10">
              {[
                "Real-time planetary positions calculated with precision",
                "Interactive wheel visualizations with D3.js",
                "Aspect patterns and house placements decoded",
                "Personal transits and cosmic forecasts"
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <Sparkles className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#FFD700' }} />
                  <span className="font-body text-gray-300">{item}</span>
                </motion.div>
              ))}
            </div>

            <Link href="/chart">
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-cosmic-violet to-cosmic-dark rounded-lg font-body font-semibold text-lg shadow-neon hover:shadow-neon-lg transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore Your Chart
              </motion.button>
            </Link>
          </motion.div>

          {/* Right: Zodiac wheel visualization */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Glowing background */}
              <motion.div
                className="absolute inset-0 bg-cosmic-violet rounded-full blur-3xl opacity-20"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Zodiac wheel image */}
              <motion.div
                className="relative z-10 rounded-full overflow-hidden glass-strong p-4"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 60,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <img 
                  src="https://pixabay.com/get/geea57f3efa0812a946f8087622caa3558bcc3bc4fe3d8a6ce9e3e8e8b4a1c575dba8c5cee7c41a76550585bafe69e0e8.svg"
                  alt="zodiac wheel by GDJ on Pixabay"
                  className="w-full h-full rounded-full"
                  style={{ 
                    filter: 'drop-shadow(0 0 20px rgba(143, 0, 255, 0.6))',
                  }}
                />
              </motion.div>

              {/* Orbiting particles */}
              {[0, 120, 240].map((rotation, index) => (
                <motion.div
                  key={index}
                  className="absolute top-1/2 left-1/2 w-full h-full"
                  style={{
                    originX: 0.5,
                    originY: 0.5,
                  }}
                  animate={{
                    rotate: [rotation, rotation + 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                    delay: index * 0.5,
                  }}
                >
                  <motion.div
                    className="absolute top-0 left-1/2 w-3 h-3 bg-cyber-gold rounded-full blur-sm"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}