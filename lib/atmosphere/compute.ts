import { computeAtmosphereConfluence } from '@/lib/atmosphere/confluence';
import { resolveDominantDriver } from '@/lib/atmosphere/headline';
import { resolveAtmospherePatternsContext } from '@/lib/atmosphere/pattern-tags';
import { computeRealityCheck } from '@/lib/atmosphere/reality-check';
import {
  applyBaselineModifier,
  applyCalibrationModifier,
  applyTripleHitAmplification,
  getBaselineTemperature,
  normalizeDayRating,
  resolveBaseIntensity,
  resolveConfidence,
} from '@/lib/atmosphere/intensity';
import { resolveTone } from '@/lib/atmosphere/tone';
import type { AtmospherePacket, ComputeAtmosphereInput } from '@/lib/atmosphere/types';
import { assertCopySafeText } from '@/lib/safety/copy-safety';

function resolveDate(input: ComputeAtmosphereInput): string {
  if (input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return input.date;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeAtmosphere(input: ComputeAtmosphereInput = {}): AtmospherePacket {
  const base = resolveBaseIntensity(input);
  const baselineTemperature = getBaselineTemperature(input.predictive?.progressedMoon);
  const withBaseline = applyBaselineModifier(base.intensity, baselineTemperature);
  const calibrated = applyCalibrationModifier(withBaseline, input.calibration);

  const provenance = Array.from(
    new Set([
      ...base.provenance,
      ...(input.predictive?.progressedMoon ? ['progressed-moon'] : []),
      ...(input.predictive?.lunarTiming ? ['lunar-timing'] : []),
      ...calibrated.provenance,
    ])
  );

  const confluence = computeAtmosphereConfluence(input.predictive, input.temporal);
  if (confluence.aligned) {
    provenance.push(confluence.tripleHit ? 'triple-hit-v2' : 'triple-confluence');
  }
  if (input.temporal?.profection) {
    provenance.push('annual-profection');
  }
  if (input.temporal?.solarArc?.activeHits?.length) {
    provenance.push('solar-arc-active');
  }

  const amplified = applyTripleHitAmplification(
    calibrated.intensity,
    resolveConfidence(input, base.source),
    confluence.tripleHit
  );
  provenance.push(...amplified.provenance);

  const intensity = amplified.intensity;
  const patterns = resolveAtmospherePatternsContext(
    input.patterns?.profile,
    input.patterns?.activeTransits
  );
  if (patterns.provenance.length) {
    provenance.push(...patterns.provenance);
  }

  const realityCheck = computeRealityCheck(
    intensity,
    input.realityCheck,
    input.calibration,
    input.patterns
  );
  if (realityCheck.source !== 'none') {
    provenance.push(`reality-check-${realityCheck.source}`);
  }
  if (realityCheck.guidanceBranch !== 'neutral') {
    provenance.push(`guidance-${realityCheck.guidanceBranch}`);
  }

  const dominantDriver = resolveDominantDriver(input, intensity);
  if (confluence.aligned && dominantDriver.source === 'transit') {
    dominantDriver.source = 'confluence';
  }
  if (realityCheck.guidanceNote) {
    dominantDriver.rationale = [dominantDriver.rationale, realityCheck.guidanceNote]
      .filter(Boolean)
      .join(' ');
  }

  const dayRating = normalizeDayRating(input.forecast, intensity);
  const tone = resolveTone(intensity);
  const confidence = amplified.confidence;

  const calibration =
    input.calibration && input.calibration.feedbackCount >= 3
      ? {
          active: true,
          feedbackCount: input.calibration.feedbackCount,
          strongestPlanet: input.calibration.strongestPlanet,
          strongestMultiplier: input.calibration.strongestMultiplier,
        }
      : undefined;

  const packet: AtmospherePacket = {
    date: resolveDate(input),
    intensity,
    feltIntensity: realityCheck.feltIntensity,
    readinessModifier: realityCheck.readinessModifier,
    dayRating,
    tone,
    dominantDriver,
    temporal: {
      progressedMoonSign: input.predictive?.progressedMoon?.sign,
      progressedMoonDegree: input.predictive?.progressedMoon?.degree,
      baselineTemperature,
      lunarPhase: input.predictive?.lunarTiming?.phase || input.moonPhase,
      lunarSign: input.moonSign,
      profectedSign: input.temporal?.profection?.profectedSign,
      profectedHouse: input.temporal?.profection?.profectedHouse,
      timeLord: input.temporal?.profection?.timeLord,
      themeOfYear: input.temporal?.profection?.themeOfYear,
      solarArcAge: input.temporal?.solarArc?.ageYears,
      solarArcHits: input.temporal?.solarArc?.activeHits?.map((hit) => ({
        directedPlanet: hit.directedPlanet,
        natalPlanet: hit.natalPlanet,
        aspect: hit.aspect,
        orb: hit.orb,
      })),
    },
    confluence,
    calibration,
    realityCheck,
    patterns,
    confidence,
    provenance,
    generatedAt: new Date().toISOString(),
  };

  const safety = assertCopySafeText([packet.dominantDriver.rationale]);
  if (!safety.safe) {
    packet.dominantDriver.rationale =
      'You might notice shifting cosmic pressure today. Stay flexible, move deliberately, and choose reversible steps.';
  }

  return packet;
}