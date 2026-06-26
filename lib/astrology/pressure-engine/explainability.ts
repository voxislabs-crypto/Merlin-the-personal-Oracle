import 'server-only';

import type { ExplainabilityPacket, TransitDriver } from '@/types/astrology';
import { buildDomainScores } from './domains';
import { selectArchetypes } from './archetypes';
import { buildSafetyGuidance } from './safety';

export interface ExplainabilityInput {
  windowStartIso: string;
  windowEndIso: string;
  globalPressure: number;
  confidence: number;
  topDrivers?: TransitDriver[];
  weightingBreakdown?: Record<string, number>;
  personalizationBreakdown?: Record<string, number>;
}

export function buildExplainabilityPacket(input: ExplainabilityInput): ExplainabilityPacket {
  const topDrivers = input.topDrivers ?? [];

  return {
    windowStartIso: input.windowStartIso,
    windowEndIso: input.windowEndIso,
    globalPressure: input.globalPressure,
    confidence: input.confidence,
    topDrivers,
    weightingBreakdown: input.weightingBreakdown ?? {},
    personalizationBreakdown: input.personalizationBreakdown ?? {},
    domainScores: buildDomainScores(input.globalPressure, input.confidence, topDrivers),
    archetypes: selectArchetypes(input.globalPressure),
    safety: buildSafetyGuidance(input.globalPressure),
  };
}
