import type {
  IdentityArchetype,
  IdentityMbti,
  IdentityMbtiLayer,
  IdentityPacket,
  IdentityProvenance,
} from '@/lib/self/types';

export interface BuildIdentityPacketInput {
  sunSign?: string | null;
  moonSign?: string | null;
  risingSign?: string | null;
  /** Single MBTI type string (legacy dashboard path) */
  mbtiType?: string | null;
  /** Optional dual / fusion detail when available */
  mbtiPrimary?: Partial<IdentityMbtiLayer> | null;
  mbtiSecondary?: Partial<IdentityMbtiLayer> | null;
  mbtiBlendSummary?: string | null;
  archetypeName?: string | null;
  patternSignature?: string | null;
  coreContradiction?: string | null;
  calcSource?: string | null;
  chartHasHouses?: boolean;
  confidenceSource?: IdentityProvenance['confidenceSource'];
}

function cleanSign(value?: string | null): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function layerFromPartial(
  partial: Partial<IdentityMbtiLayer> | null | undefined,
  fallbackRole: IdentityMbtiLayer['role'],
): IdentityMbtiLayer | undefined {
  if (!partial?.type || typeof partial.type !== 'string') return undefined;
  const type = partial.type.trim().toUpperCase();
  if (!type) return undefined;
  return {
    type,
    confidence: typeof partial.confidence === 'number' ? partial.confidence : undefined,
    label: partial.label,
    role: partial.role || fallbackRole,
  };
}

function buildMbti(input: BuildIdentityPacketInput): IdentityMbti {
  const primary =
    layerFromPartial(input.mbtiPrimary, 'primary') ||
    (input.mbtiType
      ? {
          type: String(input.mbtiType).trim().toUpperCase(),
          role: 'primary' as const,
        }
      : undefined);

  const secondary = layerFromPartial(input.mbtiSecondary, 'secondary');

  return {
    primary,
    secondary,
    blendSummary: input.mbtiBlendSummary?.trim() || undefined,
  };
}

function buildHeadline(
  placements: { sunSign?: string; moonSign?: string; risingSign?: string },
  mbti: IdentityMbti,
  archetype: IdentityArchetype,
): string {
  if (archetype.archetypeName) {
    const type = mbti.primary?.type;
    return type
      ? `${archetype.archetypeName} · ${type} in this weather`
      : `${archetype.archetypeName} — how Merlin reads you`;
  }

  const bits = [
    placements.sunSign ? `Sun ${placements.sunSign}` : null,
    placements.moonSign ? `Moon ${placements.moonSign}` : null,
    placements.risingSign ? `Rising ${placements.risingSign}` : null,
  ].filter(Boolean);

  const core = mbti.primary?.type;
  const mask = mbti.secondary?.type;
  if (bits.length && core && mask && core !== mask) {
    return `${bits.join(' · ')} · Core ${core} · Mask ${mask}`;
  }
  if (bits.length && core) {
    return `${bits.join(' · ')} · Core ${core}`;
  }
  if (bits.length) {
    return `${bits.join(' · ')} — your natal frame`;
  }
  if (core && mask && core !== mask) {
    return `Core ${core} · Mask ${mask} — dual personality from your chart`;
  }
  if (core) {
    return `${core} — core personality from your chart`;
  }
  return 'Your chart is how Merlin personalizes life weather';
}

/**
 * Build a stable IdentityPacket from dashboard / chart-derived fields.
 * Pure helper — no I/O.
 */
export function buildIdentityPacket(input: BuildIdentityPacketInput): IdentityPacket {
  const placements = {
    sunSign: cleanSign(input.sunSign),
    moonSign: cleanSign(input.moonSign),
    risingSign: cleanSign(input.risingSign),
  };
  const mbti = buildMbti(input);
  const archetype: IdentityArchetype = {
    archetypeName: input.archetypeName?.trim() || undefined,
    patternSignature: input.patternSignature?.trim() || undefined,
    coreContradiction: input.coreContradiction?.trim() || undefined,
  };

  const hasMbti = Boolean(mbti.primary?.type);
  const hasArchetype = Boolean(archetype.archetypeName || archetype.patternSignature);
  const confidenceSource =
    input.confidenceSource ||
    (hasArchetype ? 'identity_pack' : hasMbti ? 'mbti_fusion' : 'chart_only');

  return {
    pillar: 'self',
    placements,
    mbti,
    archetype,
    headline: buildHeadline(placements, mbti, archetype),
    provenance: {
      calcSource: input.calcSource || undefined,
      chartHasHouses: Boolean(input.chartHasHouses),
      confidenceSource,
      generatedAt: new Date().toISOString(),
    },
  };
}
