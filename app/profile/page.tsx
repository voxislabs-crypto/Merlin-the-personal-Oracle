'use client';

import { UserButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Eye, Sparkles } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [clarityMode, setClarityMode] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('merlin_clarity_mode');
    if (saved !== null) setClarityMode(saved !== 'false');
  }, []);

  const toggleClarityMode = () => {
    const next = !clarityMode;
    setClarityMode(next);
    localStorage.setItem('merlin_clarity_mode', String(next));
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
        <div className="absolute top-20 right-20 w-1 h-1 bg-amber-300 rounded-full animate-ping"></div>
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
          <p className="text-gray-400 text-sm mb-6">Customize how Merlin communicates with you.</p>

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

          <p className="text-gray-600 text-xs mt-4">
            This setting applies to Oracle Chat across all pages and syncs automatically.
          </p>
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
            href="/settings"
            className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-semibold transition"
          >
            Settings
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
