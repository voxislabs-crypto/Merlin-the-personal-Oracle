import 'server-only';

import type { ArchetypeSignal } from '@/types/astrology';

export function selectArchetypes(pressure: number): ArchetypeSignal[] {
  if (pressure >= 75) {
    return [
      {
        key: 'trial_by_stone',
        title: 'Trial by Stone',
        intensity: pressure,
        rationale: 'Sustained pressure suggests a discipline and boundary-building cycle.',
      },
    ];
  }

  if (pressure >= 55) {
    return [
      {
        key: 'architect',
        title: 'Architect',
        intensity: pressure,
        rationale: 'Moderate pressure supports structured planning and deliberate decision making.',
      },
    ];
  }

  return [
    {
      key: 'integration_window',
      title: 'Integration Window',
      intensity: pressure,
      rationale: 'Lower pressure supports consolidation and reflective adjustments.',
    },
  ];
}
