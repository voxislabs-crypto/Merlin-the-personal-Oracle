/**
 * Shared score shaping for life-weather meters.
 * Friction compresses above 58. Symbolic intensity stays linear through 85
 * so a 70 still means 70, then only the tail compresses so 100 cannot read
 * as near-certainty. Do not reuse the friction curve on intensity: it would
 * pull an 80 storm day down into Caution.
 */

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * Soft ceiling so friction stays expressive (≈35–88) instead of slamming 100.
 * Linear through the mid-range; only the top tail compresses.
 * Examples (approx): 40→40, 55→55, 70→66, 85→74, 100→80, 120→85.
 */
export function softCeilingFriction(raw: number): number {
  const x = Math.max(0, raw);
  if (x <= 58) return clamp(x);
  const over = x - 58;
  return clamp(58 + 34 * (1 - Math.exp(-over / 30)));
}

/**
 * Soft ceiling for symbolic intensity. Linear through 85 (Storm Watch still
 * starts at 80). The tail approaches 92, so triple-hit amplification and a
 * raw 100 cannot sit at 98–100.
 * Examples (approx): 70→70, 85→85, 90→87, 100→89, 110→90.
 */
export function softCeilingIntensity(raw: number): number {
  const x = Math.max(0, raw);
  if (x <= 85) return clamp(x);
  const over = x - 85;
  return clamp(85 + 7 * (1 - Math.exp(-over / 18)));
}
