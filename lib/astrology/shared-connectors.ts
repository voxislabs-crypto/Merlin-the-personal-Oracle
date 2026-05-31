import 'server-only';

import type { SharedConnectorProfile, SharedConnectorSummary, SharedSignalSource } from '@/types/astrology';

const DEFAULT_CONNECTOR_COPY: Record<SharedSignalSource, { privacyLabel: string; influenceLabel: string; confidenceWeight: number }> = {
  calendar: {
    privacyLabel: 'Calendar events are only used as demand markers when enabled.',
    influenceLabel: 'Workload and timing pressure',
    confidenceWeight: 0.85,
  },
  location: {
    privacyLabel: 'Location is used only for local time rhythm and region-aware pacing.',
    influenceLabel: 'Day-cycle and environmental context',
    confidenceWeight: 0.7,
  },
  sleep: {
    privacyLabel: 'Sleep signals are used only for recovery and fatigue weighting.',
    influenceLabel: 'Recovery load and cognitive stamina',
    confidenceWeight: 0.9,
  },
};

export function buildSharedConnectorProfiles(
  enabledSources: SharedSignalSource[] = [],
  mode: 'couple' | 'team' = 'couple'
): SharedConnectorProfile[] {
  const enabledSet = new Set(enabledSources);

  return (Object.keys(DEFAULT_CONNECTOR_COPY) as SharedSignalSource[]).map((source) => {
    const base = DEFAULT_CONNECTOR_COPY[source];

    return {
      source,
      enabled: enabledSet.has(source),
      privacyLabel: `${base.privacyLabel} Mode: ${mode}.`,
      influenceLabel: base.influenceLabel,
      confidenceWeight: base.confidenceWeight,
    };
  });
}

export function buildSharedConnectorSummaries(profiles: SharedConnectorProfile[]): SharedConnectorSummary[] {
  return profiles.map(({ source, enabled, privacyLabel, influenceLabel }) => ({
    source,
    enabled,
    privacyLabel,
    influenceLabel,
  }));
}
