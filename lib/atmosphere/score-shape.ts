/**
 * Shared score shaping for life-weather meters.
 * Friction and alarm both use this so neither slams 98–100.
 */

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * Soft ceiling so scores stay expressive (≈35–88) instead of slamming 100.
 * Linear through the mid-range; only the top tail compresses.
 * Examples (approx): 40→40, 55→55, 70→66, 85→74, 100→80, 120→85.
 */
export function softCeilingFriction(raw: number): number {
  const x = Math.max(0, raw);
  if (x <= 58) return clamp(x);
  const over = x - 58;
  return clamp(58 + 34 * (1 - Math.exp(-over / 30)));
}
