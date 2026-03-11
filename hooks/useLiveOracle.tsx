'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { BackgroundRunner } from '@capacitor/background-runner';
import type { BirthData } from '@/components/astrology/BirthChartCalculator';
import {
  generateLiveOracleSnapshot,
  type LiveOracleLocation,
  type LiveOracleSnapshot,
} from '@/lib/astrology/live-oracle';
import { LIVE_ORACLE_STORAGE_KEYS } from '@/lib/astrology/live-oracle-storage';

const MIN_INTERVAL_MINUTES = 1;
const MAX_INTERVAL_MINUTES = 60;
const BACKGROUND_LABEL = 'com.voxislabs.merlin.liveoracle';

const PROFILE_INTERVALS = {
  seeker: 1,
  balanced: 10,
  saver: 30,
  custom: 15,
} as const;

type PowerProfile = keyof typeof PROFILE_INTERVALS;

interface LiveOracleSettings {
  intervalMinutes: number;
  powerProfile: PowerProfile;
  proactiveNotifications: boolean;
  backgroundChecks: boolean;
}

function clampInterval(minutes: number): number {
  if (Number.isNaN(minutes)) return 15;
  return Math.max(MIN_INTERVAL_MINUTES, Math.min(MAX_INTERVAL_MINUTES, Math.round(minutes)));
}

export function useLiveOracle() {
  const timerRef = useRef<number | null>(null);
  const activeBirthDataRef = useRef<BirthData | null>(null);
  const notificationLastSentRef = useRef<number>(0);

  const [isRunning, setIsRunning] = useState(false);
  const [intervalMinutes, setIntervalMinutesState] = useState(15);
  const [powerProfile, setPowerProfileState] = useState<PowerProfile>('balanced');
  const [proactiveNotifications, setProactiveNotifications] = useState(true);
  const [backgroundChecks, setBackgroundChecks] = useState(true);
  const [snapshot, setSnapshot] = useState<LiveOracleSnapshot | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveSettings = useCallback((settings: LiveOracleSettings) => {
    localStorage.setItem(LIVE_ORACLE_STORAGE_KEYS.settings, JSON.stringify(settings));
  }, []);

  const syncSettingsToBackgroundRunner = useCallback(async (settings: LiveOracleSettings) => {
    try {
      await BackgroundRunner.dispatchEvent({
        label: BACKGROUND_LABEL,
        event: 'syncSettings',
        details: settings,
      });
    } catch {
      // No-op if background runner is unavailable in current runtime.
    }
  }, []);

  const scheduleAdviceNotification = useCallback(async (nextSnapshot: LiveOracleSnapshot) => {
    const now = Date.now();
    if (now - notificationLastSentRef.current < Math.max(60_000, intervalMinutes * 55_000)) {
      return;
    }

    const notificationPermission = await LocalNotifications.checkPermissions();
    if (notificationPermission.display !== 'granted') {
      const requested = await LocalNotifications.requestPermissions();
      if (requested.display !== 'granted') {
        return;
      }
    }

    notificationLastSentRef.current = now;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: now % 2147483647,
          title: 'Merlin Live Oracle',
          body: nextSnapshot.advice.slice(0, 180),
          schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true },
          extra: {
            type: 'live-oracle',
            timestamp: nextSnapshot.timestamp,
          },
        },
      ],
    });
  }, [intervalMinutes]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const runCycle = useCallback(async () => {
    if (!activeBirthDataRef.current) {
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });

      const location: LiveOracleLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      const nextSnapshot = await generateLiveOracleSnapshot(
        activeBirthDataRef.current,
        location,
        intervalMinutes
      );

      setSnapshot(nextSnapshot);
      localStorage.setItem(LIVE_ORACLE_STORAGE_KEYS.snapshot, JSON.stringify(nextSnapshot));

      if (proactiveNotifications) {
        await scheduleAdviceNotification(nextSnapshot);
      }

      try {
        await BackgroundRunner.dispatchEvent({
          label: BACKGROUND_LABEL,
          event: 'cacheAdvice',
          details: {
            timestamp: nextSnapshot.timestamp,
            advice: nextSnapshot.advice,
            exact: nextSnapshot.transitSummary.exact,
            approaching: nextSnapshot.transitSummary.approaching,
            latitude: nextSnapshot.location.latitude,
            longitude: nextSnapshot.location.longitude,
          },
        });
      } catch {
        // No-op for web-only runtime.
      }
    } catch (cycleError) {
      const message = cycleError instanceof Error ? cycleError.message : 'Failed to read location';
      setError(message);
    } finally {
      setIsChecking(false);
    }
  }, [intervalMinutes, proactiveNotifications, scheduleAdviceNotification]);

  const syncCurrentSettings = useCallback(async () => {
    const settings: LiveOracleSettings = {
      intervalMinutes,
      powerProfile,
      proactiveNotifications,
      backgroundChecks,
    };
    saveSettings(settings);
    await syncSettingsToBackgroundRunner(settings);
  }, [backgroundChecks, intervalMinutes, powerProfile, proactiveNotifications, saveSettings, syncSettingsToBackgroundRunner]);

  const start = useCallback(
    async (birthData: BirthData) => {
      activeBirthDataRef.current = birthData;

      const permission = await Geolocation.requestPermissions();
      if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
        setError('Location permission is required for Live Oracle mode.');
        return;
      }

      if (proactiveNotifications) {
        const notificationPermission = await LocalNotifications.checkPermissions();
        if (notificationPermission.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
      }

      if (backgroundChecks) {
        try {
          await BackgroundRunner.requestPermissions({ apis: ['geolocation', 'notifications'] });
        } catch {
          // Ignore if plugin not available in current runtime.
        }
      }

      await syncCurrentSettings();

      setIsRunning(true);
      await runCycle();

      clearTimer();
      timerRef.current = window.setInterval(() => {
        void runCycle();
      }, intervalMinutes * 60 * 1000);
    },
    [backgroundChecks, clearTimer, intervalMinutes, proactiveNotifications, runCycle, syncCurrentSettings]
  );

  const stop = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const setIntervalMinutes = useCallback((minutes: number) => {
    const clamped = clampInterval(minutes);
    setIntervalMinutesState(clamped);
    setPowerProfileState('custom');
  }, []);

  const setPowerProfile = useCallback((profile: PowerProfile) => {
    setPowerProfileState(profile);
    const nextInterval = PROFILE_INTERVALS[profile];
    setIntervalMinutesState(nextInterval);
  }, []);

  const loadPersistedState = useCallback(() => {
    try {
      const rawSettings = localStorage.getItem(LIVE_ORACLE_STORAGE_KEYS.settings);
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings) as Partial<LiveOracleSettings>;
        if (typeof parsed.intervalMinutes === 'number') {
          setIntervalMinutesState(clampInterval(parsed.intervalMinutes));
        }
        if (
          parsed.powerProfile === 'seeker' ||
          parsed.powerProfile === 'balanced' ||
          parsed.powerProfile === 'saver' ||
          parsed.powerProfile === 'custom'
        ) {
          setPowerProfileState(parsed.powerProfile);
        }
        if (typeof parsed.proactiveNotifications === 'boolean') {
          setProactiveNotifications(parsed.proactiveNotifications);
        }
        if (typeof parsed.backgroundChecks === 'boolean') {
          setBackgroundChecks(parsed.backgroundChecks);
        }
      }

      const rawSnapshot = localStorage.getItem(LIVE_ORACLE_STORAGE_KEYS.snapshot);
      if (rawSnapshot) {
        setSnapshot(JSON.parse(rawSnapshot) as LiveOracleSnapshot);
      }
    } catch {
      // Ignore malformed persisted state.
    }
  }, []);

  useEffect(() => {
    if (!isRunning || !activeBirthDataRef.current) {
      return;
    }

    clearTimer();
    timerRef.current = window.setInterval(() => {
      void runCycle();
    }, intervalMinutes * 60 * 1000);

    return () => {
      clearTimer();
    };
  }, [clearTimer, intervalMinutes, isRunning, runCycle]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  useEffect(() => {
    loadPersistedState();
  }, [loadPersistedState]);

  useEffect(() => {
    void syncCurrentSettings();
  }, [syncCurrentSettings]);

  return {
    isRunning,
    isChecking,
    intervalMinutes,
    powerProfile,
    proactiveNotifications,
    backgroundChecks,
    snapshot,
    error,
    start,
    stop,
    setIntervalMinutes,
    setPowerProfile,
    setProactiveNotifications,
    setBackgroundChecks,
    profiles: [
      { id: 'seeker' as const, label: 'Seeker', minutes: PROFILE_INTERVALS.seeker, note: 'Max precision' },
      { id: 'balanced' as const, label: 'Balanced', minutes: PROFILE_INTERVALS.balanced, note: 'Default' },
      { id: 'saver' as const, label: 'Saver', minutes: PROFILE_INTERVALS.saver, note: 'Battery-friendly' },
      { id: 'custom' as const, label: 'Custom', minutes: intervalMinutes, note: 'Manual slider' },
    ],
    intervalRange: {
      min: MIN_INTERVAL_MINUTES,
      max: MAX_INTERVAL_MINUTES,
    },
  };
}
