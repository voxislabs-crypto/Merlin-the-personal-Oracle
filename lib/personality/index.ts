/**
 * Personality voice layer — separate from the ephemeris engine.
 * Swap this without touching calculateBirthChart / sweph.
 */

export {
  adaptMessage,
  getTypeConfig,
  typeConfigs,
  type MBTIType,
  type TypeConfig,
} from '@/lib/personality/adapter';

export {
  buildVoiceProfile,
  buildVoiceStrategyBlock,
  clearVoiceProfileCache,
  type VoiceProfile,
  type BuildVoiceProfileInput,
} from '@/lib/personality/profile';

export {
  classifyIntent,
  isVoiceIntent,
} from '@/lib/personality/intent';

export {
  extractChartVoiceFacts,
  chartVoiceNotes,
  type ChartVoiceFacts,
  type ChartVoiceInput,
} from '@/lib/personality/chart-source';

export {
  getPersonaSpec,
  PERSONA_SPECS,
  VOICE_INTENTS,
  type PersonaSpec,
  type VoiceIntent,
} from '@/lib/personality/persona-spec';

export {
  fallbackWrite,
  heuristicVoiceScore,
  needsLlmConsistencyPass,
  hitsNeverSay,
  LLM_CONSISTENCY_FLOOR,
} from '@/lib/personality/fallback';
export type { SpeakingLayer } from '@/lib/personality/profile';
