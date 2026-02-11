'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BirthChart } from '@/components/astrology/BirthChart';
import { WheelVisualization } from '@/components/astrology/WheelVisualization';
import { ChartInterpretation } from '@/components/astrology/ChartInterpretation';
import { DailyForecast } from '@/components/astrology/DailyForecast';
import { ActiveTransits } from '@/components/astrology/ActiveTransits';
import { LifeArc } from '@/components/astrology/LifeArc';
import { useInterpretations } from '@/hooks/useInterpretations';
import { useForecast } from '@/hooks/useForecast';
import { useTransits } from '@/hooks/useTransits';
import { useLifeArc } from '@/hooks/useLifeArc';
import { BirthData, BirthChartData } from '@/components/astrology/BirthChartCalculator';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import { Sparkles, Moon, Zap, BookOpen } from 'lucide-react';
import type { ChartData } from '@/lib/astrology/newWheelTypes';

const STORAGE_KEY = 'merlin_chart_data';
const STORAGE_BIRTH_KEY = 'merlin_birth_data';

export default function UnifiedDashboard() {
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [chartData, setChartData] = useState<BirthChartData | null>(null);
  const [wheelData, setWheelData] = useState<ChartData | null>(null);
  const [activeSection, setActiveSection] = useState<'wheel' | 'interpretation' | 'forecast' | 'transits' | 'lifearc'>('wheel');
  
  const { interpretations, loading: interpretLoading, generateInterpretations } = useInterpretations();
  const { forecast, loading: forecastLoading, calculateForecast } = useForecast();
  const { transits, loading: transitsLoading, calculateTransits } = useTransits();
  const { lifeArc, loading: lifeArcLoading, calculateLifeArc } = useLifeArc();

  // Load persisted data on mount
  useEffect(() => {
    try {
      const savedChart = localStorage.getItem(STORAGE_KEY);
      const savedBirth = localStorage.getItem(STORAGE_BIRTH_KEY);
      
      if (savedChart && savedBirth) {
        const chart = JSON.parse(savedChart);
        const birth = JSON.parse(savedBirth);
        
        setChartData(chart);
        setBirthData(birth);
        
        // Transform for wheel
        const wheel: ChartData = {
          planets: chart.planets.map((p: any) => ({
            name: p.name,
            glyph: p.glyph || p.name?.[0] || '•',
            angle: p.longitude ?? p.position ?? 0,
            sign: p.sign || '',
            degree: p.degree ?? 0,
            element: p.element || 'Fire',
            color: p.color || 'hsl(45, 88%, 68%)',
            orbitalDistance: p.distance ?? 1,
          })),
          aspects: chart.aspects.map((a: any) => ({
            from: a.planet1?.name || a.planet1 || a.from || '',
            to: a.planet2?.name || a.planet2 || a.to || '',
            type: a.type || a.aspect || 'conjunction',
            angle: a.orb || a.angle || 0,
            color: a.color || 'hsl(45, 88%, 68%)',
            label: a.aspect || a.type || 'Aspect',
          })),
          houses: chart.houses.map((h: any) => h.longitude ?? h.position ?? 0),
          ascendant: (chart as any).ascendant?.longitude ?? (chart as any).ascendant ?? 0,
          midheaven: (chart as any).mc?.longitude ?? (chart as any).mc ?? (chart as any).midheaven ?? 0,
        };
        setWheelData(wheel);
        
        // Recalculate all derived data
        Promise.all([
          generateInterpretations(birth),
          calculateForecast(birth),
          calculateTransits(birth),
          calculateLifeArc(birth, chart)
        ]).catch((e) => console.error('Error regenerating dashboard data:', e));
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  }, []);

  const handleChartCalculated = useCallback((data: BirthChartData) => {
    // Derive birth data
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
    setChartData(data);

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(STORAGE_BIRTH_KEY, JSON.stringify(derived));
    } catch (error) {
      console.error('Error persisting data:', error);
    }

    // Transform for wheel
    const wheel: ChartData = {
      planets: data.planets.map((p: any) => ({
        name: p.name,
        glyph: p.glyph || p.name?.[0] || '•',
        angle: p.longitude ?? p.position ?? 0,
        sign: p.sign || '',
        degree: p.degree ?? 0,
        element: p.element || 'Fire',
        color: p.color || 'hsl(45, 88%, 68%)',
        orbitalDistance: p.distance ?? 1,
      })),
      aspects: data.aspects.map((a: any) => ({
        from: a.planet1?.name || a.planet1 || a.from || '',
        to: a.planet2?.name || a.planet2 || a.to || '',
        type: a.type || a.aspect || 'conjunction',
        angle: a.orb || a.angle || 0,
        color: a.color || 'hsl(45, 88%, 68%)',
        label: a.aspect || a.type || 'Aspect',
      })),
      houses: data.houses.map((h: any) => h.longitude ?? h.position ?? 0),
      ascendant: (data as any).ascendant?.longitude ?? (data as any).ascendant ?? 0,
      midheaven: (data as any).mc?.longitude ?? (data as any).mc ?? (data as any).midheaven ?? 0,
    };
    setWheelData(wheel);
    setActiveSection('wheel');

    // Fire off async jobs
    Promise.all([
      generateInterpretations(derived),
      calculateForecast(derived),
      calculateTransits(derived),
      calculateLifeArc(derived, data)
    ]).catch((e) => console.error('Error generating dashboard data:', e));
  }, [generateInterpretations, calculateForecast, calculateTransits, calculateLifeArc]);

  const handleReadAloud = () => {
    if (!forecast?.summary) return;
    
    const text = `${forecast.summary}. ${forecast.advice}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };

  const handleDailyWhisper = () => {
    setActiveSection('forecast');
  };

  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 py-12">
            {/* Header */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent mb-4">
                Your Cosmic Dashboard
              </h1>
              <p className="text-gray-300 text-lg">One place. Your whole story.</p>
            </motion.div>

            {/* Birth Chart Calculator */}
            {!chartData && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <BirthChart
                  onChartCalculated={handleChartCalculated}
                  initialData={birthData || undefined}
                  showControls={true}
                />
              </motion.div>
            )}

            {/* Main Dashboard Content */}
            {chartData && wheelData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-8"
              >
                {/* Wheel Section */}
                <div className="bg-slate-900/40 rounded-lg p-8 border border-amber-500/10 backdrop-blur-sm z-10 relative">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-amber-300">Your Birth Chart</h2>
                    <button
                      onClick={() => {
                        setChartData(null);
                        setWheelData(null);
                        setBirthData(null);
                        localStorage.removeItem(STORAGE_KEY);
                        localStorage.removeItem(STORAGE_BIRTH_KEY);
                      }}
                      className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                    >
                      Calculate New Chart
                    </button>
                  </div>
                  
                  <div className="w-full h-[600px] relative z-20">
                    <WheelVisualization chartData={wheelData} />
                  </div>

                  {/* Action Buttons Under Wheel */}
                  <div className="flex gap-4 mt-8 justify-center">
                    <button
                      onClick={handleReadAloud}
                      disabled={!forecast?.summary}
                      className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-200 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Read Aloud
                    </button>
                    <button
                      onClick={handleDailyWhisper}
                      disabled={!forecast?.summary}
                      className="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-200 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🌙 Daily Whisper
                    </button>
                  </div>
                </div>

                {/* Quick Access Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveSection('interpretation')}
                    className={`p-6 rounded-lg border-2 transition-all z-10 relative ${
                      activeSection === 'interpretation'
                        ? 'bg-blue-500/20 border-blue-400 shadow-lg shadow-blue-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-blue-400/50'
                    }`}
                  >
                    <Sparkles className="w-8 h-8 text-blue-400 mb-2 mx-auto" />
                    <h3 className="text-lg font-semibold text-blue-300">Interpretation</h3>
                    <p className="text-sm text-slate-400 mt-1">Deep chart reading</p>
                  </button>

                  <button
                    onClick={() => setActiveSection('forecast')}
                    className={`p-6 rounded-lg border-2 transition-all z-10 relative ${
                      activeSection === 'forecast'
                        ? 'bg-purple-500/20 border-purple-400 shadow-lg shadow-purple-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-purple-400/50'
                    }`}
                  >
                    <Moon className="w-8 h-8 text-purple-400 mb-2 mx-auto" />
                    <h3 className="text-lg font-semibold text-purple-300">Today's Forecast</h3>
                    <p className="text-sm text-slate-400 mt-1">Current energies</p>
                  </button>

                  <button
                    onClick={() => setActiveSection('transits')}
                    className={`p-6 rounded-lg border-2 transition-all z-10 relative ${
                      activeSection === 'transits'
                        ? 'bg-orange-500/20 border-orange-400 shadow-lg shadow-orange-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-orange-400/50'
                    }`}
                  >
                    <Zap className="w-8 h-8 text-orange-400 mb-2 mx-auto" />
                    <h3 className="text-lg font-semibold text-orange-300">Active Transits</h3>
                    <p className="text-sm text-slate-400 mt-1">Cosmic events now</p>
                  </button>

                  <button
                    onClick={() => setActiveSection('lifearc')}
                    className={`p-6 rounded-lg border-2 transition-all z-10 relative ${
                      activeSection === 'lifearc'
                        ? 'bg-green-500/20 border-green-400 shadow-lg shadow-green-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-green-400/50'
                    }`}
                  >
                    <BookOpen className="w-8 h-8 text-green-400 mb-2 mx-auto" />
                    <h3 className="text-lg font-semibold text-green-300">Life Arc</h3>
                    <p className="text-sm text-slate-400 mt-1">Your story timeline</p>
                  </button>
                </div>

                {/* Dynamic Content Section */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-slate-900/40 rounded-lg p-8 border border-amber-500/10 backdrop-blur-sm min-h-[400px]"
                  >
                    {activeSection === 'interpretation' && (
                      <ChartInterpretation
                        summary={interpretations?.chartSummary || ''}
                        planetInterpretations={interpretations?.planetInterpretations || []}
                        aspectInterpretations={interpretations?.aspectInterpretations || []}
                        loading={interpretLoading}
                      />
                    )}

                    {activeSection === 'forecast' && (
                      <DailyForecast
                        date={forecast?.date || new Date().toISOString()}
                        summary={forecast?.summary || 'Loading forecast...'}
                        planetaryHighlights={forecast?.planetaryHighlights || []}
                        moonPhase={forecast?.moonPhase || 'Unknown'}
                        advice={forecast?.advice || ''}
                        loading={forecastLoading}
                      />
                    )}

                    {activeSection === 'transits' && (
                      <ActiveTransits
                        significant={transits?.significant || []}
                        approaching={transits?.approaching || []}
                        summary={transits?.summary || { total: 0, exact: 0, approaching: 0 }}
                        loading={transitsLoading}
                      />
                    )}

                    {activeSection === 'lifearc' && (
                      <LifeArc
                        beats={lifeArc?.beats || []}
                        summary={lifeArc?.summary || 'Calculating your life arc...'}
                        currentPhase={lifeArc?.currentPhase || ''}
                        loading={lifeArcLoading}
                      />
                    )}

                    {activeSection === 'wheel' && (
                      <div className="text-center py-12">
                        <p className="text-slate-400 text-lg">
                          Select a section above to explore your cosmic insights
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
