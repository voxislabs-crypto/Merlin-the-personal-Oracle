import type { AtmospherePacket } from '@/lib/atmosphere/types';

export type AtmosphereSourceEvent =
  | 'atmosphere_source_pressure'
  | 'atmosphere_source_storm'
  | 'atmosphere_source_rating'
  | 'atmosphere_source_fallback';

export function resolveAtmosphereSourceEvent(packet: AtmospherePacket): AtmosphereSourceEvent {
  const provenance = packet.provenance;
  if (provenance.includes('pressure-engine')) return 'atmosphere_source_pressure';
  if (provenance.includes('storms')) return 'atmosphere_source_storm';
  if (provenance.includes('forecast-day-rating')) return 'atmosphere_source_rating';
  return 'atmosphere_source_fallback';
}

export function buildAtmosphereRenderedDetail(
  packet: AtmospherePacket,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  return {
    date: packet.date,
    provenance: packet.provenance,
    intensity: packet.intensity,
    feltIntensity: packet.feltIntensity,
    readinessModifier: packet.readinessModifier,
    realityCheckSource: packet.realityCheck.source,
    guidanceBranch: packet.realityCheck.guidanceBranch,
    patternModifier: packet.patterns.modifier,
    patternTags: packet.patterns.tags,
    matchedPatternCount: packet.patterns.active.length,
    dayRating: packet.dayRating,
    toneLabel: packet.tone.label,
    confidence: packet.confidence,
    confluenceAligned: packet.confluence.aligned,
    confluenceThemes: packet.confluence.themes,
    driverSource: packet.dominantDriver.source,
    driverLabel: packet.dominantDriver.label,
    intensitySource: resolveAtmosphereSourceEvent(packet),
    ...extra,
  };
}