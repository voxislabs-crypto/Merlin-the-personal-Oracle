import 'server-only';

import type { BirthChartData, SharedAtmosphereMode, SharedAtmosphereReport, SharedConnectorProfile, SharedSignalConsent, SharedAtmosphereWindow } from '@/types/astrology';
import { generateSynastryReport } from '@/lib/astrology/synastry';
import { buildSharedConnectorProfiles, buildSharedConnectorSummaries } from '@/lib/astrology/shared-connectors';

export interface BuildSharedAtmosphereInput {
  chart1: BirthChartData;
  chart2: BirthChartData;
  person1Name?: string;
  person2Name?: string;
  mode?: SharedAtmosphereMode;
  sharedConsent: boolean;
  sources?: SharedSignalConsent[];
  connectorProfiles?: SharedConnectorProfile[];
}

function buildWindows(
  compatibility: number,
  strengths: string[],
  challenges: string[],
  connectorProfiles: SharedConnectorProfile[]
): SharedAtmosphereWindow[] {
  const windows: SharedAtmosphereWindow[] = [];

  if (compatibility >= 75) {
    windows.push({
      label: 'Resonance window',
      kind: 'resonance',
      score: Math.min(100, compatibility + 10),
      recommendation: 'Use this for collaboration, intimacy, and shared planning.',
    });
  } else if (compatibility >= 55) {
    windows.push({
      label: 'Balanced window',
      kind: 'communication',
      score: compatibility,
      recommendation: 'Use this for thoughtful conversation and practical coordination.',
    });
  } else {
    windows.push({
      label: 'Tension window',
      kind: 'tension',
      score: 100 - compatibility,
      recommendation: 'Slow down, reduce assumptions, and focus on clarity before resolution.',
    });
  }

  if (challenges.length > 0) {
    windows.push({
      label: 'Communication front',
      kind: 'communication',
      score: Math.max(35, 80 - challenges.length * 8),
      recommendation: 'Prefer direct wording, short feedback loops, and explicit consent.',
    });
  }

  if (strengths.length > challenges.length) {
    windows.push({
      label: 'Restoration front',
      kind: 'rest',
      score: Math.min(95, 60 + strengths.length * 6),
      recommendation: 'This is a good window for repair, softness, and shared recovery.',
    });
  }

  const enabledConnectors = connectorProfiles.filter((profile) => profile.enabled);
  if (enabledConnectors.length > 0) {
    windows.push({
      label: 'Data refinement front',
      kind: 'communication',
      score: Math.min(90, 55 + enabledConnectors.length * 8),
      recommendation: 'Optional signals are active, so timing and recovery windows can become more precise.',
    });
  }

  return windows.slice(0, 3);
}

function buildGuidance(
  sharedConsent: boolean,
  sources: SharedSignalConsent[],
  compatibility: number,
  connectorProfiles: SharedConnectorProfile[]
): string[] {
  const guidance = [
    'Shared atmosphere only works with explicit consent from all participants.',
    'Use the report as a navigation layer, not a verdict.',
  ];

  if (sharedConsent) {
    guidance.push('Keep changes reversible and discuss them before acting on them.');
  }

  if (sources.some((source) => source.enabled)) {
    guidance.push('Optional signals refine timing only when they are individually enabled.');
  }

  if (compatibility >= 75) {
    guidance.push('High resonance still benefits from pacing and check-ins to avoid overload.' );
  }

  if (connectorProfiles.some((profile) => profile.enabled)) {
    guidance.push('Enabled connectors only provide coarse context, not raw surveillance data.');
  }

  return guidance;
}

export function buildSharedAtmosphereReport(input: BuildSharedAtmosphereInput): SharedAtmosphereReport {
  if (!input.sharedConsent) {
    throw new Error('Shared atmosphere requires explicit consent.');
  }

  const synastry = generateSynastryReport(input.chart1, input.chart2, input.person1Name, input.person2Name);
  const sources = input.sources || [
    { source: 'calendar', enabled: false, note: 'Calendar sync is opt-in only.' },
    { source: 'location', enabled: false, note: 'Location context is opt-in only.' },
    { source: 'sleep', enabled: false, note: 'Sleep tracker context is opt-in only.' },
  ];
  const connectorProfiles = input.connectorProfiles || buildSharedConnectorProfiles(
    sources.filter((source) => source.enabled).map((source) => source.source),
    input.mode || 'couple'
  );

  return {
    version: 'shared-atmosphere-v1',
    mode: input.mode || 'couple',
    sharedConsent: true,
    sources,
    connectors: buildSharedConnectorSummaries(connectorProfiles),
    summary: synastry.narrative,
    compatibility: synastry.overallCompatibility,
    windows: buildWindows(synastry.overallCompatibility, synastry.strengths, synastry.challenges, connectorProfiles),
    guidance: buildGuidance(true, sources, synastry.overallCompatibility, connectorProfiles),
    privacyNote: 'All optional inputs remain individually opt-in, visible, and revocable.',
    synastry: {
      person1Name: synastry.person1Name,
      person2Name: synastry.person2Name,
      overallCompatibility: synastry.overallCompatibility,
      narrative: synastry.narrative,
      strengths: synastry.strengths,
      challenges: synastry.challenges,
    },
    aspects: synastry.aspects,
  };
}
