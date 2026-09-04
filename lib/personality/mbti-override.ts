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

/**
 * Paint firmware (and optional mask) onto a dual overlay without rescoring.
 * Original object is not mutated. Fusion breakdowns stay as calculated.
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
