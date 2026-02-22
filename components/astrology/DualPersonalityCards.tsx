'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MBTIType } from '@/lib/mbti-overlay';
import type { DualOverlay } from '@/hooks/usePersonality';
import { Theater, Eye } from 'lucide-react';

interface DualPersonalityCardsProps {
  mbtiType: MBTIType | null;
  dualOverlay?: DualOverlay | null;
  loading?: boolean;
}

/**
 * Dual Personality Cards — What the world sees vs. what's real.
 * Mask (extrovert facade, Sun/Asc) & Core (inner truth, Moon/Mercury).
 */
export function DualPersonalityCards({ mbtiType, dualOverlay, loading = false }: DualPersonalityCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="p-8 bg-slate-900/50 rounded-lg border border-slate-700/20 animate-pulse">
            <div className="h-8 bg-slate-700/50 rounded w-24 mb-4" />
            <div className="h-4 bg-slate-700/50 rounded w-full mb-2" />
            <div className="h-4 bg-slate-700/50 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!mbtiType || !dualOverlay) {
    return (
      <div className="p-8 bg-slate-900/50 rounded-lg border border-slate-700/20 text-center">
        <p className="text-slate-400">Calculate your chart to reveal mask & core</p>
      </div>
    );
  }

  // Get colors based on MBTI type (Extrovert = warm, Introvert = cool)
  const getMaskColor = () => {
    const firstLetter = dualOverlay.hardware.mbtiType?.[0] || 'E';
    return firstLetter === 'E' 
      ? 'from-orange-600/40 to-yellow-600/40 border-orange-400/50' 
      : 'from-blue-600/40 to-cyan-600/40 border-blue-400/50';
  };

  const getCoreColor = () => {
    const firstLetter = dualOverlay.firmware.mbtiType?.[0] || 'I';
    return firstLetter === 'I'
      ? 'from-purple-600/40 to-indigo-600/40 border-purple-400/50'
      : 'from-red-600/40 to-pink-600/40 border-red-400/50';
  };

  const getMaskTextColor = () => {
    const firstLetter = dualOverlay.hardware.mbtiType?.[0] || 'E';
    return firstLetter === 'E' ? 'text-orange-300' : 'text-blue-300';
  };

  const getCoreTextColor = () => {
    const firstLetter = dualOverlay.firmware.mbtiType?.[0] || 'I';
    return firstLetter === 'I' ? 'text-purple-300' : 'text-red-300';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, rotateX: -10 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 0.6, type: 'spring', stiffness: 100 },
    },
  };

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Title */}
      <motion.h2 
        className="text-2xl font-bold text-amber-300 mb-6 flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.0 }}
      >
        <Eye className="w-6 h-6" />
        The Whole You
      </motion.h2>

      {/* Two Cards Side-by-Side */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        variants={containerVariants}
      >
        {/* LEFT: MASK (What the world sees) */}
        <motion.div
          className={`bg-gradient-to-br ${getMaskColor()} rounded-lg p-8 backdrop-blur-sm border-2 transition-all hover:shadow-lg hover:shadow-orange-500/20 relative overflow-hidden`}
          variants={cardVariants}
          whileHover={{ scale: 1.02, y: -5 }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-orange-500/0 to-orange-500/5 pointer-events-none" />
          
          {/* Content */}
          <div className="relative space-y-4 z-10">
            {/* Icon + Label */}
            <div className="flex items-center gap-3">
              <Theater className={`w-6 h-6 ${getMaskTextColor()}`} />
              <span className="text-xs uppercase tracking-widest font-bold text-orange-200/70">
                {dualOverlay.hardware.label}
              </span>
            </div>

            {/* MBTI Type */}
            <div>
              <p className="text-xs uppercase tracking-wide text-orange-300/80 mb-1">{dualOverlay.hardware.sublabel}</p>
              <p className={`text-3xl font-bold ${getMaskTextColor()}`}>
                {dualOverlay.hardware.mbtiType}
              </p>
              <p className="text-xs text-orange-200/60 mt-1">Confidence: {dualOverlay.hardware.confidence}%</p>
            </div>

            {/* Archetype */}
            <div>
              <p className="text-sm font-semibold text-white/90">
                {dualOverlay.hardware.archetype}
              </p>
              <p className="text-xs text-slate-300 italic mt-1">
                {dualOverlay.hardware.description}
              </p>
            </div>

            {/* Poetic line */}
            <div className="pt-4 border-t border-orange-400/30">
              <p className="text-sm italic text-orange-100">
                {getOuterMaskPoetry(dualOverlay.hardware.mbtiType)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* RIGHT: CORE (What's real) */}
        <motion.div
          className={`bg-gradient-to-br ${getCoreColor()} rounded-lg p-8 backdrop-blur-sm border-2 transition-all hover:shadow-lg hover:shadow-purple-500/20 relative overflow-hidden`}
          variants={cardVariants}
          whileHover={{ scale: 1.02, y: -5 }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-500/0 to-purple-500/5 pointer-events-none" />
          
          {/* Content */}
          <div className="relative space-y-4 z-10">
            {/* Icon + Label */}
            <div className="flex items-center gap-3">
              <Eye className={`w-6 h-6 ${getCoreTextColor()}`} />
              <span className="text-xs uppercase tracking-widest font-bold text-purple-200/70">
                {dualOverlay.firmware.label}
              </span>
            </div>

            {/* MBTI Type */}
            <div>
              <p className="text-xs uppercase tracking-wide text-purple-300/80 mb-1">{dualOverlay.firmware.sublabel}</p>
              <p className={`text-3xl font-bold ${getCoreTextColor()}`}>
                {dualOverlay.firmware.mbtiType}
              </p>
              <p className="text-xs text-purple-200/60 mt-1">Confidence: {dualOverlay.firmware.confidence}%</p>
            </div>

            {/* Archetype */}
            <div>
              <p className="text-sm font-semibold text-white/90">
                {dualOverlay.firmware.archetype}
              </p>
              <p className="text-xs text-slate-300 italic mt-1">
                {dualOverlay.firmware.description}
              </p>
            </div>

            {/* Poetic line */}
            <div className="pt-4 border-t border-purple-400/30">
              <p className="text-sm italic text-purple-100">
                {getInnerCorePoetry(dualOverlay.firmware.mbtiType)}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer wisdom */}
      <motion.p
        className="text-center text-sm text-slate-400 italic mt-8 pt-6 border-t border-amber-500/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        The mask lets you dance. The core knows the truth. Both are you.
      </motion.p>
    </motion.div>
  );
}

function getOuterMaskPoetry(type: string): string {
  const poems: Record<string, string> = {
    'ENFP': 'They see the spark—always lit, always moving, always possible.',
    'ENTP': 'They see the questioner—sharp mind, quick tongue, endless debate.',
    'ENFJ': 'They see the guide—warm, engaged, leading with open arms.',
    'ENTJ': 'They see the commander—decisive, driven, unbending.',
    'ESFP': 'They see the entertainer—alive in the moment, pure presence.',
    'ESTP': 'They see the risk-taker—action first, consequences second.',
    'ESFJ': 'They see the caretaker—present, generous, always there.',
    'ESTJ': 'They see the organizer—structured, reliable, in control.',
    'INFP': 'They see the dreamer—thoughtful, idealistic, searching.',
    'INFJ': 'They see the listener—knowing, still, mysteriously wise.',
    'INTP': 'They see the theorist—lost in thought, peculiar brilliance.',
    'INTJ': 'They see the strategist—distant, rarified, untouchable.',
    'ISFP': 'They see the artist—sensitive, authentic, quietly powerful.',
    'ISFJ': 'They see the protector—steady, loyal, deeply present.',
    'ISTP': 'They see the craftsman—practical, self-reliant, detached.',
    'ISTJ': 'They see the sentinel—duty-bound, unchanging, solid.',
  };
  return poems[type] || 'A light burns beneath the surface.';
}

function getInnerCorePoetry(type: string): string {
  const poems: Record<string, string> = {
    'INFJ': 'Inside: The architect of meaning. You see the pattern others miss.',
    'INFP': 'Inside: The guardian of dreams. You protect what matters most.',
    'INTJ': 'Inside: The lone visionary. You build empires from silence.',
    'INTP': 'Inside: The endless question. You know you\'ll never know enough.',
    'ISFJ': 'Inside: The quiet fortress. Your strength is in what you carry.',
    'ISFP': 'Inside: The silent creator. Beauty speaks through your hands.',
    'ISTJ': 'Inside: The immovable center. You are the gravity people orbit.',
    'ISTP': 'Inside: The secret engineer. You understand how things break.',
    'ENFJ': 'Inside: The wounded healer. You feel everything deeply.',
    'ENFP': 'Inside: The seeker of truth. Every possibility calls to you.',
    'ENTJ': 'Inside: The strategic mind. You see three moves ahead.',
    'ENTP': 'Inside: The idea thief. You steal possibilities from the void.',
    'ESFJ': 'Inside: The bond-maker. You weave people into community.',
    'ESFP': 'Inside: The moment-liver. Now is where you truly exist.',
    'ESTJ': 'Inside: The world-builder. You construct order from chaos.',
    'ESTP': 'Inside: The edge-walker. You dance with danger like a lover.',
  };
  return poems[type] || 'A wound made you whole.';
}
