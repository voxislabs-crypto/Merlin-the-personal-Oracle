/**
 * Cached voice profile — computed once per chart, reused across messages.
 * Cache the profile, not the generated output.
 */

import { buildCoreMaskTension } from '@/lib/self/dual-layer-lens';
import {
  chartVoiceNotes,
  extractChartVoiceFacts,
  type ChartVoiceFacts,
  type ChartVoiceInput,
} from '@/lib/personality/chart-source';
import { getPersonaSpec, type PersonaSpec, type VoiceIntent } from '@/lib/personality/persona-spec';
import type { BirthChartData } from '@/types/astrology';
import type { MBTIType } from '@/lib/mbti-system';

export type SpeakingLayer = 'core' | 'type' | 'chart';

export interface VoiceProfile {
  coreType?: MBTIType;
  maskType?: MBTIType;
  /** Who actually writes. Core when both exist — Mask never co-narrates. */
  speakingLayer: SpeakingLayer;
  speakingType?: MBTIType;
  tension: string | null;
  persona: PersonaSpec | null;
  maskPersona: PersonaSpec | null;
  chart: ChartVoiceFacts;
  chartNotes: string[];
  fingerprint: string;
}

export interface BuildVoiceProfileInput {
  chart?: ChartVoiceInput | BirthChartData | null;
  coreType?: string | null;
  maskType?: string | null;
}

const profileCache = new Map<string, VoiceProfile>();
const MAX_CACHE = 200;

function asType(value?: string | null): MBTIType | undefined {
  const spec = getPersonaSpec(value);
  return spec?.type;
}

function fingerprintFor(input: BuildVoiceProfileInput, chart: ChartVoiceFacts): string {
  return `${chart.fingerprint}|${asType(input.coreType) || ''}|${asType(input.maskType) || ''}`;
}

export function buildVoiceProfile(input: BuildVoiceProfileInput = {}): VoiceProfile {
  const chart = extractChartVoiceFacts(input.chart);
  const key = fingerprintFor(input, chart);
  const cached = profileCache.get(key);
  if (cached) return cached;

  const coreType = asType(input.coreType);
  const maskType = asType(input.maskType);
  const split = Boolean(coreType && maskType && maskType !== coreType);
  // One speaker: Core when present. Mask only exists as surface tint.
  const speakingType = coreType || maskType;
  const speakingLayer: SpeakingLayer = coreType ? 'core' : speakingType ? 'type' : 'chart';
  const persona = speakingType ? getPersonaSpec(speakingType) : null;
  const maskPersona = split ? getPersonaSpec(maskType) : null;
  const tension = split ? buildCoreMaskTension(coreType, maskType) : null;

  const profile: VoiceProfile = {
    coreType,
    maskType: split ? maskType : undefined,
    speakingLayer,
    speakingType,
    tension,
    persona,
    maskPersona,
    chart,
    chartNotes: chartVoiceNotes(chart),
    fingerprint: key,
  };

  if (profileCache.size >= MAX_CACHE) {
    const oldest = profileCache.keys().next().value;
    if (oldest) profileCache.delete(oldest);
  }
  profileCache.set(key, profile);
  return profile;
}

export function clearVoiceProfileCache(): void {
  profileCache.clear();
}

export function voiceProfileCacheSize(): number {
  return profileCache.size;
}

/**
 * Prompt block: decide what to say, how, and how long — before a word is written.
 */
export function buildVoiceStrategyBlock(
  profile: VoiceProfile,
  intent: VoiceIntent,
  options?: { lengthOverride?: { minWords: number; maxWords: number; note: string } },
): string {
  const persona = profile.persona;
  const length = persona?.length;
  const intentVoice = persona?.intent[intent];
  const never = [
    ...(persona?.neverSay || []),
    'as an AI',
    'cosmic energies',
    'trust the universe',
    "I'd be happy to help",
  ];

  const stack = persona
    ? `${persona.cognitiveStack.dominant.code} (${persona.cognitiveStack.dominant.plain}); aux ${persona.cognitiveStack.auxiliary.code} (${persona.cognitiveStack.auxiliary.plain})`
    : 'chart-only — no MBTI default';

  const speakerLine = profile.speakingType
    ? `SPEAKING VOICE: ${profile.speakingLayer === 'core' ? 'Core' : 'Type'} ${profile.speakingType} (${persona?.label || 'persona'}). Write entirely in this cadence. One writer.`
    : 'SPEAKING VOICE: chart-only. Do not invent INFJ or any other type.';

  const tintLine = profile.maskPersona
    ? `MASK TINT (surface only): ${profile.maskType} — colors how the room reads them (${profile.maskPersona.communicationStyle}). Do not switch into ${profile.maskType} as a second narrator. Do not blend two cadences.
${profile.tension ? `Split to name, not to co-write: ${profile.tension}` : ''}`
    : profile.speakingType
      ? 'No mask split. Do not invent a second type.'
      : 'No MBTI on file.';

  const chartBlock = profile.chartNotes.length
    ? profile.chartNotes.map((n) => `- ${n}`).join('\n')
    : '- Chart placements not loaded. Do not invent a Sun sign.';

  const examples = (persona?.examplePhrases || []).map((p) => `  • ${p}`).join('\n');
  const avoid = (persona?.avoidsSaying || []).join('; ') || 'generic assistant-speak';
  const over = (persona?.overIndex || []).join('; ') || 'lived stakes';

  return `
═══════════════════════════════════════
VOICE STRATEGY (generation, not a text filter)
═══════════════════════════════════════
Intent: ${intent.toUpperCase()}
${intentVoice ? `How this intent sounds: ${intentVoice.how}` : 'Match the intent without a costume.'}

PERSONA
${speakerLine}
${tintLine}
Cognitive stack (speaking voice only): ${stack}
Communication style: ${persona?.communicationStyle || 'Merlin calm-direct. Specific. No horoscope fluff.'}
Emotional vocabulary to prefer: ${(persona?.emotionalVocabulary || ['clear', 'pressure', 'move']).join(', ')}
Over-index on: ${over}
Avoid saying: ${avoid}
Never say: ${never.join('; ')}
${examples ? `Example cadence:\n${examples}` : ''}

LENGTH AND DENSITY (do not slice or pad a finished sentence)
${
  options?.lengthOverride
    ? options.lengthOverride.note
    : length
      ? `${length.densityNote} Target ${length.minWords}–${length.maxWords} words. Density: ${length.density}.`
      : '80–160 words unless the ask is smaller. No repetition to fill space. No mid-word cuts.'
}

CHART VOICE (source of truth — not a Sun-sign switch)
${chartBlock}
Sun ${profile.chart.sunSign || 'unknown'} · Moon ${profile.chart.moonSign || 'unknown'} · Rising ${profile.chart.risingSign || 'unknown'} · Ruler ${profile.chart.chartRuler || 'unknown'} · Element ${profile.chart.dominantElement || 'unknown'}

RULES
- One writer. The speaking voice owns every sentence. Mask tint is vis only — social surface, not a second cadence.
- Write natively in this voice. Do not drape a costume over a finished generic sentence.
- Do not mention MBTI letters unless the user asked about type.
- Do not change the weather, scores, or facts in the raw context. Personality changes navigation and cadence only.
- Merlin Test still applies: if you stripped every astrological noun, it should still be useful.
`.trim();
}
