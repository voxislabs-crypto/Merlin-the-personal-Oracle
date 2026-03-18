'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BirthChart } from '@/components/astrology/BirthChart';
import { WheelVisualization } from '@/components/astrology/WheelVisualization';
import { ChartInterpretation } from '@/components/astrology/ChartInterpretation';
import { DailyForecast } from '@/components/astrology/DailyForecast';
import { ActiveTransits } from '@/components/astrology/ActiveTransits';
import { LifeTimelineView } from '@/components/astrology/LifeTimelineView';
import { PlacementsSidebar } from '@/components/astrology/PlacementsSidebar';
import { WeeklyCalendar } from '@/components/astrology/WeeklyCalendar';
import { StormsAndNavigations } from '@/components/astrology/StormsAndNavigations';
import { PersonalityReveal } from '@/components/astrology/PersonalityReveal';
import { DualPersonalityCards } from '@/components/astrology/DualPersonalityCards';
import { InterpretationModeToggle } from '@/components/astrology/InterpretationModeToggle';
import { GrokNarrative } from '@/components/astrology/GrokNarrative';
import { CollapsibleChatPanel } from '@/components/astrology/CollapsibleChatPanel';
import { MerlinAudioPlayer } from '@/components/astrology/MerlinAudioPlayer';
import QuestLog from '@/components/astrology/QuestLog';
import { DeepDivePanel } from '@/components/DeepDivePanel';
import { useInterpretations } from '@/hooks/useInterpretations';
import { useForecast } from '@/hooks/useForecast';
import { useTransits } from '@/hooks/useTransits';
import { useLifeArc } from '@/hooks/useLifeArc';
import { useWeeklyForecast } from '@/hooks/useWeeklyForecast';
import { useStorms } from '@/hooks/useStorms';
import { usePersonality } from '@/hooks/usePersonality';
import { BirthData, BirthChartData } from '@/components/astrology/BirthChartCalculator';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Moon, Zap, BookOpen, Brain, Scroll, Eye, EyeOff, CloudLightning } from 'lucide-react';
import type { ChartData } from '@/lib/astrology/newWheelTypes';

const STORAGE_KEY = 'merlin_chart_data';
const STORAGE_BIRTH_KEY = 'merlin_birth_data';

export default function UnifiedDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [chartData, setChartData] = useState<BirthChartData | null>(null);
  const [wheelData, setWheelData] = useState<ChartData | null>(null);
  const [activeSection, setActiveSection] = useState<'wheel' | 'interpretation' | 'forecast' | 'transits' | 'lifearc' | 'personality' | 'stormradar'>('wheel');
  // Life Arc mode removed - now just raw timeline
  const [lifeArcView, setLifeArcView] = useState<'timeline' | 'prose'>('timeline');
  const [interpretMode, setInterpretMode] = useState<'grok' | 'traditional'>('grok');
  const [noBullshit, setNoBullshit] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [userId, setUserId] = useState('');
  const [questLogEnabled, setQuestLogEnabled] = useState(true); // ON by default
  const [clarityMode, setClarityMode] = useState(true); // Plain English mode — ON by default
  
  // Call ALL hooks BEFORE any early returns - this is critical for React rules of hooks
  const { interpretations, loading: interpretLoading, cacheHit, generateInterpretations } = useInterpretations();
  const { forecast, loading: forecastLoading, calculateForecast } = useForecast();
  const { transits, loading: transitsLoading, calculateTransits } = useTransits();
  const { lifeArc, loading: lifeArcLoading, calculateLifeArc } = useLifeArc();
  const { weeklyForecast, loading: weeklyLoading, calculateWeeklyForecast } = useWeeklyForecast();
  const { stormsReport, loading: stormsLoading, calculateStorms } = useStorms();
  const { mbtiType, dualOverlay, loading: personalityLoading, calculatePersonality } = usePersonality();
  
  // Load interpretation mode from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem('merlin_interpretation_mode');
    if (saved === 'grok' || saved === 'traditional') {
      setInterpretMode(saved);
    }
    // Load clarity mode setting
    const savedClarity = localStorage.getItem('merlin_clarity_mode');
    if (savedClarity !== null) setClarityMode(savedClarity !== 'false');
  }, []);

  const toggleClarityMode = () => {
    const next = !clarityMode;
    setClarityMode(next);
    localStorage.setItem('merlin_clarity_mode', String(next));
  };
  
  // Re-generate interpretations when mode changes
  useEffect(() => {
    if (birthData && chartData) {
      generateInterpretations(birthData, interpretMode);
    }
  }, [interpretMode, birthData, chartData, generateInterpretations]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      toast({
        title: 'Sign-in required',
        description: 'Please sign in to open your dashboard.',
        variant: 'destructive',
      });
      router.replace('/sign-in');
    } else {
      // Set userId from Clerk user
      setUserId(user.id || `user-${Date.now()}`);
    }
  }, [isLoaded, user, router, toast]);

  // Load persisted data on mount
  useEffect(() => {
    try {
      const savedChart = localStorage.getItem(STORAGE_KEY);
      const savedBirth = localStorage.getItem(STORAGE_BIRTH_KEY);
      
      if (savedChart && savedBirth) {
        const chart = JSON.parse(savedChart);
        const birth = JSON.parse(savedBirth);
        
        // Auto-clear stale mock data (forces fresh Swiss calculation)
        const isMockData = (chart?.metadata?.calculationSource === 'mock-fallback' || 
                           chart?.metadata?.ephemeris === 'Mock');
        if (isMockData) {
          console.log('[Dashboard] Clearing stale mock data, forcing fresh calculation...');
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_BIRTH_KEY);
          return; // Skip loading cached data, let user recalculate
        }
        
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
          generateInterpretations(birth, interpretMode),
          calculateForecast(birth),
          calculateTransits(birth),
          calculateLifeArc(birth, chart),
          calculateWeeklyForecast(birth),
          calculatePersonality(birth).then(mbti => calculateStorms(birth, mbti ?? undefined)).catch(e => console.log('Personality unavailable:', e.message))
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
      generateInterpretations(derived, interpretMode),
      calculateForecast(derived),
      calculateTransits(derived),
      calculateLifeArc(derived, data),
      calculateWeeklyForecast(derived),
      calculatePersonality(derived).then(mbti => calculateStorms(derived, mbti ?? undefined)).catch(e => console.log('Personality unavailable:', e.message))
    ]).catch((e) => console.error('Error generating dashboard data:', e));
  }, [generateInterpretations, calculateForecast, calculateTransits, calculateLifeArc, calculateWeeklyForecast, calculatePersonality, calculateStorms, interpretMode]);

  // Build the read-aloud text (used by MerlinAudioPlayer) — must be before early returns
  const readAloudText = React.useMemo(() => {
    let t = '';
    if (interpretations?.chartSummary) t += interpretations.chartSummary + '\n\n';
    if (interpretations?.planetInterpretations?.length) {
      t += 'Planetary Placements:\n';
      interpretations.planetInterpretations.forEach(p => { t += `${p.planet}: ${p.interpretation}\n\n`; });
    }
    if (!t && forecast?.summary) t = forecast.summary;
    return t || 'No interpretation available yet.';
  }, [interpretations, forecast]);

  // Conditional render: Don't render until Clerk auth is loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse text-amber-400 text-2xl">✨</div>
          <div className="text-gray-400">Loading your cosmic dashboard...</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400 mx-auto" />
          <p className="text-slate-300">Redirecting to sign-in...</p>
        </div>
      </div>
    );
  }

  const calcSource =
    ((chartData as any)?.metadata?.ephemeris as string | undefined) ||
    (((chartData as any)?.metadata?.calculationSource as string | undefined) === 'swiss-real' ? 'Swiss real' : undefined) ||
    (((chartData as any)?.metadata?.calculationSource as string | undefined) === 'mock-fallback' ? 'Mock' : undefined);
  const moonSign = chartData?.planets?.find((p: any) => p.name === 'Moon')?.sign;

  const lifeArcNarrative = lifeArc?.events?.length
    ? `From age ${lifeArc.events[0].age}, your path is marked by ${lifeArc.events
        .slice(0, 3)
        .map((e) => `${e.transitingPlanet} ${e.aspect} ${e.natalPlanet}`)
        .join(', ')}. The pattern here is pressure turning into purpose.`
    : 'Your Life Arc narrative will appear once timeline events are calculated.';

  type WhisperMode = 'plain' | 'warm' | 'bullshit' | 'oracle';

  const activateWhisperMode = (mode: WhisperMode) => {
    setActiveSection('interpretation');

    if (mode === 'plain') {
      setInterpretMode('traditional');
      setNoBullshit(false);
      if (!clarityMode) toggleClarityMode();
      return;
    }

    if (mode === 'warm') {
      setInterpretMode('grok');
      setNoBullshit(false);
      if (!clarityMode) toggleClarityMode();
      return;
    }

    if (mode === 'bullshit') {
      setInterpretMode('grok');
      setNoBullshit(true);
      if (!clarityMode) toggleClarityMode();
      return;
    }

    setInterpretMode('grok');
    setNoBullshit(false);
    if (clarityMode) toggleClarityMode();
  };

  const handleDailyWhisper = () => {
    activateWhisperMode('warm');
  };

  return (
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
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className={`px-3 py-1 text-xs rounded border font-medium ${calcSource === 'Swiss real' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : calcSource ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-slate-500 bg-slate-500/10 text-slate-300'}`}>
                  {calcSource ? calcSource : '⚙️ Calculating...'}
                </span>
                {moonSign && (moonSign === 'Sagittarius' || moonSign === 'Capricorn') && (
                  <span className="px-2 py-1 text-xs rounded border border-red-500/40 text-red-300">
                    Moon sanity check
                  </span>
                )}
              </div>
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
                {/* TOP: Wheel with Left Sidebar */}
                <motion.div
                  className="bg-slate-900/40 rounded-lg p-8 border border-amber-500/10 backdrop-blur-sm z-10 relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex justify-between items-center mb-8">
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
                  
                  {/* Grid Layout: Left Sidebar + Wheel + Right Chat */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Placements Sidebar */}
                    <div className="lg:col-span-2">
                      <PlacementsSidebar planets={chartData?.planets || []} />
                    </div>
                    
                    {/* Center: Wheel */}
                    <div className="lg:col-span-5 flex items-center justify-center overflow-hidden">
                      <div className="w-full max-w-[450px] h-[450px] flex items-center justify-center">
                        <WheelVisualization chartData={wheelData} />
                      </div>
                    </div>

                    {/* Right: Chat Panel - Expandable/Collapsible */}
                    <div style={{ gridColumn: chatExpanded ? 'span 5' : 'span 1' }} className="transition-all duration-300">
                      <div className="h-[450px] rounded-lg overflow-hidden">
                        {userId && (
                          <CollapsibleChatPanel
                            birthChart={chartData}
                            userId={userId}
                            isExpanded={chatExpanded}
                            onToggleExpand={setChatExpanded}
                            mbtiType={mbtiType || undefined}
                            clarityMode={clarityMode}
                            onClarityChange={toggleClarityMode}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Under Wheel */}
                  <div className="flex gap-4 mt-8 justify-center flex-wrap items-center">
                    {/* ElevenLabs Audio Mini-Player */}
                    <MerlinAudioPlayer
                      text={readAloudText}
                      label="Hear Merlin"
                    />
                    <button
                      onClick={handleDailyWhisper}
                      className="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-200 font-semibold transition-all"
                    >
                      🌙 Daily Whisper
                    </button>

                    <button
                      onClick={() => activateWhisperMode('plain')}
                      className="px-4 py-2 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-200 font-semibold transition-all"
                    >
                      Plain
                    </button>
                    <button
                      onClick={() => activateWhisperMode('warm')}
                      className="px-4 py-2 text-xs bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 rounded-lg text-sky-200 font-semibold transition-all"
                    >
                      Warm
                    </button>
                    <button
                      onClick={() => activateWhisperMode('bullshit')}
                      className="px-4 py-2 text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-200 font-semibold transition-all"
                    >
                      No-BS
                    </button>
                    <button
                      onClick={() => activateWhisperMode('oracle')}
                      className="px-4 py-2 text-xs bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 rounded-lg text-violet-200 font-semibold transition-all"
                    >
                      Oracle
                    </button>

                    {/* Clarity Mode Toggle — Plain English vs Oracle Full */}
                    <button
                      onClick={toggleClarityMode}
                      title={clarityMode ? 'Clarity Mode ON: plain English (click for Oracle Full)' : 'Oracle Full Mode: astrology jargon ON (click for plain English)'}
                      className={`px-6 py-3 border rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        clarityMode
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/30'
                          : 'bg-purple-500/20 border-purple-500/30 text-purple-200 hover:bg-purple-500/30'
                      }`}
                    >
                      {clarityMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span className="text-xs">
                        {clarityMode ? 'Plain English' : 'Oracle Full'}
                      </span>
                    </button>
                    
                    {/* No-Bullshit Mode Toggle */}
                    <button
                      onClick={() => setNoBullshit(!noBullshit)}
                      className={`px-6 py-3 border rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        noBullshit
                          ? 'bg-red-500/20 border-red-500/30 text-red-200 hover:bg-red-500/30'
                          : 'bg-slate-700/20 border-slate-600/30 text-slate-300 hover:bg-slate-600/30'
                      }`}
                    >
                      <span className="text-xs">
                        {noBullshit ? '🔥 No-BS Mode' : '✨ Warm Mode'}
                      </span>
                    </button>

                    {/* Quest Log Toggle */}
                    <button
                      onClick={() => setQuestLogEnabled(prev => !prev)}
                      className={`px-6 py-3 border rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        questLogEnabled
                          ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200 hover:bg-yellow-500/30'
                          : 'bg-slate-700/20 border-slate-600/30 text-slate-300 hover:bg-slate-600/30'
                      }`}
                    >
                      <Scroll className="w-3.5 h-3.5" />
                      <span className="text-xs">
                        {questLogEnabled ? 'Quests: On' : 'Quests: Off'}
                      </span>
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <DeepDivePanel birthData={chartData} />
                </motion.div>

                {/* Weekly Calendar - Below Birth Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8"
                >
                  <div className="bg-slate-900/40 rounded-lg p-8 border border-amber-500/20 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-amber-300 mb-6">7-Day Cosmic Forecast</h2>
                    <WeeklyCalendar
                      week={weeklyForecast?.week || []}
                      loading={weeklyLoading}
                    />
                  </div>
                  {/* Quest Log — only renders when enabled */}
                  <QuestLog
                    enabled={questLogEnabled}
                    chartData={chartData}
                    transits={transits}
                    forecast={forecast}
                    mbtiType={mbtiType || undefined}
                    userId={userId || undefined}
                  />
                </motion.div>

                {/* MIDDLE: Dual MBTI Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {mbtiType && (
                    <DualPersonalityCards mbtiType={mbtiType} dualOverlay={dualOverlay} transits={transits} loading={personalityLoading} />
                  )}
                </motion.div>

                {/* BOTTOM: Today's Forecast + Tabbed Analysis */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-8 mt-12"
                >
                  {/* Today's Forecast - Full Width with Active Indicator */}
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75 }}
                  >
                    {/* Section Label with ACTIVE indicator */}
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        Daily Transit Forecast
                      </h2>
                      <motion.div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-2 border-green-400/60"
                        animate={{
                          borderColor: ['rgba(74, 222, 128, 0.6)', 'rgba(74, 222, 128, 1)', 'rgba(74, 222, 128, 0.6)'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <motion.div
                          className="w-3 h-3 rounded-full bg-green-400"
                          animate={{
                            scale: [1, 1.4, 1],
                            boxShadow: [
                              '0 0 0px rgba(74, 222, 128, 0)',
                              '0 0 15px rgba(74, 222, 128, 1)',
                              '0 0 0px rgba(74, 222, 128, 0)'
                            ]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <span className="text-sm font-bold text-green-300 uppercase tracking-wider">
                          ACTIVE NOW
                        </span>
                      </motion.div>
                    </div>
                    
                    <div className="bg-slate-900/40 rounded-lg p-8 border border-purple-500/20 backdrop-blur-sm">
                      <DailyForecast
                        date={forecast?.date || new Date().toISOString()}
                        summary={forecast?.summary || 'Loading forecast...'}
                        planetaryHighlights={forecast?.planetaryHighlights || []}
                        moonPhase={forecast?.moonPhase || 'Unknown'}
                        moonSign={forecast?.moonSign}
                        sunSign={forecast?.sunSign}
                        transits={forecast?.transits || []}
                        day_rating={forecast?.day_rating}
                        focusAreas={forecast?.focusAreas}
                        advice={forecast?.advice || ''}
                        loading={forecastLoading}
                        userId={userId || undefined}
                      />
                    </div>
                  </motion.div>

                  {/* Analysis Tabs */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="space-y-4"
                  >
                    {/* Tab Buttons - Horizontal */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setActiveSection(activeSection === 'interpretation' ? 'wheel' : 'interpretation')}
                        className={`px-6 py-3 rounded-lg border transition-all font-semibold flex items-center gap-2 ${
                          activeSection === 'interpretation'
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                            : 'bg-slate-700/20 border-slate-600/30 text-slate-300 hover:bg-slate-600/30'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        Chart Reading
                        {activeSection === 'interpretation' && <span className="text-xs ml-2">↓</span>}
                      </button>

                      <button
                        onClick={() => setActiveSection(activeSection === 'transits' ? 'wheel' : 'transits')}
                        className={`px-6 py-3 rounded-lg border transition-all font-semibold flex items-center gap-2 ${
                          activeSection === 'transits'
                            ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                            : 'bg-slate-700/20 border-slate-600/30 text-slate-300 hover:bg-slate-600/30'
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                        Active Transits
                        {activeSection === 'transits' && <span className="text-xs ml-2">↓</span>}
                      </button>

                      <button
                        onClick={() => setActiveSection(activeSection === 'lifearc' ? 'wheel' : 'lifearc')}
                        className={`px-6 py-3 rounded-lg border transition-all font-semibold flex items-center gap-2 ${
                          activeSection === 'lifearc'
                            ? 'bg-green-500/20 border-green-500/50 text-green-300'
                            : 'bg-slate-700/20 border-slate-600/30 text-slate-300 hover:bg-slate-600/30'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        Life Timeline
                        {activeSection === 'lifearc' && <span className="text-xs ml-2">↓</span>}
                      </button>

                      {/* Dual MBTI tab — shows when personality data is available */}
                      <button
                        onClick={() => setActiveSection(activeSection === 'personality' ? 'wheel' : 'personality')}
                        className={`px-6 py-3 rounded-lg border transition-all font-semibold flex items-center gap-2 ${
                          activeSection === 'personality'
                            ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                            : 'bg-slate-700/20 border-slate-600/30 text-slate-300 hover:bg-slate-600/30'
                        }`}
                      >
                        <Brain className="w-4 h-4" />
                        Dual MBTI
                        {mbtiType && <span className="text-xs bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full ml-1">{mbtiType}</span>}
                        {activeSection === 'personality' && <span className="text-xs ml-2">↓</span>}
                      </button>

                      <button
                        onClick={() => setActiveSection(activeSection === 'stormradar' ? 'wheel' : 'stormradar')}
                        className={`px-6 py-3 rounded-lg border transition-all font-semibold flex items-center gap-2 ${
                          activeSection === 'stormradar'
                            ? 'bg-red-500/20 border-red-500/50 text-red-300'
                            : 'bg-slate-700/20 border-slate-600/30 text-slate-300 hover:bg-slate-600/30'
                        }`}
                      >
                        <CloudLightning className="w-4 h-4" />
                        Storm Radar
                        {activeSection === 'stormradar' && <span className="text-xs ml-2">↓</span>}
                      </button>
                    </div>

                    {/* Content Panel - Drops Down Below Buttons */}
                    {['interpretation', 'transits', 'lifearc', 'personality', 'stormradar'].includes(activeSection) && (
                      <motion.div
                        className="bg-slate-900/50 rounded-lg border border-slate-700/50 backdrop-blur-sm p-8"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Chart Interpretation */}
                        {activeSection === 'interpretation' && (
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-6">
                                {cacheHit && (
                                  <span className="text-xs text-amber-400 flex items-center gap-1">
                                    ⚡ cached
                                  </span>
                                )}
                                <InterpretationModeToggle
                                  onModeChange={(mode) => setInterpretMode(mode)}
                                  defaultMode={interpretMode}
                                />
                              </div>
                              <ChartInterpretation
                                summary={interpretations?.chartSummary || ''}
                                planetInterpretations={interpretations?.planetInterpretations || []}
                                aspectInterpretations={interpretations?.aspectInterpretations || []}
                                interpreter={interpretations?.interpreter}
                                loading={interpretLoading}
                                userId={userId || undefined}
                              />
                            </div>
                            
                            {/* Grok Narrative below Chart Interpretation */}
                            <div className="border-t border-slate-700 pt-6">
                              <GrokNarrative
                                mode={interpretMode === 'grok' ? 'grok' : 'traditional'}
                                birthData={birthData}
                                chartData={chartData}
                                lifeArc={lifeArc}
                                transits={transits}
                                tone={noBullshit ? 'direct' : 'warm'}
                              />
                            </div>
                          </div>
                        )}

                        {/* Active Transits */}
                        {activeSection === 'transits' && (
                          <ActiveTransits
                            significant={transits?.significant || []}
                            approaching={transits?.approaching || []}
                            summary={transits?.summary || { total: 0, exact: 0, approaching: 0 }}
                            loading={transitsLoading}
                            userId={userId || undefined}
                          />
                        )}

                        {/* Life Arc */}
                        {activeSection === 'lifearc' && (

                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setLifeArcView('timeline')}
                                className={`px-3 py-1 rounded text-xs border transition-all ${lifeArcView === 'timeline' ? 'border-green-500/50 text-green-200 bg-green-500/10' : 'border-slate-700 text-slate-300'}`}
                              >
                                Timeline
                              </button>
                              <button
                                onClick={() => setLifeArcView('prose')}
                                className={`px-3 py-1 rounded text-xs border transition-all ${lifeArcView === 'prose' ? 'border-green-500/50 text-green-200 bg-green-500/10' : 'border-slate-700 text-slate-300'}`}
                              >
                                Prose
                              </button>
                            </div>

                            {lifeArcView === 'timeline' ? (
                              <LifeTimelineView
                                timeline={lifeArc}
                                loading={lifeArcLoading}
                                userName={user?.firstName || undefined}
                                defaultTimeFilter="current"
                              />
                            ) : (
                              <div className="text-sm text-slate-100 leading-relaxed">
                                {lifeArcNarrative}
                              </div>
                            )}
                          </div>
                        )}
                        {/* Dual MBTI Personality Cards */}
                        {activeSection === 'personality' && (
                          <div className="space-y-4">
                            <p className="text-slate-400 text-sm">
                              Your natal chart encodes two layers of personality — the <span className="text-orange-300 font-semibold">Mask</span> the world sees (Sun/Ascendant) and the <span className="text-purple-300 font-semibold">Core</span> that drives you beneath (Moon/Mercury).
                            </p>
                            <DualPersonalityCards
                              mbtiType={mbtiType}
                              dualOverlay={dualOverlay}
                              transits={transits}
                              loading={personalityLoading}
                            />
                          </div>
                        )}

                        {activeSection === 'stormradar' && (
                          <div className="space-y-4">
                            <p className="text-slate-400 text-sm">
                              Forward-looking transit warnings with MBTI-personalized reaction and recovery guidance.
                            </p>
                            <StormsAndNavigations
                              report={stormsReport}
                              loading={stormsLoading}
                              mbtiType={mbtiType ?? undefined}
                            />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
  );
}
