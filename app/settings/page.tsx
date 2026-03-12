'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Eye, EyeOff, KeyRound, Save, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { LIVE_ORACLE_STORAGE_KEYS } from '@/lib/astrology/live-oracle-storage';

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [clarityMode, setClarityMode] = useState(true);
  const [grokApiKey, setGrokApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const hasEnvFallback = Boolean(process.env.NEXT_PUBLIC_XAI_API_KEY?.trim());

  useEffect(() => {
    const savedClarity = localStorage.getItem('merlin_clarity_mode');
    if (savedClarity !== null) {
      setClarityMode(savedClarity !== 'false');
    }

    const savedKey = localStorage.getItem(LIVE_ORACLE_STORAGE_KEYS.grokApiKey) || '';
    setGrokApiKey(savedKey);
    setHasStoredKey(Boolean(savedKey.trim()));
  }, []);

  const keyStatus = useMemo(() => {
    if (hasStoredKey) {
      return 'A Grok API key is saved on this device and will be used by Oracle features in this browser.';
    }

    if (hasEnvFallback) {
      return 'No device-specific key is saved. Merlin is currently falling back to the app-level public xAI key.';
    }

    return 'No Grok API key is currently available in this browser.';
  }, [hasEnvFallback, hasStoredKey]);

  const persistClarityMode = () => {
    const next = !clarityMode;
    setClarityMode(next);
    localStorage.setItem('merlin_clarity_mode', String(next));
    setStatusMessage('Oracle preference updated.');
  };

  const handleSaveKey = () => {
    const trimmedKey = grokApiKey.trim();
    if (!trimmedKey) {
      localStorage.removeItem(LIVE_ORACLE_STORAGE_KEYS.grokApiKey);
      setHasStoredKey(false);
      setStatusMessage('Saved Grok API key removed from this device.');
      return;
    }

    localStorage.setItem(LIVE_ORACLE_STORAGE_KEYS.grokApiKey, trimmedKey);
    setGrokApiKey(trimmedKey);
    setHasStoredKey(true);
    setStatusMessage('Grok API key saved on this device.');
  };

  const handleClearKey = () => {
    localStorage.removeItem(LIVE_ORACLE_STORAGE_KEYS.grokApiKey);
    setGrokApiKey('');
    setHasStoredKey(false);
    setStatusMessage('Saved Grok API key removed from this device.');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Please sign in to view settings</p>
          <Link href="/sign-in" className="text-amber-400 hover:text-amber-300 underline">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
        <div className="absolute top-24 right-24 w-1 h-1 bg-purple-300 rounded-full animate-ping" />
        <div className="absolute bottom-20 left-24 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-between items-center mb-12"
        >
          <div>
            <h1 className="text-4xl font-bold text-amber-400">Settings</h1>
            <p className="text-gray-400 mt-2">Manage local Oracle preferences and your Grok key.</p>
          </div>
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="bg-black/50 backdrop-blur-sm border border-amber-800 rounded-lg p-8 mb-8"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <KeyRound className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-amber-300">Grok API Key</h2>
              <p className="text-gray-400 text-sm mt-1">
                Save an xAI/Grok API key in this browser for Oracle chat and Grok-powered readings. This stays on this device.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-purple-500/20 bg-slate-950/60 p-4 mb-6">
            <p className="text-sm text-slate-200">{keyStatus}</p>
            <p className="text-xs text-slate-500 mt-2">
              For server-side use, you can still set XAI_API_KEY in your local environment. This screen manages the browser-stored key only.
            </p>
          </div>

          <label className="block text-sm text-gray-400 mb-2">Device-stored Grok API key</label>
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[260px] relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={grokApiKey}
                onChange={(event) => setGrokApiKey(event.target.value)}
                placeholder="xai-..."
                className="w-full rounded-lg border border-amber-500/20 bg-slate-950/80 px-4 py-3 pr-12 text-white outline-none focus:border-amber-400"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowApiKey((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
              >
                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleSaveKey}
              className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition inline-flex items-center gap-2"
            >
              <Save size={16} />
              Save Key
            </button>
            <button
              type="button"
              onClick={handleClearKey}
              className="px-5 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition inline-flex items-center gap-2"
            >
              <Trash2 size={16} />
              Clear Key
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="bg-black/50 backdrop-blur-sm border border-amber-800 rounded-lg p-8 mb-8"
        >
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[220px]">
              <h2 className="text-2xl font-bold text-amber-300 mb-2">Oracle Preference</h2>
              <p className="text-white font-semibold mb-1 flex items-center gap-2">
                {clarityMode ? <Eye size={16} className="text-emerald-400" /> : <Sparkles size={16} className="text-purple-400" />}
                {clarityMode ? 'Clarity Mode' : 'Oracle Full Mode'}
              </p>
              <p className="text-gray-400 text-sm">
                {clarityMode
                  ? 'Plain English responses with less astrology jargon.'
                  : 'Full astrological detail with richer symbolism and technical framing.'}
              </p>
            </div>
            <button
              type="button"
              onClick={persistClarityMode}
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16 }}
          className="bg-black/50 backdrop-blur-sm border border-amber-800 rounded-lg p-6 mb-8"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-white font-semibold">Storage scope</p>
              <p className="text-sm text-gray-400 mt-1">
                Keys saved here stay in this browser on this device. They are not synced to Clerk or uploaded by this settings page.
              </p>
            </div>
          </div>
        </motion.div>

        {statusMessage && (
          <div className="mb-8 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {statusMessage}
          </div>
        )}

        <div className="flex gap-4 flex-wrap">
          <Link href="/dashboard" className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition">
            Dashboard
          </Link>
          <Link href="/profile" className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-semibold transition">
            Profile
          </Link>
          <Link href="/oracle-chat" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition">
            Oracle Chat
          </Link>
        </div>
      </div>
    </div>
  );
}