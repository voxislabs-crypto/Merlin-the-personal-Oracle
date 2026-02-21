'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

interface CacheBadgeProps {
  isCacheHit?: boolean;
  loading?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

/**
 * Cache Badge - Shows when data is loaded from cache
 * Displays a subtle badge with cache hit indicator
 */
export function CacheBadge({
  isCacheHit = false,
  loading = false,
  position = 'top-right',
  className = ''
}: CacheBadgeProps) {
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    if (isCacheHit) {
      setShowBadge(true);
      const timer = setTimeout(() => setShowBadge(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isCacheHit]);

  const positionClasses: Record<string, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <AnimatePresence>
      {showBadge && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{ duration: 0.3 }}
          className={`fixed ${positionClasses[position]} z-50 ${className}`}
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/80 to-yellow-500/80 backdrop-blur-sm border border-amber-300/50 shadow-lg">
            <Zap className="w-4 h-4 text-white" fill="white" />
            <span className="text-xs font-semibold text-white tracking-wider">
              CACHED
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Cache Loading Indicator - Shows during cache operations
 */
export function CacheLoading() {
  return (
    <motion.div
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50"
      animate={{ opacity: [1, 0.6, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
      </div>
      <span className="text-xs text-slate-400">Loading from cache...</span>
    </motion.div>
  );
}

/**
 * Deep Thinking Loader - Sophisticated thinking animation
 * Shows a cosmic, mystical loading state for heavy computation
 */
export function DeepThinkingLoader({
  message = 'Seeking wisdom in the stars...',
  showSpinner = true
}: {
  message?: string;
  showSpinner?: boolean;
}) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-6 p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {showSpinner && (
        <div className="relative w-16 h-16">
          {/* Outer rotating ring */}
          <motion.div
            className="absolute inset-0 border-2 border-transparent border-t-amber-400 border-r-amber-400/50 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Middle pulsing ring */}
          <motion.div
            className="absolute inset-2 border border-purple-500/30 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Inner rotating ring (opposite direction) */}
          <motion.div
            className="absolute inset-4 border-2 border-transparent border-b-purple-400 border-l-purple-400/50 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Center dot */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-2 h-2 rounded-full bg-amber-300" />
          </motion.div>
        </div>
      )}

      {/* Message */}
      <motion.p
        className="text-center text-slate-300 text-sm max-w-sm"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>

      {/* Progress indicator */}
      <motion.div
        className="w-full max-w-xs h-1 bg-slate-700/50 rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 via-amber-400 to-purple-500 rounded-full"
          animate={{ 
            x: ['-100%', '100%']
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
}
