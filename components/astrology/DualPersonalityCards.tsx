'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MBTIType } from '@/lib/mbti-overlay';
import type { DualOverlay } from '@/hooks/usePersonality';
import { Theater, Eye, AlertTriangle, Shuffle } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import flavorsRaw from '@/data/mbti-flavors.json';
import shadowsRaw from '@/data/mbti-shadows.json';

const flavors = flavorsRaw as Record<string, Record<string, string>>;
const shadows = shadowsRaw as Record<string, Record<string, string>>;

const MBTI_TYPES: MBTIType[] = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];

interface TransitItem {
  transitingPlanet?: string;
  natalPlanet?: string;
  aspect?: string;
}

function findShadowTrigger(transits?: { significant?: TransitItem[]; approaching?: TransitItem[] } | null): string | null {
  if (!transits) return null;
  const all: TransitItem[] = [...(transits.significant || []), ...(transits.approaching || [])];
  for (const t of all) {
    const planet = t.transitingPlanet?.toLowerCase() || '';
    const aspect = t.aspect?.toLowerCase() || '';
    const natal = t.natalPlanet?.toLowerCase() || '';
    if (planet === 'mars' && aspect === 'square' && natal === 'moon') return 'Mars square Moon';
    if (planet === 'saturn' && aspect === 'opposition' && natal === 'sun') return 'Saturn opposition Sun';
    if (planet === 'saturn' && aspect === 'square' && natal === 'moon') return 'Saturn square Moon';
    if (planet === 'pluto' && aspect === 'opposition' && natal === 'moon') return 'Pluto opposition Moon';
  }
  return null;
}

interface DualPersonalityCardsProps {
  mbtiType: MBTIType | null;
  dualOverlay?: DualOverlay | null;
  transits?: { significant?: TransitItem[]; approaching?: TransitItem[] } | null;
  loading?: boolean;
}

/**
 * Dual Personality Cards — What the world sees vs. what's real.
 * Mask (extrovert facade, Sun/Asc) & Core (inner truth, Moon/Mercury).
 */
export function DualPersonalityCards({ mbtiType, dualOverlay, transits, loading = false }: DualPersonalityCardsProps) {
  const { user } = useUser();
  const savedOverride = (user?.unsafeMetadata?.mbtiOverride as MBTIType | undefined) ?? null;
  const [showOverride, setShowOverride] = useState(false);
  const [selectedType, setSelectedType] = useState<MBTIType | ''>(savedOverride || '');
  const [savingOverride, setSavingOverride] = useState(false);
  const [shadowExpanded, setShadowExpanded] = useState(false);

  const finalType: MBTIType | null = savedOverride || (dualOverlay?.finalType as MBTIType) || mbtiType;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const flavor = useMemo(() => {
    const type = finalType || 'INFJ';
    const f = flavors[type as string];
    if (!f) return null;
    const keys = Object.keys(f);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return { name: key, text: f[key] };
  }, [finalType]);

  const shadowTrigger = useMemo(() => findShadowTrigger(transits), [transits]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shadow = useMemo(() => {
    if (!shadowTrigger || !finalType) return null;
    const s = shadows[finalType as string];
    if (!s) return null;
    const keys = Object.keys(s);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return { name: key, text: s[key] };
  }, [shadowTrigger, finalType]);

  const handleSaveOverride = async () => {
    if (!selectedType || !user) return;
    setSavingOverride(true);
    try {
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, mbtiOverride: selectedType } });
      setShowOverride(false);
    } catch (e) {
      console.error('Failed to save MBTI override:', e);
    } finally {
      setSavingOverride(false);
    }
  };

  const handleClearOverride = async () => {
    if (!user) return;
    setSavingOverride(true);
    try {
      const meta = { ...user.unsafeMetadata };
      delete (meta as Record<string, unknown>).mbtiOverride;
      await user.update({ unsafeMetadata: meta });
    } finally {
      setSavingOverride(false);
    }
  };

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
        className="text-2xl font-bold text-amber-300 mb-2 flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.0 }}
      >
        <Eye className="w-6 h-6" />
        The Whole You
      </motion.h2>

      {/* Flavor profile */}
      {flavor && (
        <motion.p
          className="text-sm text-amber-200/70 italic mb-4 pl-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <span className="text-amber-400/60 capitalize">{flavor.name}:</span> {flavor.text}
        </motion.p>
      )}

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

      {/* Shadow Alert — only shown on tough transits */}
      <AnimatePresence>
        {shadow && shadowTrigger && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 rounded-lg border border-red-500/40 bg-red-950/30 overflow-hidden"
          >
            <button
              className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-red-300 hover:text-red-200 transition-colors"
              onClick={() => setShadowExpanded(v => !v)}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="font-semibold">Shadow Alert</span>
              <span className="text-red-400/60 ml-1">— {shadowTrigger}</span>
              <span className="ml-auto text-xs">{shadowExpanded ? '▲' : '▼'}</span>
            </button>
            <AnimatePresence>
              {shadowExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    <p className="text-xs text-red-300/80 capitalize font-semibold mb-1">{shadow.name}</p>
                    <p className="text-sm text-slate-300">{shadow.text}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Type Override */}
      <motion.div
        className="mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {!showOverride ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowOverride(true); setSelectedType(savedOverride || ''); }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition-colors py-1"
            >
              <Shuffle className="w-3.5 h-3.5" />
              {savedOverride ? `Override: ${savedOverride}` : 'Override type'}
            </button>
            {savedOverride && (
              <button
                onClick={handleClearOverride}
                disabled={savingOverride}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                clear
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as MBTIType)}
              className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">-- select type --</option>
              {MBTI_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button
              onClick={handleSaveOverride}
              disabled={!selectedType || savingOverride}
              className="text-xs bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded px-3 py-1 transition-colors"
            >
              {savingOverride ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setShowOverride(false)}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              cancel
            </button>
          </div>
        )}
      </motion.div>

      {/* Footer wisdom */}
      <motion.p
        className="text-center text-sm text-slate-400 italic mt-6 pt-6 border-t border-amber-500/20"
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
