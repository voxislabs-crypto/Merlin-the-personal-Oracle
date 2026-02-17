'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

type InterpretationMode = 'grok' | 'traditional';

interface InterpretationModeToggleProps {
  onModeChange?: (mode: InterpretationMode) => void;
  defaultMode?: InterpretationMode;
  className?: string;
}

const STORAGE_KEY = 'merlin_interpretation_mode';

export function InterpretationModeToggle({
  onModeChange,
  defaultMode = 'grok',
  className = ''
}: InterpretationModeToggleProps) {
  const [mode, setMode] = useState<InterpretationMode>(defaultMode);
  const [mounted, setMounted] = useState(false);

  // Load saved preference on mount - but don't trigger parent updates during hydration
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as InterpretationMode;
    if (saved && (saved === 'grok' || saved === 'traditional')) {
      setMode(saved);
      // Only notify parent after hydration is complete
      setTimeout(() => onModeChange?.(saved), 0);
    }
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        <label className="text-sm font-medium text-slate-300">
          Interpretation Style
        </label>
        <div className="relative bg-slate-800/50 rounded-lg p-1 border border-slate-700/50 backdrop-blur-sm h-[88px]">
          {/* Placeholder during hydration */}
        </div>
      </div>
    );
  }

  const handleToggle = (newMode: InterpretationMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
    onModeChange?.(newMode);
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <label className="text-sm font-medium text-slate-300">
        Interpretation Style
      </label>
      
      <div className="relative bg-slate-800/50 rounded-lg p-1 border border-slate-700/50 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-1 relative">
          {/* Sliding background */}
          <motion.div
            className="absolute inset-y-1 w-[calc(50%-4px)] bg-gradient-to-r from-purple-600 to-purple-500 rounded-md"
            animate={{
              x: mode === 'grok' ? 4 : 'calc(100% + 4px)'
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
          />

          {/* Deep Grok Mode button */}
          <button
            onClick={() => handleToggle('grok')}
            className={`relative z-10 px-4 py-3 rounded-md transition-colors ${
              mode === 'grok'
                ? 'text-white font-bold'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: mode === 'grok' ? '#a78bfa' : '#64748b'
                  }}
                  animate={mode === 'grok' ? {
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 1, 0.7]
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                />
                <span className="text-sm font-semibold">Deep Grok</span>
              </div>
              <span className="text-xs opacity-70">AI-powered insights</span>
            </div>
          </button>

          {/* Quick Traditional button */}
          <button
            onClick={() => handleToggle('traditional')}
            className={`relative z-10 px-4 py-3 rounded-md transition-colors ${
              mode === 'traditional'
                ? 'text-white font-bold'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚡</span>
                <span className="text-sm font-semibold">Traditional</span>
              </div>
              <span className="text-xs opacity-70">Instant results</span>
            </div>
          </button>
        </div>
      </div>

      {/* Mode description */}
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-slate-400 bg-slate-800/30 rounded-md p-3 border border-slate-700/30"
      >
        {mode === 'grok' ? (
          <div className="space-y-1">
            <p className="font-semibold text-purple-300">🔮 Deep Grok Mode</p>
            <p>
              Powered by xAI&apos;s Grok for profound, personalized insights. 
              Results are cached for instant retrieval. May take a few seconds on first generation.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="font-semibold text-amber-300">⚡ Traditional Mode</p>
            <p>
              Template-based interpretations using classical astrology principles. 
              Instant results, no API calls required.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/**
 * Hook to manage interpretation mode preference
 */
export function useInterpretationMode() {
  const [mode, setMode] = useState<InterpretationMode>('grok');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as InterpretationMode;
    if (saved && (saved === 'grok' || saved === 'traditional')) {
      setMode(saved);
    }
  }, []);

  const updateMode = (newMode: InterpretationMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  return { mode, setMode: updateMode };
}
