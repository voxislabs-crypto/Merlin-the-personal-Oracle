/**
 * Self pillar — IdentityPacket contract.
 *
 * Mirror of AtmospherePacket (life weather): one stable shape for "who is in this weather?"
 * Sky and Oracle should consume this instead of re-deriving placements ad hoc.
 *
 * @see docs/TWO_PILLARS.md
 */

export type IdentityPillar = 'self';

export type IdentityConfidenceSource =
  | 'mbti_fusion'
  | 'dual_overlay'
  | 'identity_pack'
  | 'chart_only'
  | 'unknown';

export interface IdentityCorePlacements {
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
}

export interface IdentityMbtiLayer {
  type: string;
  confidence?: number;
  label?: string;
  /** e.g. primary vs firmware / secondary dual layer */
  role: 'primary' | 'secondary' | 'firmware' | 'blend';
}

export interface IdentityMbti {
  primary?: IdentityMbtiLayer;
  secondary?: IdentityMbtiLayer;
  /** Human-readable blend line when dual overlay is present */
  blendSummary?: string;
}

export interface IdentityArchetype {
  archetypeName?: string;
  patternSignature?: string;
  coreContradiction?: string;
}

export interface IdentityProvenance {
  calcSource?: string;
  chartHasHouses: boolean;
  confidenceSource: IdentityConfidenceSource;
  generatedAt: string;
}

/**
 * Canonical Self summary for dashboard, Sky personalization, and Oracle context.
 */
export interface IdentityPacket {
  pillar: IdentityPillar;
  placements: IdentityCorePlacements;
  mbti: IdentityMbti;
  archetype: IdentityArchetype;
  /** One-line identity headline for UI heroes */
  headline: string;
  provenance: IdentityProvenance;
}
