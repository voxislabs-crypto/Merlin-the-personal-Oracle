import 'server-only';

import type { SafetyGuidance } from '@/types/astrology';

export function buildSafetyGuidance(pressure: number): SafetyGuidance {
  if (pressure >= 75) {
    return {
      grounding: ['Pause before reacting and run a short reality check with direct evidence.'],
      caution: ['Avoid major conclusions until you have external confirmation.'],
      agency: ['Choose one reversible next action and reassess in 24 hours.'],
      supportPrompt: 'If this feels overwhelming, reduce input and return when grounded.',
    };
  }

  return {
    grounding: ['Use this window for reflection and practical sequencing.'],
    caution: ['Interpretation is directional, not deterministic.'],
    agency: ['Pick one meaningful next step with low downside.'],
  };
}
