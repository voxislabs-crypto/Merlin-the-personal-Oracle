/**
 * Prompt-driven generator — personality is a generation strategy, not a filter.
 * calculateBirthChart stays untouched. Downstream consumes generateMessage.
 */

import 'server-only';

import { chatCompletion, isLlmConfigured, DEFAULT_GROQ_FAST_MODEL } from '@/lib/llm-config';
import { applyMerlinVoicePass, failsMerlinVoiceTest } from '@/lib/voice/merlin-voice';
import { classifyIntent } from '@/lib/personality/intent';
import {
  fallbackWrite,
  heuristicVoiceScore,
  needsLlmConsistencyPass,
} from '@/lib/personality/fallback';
import {
  buildVoiceProfile,
  buildVoiceStrategyBlock,
  type BuildVoiceProfileInput,
  type VoiceProfile,
} from '@/lib/personality/profile';
import type { VoiceIntent } from '@/lib/personality/persona-spec';
import type { BirthChartData } from '@/types/astrology';
import type { ChartVoiceInput } from '@/lib/personality/chart-source';

export interface GeneratedMessage {
  text: string;
  intent: VoiceIntent;
  profileFingerprint: string;
  source: 'llm' | 'llm-retry' | 'fallback';
  consistency: number;
}

function maxTokensFor(profile: VoiceProfile): number {
  const maxWords = profile.persona?.length.maxWords ?? 90;
  return Math.min(400, Math.max(120, Math.round(maxWords * 2.2)));
}

async function writeWithModel(
  profile: VoiceProfile,
  intent: VoiceIntent,
  rawContext: string,
): Promise<string> {
  const strategy = buildVoiceStrategyBlock(profile, intent);
  const content = await chatCompletion({
    model: DEFAULT_GROQ_FAST_MODEL,
    temperature: 0.55,
    maxTokens: maxTokensFor(profile),
    messages: [
      {
        role: 'system',
        content: `You are Merlin's voice layer. Write the message natively in the given persona. Return only the message — no preamble, no quotes, no labels.\n\n${strategy}`,
      },
      {
        role: 'user',
        content: `INTENT: ${intent}\n\nRAW CONTEXT (facts to keep — do not invent beyond this):\n${rawContext}\n\nWrite the message now.`,
      },
    ],
  });
  return applyMerlinVoicePass(content);
}

async function consistencyRewrite(
  profile: VoiceProfile,
  intent: VoiceIntent,
  draft: string,
): Promise<{ text: string; score: number } | null> {
  if (!isLlmConfigured()) return null;
  const strategy = buildVoiceStrategyBlock(profile, intent);
  const raw = await chatCompletion({
    model: DEFAULT_GROQ_FAST_MODEL,
    temperature: 0.2,
    maxTokens: 220,
    messages: [
      {
        role: 'system',
        content: `Score whether a draft sounds like this persona, then rewrite if it drifted into generic assistant-speak.
Return JSON only: {"score": 0.0-1.0, "text": "final message"}
score 1 = unmistakably this voice. score 0 = generic chatbot.
If score >= 0.7 you may return the draft unchanged.
Never mention the score in the text field.\n\n${strategy}`,
      },
      {
        role: 'user',
        content: `DRAFT:\n${draft}`,
      },
    ],
  });
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as { score?: number; text?: string };
    if (typeof parsed.text !== 'string' || !parsed.text.trim()) return null;
    const score =
      typeof parsed.score === 'number' && Number.isFinite(parsed.score)
        ? Math.max(0, Math.min(1, parsed.score))
        : heuristicVoiceScore(parsed.text, profile);
    return { text: applyMerlinVoicePass(parsed.text), score };
  } catch {
    return null;
  }
}

/**
 * generateMessage(chart, intent, rawContext)
 * Decides what to say, how to say it, and how long — before a word is written.
 */
export async function generateMessage(
  chart: BirthChartData | ChartVoiceInput | null | undefined,
  intent: VoiceIntent | string,
  rawContext: string,
  options: Omit<BuildVoiceProfileInput, 'chart'> = {},
): Promise<GeneratedMessage> {
  const profile = buildVoiceProfile({
    chart,
    coreType: options.coreType,
    maskType: options.maskType,
  });
  const resolvedIntent = classifyIntent(rawContext, intent);
  const fallback = fallbackWrite(profile, resolvedIntent, rawContext);

  if (!isLlmConfigured()) {
    return {
      text: fallback,
      intent: resolvedIntent,
      profileFingerprint: profile.fingerprint,
      source: 'fallback',
      consistency: heuristicVoiceScore(fallback, profile),
    };
  }

  try {
    let text = await writeWithModel(profile, resolvedIntent, rawContext);
    let source: GeneratedMessage['source'] = 'llm';
    let consistency = heuristicVoiceScore(text, profile);

    // Heuristic is the default. Second model only on never-say or low score.
    if (needsLlmConsistencyPass(text, profile)) {
      const rewritten = await consistencyRewrite(profile, resolvedIntent, text);
      if (rewritten?.text) {
        text = rewritten.text;
        consistency = Math.max(rewritten.score, heuristicVoiceScore(text, profile));
        source = 'llm-retry';
      }
    }

    if (!text.trim() || failsMerlinVoiceTest(text)) {
      return {
        text: fallback,
        intent: resolvedIntent,
        profileFingerprint: profile.fingerprint,
        source: 'fallback',
        consistency: heuristicVoiceScore(fallback, profile),
      };
    }

    return {
      text,
      intent: resolvedIntent,
      profileFingerprint: profile.fingerprint,
      source,
      consistency,
    };
  } catch (error) {
    console.warn('[personality.generateMessage] LLM failed, using fallback:', error);
    return {
      text: fallback,
      intent: resolvedIntent,
      profileFingerprint: profile.fingerprint,
      source: 'fallback',
      consistency: heuristicVoiceScore(fallback, profile),
    };
  }
}
