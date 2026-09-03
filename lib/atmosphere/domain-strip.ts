/**
 * Domain clarity strip for Today hero — glanceable ▲ / ▬ / ▼ by life area.
 * Sell clarity, not astrology jargon.
 */

import type { LifeRiskDomain, LifeRiskDomainScore, LifeRiskPacket } from '@/lib/atmosphere/types';

export type DomainTrend = 'up' | 'flat' | 'down';

export interface DomainStripItem {
  id: LifeRiskDomain;
  /** User-facing label (Relationships, Career, …) */
  label: string;
  trend: DomainTrend;
  /** Unicode arrow for share text */
  arrow: '▲' | '▬' | '▼';
  friction: number;
  support: number;
}

/** Display order + labels for the clarity strip (not internal engine names). */
export const DOMAIN_STRIP_META: Array<{ id: LifeRiskDomain; label: string }> = [
  { id: 'love', label: 'Relationships' },
  { id: 'career', label: 'Career' },
  { id: 'money', label: 'Money' },
  { id: 'health', label: 'Energy' },
  { id: 'family', label: 'Home' },
  { id: 'self', label: 'Self' },
];

export function domainTrendFromScores(friction: number, support: number): DomainTrend {
  const net = support - friction;
  if (net >= 14 || (support >= 55 && friction < 42)) return 'up';
  if (net <= -14 || (friction >= 55 && support < 42)) return 'down';
  return 'flat';
}

export function trendArrow(trend: DomainTrend): DomainStripItem['arrow'] {
  if (trend === 'up') return '▲';
  if (trend === 'down') return '▼';
  return '▬';
}

/**
 * Build strip rows from risk domains. Prefers known order; includes only
 * domains that have signal (hitCount or meaningful friction/support).
 * Always returns core 4 when risk is empty-ish so UI stays stable if scores exist.
 */
export function buildDomainStripItems(
  risk?: LifeRiskPacket | null,
  options?: { max?: number; includeQuiet?: boolean },
): DomainStripItem[] {
  const max = options?.max ?? 5;
  const includeQuiet = options?.includeQuiet ?? true;
  const byName = new Map<LifeRiskDomain, LifeRiskDomainScore>();
  for (const d of risk?.domains || []) {
    byName.set(d.name, d);
  }

  const items: DomainStripItem[] = [];
  for (const meta of DOMAIN_STRIP_META) {
    const score = byName.get(meta.id);
    const friction = score?.friction ?? 0;
    const support = score?.support ?? 0;
    const hitCount = score?.hitCount ?? 0;
    const hasSignal = hitCount > 0 || friction >= 20 || support >= 20;
    if (!includeQuiet && !hasSignal) continue;

    const trend = domainTrendFromScores(friction, support);
    items.push({
      id: meta.id,
      label: meta.label,
      trend,
      arrow: trendArrow(trend),
      friction,
      support,
    });
    if (items.length >= max) break;
  }

  return items;
}

/** Glance-strip percent — overall life-friction (hard-aspect load), not the Storm Watch alarm. */
export function resolveRiskPercent(risk?: LifeRiskPacket | null, intensityFallback?: number): number {
  if (typeof risk?.overallFriction === 'number' && Number.isFinite(risk.overallFriction)) {
    return Math.max(0, Math.min(100, Math.round(risk.overallFriction)));
  }
  if (typeof intensityFallback === 'number' && Number.isFinite(intensityFallback)) {
    return Math.max(0, Math.min(100, Math.round(intensityFallback)));
  }
  return 0;
}

export function timeOfDayGreeting(now = new Date()): 'morning' | 'afternoon' | 'evening' {
  const h = now.getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

/**
 * "Good evening, {firstName}" using the logged-in user's name.
 * Pass resolveClerkFirstName(user) — never hardcode an example name in the UI.
 * Falls back to "Good evening" when name is missing.
 */
export function buildPersonalGreeting(firstName?: string | null, now = new Date()): string {
  const slot = timeOfDayGreeting(now);
  const hello =
    slot === 'morning' ? 'Good morning' : slot === 'afternoon' ? 'Good afternoon' : 'Good evening';
  const name = (firstName || '').trim().split(/\s+/)[0];
  return name ? `${hello}, ${name}` : hello;
}
