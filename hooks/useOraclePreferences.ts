'use client';

import { useCallback, useEffect, useState } from 'react';
import type { OracleTonePreset } from '@/lib/oracle-output';
import type { OracleMode } from '@/lib/oracle-chat-client';
import type { ProphecyPolishMode } from '@/lib/prophecy-polish';

export type InterpretationMode = 'grok' | 'traditional';

export type OraclePreferences = {
  clarityMode: boolean;
  interpretationMode: InterpretationMode;
  noBullshitMode: boolean;
  questLogEnabled: boolean;
  oracleTonePreset: OracleTonePreset;
  oracleMode: OracleMode;
  includeLikelihood: boolean;
  ancientLayer: boolean;
  prophecyPolishMode: ProphecyPolishMode;
};

const DEFAULT_PREFERENCES: OraclePreferences = {
  clarityMode: true,
  interpretationMode: 'grok',
  noBullshitMode: false,
  questLogEnabled: true,
  oracleTonePreset: 'warm',
  oracleMode: 'auto',
  includeLikelihood: true,
  ancientLayer: false,
  prophecyPolishMode: 'engine',
};

const LOCAL_STORAGE_KEYS = {
  clarityMode: 'merlin_clarity_mode',
  interpretationMode: 'merlin_interpretation_mode',
  noBullshitMode: 'merlin_no_bullshit_mode',
  questLogEnabled: 'merlin_quest_log_enabled',
  oracleTonePreset: 'merlin_oracle_tone',
  oracleMode: 'merlin_oracle_mode',
  includeLikelihood: 'merlin_include_likelihood',
  ancientLayer: 'merlin_ancient_layer',
  prophecyPolishMode: 'merlin_prophecy_polish_mode',
} as const;

function normalizePreferences(input: Partial<OraclePreferences> | unknown): Partial<OraclePreferences> {
  if (!input || typeof input !== 'object') {
    return {};
  }

  const value = input as Record<string, unknown>;
  const preferences: Partial<OraclePreferences> = {};

  if (typeof value.clarityMode === 'boolean') {
    preferences.clarityMode = value.clarityMode;
  }
  if (value.interpretationMode === 'grok' || value.interpretationMode === 'traditional') {
    preferences.interpretationMode = value.interpretationMode;
  }
  if (typeof value.noBullshitMode === 'boolean') {
    preferences.noBullshitMode = value.noBullshitMode;
  }
  if (typeof value.questLogEnabled === 'boolean') {
    preferences.questLogEnabled = value.questLogEnabled;
  }
  if (
    value.oracleTonePreset === 'warm' ||
    value.oracleTonePreset === 'direct' ||
    value.oracleTonePreset === 'mystic' ||
    value.oracleTonePreset === 'strategic'
  ) {
    preferences.oracleTonePreset = value.oracleTonePreset;
  }
  if (value.oracleMode === 'auto' || value.oracleMode === 'casual' || value.oracleMode === 'detailed') {
    preferences.oracleMode = value.oracleMode;
  }
  if (typeof value.includeLikelihood === 'boolean') {
    preferences.includeLikelihood = value.includeLikelihood;
  }
  if (typeof value.ancientLayer === 'boolean') {
    preferences.ancientLayer = value.ancientLayer;
  }
  if (value.prophecyPolishMode === 'engine' || value.prophecyPolishMode === 'groq') {
    preferences.prophecyPolishMode = value.prophecyPolishMode;
  }

  return preferences;
}

function readLocalPreferences(): Partial<OraclePreferences> {
  if (typeof window === 'undefined') {
    return {};
  }

  const preferences: Partial<OraclePreferences> = {};

  const clarityMode = localStorage.getItem(LOCAL_STORAGE_KEYS.clarityMode);
  if (clarityMode !== null) {
    preferences.clarityMode = clarityMode !== 'false';
  }

  const interpretationMode = localStorage.getItem(LOCAL_STORAGE_KEYS.interpretationMode);
  if (interpretationMode === 'grok' || interpretationMode === 'traditional') {
    preferences.interpretationMode = interpretationMode;
  }

  const noBullshitMode = localStorage.getItem(LOCAL_STORAGE_KEYS.noBullshitMode);
  if (noBullshitMode !== null) {
    preferences.noBullshitMode = noBullshitMode === 'true';
  }

  const questLogEnabled = localStorage.getItem(LOCAL_STORAGE_KEYS.questLogEnabled);
  if (questLogEnabled !== null) {
    preferences.questLogEnabled = questLogEnabled !== 'false';
  }

  const oracleTonePreset = localStorage.getItem(LOCAL_STORAGE_KEYS.oracleTonePreset);
  if (
    oracleTonePreset === 'warm' ||
    oracleTonePreset === 'direct' ||
    oracleTonePreset === 'mystic' ||
    oracleTonePreset === 'strategic'
  ) {
    preferences.oracleTonePreset = oracleTonePreset;
  }

  const oracleMode = localStorage.getItem(LOCAL_STORAGE_KEYS.oracleMode);
  if (oracleMode === 'auto' || oracleMode === 'casual' || oracleMode === 'detailed') {
    preferences.oracleMode = oracleMode;
  }

  const includeLikelihood = localStorage.getItem(LOCAL_STORAGE_KEYS.includeLikelihood);
  if (includeLikelihood !== null) {
    preferences.includeLikelihood = includeLikelihood !== 'false';
  }

  const ancientLayer = localStorage.getItem(LOCAL_STORAGE_KEYS.ancientLayer);
  if (ancientLayer !== null) {
    preferences.ancientLayer = ancientLayer === 'true';
  }

  const prophecyPolishMode = localStorage.getItem(LOCAL_STORAGE_KEYS.prophecyPolishMode);
  if (prophecyPolishMode === 'engine' || prophecyPolishMode === 'groq') {
    preferences.prophecyPolishMode = prophecyPolishMode;
  }

  return preferences;
}

function writeLocalPreferences(next: Partial<OraclePreferences>): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (typeof next.clarityMode === 'boolean') {
    localStorage.setItem(LOCAL_STORAGE_KEYS.clarityMode, String(next.clarityMode));
  }
  if (next.interpretationMode === 'grok' || next.interpretationMode === 'traditional') {
    localStorage.setItem(LOCAL_STORAGE_KEYS.interpretationMode, next.interpretationMode);
  }
  if (typeof next.noBullshitMode === 'boolean') {
    localStorage.setItem(LOCAL_STORAGE_KEYS.noBullshitMode, String(next.noBullshitMode));
  }
  if (typeof next.questLogEnabled === 'boolean') {
    localStorage.setItem(LOCAL_STORAGE_KEYS.questLogEnabled, String(next.questLogEnabled));
  }
  if (
    next.oracleTonePreset === 'warm' ||
    next.oracleTonePreset === 'direct' ||
    next.oracleTonePreset === 'mystic' ||
    next.oracleTonePreset === 'strategic'
  ) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.oracleTonePreset, next.oracleTonePreset);
  }
  if (next.oracleMode === 'auto' || next.oracleMode === 'casual' || next.oracleMode === 'detailed') {
    localStorage.setItem(LOCAL_STORAGE_KEYS.oracleMode, next.oracleMode);
  }
  if (typeof next.includeLikelihood === 'boolean') {
    localStorage.setItem(LOCAL_STORAGE_KEYS.includeLikelihood, String(next.includeLikelihood));
  }
  if (typeof next.ancientLayer === 'boolean') {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ancientLayer, String(next.ancientLayer));
  }
  if (next.prophecyPolishMode === 'engine' || next.prophecyPolishMode === 'groq') {
    localStorage.setItem(LOCAL_STORAGE_KEYS.prophecyPolishMode, next.prophecyPolishMode);
  }
}

export function useOraclePreferences(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? false;
  const [preferences, setPreferences] = useState<OraclePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const localPreferences = normalizePreferences(readLocalPreferences());
    if (Object.keys(localPreferences).length === 0) {
      return;
    }

    setPreferences((prev) => ({
      ...prev,
      ...localPreferences,
    }));
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const loadServerPreferences = async () => {
      try {
        const response = await fetch('/api/oracle-preferences');
        if (!response.ok) {
          return;
        }

        const result = await response.json();
        const serverPreferences = normalizePreferences(result?.data);
        if (Object.keys(serverPreferences).length === 0 || cancelled) {
          return;
        }

        setPreferences((prev) => ({
          ...prev,
          ...serverPreferences,
        }));
        writeLocalPreferences(serverPreferences);
      } catch {
        // Keep local preferences when account sync is unavailable.
      }
    };

    loadServerPreferences();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const persistPreferences = useCallback(
    async (next: Partial<OraclePreferences>): Promise<{ synced: boolean }> => {
      const normalized = normalizePreferences(next);
      if (Object.keys(normalized).length === 0) {
        return { synced: false };
      }

      setPreferences((prev) => ({
        ...prev,
        ...normalized,
      }));
      writeLocalPreferences(normalized);

      if (!enabled) {
        return { synced: false };
      }

      try {
        const response = await fetch('/api/oracle-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalized),
        });

        if (!response.ok) {
          return { synced: false };
        }

        const result = await response.json();
        const serverPreferences = normalizePreferences(result?.data);
        if (Object.keys(serverPreferences).length > 0) {
          setPreferences((prev) => ({
            ...prev,
            ...serverPreferences,
          }));
          writeLocalPreferences(serverPreferences);
        }

        return { synced: true };
      } catch {
        return { synced: false };
      }
    },
    [enabled]
  );

  return {
    preferences,
    persistPreferences,
  };
}
