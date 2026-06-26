// app/time-machine/page.tsx - Time Machine: Long-range forecast page

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Loader2 } from 'lucide-react';
import { useTimeline } from '@/hooks/useTimeline';
import { TimeMachine } from '@/components/astrology/TimeMachine';
import { BirthChartCalculator, BirthChartData } from '@/components/astrology/BirthChartCalculator';

export default function TimeMachinePage() {
  const [chartData, setChartData] = useState<BirthChartData | null>(null);
  const [lookAheadMonths, setLookAheadMonths] = useState(12);
  const { timeline, loading: timelineLoading, error: timelineError, generateTimeline } = useTimeline();

  // Load birth chart from localStorage on mount
  useEffect(() => {
    const savedChart = typeof window !== 'undefined' ? localStorage.getItem('userBirthChart') : null;
    if (savedChart) {
      try {
        const chart = JSON.parse(savedChart);
        // Initialize with saved chart
        console.log('Loaded saved birth chart:', chart);
      } catch (e) {
        console.error('Failed to parse saved chart:', e);
      }
    }
  }, []);

  // Generate timeline when chart data changes
  useEffect(() => {
    if (chartData) {
      generateTimeline(chartData, lookAheadMonths);
    }
  }, [chartData, lookAheadMonths, generateTimeline]);

  const handleGenerateTimeline = (months: number) => {
    setLookAheadMonths(months);
    if (chartData) {
      generateTimeline(chartData, months);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900/20 to-slate-950 text-slate-100">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 border-b border-purple-500/20 bg-slate-950/60 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={28} className="text-purple-400" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-purple-500">
              Time Machine
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Explore your cosmic timeline and major life themes ahead
          </p>
        </div>
      </motion.header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Chart Calculator or Timeline Display */}
        {!chartData ? (
          // Birth Chart Input
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BirthChartCalculator onCalculate={(data) => setChartData(data)}>
              {({ chartData: _, loading, error, calculateChart: handleCalculate }: any) => (
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
                      {error instanceof Error ? error.message : String(error)}
                    </div>
                  )}
                  {loading && (
                    <div className="flex items-center justify-center gap-3 py-8">
                      <Loader2 size={24} className="animate-spin text-purple-400" />
                      <span className="text-slate-300">Calculating your chart...</span>
                    </div>
                  )}
                </div>
              )}
            </BirthChartCalculator>
          </motion.div>
        ) : (
          // Timeline Display
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Timeline Options */}
            <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-purple-300 mb-4">Forecast Duration</h2>
              <div className="flex gap-4 flex-wrap">
                {[12, 18, 24, 36].map(months => (
                  <button
                    key={months}
                    onClick={() => handleGenerateTimeline(months)}
                    disabled={timelineLoading}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      lookAheadMonths === months
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    } disabled:opacity-50`}
                  >
                    {months === 36 ? '3 Years' : `${months} Months`}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline or Loading/Error States */}
            {timelineLoading && (
              <div className="flex items-center justify-center gap-3 py-12">
                <Loader2 size={24} className="animate-spin text-purple-400" />
                <span className="text-slate-300">Generating your timeline...</span>
              </div>
            )}

            {timelineError && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
                {timelineError}
              </div>
            )}

            {timeline && !timelineLoading && (
              <TimeMachine
                timeline={timeline}
                onEventClick={(event: any) => {
                  console.log('Event clicked:', event);
                }}
              />
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
