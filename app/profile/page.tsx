'use client';

import { UserButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Eye, Sparkles, Scroll, MessageCircle } from "lucide-react";
import type { OracleTonePreset } from '@/lib/oracle-output';

type ReadingPreset = 'plain' | 'warm' | 'bullshit' | 'oracle';
type InterpretationMode = 'grok' | 'traditional';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [clarityMode, setClarityMode] = useState(true);
  const [noBullshitMode, setNoBullshitMode] = useState(false);
  const [questLogEnabled, setQuestLogEnabled] = useState(true);
  const [interpretationMode, setInterpretationMode] = useState<InterpretationMode>('grok');
  const [oracleTonePreset, setOracleTonePreset] = useState<OracleTonePreset>('warm');
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
