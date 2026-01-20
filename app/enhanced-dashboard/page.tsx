'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BirthChart } from '@/components/astrology/BirthChart';
import { ChartInterpretation } from '@/components/astrology/ChartInterpretation';
import { DailyForecast } from '@/components/astrology/DailyForecast';
import { ActiveTransits } from '@/components/astrology/ActiveTransits';
import { useInterpretations } from '@/hooks/useInterpretations';
import { useForecast } from '@/hooks/useForecast';
import { useTransits } from '@/hooks/useTransits';
import { BirthData, BirthChartData } from '@/components/astrology/BirthChartCalculator';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';

type Tab = 'overview' | 'interpretation' | 'forecast' | 'transits';

export default function EnhancedAstroDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  
  const { interpretations, loading: interpretLoading, generateInterpretations } = useInterpretations();
  const { forecast, loading: forecastLoading, calculateForecast } = useForecast();
  const { transits, loading: transitsLoading, calculateTransits } = useTransits();

  const handleChartCalculated = useCallback((data: BirthChartData) => {
    // Try to derive input BirthData from the returned chart data when available
    const possible = (data as any).birthData || (data as any).metadata || {};
    const derived: BirthData = {
      date: (possible.birthDate as string) || (possible.date as string) || '',
      time: (possible.birthTime as string) || (possible.time as string) || '12:00',
      latitude: (possible.coordinates?.lat as number) || (possible.latitude as number) || 0,
      longitude: (possible.coordinates?.lon as number) || (possible.longitude as number) || 0,
      houseSystem: 'Placidus',
      zodiac: 'Tropical',
    };

    setBirthData(derived);
    setActiveTab('overview');

    // Fire off async jobs without making this callback async (matches prop signature)
    Promise.all([
      generateInterpretations(derived),
      calculateForecast(derived),
      calculateTransits(derived)
    ]).catch((e) => console.error('Error generating dashboard data:', e));
  }, [generateInterpretations, calculateForecast, calculateTransits]);

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-4 py-12">
            {/* Header */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent mb-4">
                Your Astrological Insight
              </h1>
              <p className="text-gray-300 text-lg">Discover the cosmic forces shaping your path</p>
            </motion.div>

        {/* Birth Chart Calculator */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <BirthChart
            onChartCalculated={handleChartCalculated}
            initialData={birthData || undefined}
          />
        </motion.div>

        {/* Content Tabs */}
        {birthData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-4 border-b border-amber-500/20">
              {[
                { id: 'overview', label: '📊 Overview', icon: '✨' },
                { id: 'interpretation', label: '🔮 Interpretation', icon: '📖' },
                { id: 'forecast', label: '🌙 Today\'s Forecast', icon: '☀️' },
                { id: 'transits', label: '⚡ Active Transits', icon: '🪐' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-400'
                      : 'bg-slate-800/50 text-gray-300 border border-slate-700/50 hover:border-amber-400/30'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              className="bg-slate-900/40 rounded-lg p-8 border border-amber-500/10 backdrop-blur-sm"
            >
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-amber-300 mb-4">Your Chart Summary</h2>
                    <p className="text-gray-300 leading-relaxed text-lg">
                      {interpretations?.chartSummary || 'Loading your cosmic blueprint...'}
                    </p>
                  </div>
                  {transits?.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gradient-to-br from-amber-900/40 to-amber-900/10 rounded-lg border border-amber-500/30">
                        <p className="text-amber-300 text-sm mb-2">Active Transits</p>
                        <p className="text-3xl font-bold text-amber-200">{transits.summary.total}</p>
                        <p className="text-amber-200/60 text-xs mt-1">{transits.summary.exact} exact right now</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-900/40 to-blue-900/10 rounded-lg border border-blue-500/30">
                        <p className="text-blue-300 text-sm mb-2">Moon Phase</p>
                        <p className="text-2xl mb-1">{forecast ? getMoonEmoji(forecast.moonPhase) : '🌙'}</p>
                        <p className="text-blue-200/60 text-xs">{forecast?.moonPhase}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-900/40 to-purple-900/10 rounded-lg border border-purple-500/30">
                        <p className="text-purple-300 text-sm mb-2">Planetary Highlights</p>
                        <p className="text-3xl font-bold text-purple-200">{forecast?.planetaryHighlights.length || 0}</p>
                        <p className="text-purple-200/60 text-xs mt-1">Notable positions</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'interpretation' && (
                <ChartInterpretation
                  summary={interpretations?.chartSummary || ''}
                  planetInterpretations={interpretations?.planetInterpretations || []}
                  aspectInterpretations={interpretations?.aspectInterpretations || []}
                  loading={interpretLoading}
                />
              )}

              {activeTab === 'forecast' && (
                <DailyForecast
                  date={forecast?.date || new Date().toISOString()}
                  summary={forecast?.summary || 'Loading forecast...'}
                  planetaryHighlights={forecast?.planetaryHighlights || []}
                  moonPhase={forecast?.moonPhase || 'Unknown'}
                  advice={forecast?.advice || ''}
                  loading={forecastLoading}
                />
              )}

              {activeTab === 'transits' && (
                <ActiveTransits
                  significant={transits?.significant || []}
                  approaching={transits?.approaching || []}
                  summary={transits?.summary || { total: 0, exact: 0, approaching: 0 }}
                  loading={transitsLoading}
                />
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          className="text-center mt-16 text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p>Enter your birth details above to unveil your cosmic blueprint</p>
        </motion.div>
      </div>
    </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function getMoonEmoji(phase: string): string {
  const phaseMap: Record<string, string> = {
    'New Moon': '🌑',
    'Waxing Crescent': '🌒',
    'First Quarter': '🌓',
    'Waxing Gibbous': '🌔',
    'Full Moon': '🌕',
    'Waning Gibbous': '🌖',
    'Last Quarter': '🌗',
    'Waning Crescent': '🌘'
  };
  return phaseMap[phase] || '🌙';
}
