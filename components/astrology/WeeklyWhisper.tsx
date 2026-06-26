'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DayWhisper } from '@/hooks/useWeeklyForecast';

interface WeeklyWhisperProps {
  week: DayWhisper[];
  loading?: boolean;
}

/**
 * Weekly Whisper - Seven days, seven lines
 * No headers. No fluff. Just the compass.
 * From the sky. To you.
 */
export function WeeklyWhisper({ week, loading = false }: WeeklyWhisperProps) {
  if (loading) {
    return (
      <div className="p-8 bg-slate-900/50 rounded-lg border border-purple-500/20">
        <div className="animate-pulse space-y-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-4 bg-slate-700/50 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const dayVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-lg border border-purple-500/30 bg-gradient-to-br from-slate-900/80 to-purple-900/20 backdrop-blur-sm"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative p-8 max-h-[500px] overflow-y-auto custom-scrollbar">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {week.map((day, index) => {
            const today = new Date().toDateString();
            const dayDate = new Date(day.date).toDateString();
            const isToday = today === dayDate;

            return (
              <motion.div
                key={day.date}
                variants={dayVariants}
                className={`group relative ${isToday ? 'opacity-100' : 'opacity-90 hover:opacity-100'} transition-opacity`}
              >
                {/* Glow effect for today */}
                {isToday && (
                  <motion.div
                    className="absolute -inset-2 bg-gradient-to-r from-amber-400/20 via-purple-500/20 to-amber-400/20 rounded-lg blur-xl"
                    animate={{
                      opacity: [0.4, 0.7, 0.4],
                      scale: [1, 1.02, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
                
                {/* Content container */}
                <div className={`relative ${isToday ? 'p-4 rounded-lg bg-gradient-to-br from-purple-900/30 to-amber-900/20 border border-amber-400/50' : ''}`}>
                  {/* Day name */}
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className={`text-sm font-bold uppercase tracking-wider ${
                      isToday 
                        ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' 
                        : 'text-slate-400 group-hover:text-purple-400'
                    } transition-colors`}>
                      {day.day}
                    </span>
                    {isToday && (
                      <motion.span 
                        className="text-xs text-amber-300 bg-amber-500/30 px-2 py-0.5 rounded-full border border-amber-400/50"
                        animate={{
                          boxShadow: [
                            '0 0 0px rgba(251, 191, 36, 0)',
                            '0 0 15px rgba(251, 191, 36, 0.6)',
                            '0 0 0px rgba(251, 191, 36, 0)'
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        Today
                      </motion.span>
                    )}
                  </div>
                  
                  {/* The whisper */}
                  <p className={`text-lg leading-relaxed ${
                    isToday 
                      ? 'text-white font-semibold drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]' 
                      : 'text-slate-200'
                  } transition-colors`}>
                    {day.whisper}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.4);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.6);
        }
      `}</style>
    </motion.div>
  );
}
