import type { DualOverlay } from '@/lib/personality/dual-overlay';

export type PersonalityLens = 'mask' | 'core' | 'bridge' | 'outer';

export interface PlanetPersonalityInsight {
  lens: PersonalityLens;
  headline: string;
  detail: string;
}

const MASK_PLANETS = new Set(['Sun', 'Mars']);
const CORE_PLANETS = new Set(['Moon', 'Mercury']);

export function getPlanetPersonalityInsight(
  planetName: string,
  dualOverlay?: DualOverlay | null
): PlanetPersonalityInsight {
  const maskType = dualOverlay?.hardware.mbtiType ?? 'your Mask';
  const coreType = dualOverlay?.firmware.mbtiType ?? 'your Core';

  if (MASK_PLANETS.has(planetName)) {
    return {
      lens: 'mask',
      headline: `${planetName} feeds your Mask`,
      detail: `This placement shapes what people read first — tied to your ${maskType} hardware layer (${dualOverlay?.hardware.archetype ?? 'Sun · Rising'}).`,
    };
  }

  if (CORE_PLANETS.has(planetName)) {
    return {
      lens: 'core',
      headline: `${planetName} feeds your Inner Core`,
      detail: `This placement runs beneath the surface — tied to your ${coreType} firmware layer (${dualOverlay?.firmware.archetype ?? 'Moon · Mercury'}).`,
    };
  }

  if (planetName === 'Venus') {
    return {
      lens: 'bridge',
      headline: `${planetName} bridges Mask and Core`,
      detail: `Venus shows what you attract, value, and perform — the overlap between how you appear (${maskType}) and what you actually need (${coreType}).`,
    };
  }

  if (['Jupiter', 'Saturn'].includes(planetName)) {
    return {
      lens: 'outer',
      headline: `${planetName} sets your long-game pattern`,
      detail: `Slower-moving ${planetName} shapes life chapters more than daily mood — it colors both your public story and private operating system over years.`,
    };
  }

  return {
    lens: 'outer',
    headline: `${planetName} works in generational depth`,
    detail: `Outer-planet ${planetName} marks deep patterning — less about first impressions, more about transformation over time.`,
  };
}