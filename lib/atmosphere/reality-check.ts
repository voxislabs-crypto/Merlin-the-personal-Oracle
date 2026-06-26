import { applyPatternReadinessNudge } from '@/lib/atmosphere/pattern-personalization';
import { sanitizeCopyText } from '@/lib/safety/copy-safety';
import { clampIntensity } from '@/lib/atmosphere/tone';
import type { AtmospherePatternInput } from '@/lib/atmosphere/pattern-types';
import type { AtmosphereCalibrationInput } from '@/lib/atmosphere/types';

export const READINESS_MODIFIER_MIN = 0.7;
export const READINESS_MODIFIER_MAX = 1.3;
export const FELT_INTENSITY_MIN = 15;
export const FELT_INTENSITY_MAX = 100;

export type RealityCheckSource = 'checkin' | 'journal' | 'checkin+journal' | 'none';
export type GuidanceBranch = 'neutral' | 'storm_calm' | 'storm_heavy' | 'calm_sky_heavy' | 'aligned';

export interface AtmosphereCheckinInput {
  mood: number;
  stress: number;
  energy: number;
  confidence?: number | null;
}

export interface AtmosphereRealityCheckInput {
  checkin?: AtmosphereCheckinInput | null;
  journalText?: string | null;
}

export interface AtmosphereRealityCheck {
  sentimentScore: number | null;
  readinessModifier: number;
  feltIntensity: number;
  gap: number;
  guidanceBranch: GuidanceBranch;
  guidanceNote: string;
  source: RealityCheckSource;
}

const POSITIVE_JOURNAL_TERMS = [
  'calm',
  'clear',
  'focused',
  'good',
  'grateful',
  'grounded',
  'hopeful',
  'light',
  'peaceful',
  'ready',
  'rested',
  'steady',
  'strong',
];

const NEGATIVE_JOURNAL_TERMS = [
  'anxious',
  'angry',
  'drained',
  'exhausted',
  'frustrated',
  'heavy',
  'lonely',
  'overwhelmed',
  'sad',
  'stressed',
  'tired',
  'worried',
];

function isValidScale(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 10;
}

export function getTodayCheckinEntry<T extends { createdAt: string; mood: number | null; stress: number | null; energy: number | null }>(
  entries: T[],
  date = new Date()
): T | null {
  const todayKey = date.toISOString().slice(0, 10);

  return (
    entries.find((entry) => {
      if (!entry.createdAt.startsWith(todayKey)) return false;
      return isValidScale(entry.mood) && isValidScale(entry.stress) && isValidScale(entry.energy);
    }) ?? null
  );
}

export function computeCheckinSentimentScore(checkin: AtmosphereCheckinInput): number {
  const mood = checkin.mood;
  const stress = checkin.stress;
  const energy = checkin.energy;
  const confidence = isValidScale(checkin.confidence) ? checkin.confidence : null;

  const stressInverted = 11 - stress;
  const raw =
    confidence === null
      ? (mood + energy + stressInverted) / 3
      : (mood + energy + stressInverted + confidence) / 4;

  return clampIntensity(((raw - 1) / 9) * 100);
}

export function scoreJournalSentiment(text: string | null | undefined): number | null {
  const normalized = text?.trim().toLowerCase();
  if (!normalized) return null;

  const tokens = normalized.split(/[^a-z']+/).filter(Boolean);
  if (!tokens.length) return null;

  let positive = 0;
  let negative = 0;

  for (const token of tokens) {
    if (POSITIVE_JOURNAL_TERMS.some((term) => token.includes(term))) positive += 1;
    if (NEGATIVE_JOURNAL_TERMS.some((term) => token.includes(term))) negative += 1;
  }

  if (positive === 0 && negative === 0) return 50;

  const balance = positive - negative;
  const adjustment = Math.max(-35, Math.min(35, balance * 8));
  return clampIntensity(50 + adjustment);
}

export function blendSentimentScore(
  checkinScore: number | null,
  journalScore: number | null
): { score: number | null; source: RealityCheckSource } {
  if (checkinScore !== null && journalScore !== null) {
    return {
      score: clampIntensity(Math.round(checkinScore * 0.7 + journalScore * 0.3)),
      source: 'checkin+journal',
    };
  }

  if (checkinScore !== null) {
    return { score: checkinScore, source: 'checkin' };
  }

  if (journalScore !== null) {
    return { score: journalScore, source: 'journal' };
  }

  return { score: null, source: 'none' };
}

export function computeReadinessModifier(
  sentimentScore: number | null,
  calibration?: AtmosphereCalibrationInput | null
): number {
  let modifier = 1;

  if (sentimentScore !== null) {
    modifier = READINESS_MODIFIER_MAX - (sentimentScore / 100) * (READINESS_MODIFIER_MAX - READINESS_MODIFIER_MIN);
  }

  if (
    calibration?.feedbackCount &&
    calibration.feedbackCount >= 3 &&
    typeof calibration.strongestMultiplier === 'number' &&
    Number.isFinite(calibration.strongestMultiplier)
  ) {
    const calibrationNudge = (calibration.strongestMultiplier - 1) * 0.12;
    modifier += calibrationNudge;
  }

  return Math.max(READINESS_MODIFIER_MIN, Math.min(READINESS_MODIFIER_MAX, Number(modifier.toFixed(3))));
}

export function computeFeltIntensity(astroIntensity: number, readinessModifier: number): number {
  const raw = astroIntensity * readinessModifier;
  return Math.max(FELT_INTENSITY_MIN, Math.min(FELT_INTENSITY_MAX, Math.round(raw)));
}

export function computeIntensityGap(astroIntensity: number, feltIntensity: number): number {
  return feltIntensity - astroIntensity;
}

export function resolveGuidanceBranch(
  astroIntensity: number,
  sentimentScore: number | null,
  feltIntensity: number,
  readinessModifier: number
): GuidanceBranch {
  if (sentimentScore === null) return 'neutral';

  const feltGap = feltIntensity - astroIntensity;

  if (astroIntensity >= 60 && readinessModifier <= 0.92 && feltGap <= -8) {
    return 'storm_calm';
  }

  if (astroIntensity >= 60 && readinessModifier >= 1.08 && feltGap >= 8) {
    return 'storm_heavy';
  }

  if (astroIntensity <= 45 && sentimentScore <= 40) {
    return 'calm_sky_heavy';
  }

  if (Math.abs(feltGap) <= 6) {
    return 'aligned';
  }

  return 'neutral';
}

export function buildRealityGuidance(branch: GuidanceBranch): string {
  switch (branch) {
    case 'storm_calm':
      return sanitizeCopyText(
        'The sky is loud, but you may feel steadier than the chart suggests. Channel the pressure into one focused, reversible move instead of bracing for collapse.'
      );
    case 'storm_heavy':
      return sanitizeCopyText(
        'Sky pressure and your current state are both elevated. Simplify your plate, protect recovery time, and avoid stacking big decisions today.'
      );
    case 'calm_sky_heavy':
      return sanitizeCopyText(
        'The chart is relatively open, yet you may still feel weighed down. Treat that as signal from your body and mood — pace gently and name what needs support.'
      );
    case 'aligned':
      return sanitizeCopyText(
        'Your felt state and the sky tone are tracking together. Use that alignment to choose one deliberate step with confidence.'
      );
    default:
      return '';
  }
}

export function computeRealityCheck(
  astroIntensity: number,
  input?: AtmosphereRealityCheckInput | null,
  calibration?: AtmosphereCalibrationInput | null,
  patterns?: AtmospherePatternInput | null
): AtmosphereRealityCheck {
  const checkinScore =
    input?.checkin && isValidScale(input.checkin.mood) && isValidScale(input.checkin.stress) && isValidScale(input.checkin.energy)
      ? computeCheckinSentimentScore(input.checkin)
      : null;
  const journalScore = scoreJournalSentiment(input?.journalText);
  const blended = blendSentimentScore(checkinScore, journalScore);

  const baseReadiness = computeReadinessModifier(blended.score, calibration);
  const patternAdjusted = applyPatternReadinessNudge(
    baseReadiness,
    patterns?.profile,
    patterns?.activeTransits
  );
  const readinessModifier = patternAdjusted.modifier;
  const feltIntensity = computeFeltIntensity(astroIntensity, readinessModifier);
  const gap = computeIntensityGap(astroIntensity, feltIntensity);
  const guidanceBranch = resolveGuidanceBranch(
    astroIntensity,
    blended.score,
    feltIntensity,
    readinessModifier
  );
  const guidanceNote = buildRealityGuidance(guidanceBranch);

  return {
    sentimentScore: blended.score,
    readinessModifier,
    feltIntensity,
    gap,
    guidanceBranch,
    guidanceNote,
    source: blended.source,
  };
}