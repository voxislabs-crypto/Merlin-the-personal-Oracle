'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BirthChart } from '@/components/astrology/BirthChart';
import { WheelVisualization } from '@/components/astrology/WheelVisualization';
import { ChartInterpretation } from '@/components/astrology/ChartInterpretation';
import { DailyForecast } from '@/components/astrology/DailyForecast';
import { ActiveTransits } from '@/components/astrology/ActiveTransits';
import { LifeTimelineView } from '@/components/astrology/LifeTimelineView';
import { PlacementsSidebar } from '@/components/astrology/PlacementsSidebar';
import { WeeklyCalendar } from '@/components/astrology/WeeklyCalendar';
import { StormsAndNavigations } from '@/components/astrology/StormsAndNavigations';
import { DualPersonalityCards } from '@/components/astrology/DualPersonalityCards';
import { InterpretationModeToggle } from '@/components/astrology/InterpretationModeToggle';
import { GrokNarrative } from '@/components/astrology/GrokNarrative';
import { CollapsibleChatPanel } from '@/components/astrology/CollapsibleChatPanel';
import { MerlinAudioPlayer } from '@/components/astrology/MerlinAudioPlayer';
import { IdentityPatternCard } from '@/components/astrology/IdentityPatternCard';
import { ProgressPathCard } from '@/components/astrology/ProgressPathCard';
import { DailyOraclePulse } from '@/components/astrology/DailyOraclePulse';
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
import { Sparkles, Zap, BookOpen, Brain, Scroll, Eye, EyeOff, CloudLightning } from 'lucide-react';
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
  const focusPanelRef = useRef<HTMLDivElement | null>(null);
  const chartSectionRef = useRef<HTMLDivElement | null>(null);
  const weeklySectionRef = useRef<HTMLDivElement | null>(null);
  const personalitySectionRef = useRef<HTMLDivElement | null>(null);
  const forecastSectionRef = useRef<HTMLDivElement | null>(null);
  const [compactMode, setCompactMode] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [showWeeklyForecastPanel, setShowWeeklyForecastPanel] = useState(false);
  const [showPersonalityCardsPanel, setShowPersonalityCardsPanel] = useState(false);
  const [identityPack, setIdentityPack] = useState<{ archetypeName?: string; patternSignature?: string; coreContradiction?: string } | null>(null);
  const [progression, setProgression] = useState<{ arcPath?: string; arcLevel?: number; arcXp?: number; interactionCount?: number } | null>(null);
  const [dailyOracle, setDailyOracle] = useState<{ message?: string; dayRating?: string } | null>(null);
  const [dailyOracleLoading, setDailyOracleLoading] = useState(false);
  
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const section = new URLSearchParams(window.location.search).get('section');
    const validSections = new Set(['interpretation', 'transits', 'lifearc', 'personality', 'stormradar', 'wheel']);

    if (section && validSections.has(section)) {
      setActiveSection(section as typeof activeSection);
    }
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

  const refreshTransitsWithContext = useCallback(() => {
    if (!birthData) return;
    calculateTransits(birthData, { mbtiType: mbtiType || undefined, userId: userId || undefined });
  }, [birthData, calculateTransits, mbtiType, userId]);

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

  useEffect(() => {
    const loadIdentityFromContext = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`/api/user-context?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) return;
        const result = await res.json();
        if (!result?.success || !result?.data) return;
        if (result.data.archetypeName || result.data.patternSignature || result.data.coreContradiction) {
          setIdentityPack({
            archetypeName: result.data.archetypeName,
            patternSignature: result.data.patternSignature,
            coreContradiction: result.data.coreContradiction,
          });
        }
        if (result.data.arcPath || result.data.arcLevel || result.data.arcXp) {
          setProgression({
            arcPath: result.data.arcPath,
            arcLevel: result.data.arcLevel,
            arcXp: result.data.arcXp,
            interactionCount: result.data.interactionCount,
          });
        }
      } catch {
        // Best effort only.
      }
    };

    loadIdentityFromContext();
  }, [userId]);

  useEffect(() => {
    const ensureIdentityPack = async () => {
      if (!userId || !chartData) return;
      try {
        const response = await fetch('/api/identity-pack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, birthChart: chartData, mbtiType: mbtiType || undefined }),
        });
        if (!response.ok) return;
        const result = await response.json();
        if (result?.success && result?.data) {
          setIdentityPack(result.data);
        }
      } catch {
        // Identity pack generation should never block dashboard render.
      }
    };

    ensureIdentityPack();
  }, [userId, chartData, mbtiType]);

  const fetchDailyOracle = useCallback(async (truthBomb = false) => {
    if (!chartData) return;
    setDailyOracleLoading(true);
    try {
      const response = await fetch('/api/daily-oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          birthChart: chartData,
          truthBomb,
        }),
      });
      if (!response.ok) return;
      const result = await response.json();
      if (result?.success && result?.data) {
        setDailyOracle({ message: result.data.message, dayRating: result.data.dayRating });
      }
    } catch {
      // Daily oracle is a non-blocking enhancement.
    } finally {
      setDailyOracleLoading(false);
    }
  }, [chartData, userId]);

  useEffect(() => {
    if (!chartData) return;
    fetchDailyOracle(false);
  }, [chartData, fetchDailyOracle]);

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
          calculateTransits(birth, { mbtiType: mbtiType || undefined }),
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
      calculateTransits(derived, { mbtiType: mbtiType || undefined }),
      calculateLifeArc(derived, data),
      calculateWeeklyForecast(derived),
      calculatePersonality(derived).then(mbti => calculateStorms(derived, mbti ?? undefined)).catch(e => console.log('Personality unavailable:', e.message))
    ]).catch((e) => console.error('Error generating dashboard data:', e));
  }, [
    generateInterpretations,
    calculateForecast,
    calculateTransits,
    calculateLifeArc,
    calculateWeeklyForecast,
    calculatePersonality,
    calculateStorms,
    interpretMode,
    mbtiType,
  ]);

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

  const predictiveTopEvent = transits?.predictive?.events?.[0];
  const predictiveActionHint = predictiveTopEvent
    ? (() => {
        const hardAspect =
          predictiveTopEvent.transit.aspect === 'Square' ||
          predictiveTopEvent.transit.aspect === 'Opposition';
        const hasLunarCaution = predictiveTopEvent.explanation?.lunarSignals?.some((signal) =>
          signal.toLowerCase().includes('void-of-course')
        );

        if (hasLunarCaution || (hardAspect && predictiveTopEvent.scores.volatility >= 0.65)) {
          return {
            label: 'Delay now',
            reason: hasLunarCaution ? 'Moon timing caution in effect' : 'Volatility high on top signal',
            className: 'text-amber-200 border-amber-500/40 bg-amber-500/10',
          };
        }

        return {
          label: 'Do now',
          reason: 'Top signal is actionable',
          className: 'text-emerald-200 border-emerald-500/40 bg-emerald-500/10',
        };
      })()
    : null;

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

  const openSection = (section: 'interpretation' | 'transits' | 'lifearc' | 'personality' | 'stormradar') => {
    setActiveSection((prev) => (prev === section ? 'wheel' : section));
    setTimeout(() => {
      focusPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const scrollToBlock = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

            {identityPack && (identityPack.archetypeName || identityPack.patternSignature || identityPack.coreContradiction) && (
              <motion.div
                className="mb-8 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <IdentityPatternCard
                  archetypeName={identityPack.archetypeName}
                  patternSignature={identityPack.patternSignature}
                  coreContradiction={identityPack.coreContradiction}
                />
              </motion.div>
            )}

            {progression && (progression.arcPath || progression.arcLevel || progression.arcXp) && (
              <motion.div
                className="mb-8 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ProgressPathCard
                  arcPath={progression.arcPath}
                  arcLevel={progression.arcLevel}
                  arcXp={progression.arcXp}
                  interactionCount={progression.interactionCount}
                />
              </motion.div>
            )}

            <motion.div
              className="mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <DailyOraclePulse
                message={dailyOracle?.message}
                dayRating={dailyOracle?.dayRating}
                loading={dailyOracleLoading}
                onTruthBomb={() => fetchDailyOracle(true)}
              />
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

            {chartData && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="sticky top-4 z-40 mb-6"
              >
                <div className="bg-slate-950/85 backdrop-blur border border-amber-500/20 rounded-xl px-3 py-3 shadow-xl">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-xs uppercase tracking-wider text-amber-300">Quick Jump</p>
                    <button
                      onClick={() => setCompactMode((prev) => !prev)}
                      title="Toggle compact mode to hide secondary sections"
                      className={`px-2.5 py-1 text-xs rounded border transition ${
                        compactMode
                          ? 'border-emerald-500/50 text-emerald-200 bg-emerald-500/10'
                          : 'border-slate-600 text-slate-300 bg-slate-800/60'
                      }`}
                    >
                      {compactMode ? 'Compact: On' : 'Compact: Off'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openSection('interpretation')}
                      title="Open your chart interpretation and narrative reading"
                      className="px-3 py-1.5 text-xs rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 transition"
                    >
                      Chart Reading
                    </button>
                    <button
                      onClick={() => openSection('transits')}
                      title="Open real-time active and approaching transits"
                      className="px-3 py-1.5 text-xs rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20 transition"
                    >
                      Active Transits
                    </button>
                    <button
                      onClick={() => openSection('lifearc')}
                      title="Open your long-term life timeline"
                      className="px-3 py-1.5 text-xs rounded-lg border border-green-500/40 bg-green-500/10 text-green-200 hover:bg-green-500/20 transition"
                    >
                      Life Timeline
                    </button>
                    <button
                      onClick={() => openSection('personality')}
                      title="Open dual MBTI mask/core personality view"
                      className="px-3 py-1.5 text-xs rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 transition"
                    >
                      Dual MBTI {mbtiType ? `(${mbtiType})` : ''}
                    </button>
                    <button
                      onClick={() => openSection('stormradar')}
                      title="Open storm radar with weekly pressure and recovery guidance"
                      className="px-3 py-1.5 text-xs rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 transition"
                    >
                      Storm Radar
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Tip: Compact mode hides secondary panels so you can focus on one section at a time.
                  </p>
                </div>
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
                <div className="hidden xl:block fixed left-5 top-40 z-30">
                  <div className="bg-slate-950/80 border border-slate-700/70 rounded-xl p-2.5 backdrop-blur shadow-lg space-y-2 w-44">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 px-1">Navigator</p>
                    <button onClick={() => scrollToBlock(chartSectionRef)} className="w-full text-left px-2 py-1.5 text-xs rounded bg-slate-800/70 text-slate-200 hover:bg-slate-700 transition" title="Go to chart + chat">
                      Chart + Chat
                    </button>
                    <button onClick={() => scrollToBlock(forecastSectionRef)} className="w-full text-left px-2 py-1.5 text-xs rounded bg-slate-800/70 text-slate-200 hover:bg-slate-700 transition" title="Go to daily forecast">
                      Daily Forecast
                    </button>
                    <button onClick={() => scrollToBlock(focusPanelRef)} className="w-full text-left px-2 py-1.5 text-xs rounded bg-slate-800/70 text-slate-200 hover:bg-slate-700 transition" title="Go to analysis panels">
                      Analysis Panels
                    </button>
                    <button onClick={() => scrollToBlock(weeklySectionRef)} className="w-full text-left px-2 py-1.5 text-xs rounded bg-slate-800/70 text-slate-200 hover:bg-slate-700 transition" title="Go to weekly forecast">
                      Weekly Forecast
                    </button>
                    <button onClick={() => scrollToBlock(personalitySectionRef)} className="w-full text-left px-2 py-1.5 text-xs rounded bg-slate-800/70 text-slate-200 hover:bg-slate-700 transition" title="Go to dual MBTI cards">
                      Dual MBTI Cards
                    </button>
                  </div>
                </div>

                {/* TOP: Wheel with Left Sidebar */}
                <motion.div
                  ref={chartSectionRef}
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
                      title="Generate a concise daily guidance summary"
                      className="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-200 font-semibold transition-all"
                    >
                      🌙 Daily Whisper
                    </button>

                    <button
                      onClick={() => activateWhisperMode('plain')}
                      title="Switch interpretation to plain, no-jargon language"
                      className="px-4 py-2 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-200 font-semibold transition-all"
                    >
                      Plain
                    </button>
                    <button
                      onClick={() => activateWhisperMode('warm')}
                      title="Switch interpretation to supportive and warm tone"
                      className="px-4 py-2 text-xs bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 rounded-lg text-sky-200 font-semibold transition-all"
                    >
                      Warm
                    </button>
                    <button
                      onClick={() => activateWhisperMode('bullshit')}
                      title="Switch interpretation to direct no-BS mode"
                      className="px-4 py-2 text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-200 font-semibold transition-all"
                    >
                      No-BS
                    </button>
                    <button
                      onClick={() => activateWhisperMode('oracle')}
                      title="Switch interpretation to full Oracle mode"
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

                {/* Focus Views: moved near top for faster navigation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.42 }}
                  className="bg-slate-900/40 rounded-lg p-6 border border-amber-500/20 backdrop-blur-sm"
                >
                  <h3 className="text-xl font-bold text-amber-300 mb-4">Focus Views</h3>
                  <p className="text-sm text-slate-300 mb-4">Open a dedicated view for each module.</p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/dashboard/chart-reading" className="px-4 py-2 rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 transition">
                      Chart Reading
                    </Link>
                    <Link href="/dashboard/active-transits" className="px-4 py-2 rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20 transition">
                      Active Transits
                    </Link>
                    <Link href="/dashboard/life-timeline" className="px-4 py-2 rounded-lg border border-green-500/40 bg-green-500/10 text-green-200 hover:bg-green-500/20 transition">
                      Life Timeline
                    </Link>
                    <Link href="/dashboard/dual-mbti" className="px-4 py-2 rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 transition">
                      Dual MBTI {mbtiType ? `(${mbtiType})` : ''}
                    </Link>
                    <Link href="/dashboard/storm-radar" className="px-4 py-2 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 transition">
                      Storm Radar
                    </Link>
                  </div>
                </motion.div>

                {!compactMode && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="bg-slate-900/35 border border-slate-700/50 rounded-lg"
                  >
                    <button
                      onClick={() => setShowDeepDive((prev) => !prev)}
                      className="w-full flex items-center justify-between px-5 py-3 text-left"
                      title="Expand or collapse deep interpretation panel"
                    >
                      <span className="text-sm font-semibold text-slate-200">Deep Dive Panel</span>
                      <span className="text-xs text-slate-400">{showDeepDive ? 'Hide' : 'Show'}</span>
                    </button>
                    {showDeepDive && <DeepDivePanel birthData={chartData} />}
                  </motion.div>
                )}

                {/* Weekly Calendar - Below Birth Chart */}
                {!compactMode && (
                  <motion.div
                    ref={weeklySectionRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 bg-slate-900/35 border border-slate-700/50 rounded-lg"
                  >
                    <button
                      onClick={() => setShowWeeklyForecastPanel((prev) => !prev)}
                      className="w-full flex items-center justify-between px-5 py-3 text-left"
                      title="Expand or collapse weekly forecast and quest panels"
                    >
                      <span className="text-sm font-semibold text-slate-200">Weekly Forecast + Quests</span>
                      <span className="text-xs text-slate-400">{showWeeklyForecastPanel ? 'Hide' : 'Show'}</span>
                    </button>
                    {showWeeklyForecastPanel && (
                      <div className="px-0 pb-4">
                        <div className="bg-slate-900/40 rounded-lg p-8 border-t border-amber-500/20 backdrop-blur-sm">
                          <h2 className="text-2xl font-bold text-amber-300 mb-6">7-Day Cosmic Forecast</h2>
                          <WeeklyCalendar
                            week={weeklyForecast?.week || []}
                            loading={weeklyLoading}
                          />
                        </div>
                        <QuestLog
                          enabled={questLogEnabled}
                          chartData={chartData}
                          transits={transits}
                          forecast={forecast}
                          mbtiType={mbtiType || undefined}
                          userId={userId || undefined}
                        />
                      </div>
                    )}
                  </motion.div>
                )}

                {/* MIDDLE: Dual MBTI Cards */}
                {!compactMode && (
                  <motion.div
                    ref={personalitySectionRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-slate-900/35 border border-slate-700/50 rounded-lg"
                  >
                    <button
                      onClick={() => setShowPersonalityCardsPanel((prev) => !prev)}
                      className="w-full flex items-center justify-between px-5 py-3 text-left"
                      title="Expand or collapse dual MBTI cards"
                    >
                      <span className="text-sm font-semibold text-slate-200">Dual MBTI Cards</span>
                      <span className="text-xs text-slate-400">{showPersonalityCardsPanel ? 'Hide' : 'Show'}</span>
                    </button>
                    {showPersonalityCardsPanel && mbtiType && (
                      <div className="px-4 pb-4">
                        <DualPersonalityCards mbtiType={mbtiType} dualOverlay={dualOverlay} transits={transits} loading={personalityLoading} />
                      </div>
                    )}
                  </motion.div>
                )}

                {/* BOTTOM: Today's Forecast + Tabbed Analysis */}
                <motion.div
                  ref={forecastSectionRef}
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
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-2 border-green-400/60">
                        <div
                          className="w-3 h-3 rounded-full bg-green-400 animate-pulse"
                        />
                        <span className="text-sm font-bold text-green-300 uppercase tracking-wider">
                          ACTIVE NOW
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-900/40 rounded-lg p-8 border border-purple-500/20 backdrop-blur-sm">
                      {transits?.predictive?.lunarTiming && transits?.predictive?.progressedMoon && (
                        <div className="mb-5 rounded-lg border border-violet-500/25 bg-violet-950/20 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-violet-200">
                              🔮 Predictive Intelligence Snapshot
                            </p>
                            {predictiveActionHint && (
                              <span className={`text-xs px-2.5 py-1 rounded border ${predictiveActionHint.className}`}>
                                {predictiveActionHint.label.toUpperCase()} · {predictiveActionHint.reason}
                              </span>
                            )}
                          </div>

                          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="rounded border border-violet-400/20 bg-slate-900/40 p-2.5">
                              <p className="text-violet-200/90">Lunar timing</p>
                              <p className="text-slate-200 mt-1">
                                {transits.predictive.lunarTiming.phase} · {transits.predictive.lunarTiming.actionBias.toUpperCase()}
                              </p>
                            </div>
                            <div className="rounded border border-violet-400/20 bg-slate-900/40 p-2.5">
                              <p className="text-violet-200/90">Progressed Moon</p>
                              <p className="text-slate-200 mt-1">
                                {transits.predictive.progressedMoon.sign} {transits.predictive.progressedMoon.degree.toFixed(1)}°
                              </p>
                            </div>
                            <div className="rounded border border-violet-400/20 bg-slate-900/40 p-2.5">
                              <p className="text-violet-200/90">Top predictive signal</p>
                              <p className="text-slate-200 mt-1">
                                {predictiveTopEvent
                                  ? `${predictiveTopEvent.transit.transitingPlanet} ${predictiveTopEvent.transit.aspect} ${predictiveTopEvent.transit.natalPlanet}`
                                  : 'Building…'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

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
                    id="focus-panel"
                    ref={focusPanelRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="space-y-4"
                  >
                    {/* Tab Buttons - Horizontal */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => openSection('interpretation')}
                        title="Show full chart reading and narrative"
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
                        onClick={() => openSection('transits')}
                        title="Show active and approaching transit impacts"
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
                        onClick={() => openSection('lifearc')}
                        title="Show your long-range life timeline"
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
                        onClick={() => openSection('personality')}
                        title="Show dual MBTI mask/core personality mapping"
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
                        onClick={() => openSection('stormradar')}
                        title="Show storm radar and navigation guidance"
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
                            predictive={transits?.predictive}
                            loading={transitsLoading}
                            userId={userId || undefined}
                            mbtiType={mbtiType || undefined}
                            onContextSaved={refreshTransitsWithContext}
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
