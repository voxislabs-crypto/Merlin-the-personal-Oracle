'use client';

import type { ReactNode } from 'react';

/**
 * Soft shell for the Self pillar (You / Bonds / Numbers content).
 * @see docs/TWO_PILLARS.md
 */
export function SelfShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      data-pillar="self"
      aria-label="Self identity"
      className={`min-w-0 space-y-6 ${className}`}
    >
      {children}
    </section>
  );
}
