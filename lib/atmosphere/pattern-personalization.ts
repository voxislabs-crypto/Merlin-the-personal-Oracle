import { resolveAtmospherePatternsContext } from '@/lib/atmosphere/pattern-tags';
import type {
  AtmosphereActiveTransit,
  AtmospherePatternProfile,
} from '@/lib/atmosphere/pattern-types';

export function applyPatternPersonalization(
  basePressure: number,
  profile: AtmospherePatternProfile | null | undefined,
  activeTransits: AtmosphereActiveTransit[] = []
): { pressure: number; modifier: number; provenance: string[] } {
  const context = resolveAtmospherePatternsContext(profile, activeTransits);
  if (context.modifier === 1) {
    return { pressure: basePressure, modifier: 1, provenance: [] };
  }

  const pressure = Math.max(0, Math.min(100, Math.round(basePressure * context.modifier)));
  return {
    pressure,
    modifier: context.modifier,
    provenance: context.provenance,
  };
}

export function applyPatternReadinessNudge(
  readinessModifier: number,
  profile: AtmospherePatternProfile | null | undefined,
  activeTransits: AtmosphereActiveTransit[] = []
): { modifier: number; provenance: string[] } {
  const context = resolveAtmospherePatternsContext(profile, activeTransits);
  if (context.modifier === 1) {
    return { modifier: readinessModifier, provenance: [] };
  }

  const patternNudge = (context.modifier - 1) * 0.35;
  const next = Math.max(0.7, Math.min(1.3, Number((readinessModifier + patternNudge).toFixed(3))));
  return {
    modifier: next,
    provenance: context.provenance,
  };
}