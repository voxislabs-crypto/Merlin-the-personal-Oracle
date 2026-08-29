import { VOICE_INTENTS, type VoiceIntent } from '@/lib/personality/persona-spec';

const INTENT_PATTERNS: Record<VoiceIntent, RegExp> = {
  comfort: /\b(hurt|sad|scared|afraid|anxious|anxiety|alone|lonely|grief|grieving|overwhelmed|panic|heartbroken|tired of|can't do this|cant do this|falling apart)\b/i,
  warning: /\b(careful|warning|danger|risk|don't|do not|storm|friction|watch out|stay away|avoid|too far|about to blow)\b/i,
  celebration: /\b(celebrate|proud|won|win|yes|landed|opening|clear|got the job|good news|it worked|we did it)\b/i,
  instruction: /\b(should i|how do i|what (do|should) i|next step|tell me what to|help me (do|decide)|what do i do)\b/i,
  reflection: /\b(why (am|do|is)|pattern|meaning|who am i|what is this really|loop|always do this|keeps happening)\b/i,
};

export function isVoiceIntent(value?: string | null): value is VoiceIntent {
  if (!value) return false;
  return (VOICE_INTENTS as string[]).includes(value.trim().toLowerCase());
}

/**
 * Classify what the message is for before a word is written.
 * Same type, different intent, different output.
 */
export function classifyIntent(
  rawContext: string,
  explicit?: string | null,
): VoiceIntent {
  if (isVoiceIntent(explicit)) return explicit.trim().toLowerCase() as VoiceIntent;
  const text = (rawContext || '').trim();
  if (!text) return 'reflection';

  const priority: VoiceIntent[] = ['comfort', 'warning', 'celebration', 'reflection', 'instruction'];
  for (const intent of priority) {
    if (INTENT_PATTERNS[intent].test(text)) return intent;
  }
  return 'reflection';
}
