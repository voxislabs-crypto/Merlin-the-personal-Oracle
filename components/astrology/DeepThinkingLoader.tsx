'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeepThinkingLoaderProps {
  message?: string;
  subMessage?: string;
}

const thinkingPhrases = [
  'Consulting the cosmic archives...',
  'Reading the celestial patterns...',
  'Decoding your soul blueprint...',
  'Interpreting the stars...',
  'Channeling ancient wisdom...',
  'Weaving planetary threads...',
  'Illuminating hidden paths...',
  'Tracing karmic patterns...'
];

export function DeepThinkingLoader({ 
  message = 'Deep thinking...', 
  subMessage 
}: DeepThinkingLoaderProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [dots, setDots] = useState(1);

  useEffect(() => {
    // Rotate through thinking phrases
    const phraseInterval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % thinkingPhrases.length);
    }, 3000);

    // Animate dots
    const dotInterval = setInterval(() => {
      setDots(prev => (prev % 3) + 1);
    }, 500);

    return () => {
      clearInterval(phraseInterval);
      clearInterval(dotInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-6">
      {/* Cosmic orb animation */}
      <div className="relative w-32 h-32">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-purple-500/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Middle ring */}
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-amber-500/40"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3
          }}
        />
        
        {/* Inner orb */}
        <motion.div
          className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-600 to-amber-500"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.6
          }}
        />

        {/* Sparkles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: '50%',
              left: '50%',
            }}
            animate={{
              x: [0, Math.cos(i * Math.PI / 3) * 60],
              y: [0, Math.sin(i * Math.PI / 3) * 60],
              opacity: [0, 1, 0],
              scale: [0, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 0.2
            }}
          />
        ))}
      </div>

      {/* Text animations */}
      <div className="text-center space-y-2">
        <motion.h3
          className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-amber-400"
          animate={{
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {message}
          <span className="inline-block w-8 text-left">
            {'.'.repeat(dots)}
          </span>
        </motion.h3>

        {/* Rotating phrases */}
        <AnimatePresence mode="wait">
          <motion.p
            key={phraseIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-slate-300 text-sm italic"
          >
            {subMessage || thinkingPhrases[phraseIndex]}
          </motion.p>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden mt-4">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 via-amber-500 to-purple-500"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ width: '50%' }}
          />
        </div>
      </div>

      {/* Tip */}
      <motion.p
        className="text-xs text-slate-400 max-w-md text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
      >
        💡 Tip: Results are cached for instant access next time
      </motion.p>
    </div>
  );
}

/**
 * Compact inline loader for smaller spaces
 */
export function InlineThinkingLoader() {
  return (
    <div className="flex items-center gap-3 text-purple-300">
      <motion.div
        className="flex gap-1"
        animate={{
          opacity: [0.4, 1, 0.4]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity
        }}
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-purple-400 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </motion.div>
      <span className="text-sm italic">Channeling Grok wisdom...</span>
    </div>
  );
}
