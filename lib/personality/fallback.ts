/**
 * Deterministic writer when the LLM is unavailable.
 * Composes from the persona — never mangles a finished sentence.
 */

import { applyMerlinVoicePass } from '@/lib/voice/merlin-voice';
import type { VoiceIntent } from '@/lib/personality/persona-spec';
import type { VoiceProfile } from '@/lib/personality/profile';

const GENERIC_ASSISTANT = [
  /as an ai/i,
  /i'd be happy to/i,
  /let me know if you need/i,
  /hope that helps/i,
  /as an infj/i,
  /cosmic energies/i,
];

function firstSentences(text: string, maxWords: number): string {
  const cleaned = (text || '')
    .replace(/\s+/g, ' ')
    .replace(/, infused with [^,]+,/gi, ' ')
    .replace(/^you know, deep down,\s*/i, '')
    .trim();
  if (!cleaned) return '';

  const sentences = cleaned.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const kept: string[] = [];
  let words = 0;
  for (const sentence of sentences) {
    const count = sentence.split(/\s+/).filter(Boolean).length;
    if (kept.length && words + count > maxWords) break;
    kept.push(sentence.replace(/\.*$/, '.'));
    words += count;
    if (words >= Math.max(12, Math.floor(maxWords * 0.55))) break;
  }
  return kept.join(' ').trim();
}

function stripForbidden(text: string, profile: VoiceProfile): string {
  let out = text;
  for (const phrase of profile.persona?.neverSay || []) {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    out = out.replace(re, '');
  }
  for (const re of GENERIC_ASSISTANT) {
    out = out.replace(re, '');
  }
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Write in-voice without string hacks (no mid-sentence motivators, no uppercasing, no slice-to-length).
 */
export function fallbackWrite(
  profile: VoiceProfile,
  intent: VoiceIntent,
  rawContext: string,
): string {
  const persona = profile.persona;
  const maxWords = persona?.length.maxWords ?? 90;
  const minWords = persona?.length.minWords ?? 30;
  const intentVoice = persona?.intent[intent];
  const body = firstSentences(stripForbidden(rawContext, profile), Math.min(40, maxWords));
  const opener = intentVoice?.opener || 'Here is the honest read.';
  const closer =
    profile.tension && intent !== 'celebration'
      ? profile.tension
      : intentVoice?.closer || 'One reversible step. Then reassess.';

  const parts = [opener];
  if (body && !opener.toLowerCase().includes(body.slice(0, 18).toLowerCase())) {
    parts.push(body);
  }
  if (closer && !parts.join(' ').toLowerCase().includes(closer.slice(0, 18).toLowerCase())) {
    parts.push(closer);
  }

  let text = parts.join(' ').replace(/\s+/g, ' ').trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < minWords && persona?.examplePhrases[0]) {
    const extra = persona.examplePhrases[0];
    if (!text.toLowerCase().includes(extra.slice(0, 20).toLowerCase())) {
      text = `${text} ${extra}`.trim();
    }
  }

  return applyMerlinVoicePass(stripForbidden(text, profile));
}

export const LLM_CONSISTENCY_FLOOR = 0.62;

export function hitsNeverSay(text: string, profile: VoiceProfile): boolean {
  const lower = (text || '').toLowerCase();
  if (!lower) return false;
  return (profile.persona?.neverSay || []).some((phrase) => lower.includes(phrase.toLowerCase()));
}

/**
 * Second-model pass is rare and cheap: never-say trip or heuristic below floor.
 * Heuristic is the default. Merlin-voice fluff falls back locally — no extra LLM.
 */
export function needsLlmConsistencyPass(text: string, profile: VoiceProfile): boolean {
  if (!text.trim()) return false;
  if (hitsNeverSay(text, profile)) return true;
  return heuristicVoiceScore(text, profile) < LLM_CONSISTENCY_FLOOR;
}

export function heuristicVoiceScore(text: string, profile: VoiceProfile): number {
  const raw = (text || '').trim();
  if (!raw) return 0;
  let score = 0.55;
  const lower = raw.toLowerCase();
  const words = raw.split(/\s+/).filter(Boolean).length;
  const budget = profile.persona?.length;

  for (const phrase of profile.persona?.neverSay || []) {
    if (lower.includes(phrase.toLowerCase())) score -= 0.35;
  }
  for (const re of GENERIC_ASSISTANT) {
    if (re.test(raw)) score -= 0.4;
  }
  for (const word of profile.persona?.overIndex || []) {
    if (lower.includes(word.toLowerCase())) score += 0.08;
  }
  if (budget) {
    if (words < budget.minWords * 0.5 || words > budget.maxWords * 1.8) score -= 0.15;
    else if (words >= budget.minWords && words <= budget.maxWords) score += 0.1;
  }
  if (profile.tension && /core|mask|inner|face|proof|show/.test(lower)) score += 0.08;
  return Math.max(0, Math.min(1, Number(score.toFixed(2))));
}
