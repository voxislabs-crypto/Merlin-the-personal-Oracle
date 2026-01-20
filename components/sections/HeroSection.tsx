'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { ReactNode } from 'react';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  children?: ReactNode;
  showStars?: boolean;
}

export function HeroSection({
  title,
  subtitle,
  description,
  children,
  showStars = true,
}: HeroSectionProps) {
  return (
    <div className="relative pt-32 pb-20 px-4">
      {/* Background decoration */}
      {showStars && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-20 w-1 h-1 bg-amber-300 rounded-full animate-ping"></div>
          <div className="absolute bottom-20 left-20 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-2 h-2 bg-amber-200 rounded-full animate-ping"></div>
        </div>
      )}

      <div className="max-w-4xl mx-auto text-center relative z-10">
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
          className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent"
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-2xl md:text-3xl mb-4 text-gray-200"
          >
            {subtitle}
          </motion.p>
        )}

        {description && (
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-lg md:text-xl mb-8 text-amber-200 max-w-2xl mx-auto"
          >
            {description}
          </motion.p>
        )}

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
}
