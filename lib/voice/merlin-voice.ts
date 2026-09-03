/**
 * Merlin voice contract — canonical writing rules for LLM + deterministic copy.
 * @see docs/MERLIN_VOICE.md
 */

import { sanitizeCopyText } from '@/lib/safety/copy-safety';

/** One-line product claim (landing, share, README). */
export const MERLIN_PRODUCT_CLAIM =
  'Not a horoscope. A clear read on your day — through the lens of who you are.';

export const MERLIN_PRODUCT_TAGLINE =
  'Astrology is the engine. Clarity is the product.';

/**
 * Compact system block injected into Oracle and other LLM paths.
 * Keep under ~1.5k tokens of prose so models actually obey it.
 */
export const MERLIN_VOICE_SYSTEM_BLOCK = `
═══════════════════════════════════════
MERLIN VOICE (canonical — non-negotiable)
═══════════════════════════════════════
You never write like an astrologer. You write like an insightful coach translating complex signals into clear human language.

CORE QUESTION every answer must serve:
"What does this actually mean for me?" — not "What are the planets doing?"

PHILOSOPHY
- Astrology is the engine. Clarity is the product.
- The user should rarely need aspects, houses, or orbs to understand you.
- Technical labels are optional depth; lived experience leads.

VOICE
- Calm confidence. Never mystical, never preachy, never vague.
- Never absolute fate predictions. Use may / likely / elevated odds / more open to.
- Never overwhelm with technical lists in the hero answer.
- Write like life weather for this person — observations, not fortunes.

THREE LAYERS (use on major insights)
1. HEADLINE — one memorable sentence they would still hold five minutes later.
2. WHY (human) — emotional / life pattern. Translate symbols into psychology.
   Bad: "Mars opposes Neptune."
   Good: "Your drive and your uncertainty are pulling opposite directions."
3. MOVE — one specific, reversible action (send, delay, sleep on it, one question, protect afternoon, finish before starting).

AHA RULE
At least one line should make them think: "That's exactly how it feels."

SYMBOLS → PSYCHOLOGY
Always say what it feels like in the body, relationships, work, money, or energy.
If you name a planet or aspect, translate it in the same breath — never leave jargon alone.

SHAREABLE CLOSER
End substantial answers with one sentence worth remembering (hesitation vs fear, slow ≠ bad, one small commitment, etc.).

SCORE PAIR
A day may have two percents. They are different meters, not a disagreement.
- Storm Watch / alarm = weather intensity (the tone word; 80+ is Storm Watch).
- Friction = hard-aspect load (transit impact).
If you mention a number, name the meter: "Storm Watch 85, friction 71." Never let them look like a fight.

THE MERLIN TEST
If you removed every mention of astrology, would this still feel insightful and useful?
If no — rewrite before you finish.
`.trim();

/** Horoscope / mystic filler that fails the Merlin Test. */
export const VOICE_FLUFF_PATTERNS: RegExp[] = [
  /\bcosmic energies?\b/i,
  /\bcosmic signals?\b/i,
  /\bthe stars (are|will|have)\b/i,
  /\bthe universe (has|is|wants)\b/i,
  /\bthe cosmos\b/i,
  /\bdear seeker\b/i,
  /\bstay mindful of\b/i,
  /\btrust the universe\b/i,
  /\bpressure creates diamonds\b/i,
  /\bbeautifully aligned\b/i,
  /\bas above[, ]+so below\b/i,
  /\bgo with the (cosmic )?flow\b/i,
];

/** Bare technical lead — usually needs a human translation in the same sentence. */
export const VOICE_TECH_LEAD_PATTERNS: RegExp[] = [
  /^(Mars|Venus|Mercury|Saturn|Jupiter|Uranus|Neptune|Pluto|Sun|Moon)\s+(square|opposes?|conjunct|trine|sextile)\b/i,
  /\bSaturn squares? (your )?Moon\b/i,
  /\bMars opposes? Neptune\b/i,
];

/** Fortune-telling shapes. */
export const VOICE_FORTUNE_PATTERNS: RegExp[] = [
  /\byou will (meet|find|receive|get|lose)\b/i,
  /\bmoney is coming\b/i,
  /\byour soulmate\b/i,
  /\bthis will (definitely|certainly|inevitably)\b/i,
  /\bfate has decided\b/i,
];

export interface VoiceLintResult {
  ok: boolean;
  failsMerlinTest: boolean;
  issues: string[];
  fluffHits: string[];
  fortuneHits: string[];
  techLeadHits: string[];
}

function collectHits(text: string, patterns: RegExp[]): string[] {
  return patterns.filter((p) => p.test(text)).map((p) => p.source);
}

/**
 * Soft lint for deterministic + post-LLM copy.
 * Does not rewrite — callers decide whether to fall back or sanitize.
 */
export function lintMerlinVoice(text: string | null | undefined): VoiceLintResult {
  const t = (text || '').trim();
  if (!t) {
    return {
      ok: false,
      failsMerlinTest: true,
      issues: ['empty'],
      fluffHits: [],
      fortuneHits: [],
      techLeadHits: [],
    };
  }

  const fluffHits = collectHits(t, VOICE_FLUFF_PATTERNS);
  const fortuneHits = collectHits(t, VOICE_FORTUNE_PATTERNS);
  const techLeadHits = collectHits(t, VOICE_TECH_LEAD_PATTERNS);

  const issues: string[] = [];
  if (fluffHits.length) issues.push('fluff');
  if (fortuneHits.length) issues.push('fortune');
  // Tech alone is a soft fail only when the sentence is almost pure jargon
  if (techLeadHits.length && t.length < 80 && !/\b(feel|want|energy|conversation|work|money|people)\b/i.test(t)) {
    issues.push('tech_without_human');
  }

  const failsMerlinTest = fluffHits.length > 0 || fortuneHits.length > 0 || issues.includes('tech_without_human');

  return {
    ok: !failsMerlinTest,
    failsMerlinTest,
    issues,
    fluffHits,
    fortuneHits,
    techLeadHits,
  };
}

/** True when copy should be rejected / regenerated. */
export function failsMerlinVoiceTest(text: string | null | undefined): boolean {
  return lintMerlinVoice(text).failsMerlinTest;
}

/**
 * Soft replacements for common voice failures (post-process).
 * Complements lib/safety/copy-safety hedges.
 */
const VOICE_SOFT_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bStay mindful of cosmic energies\b/gi, replacement: 'Take one reversible step before you commit' },
  { pattern: /\bcosmic energies\b/gi, replacement: 'life pressure' },
  { pattern: /\bcosmic signals\b/gi, replacement: 'mixed pressure' },
  { pattern: /\bthe stars are beautifully aligned\b/gi, replacement: 'Friction is lower than usual' },
  { pattern: /\bthe universe has a lesson\b/gi, replacement: 'Friction is elevated' },
  { pattern: /\bpressure creates diamonds\b/gi, replacement: 'pressure is high — keep moves reversible' },
  { pattern: /\byou will meet someone important\b/gi, replacement: 'conversations may carry more opportunity than usual' },
  { pattern: /\bmoney is coming\b/gi, replacement: 'money decisions deserve one extra night of thought' },
];

export function softRewriteMerlinVoice(input: string): string {
  if (!input || typeof input !== 'string') return input;
  return VOICE_SOFT_REPLACEMENTS.reduce(
    (value, rule) => value.replace(rule.pattern, rule.replacement),
    input,
  );
}

/**
 * Apply safety hedges + voice soft rewrites.
 * Use on user-facing LLM output and high-risk templates.
 */
export function applyMerlinVoicePass(input: string): string {
  return sanitizeCopyText(softRewriteMerlinVoice(input));
}

/** Three-layer card shape for deterministic UI. */
export interface MerlinThreeLayerCopy {
  headline: string;
  why: string;
  move: string;
  /** Optional shareable closer */
  closer?: string;
}

export function formatThreeLayerPlain(layers: MerlinThreeLayerCopy): string {
  const bits = [layers.headline, layers.why, layers.move, layers.closer].filter(Boolean);
  return bits.join(' ').replace(/\s+/g, ' ').trim();
}
