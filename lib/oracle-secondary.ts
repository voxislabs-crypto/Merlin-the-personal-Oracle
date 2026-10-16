/**
 * Prophecy, life arcs, numerology, synastry, and advanced timing stay
 * available, but an ordinary question should not pull them into the reply.
 */
const SECONDARY_TOOL_RE =
  /prophec|life arc|life timeline|time machine|numerolog|life path number|synastry|composite chart|profection|time lord|solar arc|solar return|lunar return|zodiacal releasing|primary direction|firdaria|arc path|arc level/i;

export function asksForSecondaryTool(question: string): boolean {
  return SECONDARY_TOOL_RE.test(question || '');
}
