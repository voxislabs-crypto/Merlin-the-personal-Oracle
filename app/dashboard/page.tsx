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
import { GrokNarrative } from '@/components/astrology/GrokNarrative';
import { CollapsibleChatPanel } from '@/components/astrology/CollapsibleChatPanel';
import { MerlinAudioPlayer } from '@/components/astrology/MerlinAudioPlayer';
import { IdentityPatternCard } from '@/components/astrology/IdentityPatternCard';
import { ProgressPathCard } from '@/components/astrology/ProgressPathCard';
import { DailyOraclePulse } from '@/components/astrology/DailyOraclePulse';
import { PatternMirrorPanel } from '@/components/astrology/PatternMirrorPanel';
import QuestLog from '@/components/astrology/QuestLog';
import { DeepDivePanel } from '@/components/DeepDivePanel';
import { useInterpretations } from '@/hooks/useInterpretations';
import { useForecast } from '@/hooks/useForecast';
import { useTransits } from '@/hooks/useTransits';
import { useLifeArc } from '@/hooks/useLifeArc';
import { useWeeklyForecast } from '@/hooks/useWeeklyForecast';
import { useStorms } from '@/hooks/useStorms';
import { usePersonality } from '@/hooks/usePersonality';
import { useProphecy, type ProphecyStyle } from '@/hooks/useProphecy';
import { BirthData, BirthChartData } from '@/components/astrology/BirthChartCalculator';
import { GeocodingService } from '@/lib/astrology/geocoding';
import type { SynastryReport } from '@/lib/astrology/synastry';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Flame, MessageCircle, RefreshCcw, Sparkles, ScrollText } from 'lucide-react';
import type { ChartData } from '@/lib/astrology/newWheelTypes';

const STORAGE_KEY = 'merlin_chart_data';
const STORAGE_BIRTH_KEY = 'merlin_birth_data';
const ONBOARDING_STORAGE_KEY = 'merlin_dashboard_onboarding_complete_v1';
const DAILY_STREAK_LAST_KEY = 'merlin_daily_checkin_last';
const DAILY_STREAK_COUNT_KEY = 'merlin_daily_checkin_count';
const DASHBOARD_EVENTS_KEY = 'merlin_dashboard_events_v1';
const FIRST_CHART_KEY = 'merlin_first_chart_completed_at';
const FIRST_ASK_KEY = 'merlin_first_ask_completed_at';
const MAX_DASHBOARD_EVENTS = 40;
const WEEKLY_RESET_PROMPT_KEY = 'merlin_weekly_reset_prompt_seen';

type DashboardEvent = {
  eventName: string;
  at: string;
  detail: Record<string, unknown>;
};

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
  const hasRestoredPersistedDataRef = useRef(false);
  const [compactMode, setCompactMode] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [showWeeklyForecastPanel, setShowWeeklyForecastPanel] = useState(false);
  const [showPersonalityCardsPanel, setShowPersonalityCardsPanel] = useState(false);
  const [identityPack, setIdentityPack] = useState<{ archetypeName?: string; patternSignature?: string; coreContradiction?: string } | null>(null);
  const [progression, setProgression] = useState<{ arcPath?: string; arcLevel?: number; arcXp?: number; interactionCount?: number } | null>(null);
  const [dailyOracle, setDailyOracle] = useState<{
    message?: string;
    dayRating?: string;
    dominantPattern?: {
      label?: string;
      trendStatus?: 'rising' | 'stable' | 'fading' | 'new';
    } | null;
  } | null>(null);
  const [dailyOracleLoading, setDailyOracleLoading] = useState(false);
  const [patternMirror, setPatternMirror] = useState<any | null>(null);
  const [patternMirrorLoading, setPatternMirrorLoading] = useState(false);
  const [askDraftPrompt, setAskDraftPrompt] = useState('');
  const [askDraftLabel, setAskDraftLabel] = useState('');
  const [askDraftKey, setAskDraftKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dailyCheckinStreak, setDailyCheckinStreak] = useState(1);
  const [hasAskedMerlin, setHasAskedMerlin] = useState(false);
  const [dashboardEvents, setDashboardEvents] = useState<DashboardEvent[]>([]);
  const [showDevDiagnostics, setShowDevDiagnostics] = useState(false);
  const [showWeeklyResetPrompt, setShowWeeklyResetPrompt] = useState(false);
  const [prophecyStyle, setProphecyStyle] = useState<ProphecyStyle>('omen');
  const [relationshipForm, setRelationshipForm] = useState({
    personName: '',
    birthDate: '',
    birthTime: '',
    birthCity: '',
  });
  const [relationshipReport, setRelationshipReport] = useState<SynastryReport | null>(null);
  const [relationshipLoading, setRelationshipLoading] = useState(false);
  const [relationshipError, setRelationshipError] = useState('');
  const [relationshipLocationHint, setRelationshipLocationHint] = useState('');
  
  // Call ALL hooks BEFORE any early returns - this is critical for React rules of hooks
  const { interpretations, loading: interpretLoading, cacheHit, generateInterpretations } = useInterpretations();
  const { forecast, loading: forecastLoading, calculateForecast } = useForecast();
  const { transits, loading: transitsLoading, calculateTransits } = useTransits();
  const { lifeArc, loading: lifeArcLoading, calculateLifeArc } = useLifeArc();
  const { weeklyForecast, loading: weeklyLoading, calculateWeeklyForecast } = useWeeklyForecast();
  const { stormsReport, loading: stormsLoading, calculateStorms } = useStorms();
  const { mbtiType, dualOverlay, loading: personalityLoading, calculatePersonality } = usePersonality();
  const { prophecy, loading: prophecyLoading, generateProphecy } = useProphecy();
  
  // Load interpretation mode from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem('merlin_interpretation_mode');
    if (saved === 'grok' || saved === 'traditional') {
      setInterpretMode(saved);
    }
    // Load clarity mode setting
    const savedClarity = localStorage.getItem('merlin_clarity_mode');
    if (savedClarity !== null) setClarityMode(savedClarity !== 'false');
    const savedNoBullshit = localStorage.getItem('merlin_no_bullshit_mode');
    if (savedNoBullshit !== null) setNoBullshit(savedNoBullshit === 'true');
    const savedQuestLog = localStorage.getItem('merlin_quest_log_enabled');
    if (savedQuestLog !== null) setQuestLogEnabled(savedQuestLog !== 'false');
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
          setInterpretMode(preferences.interpretationMode);
          localStorage.setItem('merlin_interpretation_mode', preferences.interpretationMode);
        }
        if (typeof preferences?.noBullshitMode === 'boolean') {
          setNoBullshit(preferences.noBullshitMode);
          localStorage.setItem('merlin_no_bullshit_mode', String(preferences.noBullshitMode));
        }
        if (typeof preferences?.questLogEnabled === 'boolean') {
          setQuestLogEnabled(preferences.questLogEnabled);
          localStorage.setItem('merlin_quest_log_enabled', String(preferences.questLogEnabled));
        }
      } catch {
        // Local storage remains the fallback if the preference sync endpoint is unavailable.
      }
    };

    loadOraclePreferences();
  }, [isLoaded, user]);

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

    fetch('/api/oracle-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clarityMode: next }),
    }).catch(() => {
      // Keep local preference if server sync is temporarily unavailable.
    });
  };
  
  // Re-generate interpretations when mode changes
  useEffect(() => {
    if (birthData && chartData) {
      generateInterpretations(birthData, interpretMode, {
        userId: userId || undefined,
        mbtiType: mbtiType || undefined,
      });
    }
  }, [interpretMode, birthData, chartData, generateInterpretations, userId, mbtiType]);

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

  const fetchPatternMirror = useCallback(async () => {
    if (!userId) return;
    setPatternMirrorLoading(true);
    try {
      const response = await fetch(`/api/pattern-tracker?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) return;
      const result = await response.json();
      if (result?.success) {
        setPatternMirror(result.data);
      }
    } catch {
      // Non-blocking dashboard enhancement.
    } finally {
      setPatternMirrorLoading(false);
    }
  }, [userId]);

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
        setDailyOracle({
          message: result.data.message,
          dayRating: result.data.dayRating,
          dominantPattern: result.data.dominantPattern
            ? {
                label: result.data.dominantPattern.label,
                trendStatus: result.data.dominantPattern.trendStatus,
              }
            : null,
        });
        fetchPatternMirror();
      }
    } catch {
      // Daily oracle is a non-blocking enhancement.
    } finally {
      setDailyOracleLoading(false);
    }
  }, [chartData, userId, fetchPatternMirror]);

  const sendDailyOracleFeedback = useCallback(async (signal: 'hit' | 'missed') => {
    if (!userId || !dailyOracle?.message) return;
    try {
      await fetch('/api/oracle-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          source: 'daily_oracle_feedback',
          message: dailyOracle.message,
          feedback: signal,
        }),
      });
      fetchPatternMirror();
    } catch {
      // Feedback should not interrupt the experience.
    }
  }, [userId, dailyOracle, fetchPatternMirror]);

  useEffect(() => {
    if (!chartData) return;
    fetchDailyOracle(false);
  }, [chartData, fetchDailyOracle]);

  useEffect(() => {
    if (!chartData) return;
    generateProphecy({
      birthChart: chartData,
      style: prophecyStyle,
      ancientLayer: true,
    });
  }, [chartData, prophecyStyle, generateProphecy]);

  const appendDashboardEvent = useCallback((eventName: string, detail?: Record<string, unknown>) => {
    try {
      const now = new Date().toISOString();
      const raw = localStorage.getItem(DASHBOARD_EVENTS_KEY);
      const existing = raw ? (JSON.parse(raw) as DashboardEvent[]) : [];
      const next = [...existing, { eventName, at: now, detail: detail || {} }].slice(-MAX_DASHBOARD_EVENTS);
      localStorage.setItem(DASHBOARD_EVENTS_KEY, JSON.stringify(next));
      setDashboardEvents(next);

      if (userId) {
        void fetch('/api/dashboard-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            eventName,
            detail: detail || {},
          }),
        }).catch(() => {
          // Network failures should not block UX event capture
        });
      }
    } catch {
      // ignore local telemetry write failures
    }
  }, [userId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DASHBOARD_EVENTS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as DashboardEvent[];
      if (Array.isArray(parsed)) {
        setDashboardEvents(parsed.slice(-MAX_DASHBOARD_EVENTS));
      }
    } catch {
      // ignore malformed local event history
    }
  }, []);

  useEffect(() => {
    if (!chartData) return;

    try {
      const onboardingComplete = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
      setShowOnboarding(!onboardingComplete);

      const today = new Date();
      const todayKey = today.toISOString().slice(0, 10);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().slice(0, 10);

      const lastCheckin = localStorage.getItem(DAILY_STREAK_LAST_KEY);
      const storedCount = Number(localStorage.getItem(DAILY_STREAK_COUNT_KEY) || '0');

      let nextCount = Math.max(storedCount, 1);
      if (!lastCheckin) {
        nextCount = 1;
      } else if (lastCheckin === todayKey) {
        nextCount = Math.max(storedCount, 1);
      } else if (lastCheckin === yesterdayKey) {
        nextCount = Math.max(storedCount + 1, 2);
      } else {
        nextCount = 1;
      }

      if (lastCheckin !== todayKey) {
        appendDashboardEvent('dashboard_daily_checkin', { streak: nextCount });
      }

      if (lastCheckin && lastCheckin !== todayKey && lastCheckin !== yesterdayKey) {
        const promptWeek = `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${Math.ceil((today.getUTCDate() + 6) / 7)}`;
        const seenPromptWeek = localStorage.getItem(WEEKLY_RESET_PROMPT_KEY);
        if (seenPromptWeek !== promptWeek) {
          setShowWeeklyResetPrompt(true);
          localStorage.setItem(WEEKLY_RESET_PROMPT_KEY, promptWeek);
          appendDashboardEvent('dashboard_weekly_reset_prompt_shown', { previousCheckin: lastCheckin });
        }
      }

      localStorage.setItem(DAILY_STREAK_LAST_KEY, todayKey);
      localStorage.setItem(DAILY_STREAK_COUNT_KEY, String(nextCount));
      setDailyCheckinStreak(nextCount);

      if (!localStorage.getItem(FIRST_CHART_KEY)) {
        localStorage.setItem(FIRST_CHART_KEY, today.toISOString());
        appendDashboardEvent('dashboard_first_chart_completed', { source: calcSource || 'unknown' });
      }
    } catch {
      // localStorage failures should never block the dashboard
    }
  }, [chartData, calcSource, appendDashboardEvent]);

  useEffect(() => {
    if (!showOnboarding) return;

    const stepsComplete = hasAskedMerlin && activeSection !== 'wheel';
    if (!stepsComplete) return;

    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // ignore persistence issues
    }
    appendDashboardEvent('dashboard_onboarding_completed', {
      askedMerlin: hasAskedMerlin,
      openedFocusView: activeSection !== 'wheel',
    });
    setShowOnboarding(false);
  }, [showOnboarding, hasAskedMerlin, activeSection, appendDashboardEvent]);

  useEffect(() => {
    if (!userId) return;
    fetchPatternMirror();
  }, [userId, fetchPatternMirror]);

  // Load persisted data on mount
  useEffect(() => {
    if (!isLoaded || (user && !userId) || hasRestoredPersistedDataRef.current) return;

    hasRestoredPersistedDataRef.current = true;

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
          generateInterpretations(birth, interpretMode, { userId: userId || undefined, mbtiType: mbtiType || undefined }),
          calculateForecast(birth),
          calculateTransits(birth, { mbtiType: mbtiType || undefined, userId: userId || undefined }),
          calculateLifeArc(birth, chart),
          calculateWeeklyForecast(birth),
          calculatePersonality(birth).then(mbti => calculateStorms(birth, mbti ?? undefined)).catch(e => console.log('Personality unavailable:', e.message))
        ]).catch((e) => console.error('Error regenerating dashboard data:', e));
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  }, [
    calculateForecast,
    calculateLifeArc,
    calculatePersonality,
    calculateStorms,
    calculateTransits,
    calculateWeeklyForecast,
    generateInterpretations,
    interpretMode,
    isLoaded,
    mbtiType,
    user,
    userId,
  ]);

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
      generateInterpretations(derived, interpretMode, { userId: userId || undefined, mbtiType: mbtiType || undefined }),
      calculateForecast(derived),
      calculateTransits(derived, { mbtiType: mbtiType || undefined, userId: userId || undefined }),
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
    userId,
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

  const queueAskContext = useCallback((label: string, prompt: string) => {
    setAskDraftLabel(label);
    setAskDraftPrompt(prompt);
    setAskDraftKey((prev) => prev + 1);
    setChatExpanded(true);
    setTimeout(() => {
      chartSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }, []);

  const handlePrimaryAskMerlin = useCallback(() => {
    queueAskContext(
      askDraftLabel || 'Current chart context',
      askDraftPrompt || 'What should I pay attention to in my chart and current transits right now?'
    );
  }, [askDraftLabel, askDraftPrompt, queueAskContext]);

  const handleChatUserMessageSent = useCallback((message: string) => {
    setHasAskedMerlin(true);
    try {
      const isFirstAsk = !localStorage.getItem(FIRST_ASK_KEY);
      if (isFirstAsk) {
        localStorage.setItem(FIRST_ASK_KEY, new Date().toISOString());
      }
      appendDashboardEvent(isFirstAsk ? 'dashboard_first_ask_submitted' : 'dashboard_repeat_ask_submitted', {
        section: activeSection,
        length: message.length,
      });
    } catch {
      appendDashboardEvent('dashboard_ask_submitted', {
        section: activeSection,
        length: message.length,
      });
    }
  }, [appendDashboardEvent, activeSection]);

  const clearAskContext = useCallback(() => {
    setAskDraftLabel('');
    setAskDraftPrompt('');
    setAskDraftKey((prev) => prev + 1);
  }, []);

  const updateRelationshipField = useCallback((field: keyof typeof relationshipForm, value: string) => {
    setRelationshipForm((prev) => ({ ...prev, [field]: value }));
    setRelationshipError('');
  }, []);

  const handleRelationshipReading = useCallback(async () => {
    if (!chartData) {
      setRelationshipError('Calculate your chart first before opening Relationship Space.');
      scrollToBlock(chartSectionRef);
      return;
    }

    if (!relationshipForm.birthDate || !relationshipForm.birthTime || !relationshipForm.birthCity) {
      setRelationshipError('Partner birth date, time, and city are required.');
      return;
    }

    setRelationshipLoading(true);
    setRelationshipError('');
    setRelationshipLocationHint('');

    try {
      const location = await GeocodingService.validateLocation(relationshipForm.birthCity.trim());

      if (!location) {
        throw new Error('Partner birth city could not be located. Try a more specific city name.');
      }

      setRelationshipLocationHint(location.displayName);

      const partnerChartResponse = await fetch('/api/calculate-birth-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: relationshipForm.birthDate,
          birthTime: relationshipForm.birthTime,
          lat: location.latitude,
          lon: location.longitude,
        }),
      });

      const partnerChartResult = await partnerChartResponse.json();

      if (!partnerChartResponse.ok || !partnerChartResult?.success || !partnerChartResult?.data) {
        throw new Error(partnerChartResult?.error || 'Failed to calculate the partner chart.');
      }

      const synastryResponse = await fetch('/api/synastry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chart1: chartData,
          chart2: partnerChartResult.data,
          person1Name: user?.firstName || user?.fullName || 'You',
          person2Name: relationshipForm.personName.trim() || 'Partner',
        }),
      });

      const synastryResult = await synastryResponse.json();

      if (!synastryResponse.ok || !synastryResult?.success || !synastryResult?.data) {
        throw new Error(synastryResult?.error || 'Failed to generate the relationship reading.');
      }

      const report = synastryResult.data as SynastryReport;
      setRelationshipReport(report);
      queueAskContext(
        `${report.person1Name || 'You'} + ${report.person2Name || 'Partner'} relationship space`,
        `Read the relationship dynamic between ${report.person1Name || 'me'} and ${report.person2Name || 'my partner'}. Compatibility is ${report.overallCompatibility}%. Narrative: ${report.narrative} Strengths: ${report.strengths.join(', ') || 'none noted'}. Challenges: ${report.challenges.join(', ') || 'none noted'}. What is the clearest next move?`
      );
      toast({
        title: 'Relationship Space updated',
        description: `Compatibility reading ready for ${report.person2Name || 'your partner'}.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Relationship Space failed to load.';
      setRelationshipError(message);
      toast({
        title: 'Relationship Space error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setRelationshipLoading(false);
    }
  }, [chartData, relationshipForm, user, queueAskContext, toast]);

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
      localStorage.setItem('merlin_interpretation_mode', 'traditional');
      setNoBullshit(false);
      localStorage.setItem('merlin_no_bullshit_mode', 'false');
      if (!clarityMode) toggleClarityMode();
      fetch('/api/oracle-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interpretationMode: 'traditional', noBullshitMode: false, clarityMode: true }),
      }).catch(() => {
        // Keep local preference if server sync is temporarily unavailable.
      });
      return;
    }

    if (mode === 'warm') {
      setInterpretMode('grok');
      localStorage.setItem('merlin_interpretation_mode', 'grok');
      setNoBullshit(false);
      localStorage.setItem('merlin_no_bullshit_mode', 'false');
      if (!clarityMode) toggleClarityMode();
      fetch('/api/oracle-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interpretationMode: 'grok', noBullshitMode: false, clarityMode: true }),
      }).catch(() => {
        // Keep local preference if server sync is temporarily unavailable.
      });
      return;
    }

    if (mode === 'bullshit') {
      setInterpretMode('grok');
      localStorage.setItem('merlin_interpretation_mode', 'grok');
      setNoBullshit(true);
      localStorage.setItem('merlin_no_bullshit_mode', 'true');
      if (!clarityMode) toggleClarityMode();
      fetch('/api/oracle-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interpretationMode: 'grok', noBullshitMode: true, clarityMode: true }),
      }).catch(() => {
        // Keep local preference if server sync is temporarily unavailable.
      });
      return;
    }

    setInterpretMode('grok');
    localStorage.setItem('merlin_interpretation_mode', 'grok');
    setNoBullshit(false);
    localStorage.setItem('merlin_no_bullshit_mode', 'false');
    if (clarityMode) toggleClarityMode();
    fetch('/api/oracle-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interpretationMode: 'grok', noBullshitMode: false, clarityMode: false }),
    }).catch(() => {
      // Keep local preference if server sync is temporarily unavailable.
    });
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
                {chartData ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded border border-orange-400/45 bg-orange-500/10 text-orange-200">
                    <Flame className="h-3.5 w-3.5" />
                    {dailyCheckinStreak}-day check-in streak
                  </span>
                ) : null}
                {moonSign && (moonSign === 'Sagittarius' || moonSign === 'Capricorn') && (
                  <span className="px-2 py-1 text-xs rounded border border-red-500/40 text-red-300">
                    Moon sanity check
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-lg">One place. Your whole story.</p>
            </motion.div>

            {chartData && showOnboarding ? (
              <motion.section
                className="mb-8"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="rounded-[1.75rem] border border-amber-300/25 bg-gradient-to-r from-slate-900/95 via-slate-900/85 to-orange-950/25 p-4 md:p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.28em] text-amber-300/80">First Session Guide</p>
                      <h2 className="mt-2 text-xl md:text-2xl font-semibold text-amber-50">Lock in your first win before you leave.</h2>
                      <p className="mt-2 text-sm text-slate-300/90">Complete these 3 moves and Merlin will remember your rhythm the next time you return.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
                        } catch {
                          // ignore persistence issues
                        }
                        appendDashboardEvent('dashboard_onboarding_dismissed');
                        setShowOnboarding(false);
                      }}
                      className="self-start rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3.5">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/90">Step 1</p>
                      <p className="mt-1 text-sm text-emerald-50 font-medium">Chart calculated</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-200/90">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Complete
                      </div>
                    </div>

                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-3.5">
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/90">Step 2</p>
                      <p className="mt-1 text-sm text-cyan-50 font-medium">Ask Merlin one direct question</p>
                      {hasAskedMerlin ? (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-cyan-200/90">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Complete
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handlePrimaryAskMerlin}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/40 bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/25"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Start question
                        </button>
                      )}
                    </div>

                    <div className="rounded-2xl border border-indigo-300/20 bg-indigo-400/10 p-3.5">
                      <p className="text-xs uppercase tracking-[0.2em] text-indigo-200/90">Step 3</p>
                      <p className="mt-1 text-sm text-indigo-50 font-medium">Open one focus view</p>
                      {activeSection !== 'wheel' ? (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-indigo-200/90">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Complete
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            appendDashboardEvent('dashboard_focus_view_opened', { view: 'forecast' });
                            setActiveSection('forecast');
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-300/40 bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-100 hover:bg-indigo-500/25"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Open forecast
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.section>
            ) : null}

            {chartData ? (
              <motion.section
                className="mb-8"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="rounded-[1.4rem] border border-cyan-300/20 bg-gradient-to-r from-cyan-950/35 via-slate-900/85 to-slate-900/90 p-4 md:p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/75">Return Loop</p>
                      <h3 className="mt-1 text-lg md:text-xl font-semibold text-cyan-50">Keep the signal hot tomorrow.</h3>
                      <p className="mt-1 text-sm text-slate-300/90">Streak day {dailyCheckinStreak}. Run a fresh oracle pulse and one focused question each day for tighter timing reads.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          appendDashboardEvent('dashboard_return_rail_refresh_oracle');
                          fetchDailyOracle(true);
                        }}
                        className="rounded-full border border-cyan-300/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/25"
                      >
                        Refresh oracle
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          appendDashboardEvent('dashboard_return_rail_open_forecast');
                          setActiveSection('forecast');
                        }}
                        className="rounded-full border border-indigo-300/40 bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-100 hover:bg-indigo-500/25"
                      >
                        Open forecast
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          appendDashboardEvent('dashboard_return_rail_ask_checkin');
                          queueAskContext('Daily check-in', 'What is my highest-leverage move in the next 24 hours?');
                        }}
                        className="rounded-full border border-amber-300/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/25"
                      >
                        Ask daily check-in
                      </button>
                    </div>
                  </div>

                  {showWeeklyResetPrompt ? (
                    <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-500/10 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">Weekly Reset</p>
                      <p className="mt-1 text-sm text-amber-50">You missed a day, so your streak reset. Do a quick weekly reset prompt to restart momentum with intention.</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            appendDashboardEvent('dashboard_weekly_reset_prompt_clicked');
                            queueAskContext('Weekly reset', 'I lost momentum this week. Give me a one-step reset plan for the next 7 days.');
                            setShowWeeklyResetPrompt(false);
                          }}
                          className="rounded-full border border-amber-300/40 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-100 hover:bg-amber-500/30"
                        >
                          Start weekly reset
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            appendDashboardEvent('dashboard_weekly_reset_prompt_dismissed');
                            setShowWeeklyResetPrompt(false);
                          }}
                          className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-white/10"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 rounded-xl border border-violet-300/20 bg-violet-500/10 p-3.5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-violet-200/80">Personal Prophecy</p>
                        <h4 className="mt-1 text-base md:text-lg font-semibold text-violet-50">{prophecy?.title || 'Chart-anchored omen'}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            appendDashboardEvent('dashboard_prophecy_style_selected', { style: 'omen' });
                            setProphecyStyle('omen');
                          }}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            prophecyStyle === 'omen'
                              ? 'border-violet-300/55 bg-violet-500/30 text-violet-50'
                              : 'border-violet-300/30 bg-violet-500/10 text-violet-100'
                          }`}
                        >
                          Omen
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            appendDashboardEvent('dashboard_prophecy_style_selected', { style: 'sonnet' });
                            setProphecyStyle('sonnet');
                          }}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            prophecyStyle === 'sonnet'
                              ? 'border-violet-300/55 bg-violet-500/30 text-violet-50'
                              : 'border-violet-300/30 bg-violet-500/10 text-violet-100'
                          }`}
                        >
                          Sonnet
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!chartData) return;
                            appendDashboardEvent('dashboard_prophecy_regenerated', { style: prophecyStyle });
                            generateProphecy({ birthChart: chartData, style: prophecyStyle, ancientLayer: true });
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-violet-300/35 bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-100 hover:bg-violet-500/25"
                        >
                          <RefreshCcw className="h-3.5 w-3.5" />
                          Regenerate
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg border border-violet-200/15 bg-slate-950/45 p-3">
                      {prophecyLoading ? (
                        <p className="text-sm text-violet-100/80">Reading the tablets...</p>
                      ) : prophecy?.prophecy ? (
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-violet-50/95 font-sans">{prophecy.prophecy}</pre>
                      ) : (
                        <p className="text-sm text-violet-100/75">No prophecy available yet. Generate one from your chart.</p>
                      )}
                    </div>

                    {prophecy?.signals ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-100">
                          Blessing: {prophecy.signals.blessingPlanet} in {prophecy.signals.blessingSign}
                        </span>
                        <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-2.5 py-1 text-amber-100">
                          Test: {prophecy.signals.challengePlanet} in {prophecy.signals.challengeSign}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            appendDashboardEvent('dashboard_prophecy_ask_context');
                            queueAskContext('Prophecy follow-up', 'Turn this prophecy into a concrete 7-day plan with one non-negotiable action per day.');
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-2.5 py-1 text-cyan-100 hover:bg-cyan-500/20"
                        >
                          <ScrollText className="h-3.5 w-3.5" />
                          Turn into plan
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {process.env.NODE_ENV !== 'production' ? (
                    <div className="mt-4 border-t border-white/10 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowDevDiagnostics((prev) => !prev)}
                        className="text-xs text-slate-300 underline-offset-2 hover:text-white hover:underline"
                      >
                        {showDevDiagnostics ? 'Hide' : 'Show'} dashboard event diagnostics
                      </button>
                      {showDevDiagnostics ? (
                        <div className="mt-2 max-h-44 overflow-y-auto space-y-1 rounded-lg border border-white/10 bg-slate-950/55 p-2">
                          {dashboardEvents.length ? dashboardEvents.slice(-10).reverse().map((event, idx) => (
                            <div key={`${event.at}-${idx}`} className="text-[11px] text-slate-200/85">
                              <span className="text-cyan-200">{event.eventName}</span>
                              <span className="text-slate-400"> • {new Date(event.at).toLocaleString()}</span>
                            </div>
                          )) : (
                            <p className="text-[11px] text-slate-400">No events yet.</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </motion.section>
            ) : null}

            <motion.section
              className="mb-10"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="relative overflow-hidden rounded-[2rem] border border-amber-500/20 bg-gradient-to-br from-slate-950/95 via-slate-900/88 to-indigo-950/40 p-4 md:p-6 lg:p-7 shadow-2xl shadow-amber-950/10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),_transparent_26%),radial-gradient(circle_at_75%_22%,_rgba(99,102,241,0.16),_transparent_24%),radial-gradient(circle_at_48%_100%,_rgba(251,113,133,0.12),_transparent_30%)]" />
                <div className="relative mb-5 flex flex-col gap-3 border-b border-white/8 pb-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.32em] text-amber-300/75">Relationship Space</p>
                    <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-slate-50">Merlin is reading your pattern, your pressure, and your next move together.</h2>
                  </div>
                  <p className="max-w-xl text-sm md:text-[15px] text-slate-300/85 leading-relaxed">Identity gives the frame, the Oracle gives the live signal, and the Pattern Mirror keeps the conversation honest.</p>
                </div>
                <div className="relative mb-5 flex flex-wrap gap-2.5">
                  {progression?.arcPath ? (
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100">
                      {progression.arcPath} • Level {progression.arcLevel || 1}
                    </span>
                  ) : null}
                  {dailyOracle?.dayRating ? (
                    <span className="rounded-full border border-rose-300/25 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-100">
                      Terrain: {dailyOracle.dayRating}
                    </span>
                  ) : null}
                  {dailyOracle?.dominantPattern?.label ? (
                    <span className="rounded-full border border-indigo-300/25 bg-indigo-300/10 px-3 py-1.5 text-xs text-indigo-100">
                      Loop: {dailyOracle.dominantPattern.label}{dailyOracle.dominantPattern.trendStatus ? ` • ${dailyOracle.dominantPattern.trendStatus}` : ''}
                    </span>
                  ) : null}
                </div>
                <div className="relative grid grid-cols-1 xl:grid-cols-[0.95fr_1.35fr_0.95fr] gap-4 md:gap-5 items-start">
                  <div className="space-y-4">
                    <div className="rounded-[1.4rem] border border-white/8 bg-white/4 p-4 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-amber-300/80 mb-2">Identity Layer</p>
                      <p className="text-sm text-slate-300 leading-relaxed">Merlin remembers the shape of your patterns, not just the last thing you asked.</p>
                    </div>
                    {identityPack && (identityPack.archetypeName || identityPack.patternSignature || identityPack.coreContradiction) && (
                      <IdentityPatternCard
                        archetypeName={identityPack.archetypeName}
                        patternSignature={identityPack.patternSignature}
                        coreContradiction={identityPack.coreContradiction}
                      />
                    )}
                    {progression && (progression.arcPath || progression.arcLevel || progression.arcXp) && (
                      <ProgressPathCard
                        arcPath={progression.arcPath}
                        arcLevel={progression.arcLevel}
                        arcXp={progression.arcXp}
                        interactionCount={progression.interactionCount}
                      />
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.6rem] border border-rose-400/20 bg-gradient-to-br from-rose-950/20 to-slate-950/40 p-4 md:p-5 lg:p-6">
                      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.24em] text-rose-300/85">Relationship Space</p>
                          <h2 className="text-2xl font-semibold text-rose-50">Today’s conversation with the future</h2>
                        </div>
                        <p className="text-sm text-rose-100/70 max-w-md">This center rail is the live signal: what Merlin sees now, what it means, and whether it lands.</p>
                      </div>
                      <DailyOraclePulse
                        message={dailyOracle?.message}
                        dayRating={dailyOracle?.dayRating}
                        loading={dailyOracleLoading}
                        onTruthBomb={() => fetchDailyOracle(true)}
                        onFeedback={sendDailyOracleFeedback}
                      />
                    </div>

                    <div className="rounded-[1.4rem] border border-cyan-400/15 bg-cyan-950/10 p-4 backdrop-blur-sm">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-300/80">Ask Rail</p>
                          <p className="text-sm text-slate-300">Use the Oracle when you need a read on timing, risk, relationships, money, or the loop you are in.</p>
                          {askDraftLabel ? (
                            <div className="mt-2 flex items-center gap-2 text-xs text-cyan-200/75">
                              <span>Selected context: {askDraftLabel}</span>
                              <button
                                type="button"
                                onClick={clearAskContext}
                                className="text-cyan-100 underline-offset-2 hover:underline"
                              >
                                Clear
                              </button>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handlePrimaryAskMerlin}
                            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/45 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-50 hover:bg-cyan-400/25"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Ask Merlin
                          </button>
                          <button
                            type="button"
                            onClick={handleDailyWhisper}
                            className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
                          >
                            Warm read
                          </button>
                          <button
                            type="button"
                            onClick={() => activateWhisperMode('bullshit')}
                            className="rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/20"
                          >
                            Direct read
                          </button>
                          <button
                            type="button"
                            onClick={() => scrollToBlock(chartSectionRef)}
                            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-white/10"
                          >
                            Jump to wheel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.4rem] border border-indigo-400/15 bg-indigo-950/12 p-4 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-indigo-300/80 mb-2">Pattern Layer</p>
                      <p className="text-sm text-slate-300 leading-relaxed">Repetition becomes visible here. When a loop keeps showing up, Merlin can stop treating it like a random mood.</p>
                    </div>
                    <PatternMirrorPanel
                      data={patternMirror}
                      loading={patternMirrorLoading}
                      onAskContext={queueAskContext}
                      selectedContextLabel={askDraftLabel}
                    />
                    <div className="rounded-[1.4rem] border border-amber-400/20 bg-amber-950/10 p-4 backdrop-blur-sm space-y-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-amber-300/80 mb-2">Synastry Portal</p>
                        <p className="text-sm text-slate-300 leading-relaxed">Compare your chart with someone else and turn Relationship Space into a real compatibility reading.</p>
                      </div>

                      {!chartData ? (
                        <div className="space-y-3 rounded-xl border border-white/8 bg-white/5 p-4">
                          <p className="text-sm text-slate-300">Your chart needs to be calculated before Merlin can compare relationship dynamics.</p>
                          <button
                            type="button"
                            onClick={() => scrollToBlock(chartSectionRef)}
                            className="rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-400/20"
                          >
                            Go to chart
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <input
                              type="text"
                              value={relationshipForm.personName}
                              onChange={(e) => updateRelationshipField('personName', e.target.value)}
                              placeholder="Partner name"
                              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
                            />
                            <input
                              type="text"
                              value={relationshipForm.birthCity}
                              onChange={(e) => updateRelationshipField('birthCity', e.target.value)}
                              placeholder="Birth city"
                              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
                            />
                            <input
                              type="date"
                              value={relationshipForm.birthDate}
                              onChange={(e) => updateRelationshipField('birthDate', e.target.value)}
                              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                            />
                            <input
                              type="time"
                              value={relationshipForm.birthTime}
                              onChange={(e) => updateRelationshipField('birthTime', e.target.value)}
                              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={handleRelationshipReading}
                              disabled={relationshipLoading}
                              className="rounded-full border border-amber-300/45 bg-amber-400/15 px-4 py-2 text-sm font-semibold text-amber-50 hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {relationshipLoading ? 'Reading connection...' : 'Read the connection'}
                            </button>
                            {relationshipLocationHint ? (
                              <span className="text-xs text-amber-100/75">Using: {relationshipLocationHint}</span>
                            ) : null}
                          </div>

                          {relationshipError ? (
                            <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                              {relationshipError}
                            </div>
                          ) : null}

                          {relationshipReport ? (
                            <div className="space-y-4 rounded-[1.2rem] border border-amber-300/20 bg-gradient-to-br from-amber-950/20 to-slate-950/40 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm text-amber-100 font-semibold">
                                    {relationshipReport.person1Name || 'You'} + {relationshipReport.person2Name || 'Partner'}
                                  </p>
                                  <p className="text-xs text-slate-400">Live synastry based on both birth charts</p>
                                </div>
                                <div className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-sm font-semibold text-amber-100">
                                  {relationshipReport.overallCompatibility}% compatibility
                                </div>
                              </div>

                              <p className="text-sm leading-relaxed text-slate-200">{relationshipReport.narrative}</p>

                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-emerald-300/80">Strengths</p>
                                  <div className="space-y-2">
                                    {relationshipReport.strengths.length ? relationshipReport.strengths.map((strength) => (
                                      <div key={strength} className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                                        {strength}
                                      </div>
                                    )) : <p className="text-sm text-slate-400">No dominant strengths detected yet.</p>}
                                  </div>
                                </div>
                                <div>
                                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-rose-300/80">Challenges</p>
                                  <div className="space-y-2">
                                    {relationshipReport.challenges.length ? relationshipReport.challenges.map((challenge) => (
                                      <div key={challenge} className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                                        {challenge}
                                      </div>
                                    )) : <p className="text-sm text-slate-400">No major friction aspects in the top layer.</p>}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-300/80">Key Aspects</p>
                                <div className="space-y-2">
                                  {relationshipReport.aspects.slice(0, 4).map((aspect) => (
                                    <div key={`${aspect.person1Planet}-${aspect.person2Planet}-${aspect.aspectType}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                                      <span className="font-semibold text-white">{aspect.person1Planet} {aspect.aspectType} {aspect.person2Planet}</span>
                                      <span className="ml-2 text-xs text-slate-400">orb {aspect.orb.toFixed(1)}{aspect.exact ? ' • exact' : ''}</span>
                                      <p className="mt-1 text-xs leading-relaxed text-slate-300">{aspect.interpretation}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

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
                      <PlacementsSidebar
                        planets={chartData?.planets || []}
                        onAskContext={queueAskContext}
                        selectedContextLabel={askDraftLabel}
                      />
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
                            onUserMessageSent={handleChatUserMessageSent}
                            mbtiType={mbtiType || undefined}
                            clarityMode={clarityMode}
                            onClarityChange={toggleClarityMode}
                            draftPrompt={askDraftPrompt}
                            draftPromptKey={askDraftKey}
                            draftLabel={askDraftLabel}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Under Wheel */}
                  <div className="mt-8 space-y-3">
                    <div className="flex gap-3 justify-center flex-wrap items-center">
                      <button
                        onClick={handlePrimaryAskMerlin}
                        title="Open the chat rail and prefill a prompt for Merlin"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-400/15 hover:bg-cyan-400/25 border border-cyan-300/35 rounded-lg text-cyan-50 font-semibold transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Ask Merlin
                      </button>
                      <MerlinAudioPlayer
                        text={readAloudText}
                        label="Read My Chart"
                      />
                      <Link
                        href="/profile"
                        title="Adjust Oracle reading preferences in your profile"
                        className="inline-flex items-center gap-2 px-4 py-3 border border-slate-600/40 rounded-lg text-slate-200 bg-slate-800/60 hover:bg-slate-700/70 transition-all"
                      >
                        Oracle Preferences
                      </Link>
                    </div>

                    {askDraftLabel ? (
                      <div className="text-center flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={handlePrimaryAskMerlin}
                          className="text-xs text-cyan-200/80 hover:text-cyan-100 transition"
                        >
                          Selected context: {askDraftLabel}
                        </button>
                        <button
                          type="button"
                          onClick={clearAskContext}
                          className="text-xs text-slate-400 hover:text-slate-200 transition"
                        >
                          Clear selection
                        </button>
                      </div>
                    ) : null}

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
                        <DualPersonalityCards
                          mbtiType={mbtiType}
                          dualOverlay={dualOverlay}
                          transits={transits}
                          loading={personalityLoading}
                          onAskContext={queueAskContext}
                          selectedContextLabel={askDraftLabel}
                        />
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
                        onAskContext={queueAskContext}
                        selectedContextLabel={askDraftLabel}
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
                                <Link href="/profile" className="text-xs text-slate-400 hover:text-slate-200 transition">
                                  Interpretation engine lives in Oracle Preferences
                                </Link>
                              </div>
                              <ChartInterpretation
                                summary={interpretations?.chartSummary || ''}
                                synthesis={interpretations?.synthesis}
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
                            confluence={transits?.confluence}
                            transitWindows={transits?.transitWindows}
                            resonance={transits?.resonance}
                            loading={transitsLoading}
                            userId={userId || undefined}
                            mbtiType={mbtiType || undefined}
                            onContextSaved={refreshTransitsWithContext}
                            onAskContext={queueAskContext}
                            selectedContextLabel={askDraftLabel}
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
                                onAskContext={queueAskContext}
                                selectedContextLabel={askDraftLabel}
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
                              onAskContext={queueAskContext}
                              selectedContextLabel={askDraftLabel}
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
