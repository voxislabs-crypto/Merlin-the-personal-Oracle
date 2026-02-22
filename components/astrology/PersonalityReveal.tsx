'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MBTIType } from '@/lib/mbti-overlay';
import type { DualOverlay } from '@/hooks/usePersonality';

interface PersonalityRevealProps {
  mbtiType: MBTIType | null;
  dualOverlay?: DualOverlay | null;
  loading?: boolean;
}

/**
 * Personality Reveal - No quiz. No questions.
 * The stars said it first. The test just caught up.
 */
export function PersonalityReveal({ mbtiType, dualOverlay, loading = false }: PersonalityRevealProps) {
  if (loading) {
    return (
      <div className="p-8 bg-slate-900/50 rounded-lg border border-amber-500/20">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-700/50 rounded w-32" />
          <div className="h-4 bg-slate-700/50 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!mbtiType) {
    return (
      <div className="p-8 bg-slate-900/50 rounded-lg border border-slate-700/20">
        <div className="text-center text-slate-400 space-y-2">
          <div className="text-2xl">🔮</div>
          <p className="text-sm">Calculate your chart to reveal your personality type</p>
        </div>
      </div>
    );
  }

  const typeDescriptions: Record<MBTIType, string> = {
    'INFJ': 'The seer. You know before knowing. The wound made you wise.',
    'INFP': 'The poet. Ideals burn brighter than reality. You carry the fire.',
    'INTJ': 'The architect. Systems rise from chaos. You build the future.',
    'INTP': 'The analyst. Questions never end. You hunger for truth.',
    'ISFJ': 'The guardian. Loyalty runs deeper than blood. You hold the line.',
    'ISFP': 'The artist. Beauty speaks louder than words. You paint the world.',
    'ISTJ': 'The sentinel. Duty before desire. You anchor the storm.',
    'ISTP': 'The craftsman. Action speaks; words fade. You fix what breaks.',
    'ENFJ': 'The teacher. Your light wakes others. You lead by lifting.',
    'ENFP': 'The champion. Possibility exceeds probability. You dare the leap.',
    'ENTJ': 'The commander. Vision becomes empire. You conquer the mountain.',
    'ENTP': 'The  debater. Rules bend; minds open. You question everything.',
    'ESFJ': 'The provider. Community over self. You weave the web.',
    'ESFP': 'The performer. Life is the stage. You dance through flames.',
    'ESTJ': 'The executive. Order from disorder. You run the world.',
    'ESTP': 'The dynamo. Risk tastes like freedom. You live at the edge.'
  };

  return (
    <motion.div
      className="relative p-8 rounded-lg bg-gradient-to-br from-amber-900/20 to-slate-900/80 border border-amber-500/30 backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative space-y-4">
        {/* Type badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-block"
        >
          <div className="px-4 py-2 bg-amber-500/20 border-2 border-amber-400/40 rounded-lg">
            <span className="text-2xl font-bold text-amber-200 tracking-wider">
              {mbtiType}
            </span>
          </div>
        </motion.div>

        {/* The reveal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-3"
        >
          <p className="text-xl text-white leading-relaxed">
            You're <span className="font-bold text-amber-300">{mbtiType}</span>.
          </p>
          <p className="text-lg text-slate-200 leading-relaxed italic">
            {typeDescriptions[mbtiType]}
          </p>
        </motion.div>

        {dualOverlay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="grid grid-cols-1 gap-3 pt-2"
          >
            <div className="rounded-lg border border-amber-500/30 bg-slate-900/60 p-3">
              <p className="text-xs uppercase tracking-wide text-amber-300/80">{dualOverlay.natal.label}</p>
              <p className="text-sm font-semibold text-white mt-1">{dualOverlay.natal.archetype}</p>
              <p className="text-xs text-slate-300 mt-1 italic">{dualOverlay.natal.description}</p>
            </div>
            <div className="rounded-lg border border-purple-500/30 bg-slate-900/60 p-3">
              <p className="text-xs uppercase tracking-wide text-purple-300/80">{dualOverlay.firmware.label}</p>
              <p className="text-sm font-semibold text-white mt-1">
                {dualOverlay.firmware.mbtiType} • {dualOverlay.firmware.archetype}
              </p>
              <p className="text-xs text-slate-300 mt-1 italic">{dualOverlay.firmware.description}</p>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-amber-300/60 italic mt-6 pt-4 border-t border-amber-500/20"
        >
          The stars said it first. The test just caught up.
        </motion.p>
      </div>
    </motion.div>
  );
}
