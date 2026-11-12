/**
 * User-layer MBTI override.
 *
 * Lives above computeMBTIDual — never fed back into mbtiFusion.ts.
 * The calculator is a hypothesis. This is the person saying who they are.
 */

import type { MBTIType } from '@/lib/mbti-overlay';
import type { DualOverlay } from '@/lib/personality/dual-overlay';

export const MBTI_TYPE_CODES: MBTIType[] = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
];

export const MBTI_OVERRIDE_CORE_KEY = 'mbtiOverrideCore';
export const MBTI_OVERRIDE_MASK_KEY = 'mbtiOverrideMask';
/** Legacy DualPersonalityCards key — flavor/shadow only. Read as core until migrated. */
export const MBTI_OVERRIDE_LEGACY_KEY = 'mbtiOverride';

export type MbtiCoreSource = 'calculated' | 'user';

export interface MbtiUserOverride {
  core: MBTIType | null;
  mask: MBTIType | null;
}

export function parseMbtiType(value: unknown): MBTIType | null {
  if (typeof value !== 'string') return null;
  const type = value.trim().toUpperCase();
  return MBTI_TYPE_CODES.includes(type as MBTIType) ? (type as MBTIType) : null;
}

export function readMbtiUserOverride(
  metadata?: Record<string, unknown> | null,
): MbtiUserOverride {
  if (!metadata || typeof metadata !== 'object') {
    return { core: null, mask: null };
  }
  return {
    core:
      parseMbtiType(metadata[MBTI_OVERRIDE_CORE_KEY]) ||
      parseMbtiType(metadata[MBTI_OVERRIDE_LEGACY_KEY]),
    mask: parseMbtiType(metadata[MBTI_OVERRIDE_MASK_KEY]),
  };
}

export function coreSourceFromOverride(coreOverride: string | null | undefined): MbtiCoreSource {
  return parseMbtiType(coreOverride) ? 'user' : 'calculated';
}

export function dimensionLettersForMbtiType(type: string | null | undefined): {
  e_i: string;
  s_n: string;
  t_f: string;
  j_p: string;
} | null {
  const parsed = parseMbtiType(type);
  if (!parsed) return null;
  return {
    e_i: parsed[0],
    s_n: parsed[1],
    t_f: parsed[2],
    j_p: parsed[3],
  };
}

/** True when the painted type's four letters disagree with the chart breakdown. */
export function layerTypeOverridesBreakdown(layer: {
  mbtiType?: string | null;
  breakdown?: { e_i?: string; s_n?: string; t_f?: string; j_p?: string } | null;
}): boolean {
  const letters = dimensionLettersForMbtiType(layer.mbtiType);
  const breakdown = layer.breakdown;
  if (!letters || !breakdown) return false;
  return (
    breakdown.e_i !== letters.e_i ||
    breakdown.s_n !== letters.s_n ||
    breakdown.t_f !== letters.t_f ||
    breakdown.j_p !== letters.j_p
  );
}

/**
 * Display copy for the Dimension Map.
 * Highlighted letters follow each layer's type (including a user override).
 * Chart reasoning is kept. Engine prose is dropped when the type was overridden,
 * so the map does not describe the calculated type under a type the user set.
 * The input overlay is not mutated.
 */
export function presentDualForDimensionMap(dual: DualOverlay): DualOverlay {
  const align = (layer: DualOverlay['firmware']): DualOverlay['firmware'] => {
    const letters = dimensionLettersForMbtiType(layer.mbtiType);
    if (!letters || !layerTypeOverridesBreakdown(layer)) return layer;
    return {
      ...layer,
      description: '',
      breakdown: {
        ...layer.breakdown,
        ...letters,
      },
    };
  };

  const firmware = align(dual.firmware);
  const hardware = align(dual.hardware);
  if (firmware === dual.firmware && hardware === dual.hardware) return dual;
  return { ...dual, firmware, hardware };
}

/**
 * Paint firmware (and optional mask) onto a dual overlay without rescoring.
 * Original object is not mutated. Fusion breakdowns stay as calculated;
 * the Dimension Map realigns letters from the painted type at display time.
 */
export function applyMbtiUserOverride(
  dual: DualOverlay | null | undefined,
  override: { core?: string | null; mask?: string | null } | null | undefined,
): DualOverlay | null {
  if (!dual) return null;
  const core = parseMbtiType(override?.core);
  const mask = parseMbtiType(override?.mask);
  if (!core && !mask) return dual;

  const firmware =
    core && core !== dual.firmware.mbtiType
      ? { ...dual.firmware, mbtiType: core }
      : dual.firmware;
  const hardware =
    mask && mask !== dual.hardware.mbtiType
      ? { ...dual.hardware, mbtiType: mask }
      : dual.hardware;

  return {
    ...dual,
    firmware,
    hardware,
    // Speaking type follows Core when the user set it.
    finalType: core || dual.finalType,
  };
}

export function resolveActiveCoreType(input: {
  coreOverride?: string | null;
  dualOverlay?: { firmware?: { mbtiType?: string }; finalType?: string } | null;
  mbtiType?: string | null;
}): MBTIType | null {
  return (
    parseMbtiType(input.coreOverride) ||
    parseMbtiType(input.dualOverlay?.firmware?.mbtiType) ||
    parseMbtiType(input.mbtiType) ||
    parseMbtiType(input.dualOverlay?.finalType)
  );
}

/** Birth identity for "personality has settled for this chart." Not a chart hash. */
export function personalityBirthKey(birth: {
  date: string;
  time: string;
  latitude: number;
  longitude: number;
}): string {
  return `${birth.date}|${birth.time}|${birth.latitude}|${birth.longitude}`;
}

/**
 * Weather may refresh immediately when the user has set a Core.
 * Otherwise wait until the personality read for this birth has finished,
 * so the first forecast is not stuck on a missing type.
 */
export function weatherRefreshReady(input: {
  coreOverride?: string | null;
  birthKey: string;
  resolvedBirthKey?: string | null;
}): boolean {
  if (parseMbtiType(input.coreOverride)) return true;
  return Boolean(input.birthKey) && input.resolvedBirthKey === input.birthKey;
}

/**
 * Cache key for dashboard forecast / transit / atmosphere hydration.
 * Effective Core (override or calculated) and a mask override change the key.
 * Birth time stays in the key so a new chart still refetches. The natal wheel
 * itself is not rebuilt from this key.
 */
export function weatherHydrationKey(input: {
  tier: string;
  scope: 'full' | 'today';
  birthDate: string;
  birthTime: string;
  localDay: string;
  effectiveType?: string | null;
  maskOverride?: string | null;
}): string {
  const core = parseMbtiType(input.effectiveType) || 'none';
  const mask = parseMbtiType(input.maskOverride) || 'chart';
  // Pipe-separated: birth time contains colons.
  return [
    input.tier,
    input.scope,
    input.birthDate,
    input.birthTime,
    input.localDay,
    core,
    mask,
  ].join('|');
}

/** Local calendar day stored in a weatherHydrationKey, if the key has one. */
export function weatherHydrationDay(key: string | null | undefined): string | null {
  if (!key) return null;
  const day = key.split('|')[4];
  return day || null;
}
