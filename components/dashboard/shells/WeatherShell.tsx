'use client';

import type { ReactNode } from 'react';

/**
 * Soft shell for the Life weather pillar (Today + Forecast content).
 * Keeps page.tsx thinner without a hard package split.
 * @see docs/TWO_PILLARS.md
 */
export function WeatherShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      data-pillar="life-weather"
      aria-label="Life weather"
      className={`min-w-0 space-y-6 ${className}`}
    >
      {children}
    </section>
  );
}
