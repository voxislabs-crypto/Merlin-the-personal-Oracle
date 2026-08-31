'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BirthChart } from '@/components/astrology/BirthChart';
import { WheelVisualization } from '@/components/astrology/WheelVisualization';
import { ChartInterpretation } from '@/components/astrology/ChartInterpretation';
import { DailyForecast } from '@/components/astrology/DailyForecast';
import { ActiveTransits } from '@/components/astrology/ActiveTransits';
import { LifeTimelineView } from '@/components/astrology/LifeTimelineView';
import { PlacementsSidebar } from '@/components/astrology/PlacementsSidebar';
import { StormsAndNavigations } from '@/components/astrology/StormsAndNavigations';
import { DualPersonalityCards } from '@/components/astrology/DualPersonalityCards';
import { GrokNarrative } from '@/components/astrology/GrokNarrative';
import {
  DashboardExperienceTabs,
  type DashboardExperienceTab,
} from '@/components/dashboard/DashboardExperienceTabs';
import {
  DashboardContextNav,
  type ContextNavSection,
} from '@/components/dashboard/DashboardContextNav';
import { DashboardStatusBar } from '@/components/dashboard/DashboardStatusBar';
import { ChartIdentityBrief } from '@/components/dashboard/ChartIdentityBrief';
import { ForecastDetailsSection } from '@/components/dashboard/ForecastDetailsSection';
import { HomeTabPanel } from '@/components/dashboard/panels/HomeTabPanel';
import { NumerologyTabPanel } from '@/components/dashboard/panels/NumerologyTabPanel';

const ForecastTabPanel = dynamic(
  () =>
    import('@/components/dashboard/panels/ForecastTabPanel').then((mod) => mod.ForecastTabPanel),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 animate-pulse rounded-2xl border border-white/10 bg-slate-900/40" />
    ),
  },
);
import { WeatherShell } from '@/components/dashboard/shells/WeatherShell';
import { SelfShell } from '@/components/dashboard/shells/SelfShell';
import { TodayWeatherBrief } from '@/components/dashboard/TodayWeatherBrief';
import { ActiveStorylinePanel } from '@/components/dashboard/ActiveStorylinePanel';
import {
  WheelDetailTabs,
  type WheelDetailTab,
} from '@/components/dashboard/WheelDetailTabs';
import { WheelSelectionPanel } from '@/components/dashboard/WheelSelectionPanel';
import { PlanetPersonalityHint } from '@/components/dashboard/PlanetPersonalityHint';
import { MBTIDualBreakdown } from '@/components/dashboard/MBTIDualBreakdown';
import { WheelTransitPanel } from '@/components/dashboard/WheelTransitPanel';
import type { ZodiacSignName } from '@/lib/astrology/zodiac';
import { CosmicStoryCard } from '@/components/dashboard/CosmicStoryCard';
import { DashboardOnboardingChecklist } from '@/components/dashboard/DashboardOnboardingChecklist';
import { DashboardDailyRitualPrompt } from '@/components/dashboard/DashboardDailyRitualPrompt';
import { OracleChatDrawer } from '@/components/dashboard/OracleChatDrawer';
import { ContextualHelp } from '@/components/dashboard/ContextualHelp';
import { MerlinAudioPlayer } from '@/components/astrology/MerlinAudioPlayer';
import { IdentityPatternCard } from '@/components/astrology/IdentityPatternCard';
import { ProgressPathCard } from '@/components/astrology/ProgressPathCard';
import { DailyOraclePulse } from '@/components/astrology/DailyOraclePulse';
import { PatternMirrorPanel } from '@/components/astrology/PatternMirrorPanel';

import { DeepDivePanel } from '@/components/DeepDivePanel';
import { useInterpretations } from '@/hooks/useInterpretations';
import { useForecast } from '@/hooks/useForecast';
import { useTransits } from '@/hooks/useTransits';
import { usePressureWindow } from '@/hooks/usePressureWindow';
import { useDomainForecast } from '@/hooks/useDomainForecast';
import { useLifeArc } from '@/hooks/useLifeArc';
import { useWeeklyForecast } from '@/hooks/useWeeklyForecast';
import { useStorms } from '@/hooks/useStorms';
import { useReturns } from '@/hooks/useReturns';
import { shouldShowAnnualBriefing } from '@/lib/astrology/returns-display';
import { useCheckins } from '@/hooks/useCheckins';
import { usePersonality } from '@/hooks/usePersonality';
import { useOraclePreferences } from '@/hooks/useOraclePreferences';
import { useAtmosphere } from '@/hooks/useAtmosphere';
import {
  computeAtmosphereFromDashboardSources,
  buildAtmosphereRenderedDetail,
  buildLifeWeatherBrief,
  getTodayCheckinEntry,
  isAtmosphereEngineV1Enabled,
  resolveAtmosphereSourceEvent,
  resolveLegacyCosmicWeatherIntensity,
} from '@/lib/atmosphere';
import { useAtmosphereJournal } from '@/hooks/useAtmosphereJournal';
import { useTodayMoveMemory } from '@/hooks/useTodayMoveMemory';
import {
  preservePriorWeatherWindow,
  writeWeatherWindowSnapshot,
} from '@/lib/atmosphere/window-land';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';
import { clearSubscriptionTierClientCache } from '@/lib/subscription-tier-client';
import { useProphecy, type ProphecyEra, type ProphecyStyle } from '@/hooks/useProphecy';
import { BirthData, BirthChartData } from '@/components/astrology/BirthChartCalculator';
import { GeocodingService } from '@/lib/astrology/geocoding';
import type { SynastryReport } from '@/lib/astrology/synastry';
import { useUser } from '@clerk/nextjs';
import { resolveClerkFirstName } from '@/lib/auth/clerk-display-name';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, RefreshCcw, ScrollText } from 'lucide-react';
import type { ChartData } from '@/lib/astrology/newWheelTypes';
import type { ProphecyPolishMode } from '@/lib/prophecy-polish';
import {
  buildSparklinePoints,
  getCalibrationImpact,
  getCalibrationStability,
  getLatestCalibrationComparison,
  getRecentImpactSeries,
  getTopMover,
  parseCalibrationHistoryDays,
  parseCalibrationSortMode,
  sortCalibrationHistory,
  type CalibrationHistoryEntry,
  type CalibrationSortMode,
} from '@/lib/dashboard/calibration-history';
import {
  DASHBOARD_MODULES_STORAGE_KEY,
  DEFAULT_MODULE_PREFERENCES,
  parseDashboardModulePreferences,
  type DashboardModulePreferences,
} from '@/lib/dashboard/module-preferences';
import { getMBTITypeDescription, applyMBTIOverlay, type MBTIType } from '@/lib/mbti-overlay';
import { globalAudioManager } from '@/lib/global-audio-manager';
import { buildIdentityPacket, resolveSelfMbtiType } from '@/lib/self';
import { buildBlendSynthesis } from '@/lib/personality/mbti-blend-synthesis';
import { derivePersonalityFromChart } from '@/lib/personality/dual-overlay';
import {
  clearChartSession,
  readChartSession,
  writeChartSession,
} from '@/lib/dashboard/chart-session';


const ONBOARDING_STORAGE_KEY = 'merlin_dashboard_onboarding_complete_v1';
const DAILY_STREAK_LAST_KEY = 'merlin_daily_checkin_last';
const DAILY_STREAK_COUNT_KEY = 'merlin_daily_checkin_count';
const DASHBOARD_EVENTS_KEY = 'merlin_dashboard_events_v1';
const FIRST_CHART_KEY = 'merlin_first_chart_completed_at';
const FIRST_ASK_KEY = 'merlin_first_ask_completed_at';
const MAX_DASHBOARD_EVENTS = 40;
const WEEKLY_RESET_PROMPT_KEY = 'merlin_weekly_reset_prompt_seen';
const DAILY_RITUAL_DISMISSED_KEY = 'merlin_daily_ritual_dismissed_v1';
const CALIBRATION_HISTORY_DAYS_KEY = 'merlin_calibration_history_days';
const CALIBRATION_SORT_MODE_KEY = 'merlin_calibration_sort_mode';

type DashboardEvent = {
  eventName: string;
  at: string;
  detail: Record<string, unknown>;
};

export default function UnifiedDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  /** Clerk profile first name for Today greeting — never a hardcoded example name */
  const clerkFirstName = React.useMemo(() => resolveClerkFirstName(user), [user]);
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [chartData, setChartData] = useState<BirthChartData | null>(null);
  const [wheelData, setWheelData] = useState<ChartData | null>(null);
  const [chartQuota, setChartQuota] = useState<{
    limit: number;
    used: number;
    remaining: number;
  } | null>(null);
  const [activeSection, setActiveSection] = useState<'wheel' | 'interpretation' | 'forecast' | 'transits' | 'lifearc' | 'personality' | 'stormradar'>('wheel');
  // Life Arc mode removed - now just raw timeline
  const [lifeArcView, setLifeArcView] = useState<'timeline' | 'prose'>('timeline');
  const [interpretMode, setInterpretMode] = useState<'grok' | 'traditional'>('grok');
  const [noBullshit, setNoBullshit] = useState(false);
  const [oracleChatOpen, setOracleChatOpen] = useState(false);
  const [modulePreferences, setModulePreferences] = useState<DashboardModulePreferences>(DEFAULT_MODULE_PREFERENCES);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [userId, setUserId] = useState('');
  const [questLogEnabled, setQuestLogEnabled] = useState(true); // ON by default
  const [clarityMode, setClarityMode] = useState(true); // Plain English mode — ON by default
  const focusPanelRef = useRef<HTMLDivElement | null>(null);
  const chartSectionRef = useRef<HTMLDivElement | null>(null);
  const chartOverviewRef = useRef<HTMLDivElement | null>(null);
  const identitySectionRef = useRef<HTMLDivElement | null>(null);
  const weeklySectionRef = useRef<HTMLDivElement | null>(null);
  const personalitySectionRef = useRef<HTMLDivElement | null>(null);

  const storySectionRef = useRef<HTMLDivElement | null>(null);
  const oracleSectionRef = useRef<HTMLDivElement | null>(null);
  const detailsSectionRef = useRef<HTMLDivElement | null>(null);
  const ritualSectionRef = useRef<HTMLDivElement | null>(null);
  const numerologyBlueprintRef = useRef<HTMLDivElement | null>(null);
  const numerologyCyclesRef = useRef<HTMLDivElement | null>(null);
  const numerologyBlendRef = useRef<HTMLDivElement | null>(null);
  const stormSectionRef = useRef<HTMLDivElement | null>(null);
  const relationshipsSectionRef = useRef<HTMLDivElement | null>(null);
  const prophecySectionRef = useRef<HTMLDivElement | null>(null);
  const hasRestoredPersistedDataRef = useRef(false);
  const [compactMode, setCompactMode] = useState(true);
  const [dashboardTab, setDashboardTab] = useState<DashboardExperienceTab>('home');
  const [wheelDetailTab, setWheelDetailTab] = useState<WheelDetailTab>('astrology');
  const [selectedWheelPlanet, setSelectedWheelPlanet] = useState<string | null>(null);
  const [selectedWheelSign, setSelectedWheelSign] = useState<ZodiacSignName | null>(null);
  const [showDeepDive, setShowDeepDive] = useState(false);
  /** Self · You: chart detail & more modules start collapsed so identity stays the hero */
  const [selfChartDepthOpen, setSelfChartDepthOpen] = useState(false);
  const [selfMoreOpen, setSelfMoreOpen] = useState(false);
  /** Weather · Forecast: risk radar hero; storms open; story/oracle/analysis optional */
  const [forecastDepthOpen, setForecastDepthOpen] = useState(false);
  const [forecastRadarOpen, setForecastRadarOpen] = useState(true);
  const [forecastOracleOpen, setForecastOracleOpen] = useState(false);
  const [forecastAnalysisOpen, setForecastAnalysisOpen] = useState(false);
  /** Shared date for storm playbook + 7-day timeline ('all' | YYYY-MM-DD) */
  const [horizonSelectedDate, setHorizonSelectedDate] = useState<string>('all');
  const [showWeeklyForecastPanel, setShowWeeklyForecastPanel] = useState(false);
  const [showPersonalityCardsPanel, setShowPersonalityCardsPanel] = useState(false);
  const [identityPack, setIdentityPack] = useState<{ archetypeName?: string; patternSignature?: string; coreContradiction?: string } | null>(null);
  const [progression, setProgression] = useState<{ arcPath?: string; arcLevel?: number; arcXp?: number; interactionCount?: number } | null>(null);
  const [dailyOracle, setDailyOracle] = useState<{
    message?: string;
    dayRating?: string;
    /** Local calendar day this pulse was built for (YYYY-MM-DD) */
    date?: string;
    dominantPattern?: {
      label?: string;
      trendStatus?: 'rising' | 'stable' | 'fading' | 'new';
    } | null;
  } | null>(null);
  const [dailyOracleLoading, setDailyOracleLoading] = useState(false);
  const dailyOracleDayRef = useRef<string | null>(null);
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
  const [showDailyRitualPrompt, setShowDailyRitualPrompt] = useState(false);
  const [prophecyStyle, setProphecyStyle] = useState<ProphecyStyle>('omen');
  const [prophecyEra, setProphecyEra] = useState<ProphecyEra>('babylonian');
  const [strictMeter, setStrictMeter] = useState(false);
  const [prophecyPolishMode, setProphecyPolishMode] = useState<ProphecyPolishMode>('engine');
  const [calibrationRecomputing, setCalibrationRecomputing] = useState(false);
  const [calibrationStatus, setCalibrationStatus] = useState<string>('');
  const [calibrationHistoryLoading, setCalibrationHistoryLoading] = useState(false);
  const [calibrationHistoryDays, setCalibrationHistoryDays] = useState<7 | 30 | 90>(30);
  const [calibrationSortMode, setCalibrationSortMode] = useState<CalibrationSortMode>('recent');
  const [calibrationHistory, setCalibrationHistory] = useState<CalibrationHistoryEntry[]>([]);
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
  const [navigatorCollapsed, setNavigatorCollapsed] = useState(false);
  const [homeForecastExpanded, setHomeForecastExpanded] = useState(false);
  const [forecastDetailsExpanded, setForecastDetailsExpanded] = useState(false);
  const [activeContextSection, setActiveContextSection] = useState<ContextNavSection>('story');
  const { tier, featureFlags, premiumLocked, refreshTier, loading: tierLoading, error: tierError } = useSubscriptionTier(user, isLoaded);
  const premiumHydrationKeyRef = useRef<string | null>(null);
  const checkoutHandledRef = useRef(false);
  const atmosphereTelemetryKeyRef = useRef<string | null>(null);
  const [atmosphereHeroSeen, setAtmosphereHeroSeen] = useState(false);
  /** Local calendar day (YYYY-MM-DD) — weather rehydrates when this rolls over */
  const [localCalendarDay, setLocalCalendarDay] = useState(() => {
    if (typeof window === 'undefined') return '';
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (!isLoaded || !userId || typeof window === 'undefined') return;
    if (checkoutHandledRef.current) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('success') !== 'true') return;

    checkoutHandledRef.current = true;
    clearSubscriptionTierClientCache(userId);
    premiumHydrationKeyRef.current = null;

    void refreshTier().then(() => {
      const isTrial = params.get('trial') === 'true';
      const isLifetime = params.get('lifetime') === 'true';

      toast({
        title: isLifetime
          ? 'Lifetime access unlocked'
          : isTrial
            ? 'Trial started'
            : 'Premium unlocked',
        description: isLifetime
          ? 'Welcome to Merlin Premium — forever.'
          : isTrial
            ? 'Your 7-day premium trial is active.'
            : 'Your subscription is active.',
      });

      const cleanUrl = new URL(window.location.href);
      ['success', 'trial', 'lifetime', 'date', 'time', 'city', 'canceled'].forEach((key) =>
        cleanUrl.searchParams.delete(key)
      );
      router.replace(cleanUrl.pathname + (cleanUrl.search || ''), { scroll: false });
    });
  }, [isLoaded, refreshTier, router, toast, userId]);

  // Call ALL hooks BEFORE any early returns - this is critical for React rules of hooks
  const { interpretations, loading: interpretLoading, cacheHit, generateInterpretations } = useInterpretations();
  const {
    forecast,
    loading: forecastLoading,
    error: forecastError,
    calculateForecast,
    reset: resetForecast,
  } = useForecast();
  const { transits, loading: transitsLoading, calculateTransits } = useTransits();
  const {
    pressureWindow,
    loading: pressureWindowLoading,
    error: pressureWindowError,
    calculatePressureWindow,
  } = usePressureWindow();
  const {
    forecast: domainForecast,
    loading: domainForecastLoading,
    error: domainForecastError,
    calculateDomainForecast,
  } = useDomainForecast();
  const { lifeArc, loading: lifeArcLoading, calculateLifeArc } = useLifeArc();
  const { weeklyForecast, loading: weeklyLoading, error: weeklyError, calculateWeeklyForecast } = useWeeklyForecast();
  const { stormsReport, loading: stormsLoading, calculateStorms } = useStorms();
  const { returnsPacket, loading: returnsLoading, calculateReturns } = useReturns();
  const {
    submitCheckin,
    entries: checkinEntries,
    loading: checkinHistoryLoading,
    loadHistory: loadCheckinHistory,
  } = useCheckins();
  const {
    optIn: journalOptIn,
    text: journalText,
    setOptIn: setJournalOptIn,
    setText: setJournalText,
  } = useAtmosphereJournal(forecast?.date);
  const { memory: todayMoveMemory, remember: rememberTodayMove } = useTodayMoveMemory(userId || undefined);
  const { mbtiType, dualOverlay, loading: personalityLoading, applyChartPersonality, reset: resetPersonality } = usePersonality();
  const { preferences: oraclePreferences, persistPreferences } = useOraclePreferences({
    enabled: Boolean(userId),
  });
  const retrogradeOverlay = oraclePreferences.retrogradeOverlay;
  const retrogradeOverlayRef = useRef(retrogradeOverlay);
  retrogradeOverlayRef.current = retrogradeOverlay;
  const atmosphereEngineEnabled = isAtmosphereEngineV1Enabled({
    premium: featureFlags.premiumInsights,
  });
  const {
    atmosphere,
    loading: atmosphereLoading,
    error: atmosphereError,
    calculateAtmosphere,
    reset: resetAtmosphere,
  } = useAtmosphere();
  const {
    prophecy,
    history: prophecyHistory,
    loading: prophecyLoading,
    historyLoading: prophecyHistoryLoading,
    generateProphecy,
    loadHistory,
    markHistoryFulfilled,
  } = useProphecy();
  
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
    const savedProphecyPolish = localStorage.getItem('merlin_prophecy_polish_mode');
    if (savedProphecyPolish === 'engine' || savedProphecyPolish === 'groq') {
      setProphecyPolishMode(savedProphecyPolish);
    }

    const savedCalibrationDays = parseCalibrationHistoryDays(localStorage.getItem(CALIBRATION_HISTORY_DAYS_KEY));
    if (savedCalibrationDays) setCalibrationHistoryDays(savedCalibrationDays);

    const savedCalibrationSort = parseCalibrationSortMode(localStorage.getItem(CALIBRATION_SORT_MODE_KEY));
    if (savedCalibrationSort) setCalibrationSortMode(savedCalibrationSort);

    setModulePreferences(parseDashboardModulePreferences(localStorage.getItem(DASHBOARD_MODULES_STORAGE_KEY)));
  }, []);

  useEffect(() => {
    localStorage.setItem(CALIBRATION_HISTORY_DAYS_KEY, String(calibrationHistoryDays));
  }, [calibrationHistoryDays]);

  useEffect(() => {
    localStorage.setItem(CALIBRATION_SORT_MODE_KEY, calibrationSortMode);
  }, [calibrationSortMode]);

  useEffect(() => {
    localStorage.setItem(DASHBOARD_MODULES_STORAGE_KEY, JSON.stringify(modulePreferences));
  }, [modulePreferences]);

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
        if (preferences?.prophecyPolishMode === 'engine' || preferences?.prophecyPolishMode === 'groq') {
          setProphecyPolishMode(preferences.prophecyPolishMode);
          localStorage.setItem('merlin_prophecy_polish_mode', preferences.prophecyPolishMode);
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

  const calibrationHistorySorted = sortCalibrationHistory(calibrationHistory, calibrationSortMode);
  const latestCalibrationComparison = getLatestCalibrationComparison(calibrationHistory);
  const calibrationImpactSeries = getRecentImpactSeries(calibrationHistory, 8);
  const calibrationImpactSparkline = buildSparklinePoints(calibrationImpactSeries, 110, 24, 2);
  const latestImpact = calibrationImpactSeries.length ? calibrationImpactSeries[calibrationImpactSeries.length - 1] : 0;
  const previousImpact = calibrationImpactSeries.length > 1 ? calibrationImpactSeries[calibrationImpactSeries.length - 2] : null;
  const impactTrendDelta = previousImpact === null ? null : latestImpact - previousImpact;
  const impactStability = getCalibrationStability(calibrationImpactSeries);
  const impactStabilityHelp = `Stability uses normalized step variance across recent impact points. Current: ${(impactStability.normalizedStepChange * 100).toFixed(0)}%. Stable <= 18%, Settling <= 38%, Volatile > 38%.`;

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

  const loadCalibrationHistory = useCallback(
    async (days: 7 | 30 | 90) => {
      setCalibrationHistoryLoading(true);
      try {
        const response = await fetch(`/api/calibration/history?days=${days}`);
        const result = await response.json();
        if (response.ok && result?.success) {
          setCalibrationHistory(Array.isArray(result?.data?.entries) ? result.data.entries : []);
        }
      } catch {
        // Non-blocking history panel.
      } finally {
        setCalibrationHistoryLoading(false);
      }
    },
    []
  );

  const recomputeCalibration = useCallback(async () => {
    if (!userId) return;

    setCalibrationRecomputing(true);
    setCalibrationStatus('');

    try {
      appendDashboardEvent('dashboard_calibration_recompute_triggered', {
        days: 90,
        minSamples: 3,
      });

      const response = await fetch('/api/calibration/recompute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 90, minSamples: 3 }),
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || response.statusText || 'Calibration recompute failed');
      }

      const strongest = result?.data?.strongestModifier;
      setCalibrationStatus(
        strongest
          ? `Calibration updated: strongest modifier ${strongest.planet} ${strongest.multiplier.toFixed(2)}x`
          : 'Calibration updated: no strong modifier changes yet'
      );

      if (birthData) {
        await Promise.all([
          calculateTransits(birthData, { mbtiType: mbtiType || undefined, userId: userId || undefined }),
          calculatePressureWindow(birthData, { mbtiType: mbtiType || undefined, userId: userId || undefined }),
          calculateDomainForecast(birthData, { mbtiType: mbtiType || undefined, userId: userId || undefined }),
        ]);
      }

      await loadCalibrationHistory(calibrationHistoryDays);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown calibration error';
      setCalibrationStatus(`Calibration update failed: ${message}`);
    } finally {
      setCalibrationRecomputing(false);
    }
  }, [
    appendDashboardEvent,
    birthData,
    calculateDomainForecast,
    calculatePressureWindow,
    calculateTransits,
    calibrationHistoryDays,
    loadCalibrationHistory,
    mbtiType,
    userId,
  ]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      toast({
        title: 'Sign-in required',
        description: 'Please sign in to open your dashboard.',
        variant: 'destructive',
      });
      router.replace('/sign-in?redirect_url=' + encodeURIComponent('/dashboard'));
    } else {
      // Set userId from Clerk user
      setUserId(user.id || `user-${Date.now()}`);
    }
  }, [isLoaded, user, router, toast]);

  useEffect(() => {
    const loadIdentityFromContext = async () => {
      if (!userId || !featureFlags.persistenceEnabled) return;
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
  }, [featureFlags.persistenceEnabled, userId]);

  useEffect(() => {
    const ensureIdentityPack = async () => {
      if (!userId || !chartData || !featureFlags.persistenceEnabled) return;
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
  }, [featureFlags.persistenceEnabled, userId, chartData, mbtiType]);

  const fetchPatternMirror = useCallback(async () => {
    if (!userId || !featureFlags.persistenceEnabled) return;
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
  }, [featureFlags.persistenceEnabled, userId]);

  const fetchDailyOracle = useCallback(async (truthBomb = false) => {
    // Free freemium + paid both get a day pulse — do not gate on paid-only persistence.
    if (!chartData) return;
    const clientDate =
      localCalendarDay ||
      (() => {
        const n = new Date();
        return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
      })();

    // Skip redundant auto-fetch if we already hold today's pulse (manual truthBomb always runs).
    if (!truthBomb && dailyOracleDayRef.current === clientDate && dailyOracle?.date === clientDate) {
      return;
    }

    const previousDay = dailyOracleDayRef.current;
    // Reserve this day immediately so day-rollover effect doesn't double-fire.
    if (!truthBomb) {
      dailyOracleDayRef.current = clientDate;
    }

    setDailyOracleLoading(true);
    try {
      const response = await fetch('/api/daily-oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || undefined,
          birthChart: chartData,
          truthBomb,
          clientDate,
        }),
      });
      if (!response.ok) {
        if (!truthBomb) dailyOracleDayRef.current = previousDay;
        return;
      }
      const result = await response.json();
      if (result?.success && result?.data) {
        const pulseDate = result.data.date || clientDate;
        dailyOracleDayRef.current = pulseDate;
        setDailyOracle({
          message: result.data.message,
          dayRating: result.data.dayRating,
          date: pulseDate,
          dominantPattern: result.data.dominantPattern
            ? {
                label: result.data.dominantPattern.label,
                trendStatus: result.data.dominantPattern.trendStatus,
              }
            : null,
        });
        if (featureFlags.persistenceEnabled) {
          fetchPatternMirror();
        }
      } else if (!truthBomb) {
        dailyOracleDayRef.current = previousDay;
      }
    } catch {
      if (!truthBomb) dailyOracleDayRef.current = previousDay;
      // Daily oracle is a non-blocking enhancement.
    } finally {
      setDailyOracleLoading(false);
    }
  }, [
    chartData,
    dailyOracle?.date,
    featureFlags.persistenceEnabled,
    localCalendarDay,
    userId,
    fetchPatternMirror,
  ]);

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

  // Refetch Daily Oracle when chart loads or local calendar day rolls over
  useEffect(() => {
    if (!chartData || !localCalendarDay) return;
    if (dailyOracleDayRef.current === localCalendarDay) return;
    // Day changed — clear yesterday's pulse so UI doesn't keep a stale monologue
    setDailyOracle(null);
    void fetchDailyOracle(false);
  }, [chartData, localCalendarDay, fetchDailyOracle]);

  // Auto-generate once per chart/style/era combo — never fight a user regenerate.
  const prophecyAutoKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!chartData || !featureFlags.premiumInsights) return;
    const chartKey =
      (chartData as { jd?: number }).jd ||
      chartData.planets?.map((p) => `${p.name}:${p.sign}`).join('|') ||
      'chart';
    const autoKey = `${chartKey}|${prophecyStyle}|${prophecyEra}|${strictMeter}|${prophecyPolishMode}`;
    if (prophecyAutoKeyRef.current === autoKey) return;
    prophecyAutoKeyRef.current = autoKey;
    generateProphecy({
      birthChart: chartData,
      style: prophecyStyle,
      era: prophecyEra,
      strictMeter,
      saveToHistory: false,
      polishMode: prophecyPolishMode,
      // Day salt so opening the app on a new day can yield a fresh baseline reading
      seedSalt: `auto-${new Date().toISOString().slice(0, 10)}-${autoKey.slice(0, 48)}`,
    });
  }, [chartData, featureFlags.premiumInsights, prophecyStyle, prophecyEra, strictMeter, prophecyPolishMode, generateProphecy]);

  useEffect(() => {
    if (!userId || !featureFlags.persistenceEnabled) return;
    loadHistory();
  }, [featureFlags.persistenceEnabled, userId, loadHistory]);

  const handlePrintProphecy = useCallback(() => {
    if (!prophecy?.prophecy) return;

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!printWindow) return;

    const escapedTitle = prophecy.title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedBody = prophecy.prophecy.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');

    printWindow.document.write(`
      <html>
        <head>
          <title>${escapedTitle}</title>
          <style>
            body { font-family: Georgia, serif; padding: 32px; color: #111827; }
            h1 { font-size: 24px; margin-bottom: 12px; }
            .meta { font-size: 12px; color: #4b5563; margin-bottom: 18px; }
            .content { line-height: 1.8; white-space: normal; }
          </style>
        </head>
        <body>
          <h1>${escapedTitle}</h1>
          <p class="meta">Style: ${prophecy.style} | Era: ${prophecy.era}</p>
          <div class="content">${escapedBody}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 150);
  }, [prophecy]);

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
        void submitCheckin({
          mood: 6,
          stress: 5,
          energy: 6,
          confidence: 6,
          domains: {
            self: 6,
            career: 5,
          },
          notes: 'Auto check-in from dashboard streak refresh.',
          timestamp: today.toISOString(),
        });
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
        const firstChartSource =
          ((chartData as any)?.metadata?.ephemeris as string | undefined) ||
          (((chartData as any)?.metadata?.calculationSource as string | undefined) === 'swiss-real'
            ? 'Swiss real'
            : ((chartData as any)?.metadata?.calculationSource as string | undefined) === 'mock-fallback'
              ? 'Mock'
              : 'unknown');
        localStorage.setItem(FIRST_CHART_KEY, today.toISOString());
        appendDashboardEvent('dashboard_first_chart_completed', { source: firstChartSource });
      }
    } catch {
      // localStorage failures should never block the dashboard
    }
  }, [chartData, appendDashboardEvent, submitCheckin]);

  useEffect(() => {
    if (!chartData || !modulePreferences.returnLoop) {
      setShowDailyRitualPrompt(false);
      return;
    }

    try {
      const today = new Date().toISOString().slice(0, 10);
      const dismissed = localStorage.getItem(DAILY_RITUAL_DISMISSED_KEY);
      setShowDailyRitualPrompt(dismissed !== today);
    } catch {
      setShowDailyRitualPrompt(true);
    }
  }, [chartData, modulePreferences.returnLoop]);

  useEffect(() => {
    if (!chartData || !featureFlags.persistenceEnabled) return;
    void loadCheckinHistory({ days: 14 });
  }, [chartData, featureFlags.persistenceEnabled, loadCheckinHistory]);

  useEffect(() => {
    if (!chartData || !featureFlags.persistenceEnabled) return;

    void loadCalibrationHistory(calibrationHistoryDays);
  }, [chartData, calibrationHistoryDays, featureFlags.persistenceEnabled, loadCalibrationHistory]);

  useEffect(() => {
    if (!userId || !featureFlags.persistenceEnabled) return;
    fetchPatternMirror();
  }, [featureFlags.persistenceEnabled, userId, fetchPatternMirror]);

  // Chart rebuild allowance (lifetime per account)
  useEffect(() => {
    if (!isLoaded || !userId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/chart-quota', { cache: 'no-store', credentials: 'same-origin' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.success && data.quota) {
          setChartQuota({
            limit: data.quota.limit,
            used: data.quota.used,
            remaining: data.quota.remaining,
          });
        }
      } catch {
        // UI badge only — server still enforces.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId]);

  useEffect(() => {
    hasRestoredPersistedDataRef.current = false;
  }, [userId]);

  // Load persisted data per signed-in user — never a shared browser chart.
  useEffect(() => {
    if (!isLoaded || !userId || hasRestoredPersistedDataRef.current) return;

    hasRestoredPersistedDataRef.current = true;

    try {
      const { chartRaw: savedChart, birthRaw: savedBirth } = readChartSession(userId);
      
      if (savedChart && savedBirth) {
        const chart = JSON.parse(savedChart);
        const birth = JSON.parse(savedBirth);
        
        // Auto-clear stale mock data (forces fresh Swiss calculation)
        const isMockData = (chart?.metadata?.calculationSource === 'mock-fallback' || 
                           chart?.metadata?.ephemeris === 'Mock');
        if (isMockData) {
          console.log('[Dashboard] Clearing stale mock data, forcing fresh calculation...');
          clearChartSession(userId);
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

        const derivedMbti = applyChartPersonality(chart, {
          retrogradeOverlay: retrogradeOverlayRef.current,
        });
        const canToday = featureFlags.premiumInsights || featureFlags.freemiumToday;
        const canFull = featureFlags.premiumInsights;

        // Freemium: free gets Today sample + chart personality; paid gets full suite.
        Promise.allSettled([
          canFull
            ? generateInterpretations(birth, interpretMode, { userId: userId || undefined, mbtiType: mbtiType || undefined })
            : Promise.resolve(null),
          canToday
            ? calculateForecast(birth, {
                mbtiType: derivedMbti || mbtiType || undefined,
                userId: userId || undefined,
              })
            : Promise.resolve(null),
          canFull
            ? calculateTransits(birth, { mbtiType: mbtiType || undefined, userId: userId || undefined })
            : Promise.resolve(null),
          canFull
            ? calculatePressureWindow(birth, { mbtiType: mbtiType || undefined, userId: userId || undefined })
            : Promise.resolve(null),
          canFull
            ? calculateDomainForecast(birth, { mbtiType: mbtiType || undefined, userId: userId || undefined })
            : Promise.resolve(null),
          canFull ? calculateLifeArc(birth, chart) : Promise.resolve(null),
          canFull ? calculateWeeklyForecast(birth) : Promise.resolve(null),
          canFull ? calculateStorms(birth, derivedMbti ?? undefined) : Promise.resolve(null),
          canFull ? calculateReturns(birth) : Promise.resolve(null),
          atmosphereEngineEnabled && canToday
            ? calculateAtmosphere(birth, {
                mbtiType: derivedMbti || mbtiType || undefined,
                userId: userId || undefined,
              })
            : Promise.resolve(null),
        ]).catch((e) => console.error('Error regenerating dashboard data:', e));
      } else {
        setChartData(null);
        setBirthData(null);
        setWheelData(null);
        resetPersonality();
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  }, [
    calculateDomainForecast,
    calculateForecast,
    calculateLifeArc,
    calculatePressureWindow,
    applyChartPersonality,
    calculateStorms,
    calculateReturns,
    calculateTransits,
    calculateWeeklyForecast,
    atmosphereEngineEnabled,
    calculateAtmosphere,
    featureFlags.freemiumToday,
    featureFlags.premiumInsights,
    generateInterpretations,
    interpretMode,
    isLoaded,
    mbtiType,
    resetPersonality,
    userId,
  ]);

  useEffect(() => {
    if (!chartData) return;
    applyChartPersonality(chartData, { retrogradeOverlay });
  }, [applyChartPersonality, chartData, retrogradeOverlay]);

  // Keep local calendar day fresh (tab focus + midnight) so weather isn't stuck on yesterday
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncLocalDay = () => {
      const n = new Date();
      const day = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
      setLocalCalendarDay((prev) => (prev === day ? prev : day));
    };

    syncLocalDay();
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncLocalDay();
    };
    window.addEventListener('focus', syncLocalDay);
    document.addEventListener('visibilitychange', onVisible);

    // Fire shortly after local midnight, then every minute as a backstop
    let midnightTimer: ReturnType<typeof setTimeout> | null = null;
    const armMidnight = () => {
      const n = new Date();
      const next = new Date(n);
      next.setHours(24, 0, 5, 0);
      midnightTimer = setTimeout(() => {
        syncLocalDay();
        armMidnight();
      }, Math.max(1000, next.getTime() - n.getTime()));
    };
    armMidnight();
    const minuteTick = setInterval(syncLocalDay, 60_000);

    return () => {
      window.removeEventListener('focus', syncLocalDay);
      document.removeEventListener('visibilitychange', onVisible);
      if (midnightTimer) clearTimeout(midnightTimer);
      clearInterval(minuteTick);
    };
  }, []);

  useEffect(() => {
    const canToday = featureFlags.premiumInsights || featureFlags.freemiumToday;
    const canFull = featureFlags.premiumInsights;
    if (!canToday || !birthData || !chartData) return;
    if (!localCalendarDay) return;

    // Include local calendar day so Aug 5 → Aug 6 always re-fetches weather
    const hydrationKey = `${tier}:${canFull ? 'full' : 'today'}:${birthData.date}:${birthData.time}:${localCalendarDay}`;
    if (premiumHydrationKeyRef.current === hydrationKey) return;

    const previousKey = premiumHydrationKeyRef.current;
    premiumHydrationKeyRef.current = hydrationKey;

    // Day roll-over (or first load after day change): clear stale day packets so UI
    // doesn't paint yesterday while the new day is in flight
    if (previousKey && !previousKey.endsWith(`:${localCalendarDay}`)) {
      resetForecast();
      resetAtmosphere();
    }

    const derivedMbti = applyChartPersonality(chartData, {
      retrogradeOverlay: retrogradeOverlayRef.current,
    });

    Promise.allSettled([
      canFull
        ? generateInterpretations(birthData, interpretMode, {
            userId: userId || undefined,
            mbtiType: derivedMbti || mbtiType || undefined,
          })
        : Promise.resolve(null),
      calculateForecast(birthData, {
        mbtiType: derivedMbti || mbtiType || undefined,
        userId: userId || undefined,
      }),
      canFull
        ? calculateTransits(birthData, {
            mbtiType: derivedMbti || mbtiType || undefined,
            userId: userId || undefined,
          })
        : Promise.resolve(null),
      canFull
        ? calculatePressureWindow(birthData, {
            mbtiType: derivedMbti || mbtiType || undefined,
            userId: userId || undefined,
          })
        : Promise.resolve(null),
      canFull
        ? calculateDomainForecast(birthData, {
            mbtiType: derivedMbti || mbtiType || undefined,
            userId: userId || undefined,
          })
        : Promise.resolve(null),
      canFull ? calculateLifeArc(birthData, chartData) : Promise.resolve(null),
      canFull ? calculateWeeklyForecast(birthData) : Promise.resolve(null),
      canFull ? calculateStorms(birthData, derivedMbti ?? undefined) : Promise.resolve(null),
      canFull ? calculateReturns(birthData) : Promise.resolve(null),
      atmosphereEngineEnabled
        ? calculateAtmosphere(birthData, {
            mbtiType: derivedMbti || mbtiType || undefined,
            userId: userId || undefined,
            clientDate: localCalendarDay,
          })
        : Promise.resolve(null),
    ]).catch((error) => console.error('Error hydrating dashboard weather data:', error));
  }, [
    applyChartPersonality,
    birthData,
    calculateDomainForecast,
    calculateForecast,
    calculateLifeArc,
    calculatePressureWindow,
    calculateStorms,
    calculateReturns,
    calculateTransits,
    calculateWeeklyForecast,
    atmosphereEngineEnabled,
    calculateAtmosphere,
    chartData,
    featureFlags.freemiumToday,
    featureFlags.premiumInsights,
    generateInterpretations,
    interpretMode,
    localCalendarDay,
    mbtiType,
    resetAtmosphere,
    resetForecast,
    tier,
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

    try {
      if (userId) {
        writeChartSession(userId, JSON.stringify(data), JSON.stringify(derived));
      }
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
    setSelectedWheelPlanet(null);
    setSelectedWheelSign(null);

    const derivedMbti = applyChartPersonality(data, {
      retrogradeOverlay: retrogradeOverlayRef.current,
    });
    const canToday = featureFlags.premiumInsights || featureFlags.freemiumToday;
    const canFull = featureFlags.premiumInsights;

    // Fire off async jobs (freemium: Today sample; paid: full suite)
    Promise.allSettled([
      canFull
        ? generateInterpretations(derived, interpretMode, {
            userId: userId || undefined,
            mbtiType: mbtiType || undefined,
          })
        : Promise.resolve(null),
      canToday
        ? calculateForecast(derived, {
            mbtiType: derivedMbti || mbtiType || undefined,
            userId: userId || undefined,
          })
        : Promise.resolve(null),
      canFull
        ? calculateTransits(derived, { mbtiType: mbtiType || undefined, userId: userId || undefined })
        : Promise.resolve(null),
      canFull
        ? calculatePressureWindow(derived, { mbtiType: mbtiType || undefined, userId: userId || undefined })
        : Promise.resolve(null),
      canFull
        ? calculateDomainForecast(derived, { mbtiType: mbtiType || undefined, userId: userId || undefined })
        : Promise.resolve(null),
      canFull ? calculateLifeArc(derived, data) : Promise.resolve(null),
      canFull ? calculateWeeklyForecast(derived) : Promise.resolve(null),
      canFull ? calculateStorms(derived, derivedMbti ?? undefined) : Promise.resolve(null),
      canFull ? calculateReturns(derived) : Promise.resolve(null),
      atmosphereEngineEnabled && canToday
        ? calculateAtmosphere(derived, {
            mbtiType: derivedMbti || mbtiType || undefined,
            userId: userId || undefined,
          })
        : Promise.resolve(null),
    ]).catch((e) => console.error('Error generating dashboard data:', e));
  }, [
    generateInterpretations,
    calculateDomainForecast,
    calculateForecast,
    calculateTransits,
    calculatePressureWindow,
    calculateLifeArc,
    calculateWeeklyForecast,
    applyChartPersonality,
    calculateStorms,
    calculateReturns,
    atmosphereEngineEnabled,
    calculateAtmosphere,
    featureFlags.freemiumToday,
    featureFlags.premiumInsights,
    interpretMode,
    mbtiType,
    userId,
  ]);

  // Build the read-aloud text (used by MerlinAudioPlayer) — must be before early returns
  const readAloudText = React.useMemo(() => {
    const sections: string[] = [];

    if (interpretations?.chartSummary) {
      sections.push(interpretations.chartSummary);
    }

    if (interpretations?.synthesis?.unifiedReading) {
      sections.push(interpretations.synthesis.unifiedReading);
    }

    if (forecast?.summary) {
      sections.push(`Today's forecast: ${forecast.summary}`);
    }

    if (chartData?.planets?.length) {
      const sun = chartData.planets.find((p: any) => p.name === 'Sun');
      const moon = chartData.planets.find((p: any) => p.name === 'Moon');
      const mercury = chartData.planets.find((p: any) => p.name === 'Mercury');
      const venus = chartData.planets.find((p: any) => p.name === 'Venus');
      const mars = chartData.planets.find((p: any) => p.name === 'Mars');
      const ascSign = (chartData as any)?.ascendant?.sign as string | undefined;
      const mcSign = (chartData as any)?.midheaven?.sign as string | undefined;

      const corePlacements: string[] = [];
      if (sun?.sign) corePlacements.push(`Sun in ${sun.sign}`);
      if (moon?.sign) corePlacements.push(`Moon in ${moon.sign}`);
      if (ascSign) corePlacements.push(`Rising in ${ascSign}`);
      if (mercury?.sign) corePlacements.push(`Mercury in ${mercury.sign}`);
      if (venus?.sign) corePlacements.push(`Venus in ${venus.sign}`);
      if (mars?.sign) corePlacements.push(`Mars in ${mars.sign}`);

      if (corePlacements.length) {
        sections.push(`Core placements: ${corePlacements.join(', ')}.`);
      }

      const topAspects = (chartData.aspects || [])
        .slice(0, 4)
        .map((aspect: any) => {
          const planet1 = aspect?.planet1?.name || aspect?.planet1 || 'Planet';
          const planet2 = aspect?.planet2?.name || aspect?.planet2 || 'Planet';
          const aspectType = aspect?.type || aspect?.aspect || 'aspect';
          return `${planet1} ${aspectType} ${planet2}`;
        })
        .filter(Boolean);

      if (topAspects.length) {
        sections.push(`Primary chart dynamics: ${topAspects.join(', ')}.`);
      }

      const signToElement: Record<string, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
        Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water',
        Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water',
        Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water',
      };
      const elementCounts: Record<'Fire' | 'Earth' | 'Air' | 'Water', number> = {
        Fire: 0,
        Earth: 0,
        Air: 0,
        Water: 0,
      };
      const houseCounts = new Map<number, number>();

      chartData.planets.forEach((planet: any) => {
        const element = signToElement[planet?.sign as string];
        if (element) elementCounts[element] += 1;
        if (typeof planet?.house === 'number') {
          houseCounts.set(planet.house, (houseCounts.get(planet.house) || 0) + 1);
        }
      });

      const elementRanking = Object.entries(elementCounts)
        .sort((a, b) => b[1] - a[1])
        .filter(([, count]) => count > 0)
        .slice(0, 2)
        .map(([element, count]) => `${element} (${count})`);

      if (elementRanking.length) {
        sections.push(`Elemental climate: ${elementRanking.join(', ')} are leading in your chart right now.`);
      }

      const topHouses = Array.from(houseCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([house, count]) => `House ${house} (${count})`);

      if (topHouses.length) {
        sections.push(`Life areas emphasized: ${topHouses.join(', ')}.`);
      }

      if (ascSign || mcSign) {
        sections.push(`Angle signature: ${ascSign ? `Ascendant in ${ascSign}` : 'Ascendant unavailable'}${mcSign ? `, Midheaven in ${mcSign}` : ''}.`);
      }

      const guidance: string[] = [];
      if (moon?.sign) {
        guidance.push(`Emotionally, Moon in ${moon.sign} asks for depth before trust.`);
      }
      if (mercury?.sign) {
        guidance.push(`Mentally, Mercury in ${mercury.sign} thrives on detail and precision.`);
      }
      if (venus?.sign && mars?.sign) {
        guidance.push(`Relationally, Venus in ${venus.sign} and Mars in ${mars.sign} blend your attraction style with your action style.`);
      }
      if (guidance.length) {
        sections.push(`Practical guidance: ${guidance.slice(0, 3).join(' ')}`);
      }
    }

    if (mbtiType) {
      const mbtiDescriptor = getMBTITypeDescription(mbtiType as any);
      const hardwareType = dualOverlay?.hardware?.mbtiType;
      const firmwareType = dualOverlay?.firmware?.mbtiType;

      if (hardwareType && firmwareType && hardwareType !== firmwareType) {
        sections.push(`Personality architecture: outer mask ${hardwareType}, inner core ${firmwareType}. Final type ${mbtiType}. ${mbtiDescriptor}.`);
      } else {
        sections.push(`Personality lens: ${mbtiType}. ${mbtiDescriptor}.`);
      }

      const mbtiThemes = ['Transformation', 'Career', 'Relationships'];
      const mbtiOverlayLines = mbtiThemes
        .map((theme) => applyMBTIOverlay(theme, mbtiType as any))
        .filter(Boolean)
        .slice(0, 2);

      if (mbtiOverlayLines.length) {
        sections.push(`MBTI overlays: ${mbtiOverlayLines.join(' ')}`);
      }
    }

    const predictiveEvents = transits?.predictive?.events?.slice(0, 2) || [];
    if (predictiveEvents.length) {
      const predictiveLines = predictiveEvents.map((event) => {
        const timing = event?.timing?.phase ? `Phase: ${event.timing.phase}` : '';
        const mbtiMove = event?.mbtiLens?.bestMove24h ? `Best move: ${event.mbtiLens.bestMove24h}` : '';
        return `${event.transit.transitingPlanet} ${event.transit.aspect} ${event.transit.natalPlanet}. ${event.narrative?.whisper || ''} ${timing}. ${mbtiMove}`.trim();
      });
      sections.push(`Predictive storm layer: ${predictiveLines.join(' ')}`);
    }

    if (stormsReport?.weekSummary) {
      sections.push(`Storm radar summary: ${stormsReport.weekSummary}`);
    }

    if (lifeArc?.events?.length) {
      const lifeArcEvents = lifeArc.events
        .slice(0, 2)
        .map((event: any) => `${event.transitingPlanet} ${event.aspect} ${event.natalPlanet} around age ${event.age}`)
        .join(', ');
      sections.push(`Life timeline signals: ${lifeArcEvents}.`);
    }

    if (!sections.length) {
      if (premiumLocked) {
        return 'Your chart is calculated. Premium interpretation is currently locked, but Merlin can still read your core placements and major aspects once available in this session.';
      }
      return 'Your chart is ready, but there is no readable summary yet. Try recalculating your chart once.';
    }

    const tierOutro = premiumLocked
      ? 'This reading is generated from your live chart and MBTI lens in free mode.'
      : 'This reading blends your natal chart, MBTI architecture, and predictive storm layers.';

    return `${sections.join('\n\n')}\n\n${tierOutro}`;
  }, [
    interpretations,
    forecast,
    chartData,
    mbtiType,
    dualOverlay,
    transits,
    stormsReport,
    lifeArc,
    premiumLocked,
  ]);

  const queueAskContext = useCallback((label: string, prompt: string) => {
    setAskDraftLabel(label);
    setAskDraftPrompt(prompt);
    setAskDraftKey((prev) => prev + 1);
    setOracleChatOpen(true);
  }, []);

  const handlePrimaryAskMerlin = useCallback(() => {
    queueAskContext(
      askDraftLabel || 'Current chart context',
      askDraftPrompt || 'What should I pay attention to in my chart and current transits right now?'
    );
  }, [askDraftLabel, askDraftPrompt, queueAskContext]);

  const handleOnboardingDismiss = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // ignore persistence issues
    }
    appendDashboardEvent('dashboard_onboarding_dismissed');
    setShowOnboarding(false);
  }, [appendDashboardEvent]);

  const handleOnboardingComplete = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // ignore persistence issues
    }
    appendDashboardEvent('dashboard_onboarding_completed', {
      askedMerlin: hasAskedMerlin,
      allStepsComplete: true,
    });
    setShowOnboarding(false);
  }, [appendDashboardEvent, hasAskedMerlin]);

  const handleOnboardingNavigateChart = useCallback(() => {
    appendDashboardEvent('dashboard_onboarding_step', { step: 'chart' });
    setDashboardTab('chart');
    setTimeout(() => chartSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  }, [appendDashboardEvent]);

  const handleOnboardingNavigateForecast = useCallback(() => {
    appendDashboardEvent('dashboard_focus_view_opened', { view: 'forecast' });
    setDashboardTab('home');
    setTimeout(() => storySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  }, [appendDashboardEvent]);

  const handleOnboardingNavigateStormRadar = useCallback(() => {
    appendDashboardEvent('dashboard_focus_view_opened', { view: 'stormradar' });
    setDashboardTab('forecast');
    setActiveSection('stormradar');
    setTimeout(() => focusPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  }, [appendDashboardEvent]);

  const handleOnboardingNavigateAskMerlin = useCallback(() => {
    appendDashboardEvent('dashboard_onboarding_step', { step: 'ask-merlin' });
    handlePrimaryAskMerlin();
  }, [appendDashboardEvent, handlePrimaryAskMerlin]);

  const handleDismissDailyRitual = useCallback(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(DAILY_RITUAL_DISMISSED_KEY, today);
    } catch {
      // ignore persistence issues
    }
    appendDashboardEvent('dashboard_daily_ritual_dismissed');
    setShowDailyRitualPrompt(false);
  }, [appendDashboardEvent]);

  const handleDailyRitualOpenForecast = useCallback(() => {
    appendDashboardEvent('dashboard_daily_ritual_open_forecast');
    setDashboardTab('home');
    setTimeout(() => storySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  }, [appendDashboardEvent]);

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

  const stopAllVoicePlayback = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (globalAudioManager) {
      globalAudioManager.stop();
      globalAudioManager.clearCallbacks();
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    window.dispatchEvent(new Event('merlin-stop-all-audio'));

    toast({
      title: 'Voice muted',
      description: 'Stopped all active Merlin audio.',
    });
  }, [toast]);

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

  const calcSource =
    ((chartData as any)?.metadata?.ephemeris as string | undefined) ||
    (((chartData as any)?.metadata?.calculationSource as string | undefined) === 'swiss-real' ? 'Swiss real' : undefined) ||
    (((chartData as any)?.metadata?.calculationSource as string | undefined) === 'mock-fallback' ? 'Mock' : undefined);
  const natalBodies = (chartData?.planets?.length ? chartData.planets : chartData?.positions) || [];
  const moonSign =
    natalBodies.find((p) => p.name === 'Moon')?.sign ||
    forecast?.moonSign;
  const sunSign = natalBodies.find((p) => p.name === 'Sun')?.sign;
  const risingSign =
    chartData?.ascendant?.sign ||
    natalBodies.find((p) => p.name === 'Ascendant' || p.name === 'Rising')?.sign;

  const lifeArcNarrative = lifeArc?.events?.length
    ? `From age ${lifeArc.events[0].age}, your path is marked by ${lifeArc.events
        .slice(0, 3)
        .map((e) => `${e.transitingPlanet} ${e.aspect} ${e.natalPlanet}`)
        .join(', ')}. The pattern here is pressure turning into purpose.`
    : 'Your Life Arc narrative will appear once timeline events are calculated.';

  const predictiveTopEvent = transits?.predictive?.events?.[0];

  const todayCheckinEntry = React.useMemo(
    () => getTodayCheckinEntry(checkinEntries),
    [checkinEntries]
  );

  const clientAtmospherePacket = React.useMemo(() => {
    if (!atmosphereEngineEnabled) return null;
    return computeAtmosphereFromDashboardSources({
      date: forecast?.date,
      pressureWindow,
      forecast,
      stormsReport,
      moonPhase: forecast?.moonPhase,
      moonSign: forecast?.moonSign,
      chartData,
      birthDate: birthData?.date,
      patternProfile: pressureWindow?.patternProfile ?? null,
      realityCheck: {
        checkin: todayCheckinEntry
          ? {
              mood: todayCheckinEntry.mood as number,
              stress: todayCheckinEntry.stress as number,
              energy: todayCheckinEntry.energy as number,
              confidence: todayCheckinEntry.confidence,
            }
          : undefined,
        journalText: journalOptIn ? journalText : undefined,
      },
    });
  }, [
    atmosphereEngineEnabled,
    birthData?.date,
    chartData,
    forecast,
    journalOptIn,
    journalText,
    pressureWindow,
    pressureWindow?.patternProfile,
    stormsReport,
    todayCheckinEntry,
  ]);

  /**
   * Day-scoped weather is not ready until server atmosphere + forecast settle
   * (or error). Idle hooks start as loading=false with null data — treat that
   * as still pending so we never paint a fake Caution from week storms.
   * Also treat packets dated for a previous local day as pending (day roll-over).
   */
  const hasWeatherContext = Boolean(
    featureFlags.premiumInsights && birthData && chartData,
  );
  const weatherPacketStale = Boolean(
    localCalendarDay &&
      ((forecast?.date && forecast.date !== localCalendarDay) ||
        (atmosphere?.date && atmosphere.date !== localCalendarDay)),
  );
  const serverAtmospherePending =
    atmosphereEngineEnabled &&
    hasWeatherContext &&
    !atmosphere &&
    !atmosphereError;
  const forecastPending = hasWeatherContext && !forecast && !forecastError;

  /** Hold Today on a loader until day-scoped feeds settle (prevents tone flash) */
  const todayWeatherStillLoading =
    hasWeatherContext &&
    (serverAtmospherePending ||
      forecastPending ||
      atmosphereLoading ||
      forecastLoading ||
      weatherPacketStale);

  // Prefer server atmosphere. While loading, pending, or packet is for a prior
  // local day, do not paint client/stale weather as "today".
  const atmosphereForToday =
    atmosphere && localCalendarDay && atmosphere.date === localCalendarDay
      ? atmosphere
      : atmosphere && !localCalendarDay
        ? atmosphere
        : null;
  const activeAtmospherePacket = atmosphereEngineEnabled
    ? atmosphereForToday ??
      (serverAtmospherePending || atmosphereLoading || weatherPacketStale
        ? null
        : clientAtmospherePacket)
    : null;

  // Today hero fallback only — omit week storms (they paint false Caution).
  const legacyCosmicWeatherIntensity = React.useMemo(
    () =>
      resolveLegacyCosmicWeatherIntensity({
        dayRating: forecast?.day_rating,
        topPressureIntensity: pressureWindow?.predictive?.events?.[0]?.scores?.intensity,
      }),
    [forecast?.day_rating, pressureWindow?.predictive?.events],
  );

  const cosmicWeatherIntensity =
    activeAtmospherePacket?.intensity ??
    (todayWeatherStillLoading ? null : legacyCosmicWeatherIntensity);

  const legacyCosmicWeatherHeadline = React.useMemo(() => {
    if (predictiveTopEvent) {
      return `${predictiveTopEvent.transit.transitingPlanet} ${predictiveTopEvent.transit.aspect} ${predictiveTopEvent.transit.natalPlanet}`;
    }
    if (forecast?.planetaryHighlights?.[0]) {
      return forecast.planetaryHighlights[0];
    }
    if (stormsReport?.weekSummary) {
      return stormsReport.weekSummary;
    }
    return undefined;
  }, [forecast?.planetaryHighlights, predictiveTopEvent, stormsReport?.weekSummary]);

  const cosmicWeatherHeadline = activeAtmospherePacket?.dominantDriver.rationale ?? legacyCosmicWeatherHeadline;
  const cosmicDayRating = activeAtmospherePacket?.dayRating ?? forecast?.day_rating;

  const handleAskAboutToday = useCallback(() => {
    if (activeAtmospherePacket) {
      const { tone, intensity, feltIntensity, dayRating, dominantDriver, confluence, realityCheck } =
        activeAtmospherePacket;
      const confluenceLine = confluence.aligned
        ? ` Multiple life-weather signals are aligned (${confluence.themes.slice(0, 2).join(', ') || 'converging layers'}).`
        : '';
      const feltLine =
        realityCheck.source !== 'none'
          ? ` Felt intensity: ${feltIntensity}% (chart weather ${intensity}%, mood signal ${realityCheck.sentimentScore ?? 'n/a'}%).`
          : '';
      queueAskContext(
        "Today's life weather",
        `Today's life weather for my chart: ${tone.label} at ${intensity}% (${dayRating} day).${feltLine} Dominant driver: ${dominantDriver.label} — ${dominantDriver.rationale}.${confluenceLine} Explain what this means for me today and what I should watch for.`
      );
      return;
    }

    const ratingLabel = forecast?.day_rating || 'today';
    queueAskContext(
      "Today's life weather",
      `Why is today rated ${ratingLabel} for my chart? Explain what's driving the life weather and what I should watch for.`
    );
  }, [activeAtmospherePacket, forecast?.day_rating, queueAskContext]);

  const handleAskSolarYear = useCallback(() => {
    const briefing = returnsPacket?.solarReturn;
    if (!briefing) {
      queueAskContext(
        'Solar year',
        'What does my current solar return chart suggest about the year ahead?'
      );
      return;
    }

    queueAskContext(
      'Solar year',
      `My solar return for ${briefing.returnYear} is ${briefing.ascendantSign} rising with Moon in ${briefing.moonSign}. ${briefing.annualTheme} What are the main themes and best moves for this solar year?`
    );
  }, [queueAskContext, returnsPacket?.solarReturn]);

  const showAnnualBriefing =
    Boolean(returnsPacket?.solarReturn && shouldShowAnnualBriefing(returnsPacket.solarReturn));

  useEffect(() => {
    if (!atmosphereEngineEnabled || !activeAtmospherePacket) return;

    setAtmosphereHeroSeen(true);

    const telemetryKey = [
      activeAtmospherePacket.date,
      activeAtmospherePacket.intensity,
      activeAtmospherePacket.provenance.join('|'),
      activeAtmospherePacket.dominantDriver.source,
    ].join(':');

    if (atmosphereTelemetryKeyRef.current === telemetryKey) return;
    atmosphereTelemetryKeyRef.current = telemetryKey;

    const renderedDetail = buildAtmosphereRenderedDetail(activeAtmospherePacket, {
      surface: dashboardTab === 'forecast' ? 'forecast-hero' : 'home-hero',
    });
    appendDashboardEvent('atmosphere_rendered', renderedDetail);
    appendDashboardEvent(resolveAtmosphereSourceEvent(activeAtmospherePacket), {
      date: activeAtmospherePacket.date,
      intensity: activeAtmospherePacket.intensity,
      dayRating: activeAtmospherePacket.dayRating,
      provenance: activeAtmospherePacket.provenance,
    });
  }, [
    activeAtmospherePacket,
    appendDashboardEvent,
    atmosphereEngineEnabled,
    dashboardTab,
  ]);

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

  const personalityReads = useMemo(() => {
    if (!chartData) return { base: null, rx: null, live: null };
    try {
      const base = derivePersonalityFromChart(chartData, { retrogradeOverlay: false })?.dualOverlay || null;
      const rx = derivePersonalityFromChart(chartData, { retrogradeOverlay: true })?.dualOverlay || null;
      return {
        base,
        rx,
        live: (retrogradeOverlay ? rx : base) || null,
      };
    } catch (error) {
      console.warn('[dashboard] live dual personality failed:', error);
      return { base: null, rx: null, live: null };
    }
  }, [chartData, retrogradeOverlay]);
  const liveDual = personalityReads.live;

  /** P1 + P3: sharp three-beat life weather brief for Today (day-scoped only) */
  const lifeWeatherBrief = React.useMemo(() => {
    const summary =
      (typeof forecast?.summary === 'string' && forecast.summary) ||
      null;
    return buildLifeWeatherBrief({
      packet: activeAtmospherePacket,
      forecastSummary: summary,
      forecastAdvice: typeof forecast?.advice === 'string' ? forecast.advice : null,
      transitLookup: forecast?.transitLookup,
      date: forecast?.date || activeAtmospherePacket?.date || null,
      moveMemory: todayMoveMemory,
      mbtiType: resolveSelfMbtiType({ dualOverlay: liveDual, mbtiType }) || null,
      maskType: liveDual?.hardware?.mbtiType || null,
      // Week-horizon predictive moves only after feeds settle
      predictiveMove:
        !todayWeatherStillLoading && predictiveActionHint
          ? `${predictiveActionHint.label} — ${predictiveActionHint.reason}`
          : null,
      loading: todayWeatherStillLoading,
      // Free freemiumToday users see a real Today sample — don't show the locked placeholder.
      premiumLocked: !featureFlags.premiumInsights && !featureFlags.freemiumToday,
      errorMessage:
        !todayWeatherStillLoading && forecastError?.message ? forecastError.message : null,
    });
  }, [
    activeAtmospherePacket,
    liveDual,
    liveDual?.firmware?.mbtiType,
    liveDual?.hardware?.mbtiType,
    featureFlags.freemiumToday,
    featureFlags.premiumInsights,
    forecast,
    forecastError?.message,
    mbtiType,
    predictiveActionHint,
    todayMoveMemory,
    todayWeatherStillLoading,
  ]);

  React.useEffect(() => {
    if (todayWeatherStillLoading || !lifeWeatherBrief.themeId || !lifeWeatherBrief.move) return;
    const date = forecast?.date || activeAtmospherePacket?.date;
    if (!date) return;
    preservePriorWeatherWindow(date, userId || undefined);
    writeWeatherWindowSnapshot(
      {
        date,
        move: lifeWeatherBrief.move,
        themeLabel: lifeWeatherBrief.themeLabel,
        intensity: cosmicWeatherIntensity ?? activeAtmospherePacket?.intensity,
      },
      userId || undefined,
    );
    rememberTodayMove({
      date,
      themeId: lifeWeatherBrief.themeId,
      move: lifeWeatherBrief.move,
      factKey: lifeWeatherBrief.leadFactKey || lifeWeatherBrief.themeId,
    });
  }, [
    activeAtmospherePacket?.date,
    activeAtmospherePacket?.intensity,
    cosmicWeatherIntensity,
    forecast?.date,
    lifeWeatherBrief.leadFactKey,
    lifeWeatherBrief.move,
    lifeWeatherBrief.themeId,
    lifeWeatherBrief.themeLabel,
    rememberTodayMove,
    todayWeatherStillLoading,
    userId,
  ]);

  const cosmicStoryText = lifeWeatherBrief.story;
  const cosmicWeatherHeadlineForUi = lifeWeatherBrief.why || cosmicWeatherHeadline;
  const cosmicStoryMove = lifeWeatherBrief.move;
  const cosmicStoryMbtiGuidance = React.useMemo(() => {
    if (!mbtiType || !forecast) return undefined;
    const overlay = forecast.mbti_overlay as Record<string, unknown> | undefined;
    if (overlay?.reasoning && typeof overlay.reasoning === 'string') {
      return overlay.reasoning;
    }
    const typedOverlay = overlay?.[mbtiType] as { translation?: string } | undefined;
    if (typedOverlay?.translation) return typedOverlay.translation;
    if (forecast.primaryTheme) {
      return applyMBTIOverlay(forecast.primaryTheme, mbtiType as MBTIType);
    }
    return undefined;
  }, [forecast, mbtiType]);

  const predictiveSnapshot = React.useMemo(
    () =>
      transits?.predictive?.lunarTiming && transits?.predictive?.progressedMoon
        ? {
            lunarPhase: transits.predictive.lunarTiming.phase,
            lunarActionBias: transits.predictive.lunarTiming.actionBias,
            progressedMoonSign: transits.predictive.progressedMoon.sign,
            progressedMoonDegree: transits.predictive.progressedMoon.degree,
            topSignal: predictiveTopEvent
              ? `${predictiveTopEvent.transit.transitingPlanet} ${predictiveTopEvent.transit.aspect} ${predictiveTopEvent.transit.natalPlanet}`
              : undefined,
            actionHint: predictiveActionHint || undefined,
          }
        : undefined,
    [predictiveActionHint, predictiveTopEvent, transits?.predictive],
  );

  /** Transit confluence blurb from /api/interpret — "now" storyline, not natal identity */
  const activeTransitStoryline = React.useMemo(() => {
    const summary = interpretations?.chartSummary;
    if (!summary || typeof summary !== 'string') return undefined;
    const lower = summary.toLowerCase();
    if (lower.includes('strongest storyline') || lower.includes('clearest timing')) {
      // First two sentences are theme + timing (see buildUnifiedReading)
      const parts = summary.split(/(?<=[.!?])\s+/).filter(Boolean);
      return parts.slice(0, 2).join(' ');
    }
    return undefined;
  }, [interpretations?.chartSummary]);

  const chartIdentityHeadline = React.useMemo(() => {
    const summary = interpretations?.chartSummary;
    if (!summary || typeof summary !== 'string') return undefined;
    // Don't use transit storyline as natal "who you are" prose
    if (activeTransitStoryline) return undefined;
    return (
      summary.split('. ').slice(0, 2).join('. ') + (summary.includes('.') ? '.' : '')
    );
  }, [activeTransitStoryline, interpretations?.chartSummary]);

  /** Self pillar contract — who is in this life weather. @see docs/TWO_PILLARS.md */
  const identityPacket = useMemo(
    () =>
      buildIdentityPacket({
        sunSign,
        moonSign,
        risingSign,
        // Core (firmware) is primary for Self — mask is secondary presentation layer
        mbtiType: liveDual?.firmware?.mbtiType || liveDual?.finalType || mbtiType || undefined,
        mbtiPrimary: liveDual?.firmware
          ? {
              type: liveDual.firmware.mbtiType,
              role: 'primary',
              label: 'Core · who you are inside',
              confidence: liveDual.firmware.confidence,
            }
          : undefined,
        mbtiSecondary: liveDual?.hardware
          ? {
              type: liveDual.hardware.mbtiType,
              role: 'secondary',
              label: 'Mask · how you present',
              confidence: liveDual.hardware.confidence,
            }
          : undefined,
        mbtiBlendSummary: liveDual
          ? liveDual.firmware?.mbtiType === liveDual.hardware?.mbtiType
            ? `Aligned ${liveDual.firmware?.mbtiType || liveDual.finalType} inside and out`
            : `Core ${liveDual.firmware?.mbtiType || '—'} · Mask ${liveDual.hardware?.mbtiType || '—'} → ${liveDual.finalType}`
          : undefined,
        archetypeName: identityPack?.archetypeName,
        patternSignature: identityPack?.patternSignature,
        coreContradiction: identityPack?.coreContradiction,
        calcSource: chartData ? 'chart' : undefined,
        chartHasHouses: Boolean(
          chartData?.houses?.length ||
            (chartData as { houseSystem?: { cusps?: number[] } } | null)?.houseSystem?.cusps?.length,
        ),
        confidenceSource: liveDual ? 'dual_overlay' : mbtiType ? 'mbti_fusion' : 'chart_only',
        // Soft tint only — OS stays stable; edge line can nod at weather
        weatherIntensity: activeAtmospherePacket?.intensity ?? null,
      }),
    [
      sunSign,
      moonSign,
      risingSign,
      mbtiType,
      liveDual,
      identityPack,
      chartData,
      activeAtmospherePacket?.intensity,
    ],
  );

  const selfIdentityHeadline = chartIdentityHeadline || identityPacket.headline;

  const personalityBlend = useMemo(
    () => (liveDual ? buildBlendSynthesis(liveDual) : null),
    [liveDual],
  );

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
    setForecastAnalysisOpen(true);
    setActiveSection((prev) => (prev === section ? 'wheel' : section));
    setTimeout(() => {
      focusPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const scrollToBlock = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleWheelPlanetSelect = useCallback((name: string | null) => {
    setSelectedWheelPlanet(name);
    if (name) {
      setSelectedWheelSign(null);
      setWheelDetailTab('astrology');
      setSelfChartDepthOpen(true);
    }
  }, []);

  const handleRecalculateChart = useCallback(() => {
    if (chartQuota && chartQuota.remaining <= 0) {
      toast({
        title: 'Chart rebuild limit reached',
        description: `This account allows ${chartQuota.limit} chart builds total (first natal + rerolls). Contact support for a legitimate birth-data fix.`,
        variant: 'destructive',
      });
      return;
    }

    const remaining =
      chartQuota?.remaining != null
        ? ` You have ${chartQuota.remaining} rebuild${chartQuota.remaining === 1 ? '' : 's'} left.`
        : '';
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        `Recalculate with new birth data? Your current chart session will clear.${remaining}`,
      )
    ) {
      return;
    }

    hasRestoredPersistedDataRef.current = true;
    premiumHydrationKeyRef.current = null;
    setChartData(null);
    setWheelData(null);
    setBirthData(null);
    setSelectedWheelPlanet(null);
    setSelectedWheelSign(null);
    setDashboardTab('chart');
    try {
      clearChartSession(userId);
    } catch {
      // ignore storage errors
    }
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, [chartQuota, toast, userId]);

  const handleWheelSignSelect = useCallback((name: ZodiacSignName | null) => {
    setSelectedWheelSign(name);
    if (name) {
      setSelectedWheelPlanet(null);
      setWheelDetailTab('astrology');
      setSelfChartDepthOpen(true);
    }
  }, []);

  const clearWheelSelection = useCallback(() => {
    setSelectedWheelPlanet(null);
    setSelectedWheelSign(null);
  }, []);

  const scrollToContextSection = useCallback(
    (section: ContextNavSection) => {
      setActiveContextSection(section);

      if (dashboardTab === 'relationships') {
        relationshipsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if (section === 'personality') {
        setWheelDetailTab('personality');
        setSelfChartDepthOpen(true);
      } else if (section === 'placements' || section === 'wheel') {
        setWheelDetailTab('astrology');
        if (dashboardTab === 'chart') setSelfChartDepthOpen(true);
      } else if (section === 'analysis') {
        if (dashboardTab === 'forecast') {
          setForecastAnalysisOpen(true);
          if (activeSection === 'wheel') setActiveSection('transits');
        }
      } else if (section === 'oracle' || section === 'details') {
        if (dashboardTab === 'forecast' || dashboardTab === 'home') {
          setForecastDepthOpen(true);
        }
      } else if (section === 'timeline' || section === 'storm') {
        if (dashboardTab === 'forecast') setForecastRadarOpen(true);
      } else if (section === 'prophecy' || section === 'focus') {
        if (dashboardTab === 'forecast') setForecastAnalysisOpen(true);
      }

      const refMap: Partial<Record<ContextNavSection, React.RefObject<HTMLDivElement | null>>> = {
        story: storySectionRef,
        oracle: oracleSectionRef,
        details: detailsSectionRef,
        ritual: ritualSectionRef,
        overview: dashboardTab === 'chart' ? chartOverviewRef : storySectionRef,
        wheel: chartSectionRef,
        placements: chartSectionRef,
        personality: chartSectionRef,
        focus: focusPanelRef,
        'deep-dive': focusPanelRef,
        identity: identitySectionRef,
        timeline: weeklySectionRef,
        storm: stormSectionRef,
        analysis: focusPanelRef,
        prophecy: prophecySectionRef,
        'numerology-core': numerologyBlueprintRef,
        'numerology-cycles': numerologyCyclesRef,
        'numerology-blend': numerologyBlendRef,
      };

      // Allow collapsed panels to mount before scroll
      window.setTimeout(() => {
        const ref = refMap[section];
        if (ref?.current) {
          ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    },
    [activeSection, dashboardTab],
  );

  useEffect(() => {
    const defaultSection: ContextNavSection =
      dashboardTab === 'home'
        ? 'story'
        : dashboardTab === 'forecast'
          ? 'story'
          : dashboardTab === 'numerology'
            ? 'numerology-core'
          : dashboardTab === 'chart'
            ? 'overview'
            : 'overview';
    setActiveContextSection(defaultSection);
  }, [dashboardTab]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <DashboardStatusBar
            showHeroTitle={showOnboarding}
            calcSource={calcSource}
            streak={chartData ? dailyCheckinStreak : undefined}
            tier={tier}
            premiumLocked={premiumLocked}
            tierLoading={tierLoading}
            tierError={tierError}
            firstName={clerkFirstName}
            onRefreshTier={() => {
              premiumHydrationKeyRef.current = null;
              void refreshTier();
            }}
            onStopVoice={stopAllVoicePlayback}
            dateLabel={forecast?.date ? new Date(`${forecast.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : undefined}
          />
        </motion.div>

            <DashboardExperienceTabs activeTab={dashboardTab} onTabChange={setDashboardTab} />

            {!chartData ? (
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
            ) : null}

            {chartData ? (
              <div className="flex items-start gap-6">
                <DashboardContextNav
                  activeTab={dashboardTab}
                  activeSection={activeContextSection}
                  collapsed={navigatorCollapsed}
                  onCollapsedChange={setNavigatorCollapsed}
                  onNavigate={scrollToContextSection}
                  compactMode={compactMode}
                  onCompactModeChange={setCompactMode}
                  premiumLocked={premiumLocked}
                  mbtiType={liveDual?.firmware?.mbtiType || mbtiType || undefined}
                  modulePreferences={modulePreferences}
                  onModulePreferencesChange={setModulePreferences}
                />
                <div className="min-w-0 flex-1">
            {dashboardTab === 'relationships' && modulePreferences.relationshipSpace ? (
            <SelfShell>
            <motion.section
              ref={relationshipsSectionRef}
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
                        date={dailyOracle?.date}
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
            </SelfShell>
            ) : null}

            {/* Main Dashboard Content */}
            {chartData && dashboardTab !== 'relationships' && (
              <div className="space-y-6">
                {dashboardTab === 'home' ? (
                  <WeatherShell>
                  <HomeTabPanel
                    storyRef={storySectionRef}
                    oracleRef={oracleSectionRef}
                    detailsRef={detailsSectionRef}
                    ritualRef={ritualSectionRef}
                    intensity={cosmicWeatherIntensity ?? 0}
                    feltIntensity={activeAtmospherePacket?.feltIntensity}
                    sentimentScore={activeAtmospherePacket?.realityCheck.sentimentScore}
                    dayRating={todayWeatherStillLoading ? undefined : cosmicDayRating}
                    date={forecast?.date}
                    story={cosmicStoryText}
                    whyLine={cosmicWeatherHeadlineForUi}
                    todayMove={cosmicStoryMove}
                    whyToday={lifeWeatherBrief.whyToday}
                    usuallyBrings={lifeWeatherBrief.usuallyBrings}
                    navigate={lifeWeatherBrief.navigate}
                    watchFor={lifeWeatherBrief.watchFor}
                    supportingSignals={lifeWeatherBrief.supportingSignals}
                    chartConfidence={lifeWeatherBrief.chartConfidence}
                    readConfidence={lifeWeatherBrief.readConfidence}
                    chartConfidenceLabel={lifeWeatherBrief.chartConfidenceLabel}
                    readConfidenceLabel={lifeWeatherBrief.readConfidenceLabel}
                    moveConfidence={lifeWeatherBrief.moveConfidence}
                    confidenceLabel={lifeWeatherBrief.confidenceLabel}
                    mixedSignals={lifeWeatherBrief.mixedSignals}
                    themeLabel={lifeWeatherBrief.themeLabel}
                    heldFromYesterday={lifeWeatherBrief.heldFromYesterday}
                    weatherPrinciple={lifeWeatherBrief.weatherPrinciple}
                    driverLabel={
                      todayWeatherStillLoading
                        ? null
                        : activeAtmospherePacket?.dominantDriver?.label
                    }
                    mbtiType={mbtiType || undefined}
                    mbtiGuidance={cosmicStoryMbtiGuidance}
                    moonPhase={todayWeatherStillLoading ? undefined : forecast?.moonPhase}
                    moonSign={todayWeatherStillLoading ? undefined : forecast?.moonSign}
                    streak={dailyCheckinStreak}
                    forecastLoading={todayWeatherStillLoading}
                    atmosphereProvenance={activeAtmospherePacket?.provenance}
                    confluenceAligned={activeAtmospherePacket?.confluence.aligned}
                    confluenceThemes={activeAtmospherePacket?.confluence.themes}
                    solarReturnBriefing={returnsPacket?.solarReturn}
                    lunarReturnWeather={returnsPacket?.lunarReturn}
                    returnsLoading={returnsLoading}
                    showAnnualBriefing={showAnnualBriefing}
                    onAskSolarYear={handleAskSolarYear}
                    userId={userId || undefined}
                    onAskMerlin={handleAskAboutToday}
                    onExploreSelf={() => setDashboardTab('chart')}
                    askLabel={lifeWeatherBrief.askLabel}
                    storyEyebrow={lifeWeatherBrief.eyebrow}
                    selfChips={[
                      liveDual?.firmware?.mbtiType
                        ? `Core ${liveDual.firmware.mbtiType}`
                        : identityPacket.mbti.primary?.type
                          ? `Core ${identityPacket.mbti.primary.type}`
                          : undefined,
                      liveDual?.hardware?.mbtiType &&
                      liveDual.hardware.mbtiType !== liveDual.firmware?.mbtiType
                        ? `Mask ${liveDual.hardware.mbtiType}`
                        : undefined,
                      identityPacket.placements.sunSign
                        ? `Sun ${identityPacket.placements.sunSign}`
                        : undefined,
                    ].filter(Boolean) as string[]}
                    dailyOracleMessage={dailyOracle?.message}
                    dailyOracleDate={dailyOracle?.date}
                    dailyOracleRating={dailyOracle?.dayRating}
                    dailyOracleLoading={dailyOracleLoading}
                    onRefreshOracle={() => void fetchDailyOracle(true)}
                    onOracleFeedback={sendDailyOracleFeedback}
                    homeForecastExpanded={homeForecastExpanded}
                    onHomeForecastExpandedChange={setHomeForecastExpanded}
                    forecast={forecast}
                    onAskContext={queueAskContext}
                    askDraftLabel={askDraftLabel}
                    explainability={pressureWindow?.explainability}
                    domainScores={domainForecast?.domains}
                    insightLoading={pressureWindowLoading || domainForecastLoading}
                    insightError={pressureWindowError?.message || domainForecastError?.message}
                    predictiveSnapshot={predictiveSnapshot}
                    showDailyRitual={modulePreferences.returnLoop}
                    calibrationRecomputing={calibrationRecomputing}
                    onDailyRitualRefreshOracle={() => {
                      appendDashboardEvent('dashboard_daily_ritual_refresh_oracle');
                      void fetchDailyOracle(true);
                    }}
                    onDailyCheckin={() => {
                      appendDashboardEvent('dashboard_daily_ritual_checkin');
                      queueAskContext('Daily check-in', 'What is my highest-leverage move in the next 24 hours?');
                    }}
                    onRecalibrate={recomputeCalibration}
                    showDevDiagnostics={showDevDiagnostics}
                    onToggleDevDiagnostics={() => setShowDevDiagnostics((prev) => !prev)}
                    dashboardEvents={dashboardEvents}
                    journalOptIn={journalOptIn}
                    journalText={journalText}
                    onJournalOptInChange={setJournalOptIn}
                    onJournalTextChange={setJournalText}
                    premiumLocked={premiumLocked}
                    tier={tier}
                    forecastError={Boolean(forecastError) && !forecast && !activeAtmospherePacket}
                    onRetryForecast={() => {
                      if (!birthData) return;
                      void calculateForecast(birthData, {
                        mbtiType: mbtiType || undefined,
                        userId: userId || undefined,
                      });
                    }}
                    risk={activeAtmospherePacket?.risk ?? null}
                    firstName={clerkFirstName}
                  />
                  </WeatherShell>
                ) : null}

                {dashboardTab === 'numerology' ? (
                  <SelfShell>
                  <NumerologyTabPanel
                    birthDate={birthData?.date}
                    sunSign={sunSign}
                    moonSign={moonSign || forecast?.moonSign}
                    premiumLocked={premiumLocked}
                    tier={tier}
                    onAskMerlin={queueAskContext}
                    blueprintRef={numerologyBlueprintRef}
                    cyclesRef={numerologyCyclesRef}
                    blendRef={numerologyBlendRef}
                  />
                  </SelfShell>
                ) : null}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="min-w-0 space-y-8"
              >
                {dashboardTab === 'chart' ? (
                <SelfShell>
                <div ref={chartOverviewRef} className="mb-6">
                  <ChartIdentityBrief
                    sunSign={identityPacket.placements.sunSign || sunSign}
                    moonSign={identityPacket.placements.moonSign || moonSign}
                    risingSign={identityPacket.placements.risingSign || risingSign}
                    mbtiType={identityPacket.mbti.primary?.type || liveDual?.firmware?.mbtiType || mbtiType || undefined}
                    mbtiCore={liveDual?.firmware?.mbtiType || identityPacket.mbti.primary?.type}
                    mbtiMask={liveDual?.hardware?.mbtiType || identityPacket.mbti.secondary?.type}
                    mbtiFinal={liveDual?.finalType || mbtiType || undefined}
                    blendHeadline={personalityBlend?.headline}
                    blendSummary={
                      personalityBlend
                        ? personalityBlend.sameType
                          ? personalityBlend.summary
                          : personalityBlend.combinedInterpretation
                        : identityPacket.mbti.blendSummary
                    }
                    edgeTakeaway={
                      identityPacket.edgeTakeaway ||
                      (personalityBlend
                        ? {
                            title: 'Your edge',
                            body: personalityBlend.sameType
                              ? personalityBlend.summary
                              : personalityBlend.combinedInterpretation,
                          }
                        : null)
                    }
                    chartForLabel={
                      birthData?.date
                        ? `Natal chart · ${birthData.date}${
                            birthData.time && birthData.time !== '12:00' ? ` · ${birthData.time}` : ''
                          }`
                        : null
                    }
                    baseCoreType={personalityReads.base?.firmware?.mbtiType}
                    rxCoreType={personalityReads.rx?.firmware?.mbtiType}
                    operatingSystem={identityPacket.operatingSystem}
                    activeStoryline={activeTransitStoryline}
                    storylineThemes={interpretations?.confluence || null}
                    storylineWindows={interpretations?.transitWindows || null}
                    headline={selfIdentityHeadline}
                    onAskMerlin={() =>
                      queueAskContext(
                        'Self identity',
                        'Explain my Sun, Moon, and Rising in plain language and how they shape how I show up in today\'s life weather.',
                      )
                    }
                    retrogradeOverlay={retrogradeOverlay}
                    onToggleRetrogradeOverlay={() => {
                      const next = !retrogradeOverlay;
                      void persistPreferences({ retrogradeOverlay: next });
                      if (chartData) {
                        applyChartPersonality(chartData, { retrogradeOverlay: next });
                      }
                    }}
                    onAskPersonality={() =>
                      queueAskContext(
                        'Personality type',
                        liveDual
                          ? `I want to talk through my dual personality from the chart. Core (inner): ${liveDual.firmware?.mbtiType}. Mask (outer): ${liveDual.hardware?.mbtiType}. Integrated type: ${liveDual.finalType}. Explain what each type means, how they work together when they differ, how people might misread me, and how this should shape my life-weather guidance. Ask me if anything doesn't fit.`
                          : `Discuss my chart personality type (${mbtiType || 'unknown'}) — what it means, strengths, blind spots, and how it colors today's life weather. Ask me what feels true or off.`,
                      )
                    }
                    onAskStoryline={() =>
                      queueAskContext(
                        'Active storyline',
                        activeTransitStoryline
                          ? `Explain this active life-weather storyline in plain language and what I should do with it: ${activeTransitStoryline}`
                          : 'What is my strongest transit theme right now, and what should I prioritize this week?',
                      )
                    }
                    onAskStorylineTheme={(title) =>
                      queueAskContext(
                        title,
                        `Why is "${title}" a strong storyline for me right now? How many signals are aligned, what should I watch for, and what's one practical move this week?`,
                      )
                    }
                    onAskStorylineWindow={(title) =>
                      queueAskContext(
                        title,
                        `What should I know about this timing window: ${title}? What peaks, what to do before/during/after, and what to avoid?`,
                      )
                    }
                    onRecalculateChart={handleRecalculateChart}
                    recalculateDisabled={Boolean(chartQuota && chartQuota.remaining <= 0)}
                    recalculateHint={
                      chartQuota && chartQuota.remaining <= 0
                        ? 'Chart rebuild limit reached for this account'
                        : chartQuota
                          ? `${chartQuota.remaining} rebuild${chartQuota.remaining === 1 ? '' : 's'} left (first natal + rerolls)`
                          : 'Enter a new birth date, time, or place'
                    }
                  />
                </div>

                {/* 2. Chart as instrument — compact, not a second homepage */}
                <motion.div
                  ref={chartSectionRef}
                  className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-950/25 via-slate-950/60 to-violet-950/25 p-4 shadow-xl shadow-amber-950/15 backdrop-blur-md md:p-5"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300/70">
                        Your chart
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-amber-50">The instrument</h2>
                      <p className="mt-0.5 text-xs text-slate-400 max-w-md">
                        Tap a planet for a quick read. Detail stays closed until you want it.
                      </p>
                    </div>
                    <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
                      {chartQuota ? (
                        <p className="text-[10px] font-mono text-slate-500">
                          {chartQuota.remaining}/{chartQuota.limit} builds left · first natal + rerolls
                        </p>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleRecalculateChart}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={Boolean(chartQuota && chartQuota.remaining <= 0)}
                        title={
                          chartQuota && chartQuota.remaining <= 0
                            ? 'Chart rebuild limit reached for this account'
                            : 'Enter new birth date, time, or place'
                        }
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Recalculate chart
                      </button>
                    </div>
                  </div>

                  {!wheelData ? (
                    <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-amber-500/15 bg-slate-950/40 px-6 py-8 text-center">
                      <p className="text-sm text-slate-300">Preparing your chart wheel…</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center overflow-hidden">
                        <div className="flex h-[min(380px,70vw)] w-full max-w-[380px] items-center justify-center">
                          <WheelVisualization
                            chartData={wheelData}
                            selectedPlanet={selectedWheelPlanet}
                            selectedSign={selectedWheelSign}
                            onPlanetSelect={handleWheelPlanetSelect}
                            onSignSelect={handleWheelSignSelect}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={handlePrimaryAskMerlin}
                          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-50 hover:bg-cyan-400/20"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Ask Merlin
                        </button>
                        <MerlinAudioPlayer text={readAloudText} label="Read chart" />
                      </div>

                      {askDraftLabel ? (
                        <div className="mt-2 flex items-center justify-center gap-3 text-center">
                          <button
                            type="button"
                            onClick={handlePrimaryAskMerlin}
                            className="text-xs text-cyan-200/80 hover:text-cyan-100"
                          >
                            Selected: {askDraftLabel}
                          </button>
                          <button
                            type="button"
                            onClick={clearAskContext}
                            className="text-xs text-slate-500 hover:text-slate-300"
                          >
                            Clear
                          </button>
                        </div>
                      ) : null}

                      {/* 3. Chart depth — collapsed by default */}
                      <div className="mt-5 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-950/40">
                        <button
                          type="button"
                          onClick={() => setSelfChartDepthOpen((o) => !o)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-900/50"
                          aria-expanded={selfChartDepthOpen}
                        >
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                              Optional
                            </p>
                            <p className="text-sm font-semibold text-slate-200">
                              Explore chart details
                            </p>
                            <p className="text-xs text-slate-500">
                              Placements, deeper personality map, transit snapshot
                            </p>
                          </div>
                          <span className="text-xs font-medium text-slate-400">
                            {selfChartDepthOpen ? 'Hide' : 'Show'}
                          </span>
                        </button>

                        {selfChartDepthOpen ? (
                          <div className="border-t border-white/5 px-3 pb-4 pt-2">
                            <WheelDetailTabs
                              activeTab={wheelDetailTab}
                              onTabChange={setWheelDetailTab}
                              astrologyPanel={
                                <div className="space-y-4">
                                  <WheelSelectionPanel
                                    selectedPlanet={selectedWheelPlanet}
                                    selectedSign={selectedWheelSign}
                                    planets={chartData?.planets || []}
                                    planetInterpretations={interpretations?.planetInterpretations}
                                    onClear={clearWheelSelection}
                                    onPlanetSelect={handleWheelPlanetSelect}
                                    onAskContext={queueAskContext}
                                  />
                                  <PlacementsSidebar
                                    planets={chartData?.planets || []}
                                    onAskContext={queueAskContext}
                                    selectedContextLabel={askDraftLabel}
                                    selectedPlanet={selectedWheelPlanet}
                                    onPlanetSelect={handleWheelPlanetSelect}
                                  />
                                </div>
                              }
                              personalityPanel={
                                featureFlags.selfPeek ? (
                                  <div className="space-y-3">
                                    <p className="text-xs text-slate-400">
                                      Dimension map and shadow — your Core / Mask summary is already
                                      above.
                                    </p>
                                    {selectedWheelPlanet ? (
                                      <PlanetPersonalityHint
                                        planetName={selectedWheelPlanet}
                                        dualOverlay={liveDual}
                                      />
                                    ) : null}
                                    {liveDual ? (
                                      <MBTIDualBreakdown dualOverlay={liveDual} />
                                    ) : null}
                                  </div>
                                ) : (
                                  <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-5 text-sm text-amber-100">
                                    <p className="mb-2 font-semibold">
                                      Personality depth is locked on your current plan.
                                    </p>
                                    <Link
                                      href="/checkout-subscription"
                                      className="inline-flex items-center gap-2 rounded border border-amber-300/50 bg-amber-500/20 px-3 py-1.5 text-amber-50 hover:bg-amber-500/30"
                                    >
                                      Upgrade Plan
                                    </Link>
                                  </div>
                                )
                              }
                              forecastPanel={
                                <WheelTransitPanel
                                  intensity={cosmicWeatherIntensity ?? undefined}
                                  dayRating={cosmicDayRating}
                                  driverLabel={activeAtmospherePacket?.dominantDriver.label}
                                  moonPhase={forecast?.moonPhase}
                                  moonSign={forecast?.moonSign}
                                  significant={transits?.significant || []}
                                  approaching={transits?.approaching || []}
                                  loading={
                                    todayWeatherStillLoading || (forecastLoading && !forecast)
                                  }
                                  transitsLoading={transitsLoading && !transits}
                                  onAskContext={queueAskContext}
                                  onOpenHomeForecast={() => setDashboardTab('home')}
                                />
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </motion.div>

                {/* 4. More modules — collapsed; not competing with “about you” */}
                <div className="overflow-hidden rounded-2xl border border-slate-600/45 bg-slate-950/55 shadow-lg backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setSelfMoreOpen((o) => !o)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-900/40"
                    aria-expanded={selfMoreOpen}
                  >
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        Optional depth
                      </p>
                      <p className="text-sm font-semibold text-slate-200">
                        More about you
                      </p>
                      <p className="text-xs text-slate-500">
                        Focus views, deep dive, archetype path
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      {selfMoreOpen ? 'Hide' : 'Show'}
                    </span>
                  </button>

                  {selfMoreOpen ? (
                    <div className="space-y-4 border-t border-white/5 px-4 pb-5 pt-4">
                      {modulePreferences.focusViews ? (
                        <div className="rounded-xl border border-amber-500/15 bg-slate-900/40 p-4">
                          <h3 className="text-sm font-semibold text-amber-200">Focus views</h3>
                          <p className="mt-1 text-xs text-slate-400 mb-3">
                            Dedicated rooms when you want a full-screen module.
                          </p>
                          {premiumLocked ? (
                            <p className="mb-2 text-xs text-amber-200">
                              Dual MBTI is free. Chart reading, transits, timeline, and storm radar need a paid plan.
                            </p>
                          ) : null}
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href="/dashboard/chart-reading"
                              className="rounded-lg border border-blue-500/35 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-200 hover:bg-blue-500/20"
                            >
                              Chart Reading{premiumLocked ? ' · Locked' : ''}
                            </Link>
                            <Link
                              href="/dashboard/active-transits"
                              className="rounded-lg border border-orange-500/35 bg-orange-500/10 px-3 py-1.5 text-xs text-orange-200 hover:bg-orange-500/20"
                            >
                              Active Transits{premiumLocked ? ' · Locked' : ''}
                            </Link>
                            <Link
                              href="/dashboard/life-timeline"
                              className="rounded-lg border border-green-500/35 bg-green-500/10 px-3 py-1.5 text-xs text-green-200 hover:bg-green-500/20"
                            >
                              Life Timeline{premiumLocked ? ' · Locked' : ''}
                            </Link>
                            <Link
                              href="/dashboard/dual-mbti"
                              className="rounded-lg border border-violet-500/35 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/20"
                            >
                              Dual MBTI{mbtiType ? ` (${mbtiType})` : ''}
                            </Link>
                            <Link
                              href="/dashboard/storm-radar"
                              className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/20"
                            >
                              Storm Radar{premiumLocked ? ' · Locked' : ''}
                            </Link>
                          </div>
                        </div>
                      ) : null}

                      {modulePreferences.deepDive ? (
                        <div className="rounded-xl border border-slate-700/50 bg-slate-900/35">
                          <button
                            type="button"
                            onClick={() => setShowDeepDive((prev) => !prev)}
                            className="flex w-full items-center justify-between px-4 py-3 text-left"
                          >
                            <span className="text-sm font-semibold text-slate-200">Deep dive</span>
                            <span className="text-xs text-slate-400">
                              {showDeepDive ? 'Hide' : 'Show'}
                            </span>
                          </button>
                          {showDeepDive ? (
                            <div className="border-t border-white/5 px-2 pb-3">
                              <DeepDivePanel birthData={chartData} />
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {identityPack &&
                      (identityPack.archetypeName || identityPack.patternSignature) ? (
                        <div
                          ref={identitySectionRef}
                          className="grid grid-cols-1 gap-3 md:grid-cols-2"
                        >
                          <IdentityPatternCard
                            archetypeName={identityPack.archetypeName}
                            patternSignature={identityPack.patternSignature}
                            coreContradiction={identityPack.coreContradiction}
                          />
                          {progression &&
                          (progression.arcPath || progression.arcLevel) ? (
                            <ProgressPathCard
                              arcPath={progression.arcPath}
                              arcLevel={progression.arcLevel}
                              arcXp={progression.arcXp}
                              interactionCount={progression.interactionCount}
                            />
                          ) : null}
                        </div>
                      ) : null}

                      <Link
                        href="/profile"
                        className="inline-block text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
                      >
                        Oracle preferences in Profile
                      </Link>
                    </div>
                  ) : null}
                </div>
                </SelfShell>
                ) : null}

                {dashboardTab === 'forecast' ? (
                  <ForecastTabPanel
                    storySectionRef={storySectionRef}
                    stormSectionRef={stormSectionRef}
                    weeklySectionRef={weeklySectionRef}
                    risk={activeAtmospherePacket?.risk}
                    riskLoading={
                      (forecastLoading || atmosphereLoading) && !activeAtmospherePacket?.risk
                    }
                    onAskAboutRisk={() => {
                      const risk = activeAtmospherePacket?.risk;
                      const driver = risk?.topDrivers?.[0]?.label;
                      const peak = risk?.nextFrictionPeak?.label;
                      queueAskContext(
                        'Transit risk',
                        risk
                          ? `Score-first read: level ${risk.level}, friction ${risk.overallFriction}/100, elevatedDisruption=${risk.elevatedDisruption}. Driver: ${driver || 'n/a'}. Next hard peak: ${peak || 'none'}. What should I prepare for and avoid?`
                          : 'What hard transit windows should I prepare for this week, and is life friction elevated for my chart?',
                      );
                    }}
                    onBackToToday={() => setDashboardTab('home')}
                    onAskAboutHorizon={handleAskAboutToday}
                    forecastRadarOpen={forecastRadarOpen}
                    onForecastRadarOpenChange={setForecastRadarOpen}
                    stormsReport={stormsReport}
                    stormsLoading={stormsLoading}
                    mbtiType={mbtiType ?? undefined}
                    horizonSelectedDate={horizonSelectedDate}
                    onHorizonSelectedDateChange={setHorizonSelectedDate}
                    showWeeklyForecast={modulePreferences.weeklyForecast}
                    weeklyForecast={weeklyForecast}
                    weeklyLoading={weeklyLoading}
                    weeklyError={weeklyError}
                    questLogEnabled={questLogEnabled}
                    chartData={chartData}
                    transits={transits}
                    forecast={forecast}
                    userId={userId || undefined}
                  >
                    {/* 3. Narrative / storyline — demoted (optional depth) */}
                    {(interpretations?.confluence?.length ||
                      interpretations?.transitWindows?.length ||
                      activeTransitStoryline) ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-600/45 bg-slate-950/55 shadow-lg backdrop-blur-md">
                        <button
                          type="button"
                          onClick={() => setForecastDepthOpen((o) => !o)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-900/50"
                          aria-expanded={forecastDepthOpen}
                        >
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                              Optional story
                            </p>
                            <p className="text-sm font-semibold text-slate-200">
                              Horizon storyline
                            </p>
                            <p className="text-xs text-slate-500">
                              Narrative themes — secondary to risk score
                            </p>
                          </div>
                          <span className="text-xs font-medium text-slate-400">
                            {forecastDepthOpen ? 'Hide' : 'Show'}
                          </span>
                        </button>
                        {forecastDepthOpen ? (
                          <div className="border-t border-white/5 px-4 pb-5 pt-4">
                            <ActiveStorylinePanel
                              themes={interpretations?.confluence || null}
                              windows={interpretations?.transitWindows || null}
                              fallbackText={activeTransitStoryline}
                              onAskStoryline={() =>
                                queueAskContext(
                                  'Active storyline',
                                  activeTransitStoryline
                                    ? `Explain this horizon storyline and what I should do: ${activeTransitStoryline}`
                                    : 'What is my strongest transit theme this week, and what should I prioritize?',
                                )
                              }
                              onAskTheme={(title) =>
                                queueAskContext(
                                  title,
                                  `Why is "${title}" strong on my horizon right now, and what's one practical move?`,
                                )
                              }
                              onAskWindow={(title) =>
                                queueAskContext(
                                  title,
                                  `What should I know about this timing window: ${title}? Before, during, after?`,
                                )
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {/* 4. Forecast detail + oracle — optional */}
                    <div className="overflow-hidden rounded-2xl border border-slate-600/45 bg-slate-950/55 shadow-lg backdrop-blur-md">
                      <button
                        type="button"
                        onClick={() => setForecastOracleOpen((o) => !o)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-900/50"
                        aria-expanded={forecastOracleOpen}
                      >
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Optional</p>
                          <p className="text-sm font-semibold text-slate-200">
                            Forecast detail &amp; oracle
                          </p>
                          <p className="text-xs text-slate-500">
                            Full breakdown, domains, timing tabs, Merlin commentary
                          </p>
                        </div>
                        <span className="text-xs font-medium text-slate-400">
                          {forecastOracleOpen ? 'Hide' : 'Show'}
                        </span>
                      </button>
                      {forecastOracleOpen ? (
                        <div className="space-y-5 border-t border-white/5 px-4 pb-5 pt-4">
                          <div ref={oracleSectionRef} className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-[11px] uppercase tracking-[0.24em] text-violet-200/70">
                                Merlin adds
                              </p>
                              <button
                                type="button"
                                onClick={() => void fetchDailyOracle(true)}
                                className="rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
                              >
                                Refresh oracle
                              </button>
                            </div>
                            <DailyOraclePulse
                              message={dailyOracle?.message}
                              dayRating={dailyOracle?.dayRating}
                              date={dailyOracle?.date}
                              loading={dailyOracleLoading}
                              onTruthBomb={() => fetchDailyOracle(true)}
                              onFeedback={sendDailyOracleFeedback}
                            />
                          </div>

                          <div ref={detailsSectionRef}>
                            <ForecastDetailsSection
                              expanded={forecastDetailsExpanded}
                              onExpandedChange={setForecastDetailsExpanded}
                              date={forecast?.date || new Date().toISOString()}
                              summary={cosmicStoryText}
                              planetaryHighlights={forecast?.planetaryHighlights || []}
                              moonPhase={forecast?.moonPhase || 'Unknown'}
                              moonSign={forecast?.moonSign}
                              sunSign={forecast?.sunSign}
                              transits={forecast?.transits || []}
                              day_rating={forecast?.day_rating}
                              focusAreas={forecast?.focusAreas}
                              timingWindows={forecast?.timingWindows}
                              futureSignals={forecast?.futureSignals}
                              conversationalPrompts={forecast?.conversationalPrompts}
                              advice={forecast?.advice || ''}
                              loading={forecastLoading}
                              userId={userId || undefined}
                              onAskContext={queueAskContext}
                              selectedContextLabel={askDraftLabel}
                              explainability={pressureWindow?.explainability}
                              domainScores={domainForecast?.domains}
                              insightLoading={pressureWindowLoading || domainForecastLoading}
                              insightError={
                                pressureWindowError?.message || domainForecastError?.message
                              }
                              predictiveSnapshot={predictiveSnapshot}
                              helpText="Full forecast depth — open when you want more than the risk radar."
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* 4. Analysis lab — collapsed */}
                    <div className="overflow-hidden rounded-2xl border border-slate-600/45 bg-slate-950/55 shadow-lg backdrop-blur-md">
                      <button
                        type="button"
                        onClick={() => setForecastAnalysisOpen((o) => !o)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-900/40"
                        aria-expanded={forecastAnalysisOpen}
                      >
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                            Optional depth
                          </p>
                          <p className="text-sm font-semibold text-slate-200">
                            Analysis &amp; prophecy
                          </p>
                          <p className="text-xs text-slate-500">
                            Transits, life timeline, chart reading, history
                          </p>
                        </div>
                        <span className="text-xs font-medium text-slate-400">
                          {forecastAnalysisOpen ? 'Hide' : 'Show'}
                        </span>
                      </button>

                      {forecastAnalysisOpen ? (
                        <div className="space-y-4 border-t border-white/5 px-4 pb-5 pt-4">
                          <div className="flex flex-wrap gap-2">
                            {(
                              [
                                { key: 'transits' as const, label: 'Active Transits' },
                                { key: 'lifearc' as const, label: 'Life Timeline' },
                                { key: 'interpretation' as const, label: 'Chart Reading' },
                                { key: 'stormradar' as const, label: 'Storm Detail' },
                              ] as const
                            ).map((item) => (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => openSection(item.key)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                  activeSection === item.key
                                    ? 'border-amber-400/50 bg-amber-500/20 text-amber-100'
                                    : 'border-slate-600/50 bg-slate-800/60 text-slate-200 hover:bg-slate-700/70'
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>

                          <div id="focus-panel" ref={focusPanelRef} className="space-y-4">
                            {[
                              'interpretation',
                              'transits',
                              'lifearc',
                              'personality',
                              'stormradar',
                            ].includes(activeSection) && (
                              <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-5 md:p-6 backdrop-blur-sm">
                                {premiumLocked && activeSection !== 'personality' ? (
                                  <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-5 text-sm text-amber-100">
                                    <p className="font-semibold mb-2">
                                      This module is locked on your current plan.
                                    </p>
                                    <p className="text-amber-200/90 mb-3">
                                      Free includes dual MBTI and Today&apos;s life weather sample.
                                      Upgrade for chart interpretations, transits, life timeline, and
                                      storm radar.
                                    </p>
                                    <Link
                                      href="/checkout-subscription"
                                      className="inline-flex items-center gap-2 rounded border border-amber-300/50 bg-amber-500/20 px-3 py-1.5 text-amber-50 hover:bg-amber-500/30"
                                    >
                                      Upgrade Plan
                                    </Link>
                                  </div>
                                ) : null}

                                {!premiumLocked && activeSection === 'interpretation' && (
                                  <div className="space-y-6">
                                    <div className="space-y-4">
                                      <div className="mb-4 flex items-center gap-2">
                                        {cacheHit && (
                                          <span className="flex items-center gap-1 text-xs text-amber-400">
                                            ⚡ cached
                                          </span>
                                        )}
                                        <Link
                                          href="/profile"
                                          className="text-xs text-slate-400 transition hover:text-slate-200"
                                        >
                                          Interpretation engine in Oracle Preferences
                                        </Link>
                                      </div>
                                      <ChartInterpretation
                                        summary={interpretations?.chartSummary || ''}
                                        synthesis={interpretations?.synthesis}
                                        planetInterpretations={
                                          interpretations?.planetInterpretations || []
                                        }
                                        aspectInterpretations={
                                          interpretations?.aspectInterpretations || []
                                        }
                                        interpreter={interpretations?.interpreter}
                                        loading={interpretLoading}
                                        userId={userId || undefined}
                                        explainability={pressureWindow?.explainability}
                                        domainScores={domainForecast?.domains}
                                        insightLoading={
                                          pressureWindowLoading || domainForecastLoading
                                        }
                                        insightError={
                                          pressureWindowError?.message ||
                                          domainForecastError?.message
                                        }
                                      />
                                    </div>
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

                                {!premiumLocked && activeSection === 'transits' && (
                                  <ActiveTransits
                                    significant={transits?.significant || []}
                                    approaching={transits?.approaching || []}
                                    summary={
                                      transits?.summary || {
                                        total: 0,
                                        exact: 0,
                                        approaching: 0,
                                      }
                                    }
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
                                    explainability={pressureWindow?.explainability}
                                    domainScores={domainForecast?.domains}
                                    insightLoading={
                                      pressureWindowLoading || domainForecastLoading
                                    }
                                    insightError={
                                      pressureWindowError?.message ||
                                      domainForecastError?.message
                                    }
                                    calibrationProvenance={transits?.calibrationProvenance}
                                  />
                                )}

                                {!premiumLocked && activeSection === 'lifearc' && (
                                  <div className="space-y-4">
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setLifeArcView('timeline')}
                                        className={`rounded border px-3 py-1 text-xs transition-all ${
                                          lifeArcView === 'timeline'
                                            ? 'border-green-500/50 bg-green-500/10 text-green-200'
                                            : 'border-slate-700 text-slate-300'
                                        }`}
                                      >
                                        Timeline
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setLifeArcView('prose')}
                                        className={`rounded border px-3 py-1 text-xs transition-all ${
                                          lifeArcView === 'prose'
                                            ? 'border-green-500/50 bg-green-500/10 text-green-200'
                                            : 'border-slate-700 text-slate-300'
                                        }`}
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
                                      <div className="text-sm leading-relaxed text-slate-100">
                                        {lifeArcNarrative}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {featureFlags.selfPeek && activeSection === 'personality' && (
                                  <div className="space-y-4">
                                    <p className="text-sm text-slate-400">
                                      Full dual personality lives on{' '}
                                      <button
                                        type="button"
                                        className="font-semibold text-amber-200 underline-offset-2 hover:underline"
                                        onClick={() => setDashboardTab('chart')}
                                      >
                                        Self · You
                                      </button>
                                      . Dimension map below if you need it here.
                                    </p>
                                    {liveDual ? (
                                      <MBTIDualBreakdown dualOverlay={liveDual} />
                                    ) : null}
                                  </div>
                                )}

                                {!premiumLocked && activeSection === 'stormradar' && (
                                  <div className="space-y-4">
                                    <p className="text-sm text-slate-400">
                                      Forward-looking transit warnings with chart-personalized
                                      guidance.
                                    </p>
                                    <StormsAndNavigations
                                      report={stormsReport}
                                      loading={stormsLoading}
                                      mbtiType={mbtiType ?? undefined}
                                      selectedDate={horizonSelectedDate}
                                      onSelectedDateChange={setHorizonSelectedDate}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {modulePreferences.history ? (
                            <div className="rounded-xl border border-slate-700/50 bg-slate-900/35">
                              <button
                                type="button"
                                onClick={() => setShowHistoryPanel((prev) => !prev)}
                                className="flex w-full items-center justify-between px-4 py-3 text-left"
                              >
                                <span className="text-sm font-semibold text-slate-200">
                                  History &amp; calibration
                                </span>
                                <span className="text-xs text-slate-400">
                                  {showHistoryPanel ? 'Hide' : 'Show'}
                                </span>
                              </button>
                              {showHistoryPanel ? (
                                <div className="space-y-4 px-4 pb-4">
                                  <div className="rounded-xl border border-cyan-300/20 bg-slate-900/45 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/75">
                                        Recent check-ins
                                      </p>
                                      <span className="text-[11px] text-slate-300/80">
                                        Past 14 days
                                      </span>
                                    </div>
                                    {checkinHistoryLoading ? (
                                      <p className="mt-2 text-xs text-slate-300">
                                        Loading check-in history...
                                      </p>
                                    ) : checkinEntries.length ? (
                                      <div className="mt-2 space-y-2">
                                        {checkinEntries.slice(0, 5).map((entry) => (
                                          <div
                                            key={entry.id}
                                            className="rounded-lg border border-white/10 bg-slate-950/45 px-2.5 py-2"
                                          >
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                                              <span>
                                                {new Date(entry.createdAt).toLocaleDateString()}
                                              </span>
                                              <span>
                                                Mood {entry.mood ?? '-'} · Stress{' '}
                                                {entry.stress ?? '-'} · Energy {entry.energy ?? '-'}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="mt-2 text-xs text-slate-400">
                                        No check-ins yet.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : null}

                          <motion.div
                            ref={prophecySectionRef}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border border-violet-300/20 bg-violet-500/10 p-3.5"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-violet-200/80">
                                  Personal prophecy
                                </p>
                                <h4 className="mt-1 text-base font-semibold text-violet-50 md:text-lg">
                                  {prophecy?.title || 'Chart-anchored omen'}
                                </h4>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    appendDashboardEvent('dashboard_prophecy_style_selected', {
                                      style: 'omen',
                                    });
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
                                    appendDashboardEvent('dashboard_prophecy_style_selected', {
                                      style: 'sonnet',
                                    });
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
                                    appendDashboardEvent('dashboard_prophecy_regenerated', {
                                      style: prophecyStyle,
                                      era: prophecyEra,
                                      strictMeter,
                                    });
                                    // Bust auto-key so a later style effect doesn't block; regenerate owns the next text.
                                    prophecyAutoKeyRef.current = `regen-${Date.now()}`;
                                    void generateProphecy({
                                      birthChart: chartData,
                                      style: prophecyStyle,
                                      era: prophecyEra,
                                      strictMeter,
                                      saveToHistory: true,
                                      polishMode: prophecyPolishMode,
                                      regenerate: true,
                                      seedSalt: `regen-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`,
                                    }).then((result) => {
                                      if (result) void loadHistory();
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 rounded-full border border-violet-300/35 bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-100 hover:bg-violet-500/25"
                                >
                                  <RefreshCcw className="h-3.5 w-3.5" />
                                  Regenerate
                                </button>
                                <button
                                  type="button"
                                  onClick={handlePrintProphecy}
                                  className="inline-flex items-center gap-1 rounded-full border border-slate-300/35 bg-slate-500/15 px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-slate-500/25"
                                >
                                  Print
                                </button>
                              </div>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <label className="text-xs text-violet-200/85">Era</label>
                              <select
                                value={prophecyEra}
                                onChange={(event) => {
                                  const nextEra = event.target.value as ProphecyEra;
                                  appendDashboardEvent('dashboard_prophecy_era_selected', {
                                    era: nextEra,
                                  });
                                  setProphecyEra(nextEra);
                                }}
                                className="rounded-md border border-violet-300/35 bg-slate-900/70 px-2 py-1 text-xs text-violet-100"
                              >
                                <option value="babylonian">Babylonian</option>
                                <option value="hermetic">Hermetic</option>
                                <option value="psalmic">Psalmic</option>
                                <option value="stoic">Stoic</option>
                              </select>
                              <label className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-100">
                                <input
                                  type="checkbox"
                                  checked={strictMeter}
                                  onChange={(event) => {
                                    appendDashboardEvent('dashboard_prophecy_meter_toggled', {
                                      strictMeter: event.target.checked,
                                    });
                                    setStrictMeter(event.target.checked);
                                  }}
                                />
                                Strict sonnet meter
                              </label>
                            </div>

                            <div className="mt-3 rounded-lg border border-violet-200/15 bg-slate-950/45 p-3">
                              {prophecyLoading ? (
                                <p className="text-sm text-violet-100/80">Reading the tablets...</p>
                              ) : prophecy?.prophecy ? (
                                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-violet-50/95">
                                  {prophecy.prophecy}
                                </pre>
                              ) : (
                                <p className="text-sm text-violet-100/75">
                                  No prophecy available yet. Generate one from your chart.
                                </p>
                              )}
                            </div>

                            {prophecy?.signals ? (
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-100">
                                  Blessing: {prophecy.signals.blessingPlanet} in{' '}
                                  {prophecy.signals.blessingSign}
                                </span>
                                <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-2.5 py-1 text-amber-100">
                                  Test: {prophecy.signals.challengePlanet} in{' '}
                                  {prophecy.signals.challengeSign}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    appendDashboardEvent('dashboard_prophecy_ask_context');
                                    queueAskContext(
                                      'Prophecy follow-up',
                                      'Turn this prophecy into a concrete 7-day plan with one non-negotiable action per day.',
                                    );
                                  }}
                                  className="inline-flex items-center gap-1 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-2.5 py-1 text-cyan-100 hover:bg-cyan-500/20"
                                >
                                  <ScrollText className="h-3.5 w-3.5" />
                                  Turn into plan
                                </button>
                              </div>
                            ) : null}

                            <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
                              <p className="text-xs uppercase tracking-[0.2em] text-violet-200/80">
                                Prophecy timeline
                              </p>
                              {prophecyHistoryLoading ? (
                                <p className="mt-2 text-xs text-violet-100/75">Loading timeline...</p>
                              ) : prophecyHistory.length ? (
                                <div className="mt-2 max-h-44 space-y-2 overflow-y-auto pr-1">
                                  {prophecyHistory.slice(0, 12).map((entry) => (
                                    <div
                                      key={entry.id}
                                      className="rounded-md border border-white/10 bg-white/5 px-2.5 py-2"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-medium text-violet-50">
                                          {entry.title}
                                        </p>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const next = !entry.fulfilled;
                                            appendDashboardEvent(
                                              'dashboard_prophecy_fulfillment_toggled',
                                              { fulfilled: next },
                                            );
                                            markHistoryFulfilled(entry.id, next);
                                          }}
                                          className={`rounded-full border px-2 py-0.5 text-[11px] ${
                                            entry.fulfilled
                                              ? 'border-emerald-300/45 bg-emerald-500/20 text-emerald-100'
                                              : 'border-amber-300/45 bg-amber-500/20 text-amber-100'
                                          }`}
                                        >
                                          {entry.fulfilled ? 'Fulfilled' : 'Mark Fulfilled'}
                                        </button>
                                      </div>
                                      <p className="mt-1 text-[11px] text-slate-300">
                                        {new Date(entry.createdAt).toLocaleString()}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-2 text-xs text-violet-100/75">
                                  No saved prophecies yet. Regenerate to save one.
                                </p>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      ) : null}
                    </div>
                  </ForecastTabPanel>
                ) : null}
              </motion.div>
              </div>
            )}

                </div>
              </div>
            ) : null}

            {chartData && userId ? (
              <OracleChatDrawer
                isOpen={oracleChatOpen}
                onOpenChange={setOracleChatOpen}
                birthChart={chartData}
                userId={userId}
                onUserMessageSent={handleChatUserMessageSent}
                mbtiType={
                  liveDual?.finalType ||
                  liveDual?.firmware?.mbtiType ||
                  mbtiType ||
                  undefined
                }
                clarityMode={clarityMode}
                onClarityChange={toggleClarityMode}
                draftPrompt={askDraftPrompt}
                draftPromptKey={askDraftKey}
                draftLabel={askDraftLabel}
                atmospherePacket={activeAtmospherePacket}
                dualPersonality={
                  liveDual
                    ? {
                        core: liveDual.firmware?.mbtiType,
                        mask: liveDual.hardware?.mbtiType,
                        final: liveDual.finalType,
                      }
                    : null
                }
              />
            ) : null}

            {chartData && modulePreferences.returnLoop && showDailyRitualPrompt ? (
              <DashboardDailyRitualPrompt
                enabled={showDailyRitualPrompt}
                streak={dailyCheckinStreak}
                showWeeklyReset={showWeeklyResetPrompt}
                calibrationRecomputing={calibrationRecomputing}
                onDismissForToday={handleDismissDailyRitual}
                onRefreshOracle={() => {
                  appendDashboardEvent('dashboard_daily_ritual_popup_refresh_oracle');
                  void fetchDailyOracle(true);
                }}
                onOpenForecast={handleDailyRitualOpenForecast}
                onDailyCheckin={() => {
                  appendDashboardEvent('dashboard_daily_ritual_popup_checkin');
                  queueAskContext('Daily check-in', 'What is my highest-leverage move in the next 24 hours?');
                }}
                onRecomputeCalibration={recomputeCalibration}
                onWeeklyReset={() => {
                  appendDashboardEvent('dashboard_weekly_reset_prompt_clicked');
                  queueAskContext('Weekly reset', 'I lost momentum this week. Give me a one-step reset plan for the next 7 days.');
                  setShowWeeklyResetPrompt(false);
                }}
                onDismissWeeklyReset={() => {
                  appendDashboardEvent('dashboard_weekly_reset_prompt_dismissed');
                  setShowWeeklyResetPrompt(false);
                }}
              />
            ) : null}

            {chartData && showOnboarding ? (
              <DashboardOnboardingChecklist
                dashboardTab={dashboardTab}
                hasAskedMerlin={hasAskedMerlin}
                onDismiss={handleOnboardingDismiss}
                onNavigateToChart={handleOnboardingNavigateChart}
                onNavigateToForecast={handleOnboardingNavigateForecast}
                onNavigateToStormRadar={handleOnboardingNavigateStormRadar}
                onNavigateToAskMerlin={handleOnboardingNavigateAskMerlin}
                onAllStepsComplete={handleOnboardingComplete}
                hasSeenAtmosphere={atmosphereHeroSeen}
              />
            ) : null}
          </div>
        </div>
  );
}
