'use client';

import { UserButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Eye, Sparkles, Scroll, MessageCircle } from "lucide-react";
import type { OracleTonePreset } from '@/lib/oracle-output';

type ReadingPreset = 'plain' | 'warm' | 'bullshit' | 'oracle';
type InterpretationMode = 'grok' | 'traditional';
type OracleMode = 'auto' | 'casual' | 'detailed';
type ProphecyPolishMode = 'engine' | 'groq';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [clarityMode, setClarityMode] = useState(true);
  const [noBullshitMode, setNoBullshitMode] = useState(false);
  const [questLogEnabled, setQuestLogEnabled] = useState(true);
  const [interpretationMode, setInterpretationMode] = useState<InterpretationMode>('grok');
  const [oracleTonePreset, setOracleTonePreset] = useState<OracleTonePreset>('warm');
  const [oracleMode, setOracleMode] = useState<OracleMode>('auto');
  const [includeLikelihood, setIncludeLikelihood] = useState(true);
  const [ancientLayer, setAncientLayer] = useState(false);
  const [prophecyPolishMode, setProphecyPolishMode] = useState<ProphecyPolishMode>('engine');
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('merlin_clarity_mode');
    if (saved !== null) setClarityMode(saved !== 'false');
    const savedNoBullshit = localStorage.getItem('merlin_no_bullshit_mode');
    if (savedNoBullshit !== null) setNoBullshitMode(savedNoBullshit === 'true');
    const savedQuestLog = localStorage.getItem('merlin_quest_log_enabled');
    if (savedQuestLog !== null) setQuestLogEnabled(savedQuestLog !== 'false');
    const savedInterpretationMode = localStorage.getItem('merlin_interpretation_mode');
    if (savedInterpretationMode === 'grok' || savedInterpretationMode === 'traditional') {
      setInterpretationMode(savedInterpretationMode);
    }
    const savedTone = localStorage.getItem('merlin_oracle_tone') as OracleTonePreset | null;
    if (savedTone && ['warm', 'direct', 'mystic', 'strategic'].includes(savedTone)) {
      setOracleTonePreset(savedTone);
    }
    const savedMode = localStorage.getItem('merlin_oracle_mode') as OracleMode | null;
    if (savedMode && ['auto', 'casual', 'detailed'].includes(savedMode)) {
      setOracleMode(savedMode);
    }
    const savedLikelihood = localStorage.getItem('merlin_include_likelihood');
    if (savedLikelihood !== null) setIncludeLikelihood(savedLikelihood !== 'false');
    const savedAncient = localStorage.getItem('merlin_ancient_layer');
    if (savedAncient !== null) setAncientLayer(savedAncient === 'true');
    const savedProphecyPolish = localStorage.getItem('merlin_prophecy_polish_mode');
    if (savedProphecyPolish === 'engine' || savedProphecyPolish === 'groq') {
      setProphecyPolishMode(savedProphecyPolish);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const loadOraclePreferences = async () => {
      try {
        const response = await fetch('/api/oracle-preferences');
        if (!response.ok) return;

        const result = await response.json();
        const preferences = result?.data;

        if (typeof preferences?.clarityMode === 'boolean') {
          setClarityMode(preferences.clarityMode);
          localStorage.setItem('merlin_clarity_mode', String(preferences.clarityMode));
        }
        if (preferences?.interpretationMode === 'grok' || preferences?.interpretationMode === 'traditional') {
          setInterpretationMode(preferences.interpretationMode);
          localStorage.setItem('merlin_interpretation_mode', preferences.interpretationMode);
        }
        if (typeof preferences?.noBullshitMode === 'boolean') {
          setNoBullshitMode(preferences.noBullshitMode);
          localStorage.setItem('merlin_no_bullshit_mode', String(preferences.noBullshitMode));
        }
        if (typeof preferences?.questLogEnabled === 'boolean') {
          setQuestLogEnabled(preferences.questLogEnabled);
          localStorage.setItem('merlin_quest_log_enabled', String(preferences.questLogEnabled));
        }
        if (
          preferences?.oracleTonePreset === 'warm' ||
          preferences?.oracleTonePreset === 'direct' ||
          preferences?.oracleTonePreset === 'mystic' ||
          preferences?.oracleTonePreset === 'strategic'
        ) {
          setOracleTonePreset(preferences.oracleTonePreset);
          localStorage.setItem('merlin_oracle_tone', preferences.oracleTonePreset);
        }
        if (preferences?.oracleMode === 'auto' || preferences?.oracleMode === 'casual' || preferences?.oracleMode === 'detailed') {
          setOracleMode(preferences.oracleMode);
          localStorage.setItem('merlin_oracle_mode', preferences.oracleMode);
        }
        if (typeof preferences?.includeLikelihood === 'boolean') {
          setIncludeLikelihood(preferences.includeLikelihood);
          localStorage.setItem('merlin_include_likelihood', String(preferences.includeLikelihood));
        }
        if (typeof preferences?.ancientLayer === 'boolean') {
          setAncientLayer(preferences.ancientLayer);
          localStorage.setItem('merlin_ancient_layer', String(preferences.ancientLayer));
        }
        if (preferences?.prophecyPolishMode === 'engine' || preferences?.prophecyPolishMode === 'groq') {
          setProphecyPolishMode(preferences.prophecyPolishMode);
          localStorage.setItem('merlin_prophecy_polish_mode', preferences.prophecyPolishMode);
        }
      } catch {
        // Local preferences remain the fallback if account sync is unavailable.
      }
    };

    loadOraclePreferences();
  }, [isLoaded, user]);

  const persistOraclePreferences = async (next: Partial<{
    clarityMode: boolean;
    interpretationMode: InterpretationMode;
    noBullshitMode: boolean;
    questLogEnabled: boolean;
    oracleTonePreset: OracleTonePreset;
    oracleMode: OracleMode;
    includeLikelihood: boolean;
    ancientLayer: boolean;
    prophecyPolishMode: ProphecyPolishMode;
  }>) => {
    try {
      const response = await fetch('/api/oracle-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      setSyncMessage('Saved to your account');
      window.setTimeout(() => setSyncMessage(''), 1800);
    } catch {
      setSyncMessage('Saved on this device only');
      window.setTimeout(() => setSyncMessage(''), 1800);
    }
  };

  const toggleClarityMode = () => {
    const next = !clarityMode;
    setClarityMode(next);
    localStorage.setItem('merlin_clarity_mode', String(next));
    void persistOraclePreferences({ clarityMode: next });
  };

  const toggleNoBullshitMode = () => {
    const next = !noBullshitMode;
    setNoBullshitMode(next);
    localStorage.setItem('merlin_no_bullshit_mode', String(next));
    void persistOraclePreferences({ noBullshitMode: next });
  };

  const toggleQuestLog = () => {
    const next = !questLogEnabled;
    setQuestLogEnabled(next);
    localStorage.setItem('merlin_quest_log_enabled', String(next));
    void persistOraclePreferences({ questLogEnabled: next });
  };

  const setInterpretationPreference = (mode: InterpretationMode) => {
    setInterpretationMode(mode);
    localStorage.setItem('merlin_interpretation_mode', mode);
    void persistOraclePreferences({ interpretationMode: mode });
  };

  const setOracleTonePreference = (tone: OracleTonePreset) => {
    setOracleTonePreset(tone);
    localStorage.setItem('merlin_oracle_tone', tone);
    void persistOraclePreferences({ oracleTonePreset: tone });
  };

  const setOracleModePreference = (mode: OracleMode) => {
    setOracleMode(mode);
    localStorage.setItem('merlin_oracle_mode', mode);
    void persistOraclePreferences({ oracleMode: mode });
  };

  const setProphecyPolishModePreference = (mode: ProphecyPolishMode) => {
    setProphecyPolishMode(mode);
    localStorage.setItem('merlin_prophecy_polish_mode', mode);
    void persistOraclePreferences({ prophecyPolishMode: mode });
  };

  const toggleLikelihood = () => {
    const next = !includeLikelihood;
    setIncludeLikelihood(next);
    localStorage.setItem('merlin_include_likelihood', String(next));
    void persistOraclePreferences({ includeLikelihood: next });
  };

  const toggleAncientLayer = () => {
    const next = !ancientLayer;
    setAncientLayer(next);
    localStorage.setItem('merlin_ancient_layer', String(next));
    void persistOraclePreferences({ ancientLayer: next });
  };

  const setReadingLens = (lens: 'modern' | 'ancient') => {
    const nextMode: OracleMode = lens === 'modern' ? 'casual' : 'detailed';
    const nextAncient = lens === 'ancient';

    setOracleMode(nextMode);
    localStorage.setItem('merlin_oracle_mode', nextMode);
    setAncientLayer(nextAncient);
    localStorage.setItem('merlin_ancient_layer', String(nextAncient));

    void persistOraclePreferences({
      oracleMode: nextMode,
      ancientLayer: nextAncient,
    });
  };

  const applyReadingPreset = (preset: ReadingPreset) => {
    if (preset === 'plain') {
      setInterpretationMode('traditional');
      localStorage.setItem('merlin_interpretation_mode', 'traditional');
      setClarityMode(true);
      localStorage.setItem('merlin_clarity_mode', 'true');
      setNoBullshitMode(false);
      localStorage.setItem('merlin_no_bullshit_mode', 'false');
      void persistOraclePreferences({ interpretationMode: 'traditional', clarityMode: true, noBullshitMode: false });
      return;
    }

    if (preset === 'warm') {
      setInterpretationMode('grok');
      localStorage.setItem('merlin_interpretation_mode', 'grok');
      setClarityMode(true);
      localStorage.setItem('merlin_clarity_mode', 'true');
      setNoBullshitMode(false);
      localStorage.setItem('merlin_no_bullshit_mode', 'false');
      void persistOraclePreferences({ interpretationMode: 'grok', clarityMode: true, noBullshitMode: false });
      return;
    }

    if (preset === 'bullshit') {
      setInterpretationMode('grok');
      localStorage.setItem('merlin_interpretation_mode', 'grok');
      setClarityMode(true);
      localStorage.setItem('merlin_clarity_mode', 'true');
      setNoBullshitMode(true);
      localStorage.setItem('merlin_no_bullshit_mode', 'true');
      void persistOraclePreferences({ interpretationMode: 'grok', clarityMode: true, noBullshitMode: true });
      return;
    }

    setInterpretationMode('grok');
    localStorage.setItem('merlin_interpretation_mode', 'grok');
    setClarityMode(false);
    localStorage.setItem('merlin_clarity_mode', 'false');
    setNoBullshitMode(false);
    localStorage.setItem('merlin_no_bullshit_mode', 'false');
    void persistOraclePreferences({ interpretationMode: 'grok', clarityMode: false, noBullshitMode: false });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Please sign in to view your profile</p>
          <Link
            href="/sign-in"
            className="text-amber-400 hover:text-amber-300 underline"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-amber-300 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-between items-center mb-12"
        >
          <h1 className="text-4xl font-bold text-amber-400">Your Profile</h1>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-12 h-12',
                userButtonPopoverCard: 'bg-slate-900 border border-purple-500',
                userButtonPopoverActionButton: 'text-white hover:bg-purple-600',
                userButtonPopoverActionButtonText: 'text-white',
                dividerBox: 'bg-purple-500/30',
              },
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-black/50 backdrop-blur-sm border border-amber-800 rounded-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-amber-300 mb-6">Account Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-gray-400 text-sm">Full Name</label>
              <p className="text-lg text-white mt-1">
                {user.firstName} {user.lastName}
              </p>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Email</label>
              <p className="text-lg text-white mt-1">
                {user.emailAddresses[0]?.emailAddress}
              </p>
            </div>

            <div>
              <label className="text-gray-400 text-sm">User ID</label>
              <p className="text-lg text-white mt-1 font-mono text-sm">
                {user.id}
              </p>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Account Created</label>
              <p className="text-lg text-white mt-1">
                {new Date(user.createdAt || '').toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-black/50 backdrop-blur-sm border border-amber-800 rounded-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-amber-300 mb-2">Oracle Preferences</h2>
          <p className="text-gray-400 text-sm mb-6">Customize how Merlin reads your chart and communicates across the app.</p>

          <div className="mb-8">
            <p className="text-white font-semibold mb-3 flex items-center gap-2">
              <MessageCircle size={16} className="text-cyan-400" />
              Reading presets
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => applyReadingPreset('plain')}
                className="px-4 py-2 text-sm bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-200 font-semibold transition-all"
              >
                Plain
              </button>
              <button
                onClick={() => applyReadingPreset('warm')}
                className="px-4 py-2 text-sm bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 rounded-lg text-sky-200 font-semibold transition-all"
              >
                Warm
              </button>
              <button
                onClick={() => applyReadingPreset('bullshit')}
                className="px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-200 font-semibold transition-all"
              >
                No-BS
              </button>
              <button
                onClick={() => applyReadingPreset('oracle')}
                className="px-4 py-2 text-sm bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 rounded-lg text-violet-200 font-semibold transition-all"
              >
                Oracle
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="text-white font-semibold mb-1">Interpretation engine</p>
                <p className="text-gray-400 text-sm">
                  {interpretationMode === 'grok'
                    ? 'Deep Grok for slower, richer AI interpretation.'
                    : 'Traditional mode for faster classical astrology output.'}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setInterpretationPreference('grok')}
                  className={`px-4 py-2 text-sm rounded-lg border transition ${
                    interpretationMode === 'grok'
                      ? 'bg-violet-500/20 border-violet-500/30 text-violet-100'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/70'
                  }`}
                >
                  Deep Grok
                </button>
                <button
                  onClick={() => setInterpretationPreference('traditional')}
                  className={`px-4 py-2 text-sm rounded-lg border transition ${
                    interpretationMode === 'traditional'
                      ? 'bg-amber-500/20 border-amber-500/30 text-amber-100'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/70'
                  }`}
                >
                  Traditional
                </button>
              </div>
            </div>

            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="text-white font-semibold mb-1">Oracle tone</p>
                <p className="text-gray-400 text-sm">
                  {oracleTonePreset === 'warm' && 'Supportive and emotionally buffered.'}
                  {oracleTonePreset === 'direct' && 'Sharper and more confrontational when needed.'}
                  {oracleTonePreset === 'strategic' && 'Structured, tactical, and decision-oriented.'}
                  {oracleTonePreset === 'mystic' && 'More symbolic, poetic, and ceremonial.'}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['warm', 'direct', 'strategic', 'mystic'] as OracleTonePreset[]).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setOracleTonePreference(tone)}
                    className={`px-4 py-2 text-sm rounded-lg border transition ${
                      oracleTonePreset === tone
                        ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-100'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/70'
                    }`}
                  >
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-white font-semibold mb-1">Reading lens</p>
                <p className="text-gray-400 text-sm">
                  Pick your vibe first. You can still fine-tune mode and ancient depth below.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setReadingLens('modern')}
                  className={`group text-left rounded-xl border p-4 transition-all ${
                    !ancientLayer && oracleMode === 'casual'
                      ? 'border-cyan-300/60 bg-gradient-to-br from-cyan-500/25 via-sky-500/20 to-slate-900 shadow-[0_0_0_1px_rgba(103,232,249,0.15)]'
                      : 'border-slate-700 bg-slate-800/40 hover:border-cyan-500/40 hover:bg-cyan-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-cyan-100 flex items-center gap-2">
                      <MessageCircle size={16} className="text-cyan-300" />
                      Modern Oracle
                    </p>
                    <span className="text-[10px] uppercase tracking-wider text-cyan-300/80">Today Voice</span>
                  </div>
                  <p className="text-xs text-cyan-100/80 mt-2 leading-relaxed">
                    Fast, clean, no-BS reads. Quick hits, casual flow, plain guidance when you need a direct answer now.
                  </p>
                </button>

                <button
                  onClick={() => setReadingLens('ancient')}
                  className={`group text-left rounded-xl border p-4 transition-all ${
                    ancientLayer && oracleMode === 'detailed'
                      ? 'border-amber-300/60 bg-gradient-to-br from-amber-700/30 via-amber-900/35 to-slate-900 shadow-[0_0_0_1px_rgba(251,191,36,0.18)]'
                      : 'border-slate-700 bg-slate-800/40 hover:border-amber-500/40 hover:bg-amber-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-amber-100 flex items-center gap-2">
                      <Scroll size={16} className="text-amber-300" />
                      Ancient Oracle
                    </p>
                    <span className="text-[10px] uppercase tracking-wider text-amber-300/80">Babylonian Depth</span>
                  </div>
                  <p className="text-xs text-amber-100/80 mt-2 leading-relaxed">
                    Slow-burn interpretation with old-world symbolism and layered lore, fused into practical modern timing.
                  </p>
                </button>
              </div>
            </div>

            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="text-white font-semibold mb-1">Response style</p>
                <p className="text-gray-400 text-sm">
                  {oracleMode === 'auto' && 'Merlin decides the level of detail based on your question.'}
                  {oracleMode === 'casual' && 'Shorter, looser, more conversational answers.'}
                  {oracleMode === 'detailed' && 'Structured, explicit, and more analytical readings.'}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['auto', 'casual', 'detailed'] as OracleMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setOracleModePreference(mode)}
                    className={`px-4 py-2 text-sm rounded-lg border transition ${
                      oracleMode === mode
                        ? 'bg-sky-500/20 border-sky-500/30 text-sky-100'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/70'
                    }`}
                  >
                    {mode === 'auto' ? 'Auto' : mode === 'casual' ? 'Casual' : 'Detailed'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="text-white font-semibold mb-1">Likelihood display</p>
                <p className="text-gray-400 text-sm">
                  {includeLikelihood
                    ? 'Show confidence or likelihood percentages when the reading supports them.'
                    : 'Hide percentages for a cleaner, more prose-first reading.'}
                </p>
              </div>
              <button
                onClick={toggleLikelihood}
                className={`px-4 py-2 border rounded-lg font-semibold transition-all ${
                  includeLikelihood
                    ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-100 hover:bg-indigo-500/30'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/70'
                }`}
              >
                {includeLikelihood ? 'Percentages On' : 'Percentages Off'}
              </button>
            </div>

            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <p className="text-white font-semibold mb-1">Prophecy polish engine</p>
                <p className="text-gray-400 text-sm">
                  {prophecyPolishMode === 'engine'
                    ? 'Use built-in deterministic prophecy generation only (lowest cost).'
                    : 'Use Groq as an optional rewrite layer for poetic polish when available.'}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setProphecyPolishModePreference('engine')}
                  className={`px-4 py-2 text-sm rounded-lg border transition ${
                    prophecyPolishMode === 'engine'
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/70'
                  }`}
                >
                  Engine Only
                </button>
                <button
                  onClick={() => setProphecyPolishModePreference('groq')}
                  className={`px-4 py-2 text-sm rounded-lg border transition ${
                    prophecyPolishMode === 'groq'
                      ? 'bg-violet-500/20 border-violet-500/30 text-violet-100'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/70'
                  }`}
                >
                  Engine + Groq
                </button>
              </div>
            </div>

            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="text-white font-semibold mb-1">Ancient layer</p>
                <p className="text-gray-400 text-sm">
                  {ancientLayer
                    ? 'Blend older astrological sources into the modern reading voice.'
                    : 'Keep readings modern unless you explicitly ask Merlin to go deeper.'}
                </p>
              </div>
              <button
                onClick={toggleAncientLayer}
                className={`px-4 py-2 border rounded-lg font-semibold transition-all ${
                  ancientLayer
                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-100 hover:bg-amber-500/30'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/70'
                }`}
              >
                {ancientLayer ? 'Ancient On' : 'Ancient Off'}
              </button>
            </div>

            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-[200px]">
              <p className="text-white font-semibold mb-1 flex items-center gap-2">
                {clarityMode ? <Eye size={16} className="text-emerald-400" /> : <Sparkles size={16} className="text-purple-400" />}
                {clarityMode ? 'Clarity Mode' : 'Oracle Full Mode'}
              </p>
              <p className="text-gray-400 text-sm">
                {clarityMode
                  ? 'Plain English — no astrology jargon. Easy for everyone to understand.'
                  : 'Full astrological detail — planetary aspects, house positions, confidence scores.'}
              </p>
              </div>
              <button
                onClick={toggleClarityMode}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none ${
                  clarityMode ? 'bg-emerald-500 border-emerald-600' : 'bg-purple-700 border-purple-600'
                }`}
                role="switch"
                aria-checked={clarityMode}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                    clarityMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="text-white font-semibold mb-1">Tone setting</p>
                <p className="text-gray-400 text-sm">
                  {noBullshitMode
                    ? 'Direct mode trims the softness and gets to the point.'
                    : 'Warm mode keeps Merlin supportive and more emotionally buffered.'}
                </p>
              </div>
              <button
                onClick={toggleNoBullshitMode}
                className={`px-4 py-2 border rounded-lg font-semibold transition-all ${
                  noBullshitMode
                    ? 'bg-red-500/20 border-red-500/30 text-red-200 hover:bg-red-500/30'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/70'
                }`}
              >
                {noBullshitMode ? 'No-BS Mode' : 'Warm Mode'}
              </button>
            </div>

            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="text-white font-semibold mb-1 flex items-center gap-2">
                  <Scroll size={16} className="text-amber-300" />
                  Quest log
                </p>
                <p className="text-gray-400 text-sm">
                  Keep the dashboard quest tracker visible as part of your reading flow.
                </p>
              </div>
              <button
                onClick={toggleQuestLog}
                className={`px-4 py-2 border rounded-lg font-semibold transition-all ${
                  questLogEnabled
                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-100 hover:bg-amber-500/30'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/70'
                }`}
              >
                {questLogEnabled ? 'Quests On' : 'Quests Off'}
              </button>
            </div>
          </div>

          <p className="text-gray-600 text-xs mt-4">
            These settings apply across the app and now sync to your account.
          </p>
          {syncMessage ? <p className="text-emerald-300 text-xs mt-2">{syncMessage}</p> : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex gap-4"
        >
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
          >
            Home
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
