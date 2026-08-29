/**
 * Personality adapter — generation strategy, not a text filter.
 *
 * The ephemeris engine (calculateBirthChart / sweph) is untouched.
 * This module decides voice: what to say, how, and how long.
 *
 * @deprecated String hacks (infuseMotivators / adjustTone / adjustStructure / slice-to-length)
 * were removed. Use generateMessage for LLM voice, or adaptMessage for the deterministic writer.
 */

import type { MBTIType, TypeConfig } from '@shared/schema';
import { typeConfigs } from '@shared/schema';
import { classifyIntent } from '@/lib/personality/intent';
import { fallbackWrite } from '@/lib/personality/fallback';
import { buildVoiceProfile } from '@/lib/personality/profile';
import { getPersonaSpec } from '@/lib/personality/persona-spec';

export type { MBTIType, TypeConfig } from '@shared/schema';
export { typeConfigs } from '@shared/schema';

export {
  buildVoiceProfile,
  buildVoiceStrategyBlock,
  clearVoiceProfileCache,
} from '@/lib/personality/profile';

export { classifyIntent } from '@/lib/personality/intent';
export { extractChartVoiceFacts, chartVoiceNotes } from '@/lib/personality/chart-source';
export { getPersonaSpec, PERSONA_SPECS } from '@/lib/personality/persona-spec';

/**
 * Legacy TypeConfig view of the rich persona spec.
 * Kept so older callers can still read tone / structure / motivators.
 * Generation no longer uses these four fields.
 */
export function getTypeConfig(mbtiType: MBTIType): TypeConfig {
  const spec = getPersonaSpec(mbtiType);
  const legacy = typeConfigs[mbtiType];
  if (!spec) return legacy;
  return {
    ...legacy,
    motivators: spec.overIndex.slice(0, 5),
    lengthMultiplier: Number((spec.length.maxWords / 70).toFixed(2)),
  };
}

/**
 * Sync path: write in-voice from the persona without mangling the source sentence.
 * Prefer generateMessage when an LLM is available (API / server).
 */
export function adaptMessage(mbtiType: MBTIType, rawMessage: string): string {
  const profile = buildVoiceProfile({ coreType: mbtiType });
  const intent = classifyIntent(rawMessage);
  return fallbackWrite(profile, intent, rawMessage);
}
