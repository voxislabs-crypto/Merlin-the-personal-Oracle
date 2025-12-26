"use client";

import { motion } from 'framer-motion';
import { Sparkles, Moon, Eye } from 'lucide-react';
import Link from 'next/link';

interface HeroSectionProps {
  onCalculateClick?: () => void;
  hasChart?: boolean;
}

export function HeroSection({ onCalculateClick, hasChart = false }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background with cosmic imagery */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-mystic-darker"></div>
        <img 
          src="https://pixabay.com/get/g175a989e3dcf5bc8488af390a3164bb2d73ae4002b992c0c4250a69f95e8ea292e5f347e596c949e878b1754d45ab779.jpg"
          alt="cosmic space nebula by Placidplace on Pixabay"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          style={{ backgroundColor: '#1a0933' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-mystic-deep/50 to-mystic-darker"></div>
        
        {/* Cyber grid overlay */}
        <div className="absolute inset-0 cyber-grid opacity-20"></div>
        
        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cosmic-violet rounded-full blur-3xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cosmic-dark rounded-full blur-3xl opacity-20"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* Mystical icon */}
          <motion.div 
            className="flex justify-center mb-8"
            animate={{ 
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div className="relative">
              <Eye className="w-16 h-16 text-cosmic-light" style={{ color: '#EE82EE' }} />
              <motion.div
                className="absolute inset-0 bg-cosmic-violet rounded-full blur-xl opacity-50"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              />
            </div>
          </motion.div>

          {/* Main heading */}
          <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold mb-6">
            <motion.span 
              className="inline-block bg-gradient-to-r from-cosmic-light via-cosmic-violet to-cyber-gold bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                backgroundSize: '200% auto',
              }}
            >
              MERLIN
            </motion.span>
          </h1>

          {/* Subtitle */}
          <motion.p 
            className="font-body text-xl sm:text-2xl md:text-3xl text-cosmic-light mb-4 tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            Your Personal Oracle
          </motion.p>

          <motion.p 
            className="font-body text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 1 }}
          >
            Where ancient celestial wisdom meets cybernetic divination. 
            Unlock the secrets written in your stars.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
          >
            {onCalculateClick && (
              <motion.button
                onClick={onCalculateClick}
                className="group relative px-8 py-4 bg-gradient-to-r from-cosmic-violet to-cosmic-dark rounded-lg font-body font-semibold text-lg overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {hasChart ? 'Recalculate Chart' : 'Calculate Your Chart'}
                </span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-cosmic-violet/80 to-cosmic-dark/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                <div className="absolute inset-0 shadow-neon opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.button>
            )}

            <Link href="/learn-more">
              <motion.button
                className="px-8 py-4 glass rounded-lg font-body font-semibold text-lg hover:glass-strong transition-all duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Moon className="w-5 h-5" style={{ color: '#EE82EE' }} />
                Learn More
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Floating mystical elements */}
        <div className="absolute top-20 left-10 opacity-30">
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="w-8 h-8" style={{ color: '#FFD700' }} />
          </motion.div>
        </div>
        <div className="absolute bottom-20 right-10 opacity-30">
          <motion.div
            animate={{
              y: [0, 20, 0],
              rotate: [0, -10, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Moon className="w-8 h-8" style={{ color: '#EE82EE' }} />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-6 h-10 border-2 border-cosmic-violet rounded-full flex justify-center">
          <motion.div
            className="w-1.5 h-1.5 bg-cosmic-light rounded-full mt-2"
            animate={{
              y: [0, 16, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </motion.div>
    </section>
  );
}