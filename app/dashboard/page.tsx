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
import { WeeklyWhisper } from '@/components/astrology/WeeklyWhisper';
import { PersonalityReveal } from '@/components/astrology/PersonalityReveal';
import { DualPersonalityCards } from '@/components/astrology/DualPersonalityCards';
import { InterpretationModeToggle } from '@/components/astrology/InterpretationModeToggle';
import { GrokNarrative } from '@/components/astrology/GrokNarrative';
import { CollapsibleChatPanel } from '@/components/astrology/CollapsibleChatPanel';
import { useInterpretations } from '@/hooks/useInterpretations';
import { useForecast } from '@/hooks/useForecast';
import { useTransits } from '@/hooks/useTransits';
import { useLifeArc } from '@/hooks/useLifeArc';
import { useWeeklyForecast } from '@/hooks/useWeeklyForecast';
import { usePersonality } from '@/hooks/usePersonality';
import { BirthData, BirthChartData } from '@/components/astrology/BirthChartCalculator';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Moon, Zap, BookOpen } from 'lucide-react';
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
  const [activeSection, setActiveSection] = useState<'wheel' | 'interpretation' | 'forecast' | 'transits' | 'lifearc'>('wheel');
  // Life Arc mode removed - now just raw timeline
  const [lifeArcView, setLifeArcView] = useState<'timeline' | 'prose'>('timeline');
  const [interpretMode, setInterpretMode] = useState<'grok' | 'traditional'>('grok');
  const [noBullshit, setNoBullshit] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [userId, setUserId] = useState('');
  
  // Call ALL hooks BEFORE any early returns - this is critical for React rules of hooks
  const { interpretations, loading: interpretLoading, cacheHit, generateInterpretations } = useInterpretations();
  const { forecast, loading: forecastLoading, calculateForecast } = useForecast();
  const { transits, loading: transitsLoading, calculateTransits } = useTransits();
  const { lifeArc, loading: lifeArcLoading, calculateLifeArc } = useLifeArc();
  const { weeklyForecast, loading: weeklyLoading, calculateWeeklyForecast } = useWeeklyForecast();
  const { mbtiType, dualOverlay, loading: personalityLoading, calculatePersonality } = usePersonality();
  
  // Load interpretation mode from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem('merlin_interpretation_mode');
    if (saved === 'grok' || saved === 'traditional') {
      setInterpretMode(saved);
    }
  }, []);
  
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
          calculatePersonality(birth).catch(e => console.log('Personality unavailable:', e.message))
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
      calculatePersonality(derived).catch(e => console.log('Personality unavailable:', e.message))
    ]).catch((e) => console.error('Error generating dashboard data:', e));
  }, [generateInterpretations, calculateForecast, calculateTransits, calculateLifeArc, calculateWeeklyForecast, calculatePersonality, interpretMode]);

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

  const handleReadAloud = () => {
    // Build full interpretation text
    let text = '';
    
    if (interpretations?.chartSummary) {
      text += interpretations.chartSummary + '\n\n';
    }
    
    if (interpretations?.planetInterpretations && interpretations.planetInterpretations.length > 0) {
      text += 'Planetary Placements:\n';
      interpretations.planetInterpretations.forEach(p => {
        text += `${p.planet}: ${p.interpretation}\n\n`;
      });
    }
    
    if (!text && forecast?.summary) {
      text = forecast.summary;
    }
    
    if (!text) {
      text = 'No interpretation available';
    }

    // Use ElevenLabs TTS via our endpoint with "mystic" voice archetype
    playWithElevenLabs(text);
  };

  const playWithElevenLabs = async (text: string) => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: 'mystic', // Use mystic voice for the readings
          provider: 'elevenlabs',
        }),
      });

      if (!response.ok) {
        // Fallback to Web Speech API if ElevenLabs fails
        console.log('[ReadAloud] ElevenLabs unavailable, using Web Speech API');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
        return;
      }

      const result = await response.json();
      
      if (result.success && result.data.audio) {
        // If audio is a URL, play it
        if (result.data.audio.startsWith('data:audio') || result.data.audio.startsWith('http')) {
          const audio = new Audio(result.data.audio);
          audio.play().catch(err => {
            console.error('[ReadAloud] Play error:', err);
            // Final fallback to Web Speech API
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;
            window.speechSynthesis.speak(utterance);
          });
        }
      } else {
        // Fallback if no audio data
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('[ReadAloud] Error:', error);
      // Ultimate fallback to Web Speech API
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDailyWhisper = () => {
    setActiveSection('forecast');
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
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Under Wheel */}
                  <div className="flex gap-4 mt-8 justify-center flex-wrap items-center">
                    <button
                      onClick={handleReadAloud}
                      className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-200 font-semibold transition-all"
                    >
                      Read Aloud
                    </button>
                    <button
                      onClick={handleDailyWhisper}
                      className="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-200 font-semibold transition-all"
                    >
                      🌙 Daily Whisper
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
                  </div>
                </motion.div>

                {/* MIDDLE: Dual MBTI Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {mbtiType && (
                    <DualPersonalityCards mbtiType={mbtiType} dualOverlay={dualOverlay} loading={personalityLoading} />
                  )}
                </motion.div>

                {/* BOTTOM: Grid Layout - Forecast/Weekly + Tabbed Analysis */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-8 mt-12"
                >
                  {/* SECTION 1: Forecast + Weekly (full width) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Today's Forecast */}
                    <motion.div
                      className="bg-slate-900/40 rounded-lg p-8 border border-purple-500/20 backdrop-blur-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.65 }}
                    >
                      <DailyForecast
                        date={forecast?.date || new Date().toISOString()}
                        summary={forecast?.summary || 'Loading forecast...'}
                        planetaryHighlights={forecast?.planetaryHighlights || []}
                        moonPhase={forecast?.moonPhase || 'Unknown'}
                        advice={forecast?.advice || ''}
                        loading={forecastLoading}
                      />
                    </motion.div>

                    {/* Weekly Whisper */}
                    <motion.div
                      className="bg-slate-900/40 rounded-lg p-8 border border-amber-500/20 backdrop-blur-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <h2 className="text-2xl font-bold text-amber-300 mb-6">Weekly Overview</h2>
                      <WeeklyWhisper
                        week={weeklyForecast?.week || []}
                        loading={weeklyLoading}
                      />
                    </motion.div>
                  </div>

                  {/* SECTION 2: Analysis Tabs (below chart) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75 }}
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
                    </div>

                    {/* Content Panel - Drops Down Below Buttons */}
                    {['interpretation', 'transits', 'lifearc'].includes(activeSection) && (
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
