import 'server-only';

import { sanitizeCopyText } from '@/lib/safety/copy-safety';
import type { AtmospherePacket } from '@/lib/atmosphere/types';

export type AtmosphereRationaleProvider = 'openrouter' | 'ollama' | 'groq' | 'xai' | 'none';

export interface AtmosphereRationaleLlmConfig {
  enabled: boolean;
  provider: AtmosphereRationaleProvider;
  apiUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

const RATIONALE_SYSTEM_PROMPT = `You write one sentence of calm, actionable sky guidance for a personal astrology dashboard.
Rules:
- Use hedged language ("you might notice", "consider", "pace yourself")
- No predictions, fate, or certainty
- No medical, legal, or financial advice
- Max 220 characters
- Return only the sentence, no quotes`;

export function getAtmosphereRationaleLlmConfig(): AtmosphereRationaleLlmConfig {
  const enabled = process.env.ATMOSPHERE_RATIONALE_LLM_ENABLED === 'true';
  const provider = normalizeProvider(process.env.ATMOSPHERE_RATIONALE_LLM_PROVIDER);
  const timeoutMs = Number(process.env.ATMOSPHERE_RATIONALE_LLM_TIMEOUT_MS || '2500');

  if (provider === 'ollama') {
    const baseUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
    return {
      enabled,
      provider,
      apiUrl: `${baseUrl}/v1/chat/completions`,
      apiKey: '',
      model: process.env.ATMOSPHERE_RATIONALE_LLM_MODEL || process.env.OLLAMA_MODEL || 'llama3.2',
      timeoutMs,
    };
  }

  if (provider === 'openrouter') {
    return {
      enabled,
      provider,
      apiUrl: process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: process.env.OPENROUTER_API_KEY || process.env.LLM_API_KEY || '',
      model:
        process.env.ATMOSPHERE_RATIONALE_LLM_MODEL ||
        process.env.OPENROUTER_MODEL ||
        'meta-llama/llama-3.3-8b-instruct:free',
      timeoutMs,
    };
  }

  if (provider === 'groq') {
    return {
      enabled,
      provider,
      apiUrl: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: process.env.GROQ_API_KEY || '',
      model: process.env.ATMOSPHERE_RATIONALE_LLM_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      timeoutMs,
    };
  }

  if (provider === 'xai') {
    return {
      enabled,
      provider,
      apiUrl: process.env.XAI_API_URL || 'https://api.x.ai/v1/chat/completions',
      apiKey: process.env.XAI_API_KEY || '',
      model: process.env.ATMOSPHERE_RATIONALE_LLM_MODEL || process.env.XAI_MODEL || 'grok-3-fast',
      timeoutMs,
    };
  }

  return {
    enabled: false,
    provider: 'none',
    apiUrl: '',
    apiKey: '',
    model: '',
    timeoutMs,
  };
}

export function isAtmosphereRationaleLlmAvailable(config = getAtmosphereRationaleLlmConfig()): boolean {
  if (!config.enabled || config.provider === 'none') return false;
  if (config.provider === 'ollama') return Boolean(config.apiUrl);
  return Boolean(config.apiKey && config.apiUrl && config.model);
}

function normalizeProvider(value: string | undefined): AtmosphereRationaleProvider {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'openrouter') return 'openrouter';
  if (normalized === 'ollama') return 'ollama';
  if (normalized === 'groq') return 'groq';
  if (normalized === 'xai') return 'xai';
  return 'none';
}

function buildRationaleUserPrompt(packet: AtmospherePacket): string {
  const patternLine =
    packet.patterns.active.length > 0
      ? `Learned sensitivities: ${packet.patterns.active
          .slice(0, 2)
          .map((match) => match.patternKey)
          .join(', ')}. `
      : '';

  const realityLine =
    packet.realityCheck.source !== 'none'
      ? `Felt intensity ${packet.feltIntensity}% vs sky ${packet.intensity}%. `
      : '';

  return [
    `Sky tone: ${packet.tone.label} (${packet.intensity}%).`,
    `Day rating: ${packet.dayRating}.`,
    `Driver: ${packet.dominantDriver.label}.`,
    realityLine,
    patternLine,
    `Template rationale to refine: ${packet.dominantDriver.rationale}`,
  ]
    .filter(Boolean)
    .join(' ');
}

async function requestRationaleProse(
  packet: AtmospherePacket,
  config: AtmosphereRationaleLlmConfig
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.apiKey) {
      headers.Authorization = `Bearer ${config.apiKey}`;
    }

    if (config.provider === 'openrouter') {
      headers['HTTP-Referer'] = process.env.OPENROUTER_HTTP_REFERER || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
      headers['X-Title'] = process.env.OPENROUTER_APP_TITLE || 'Merlin Atmosphere';
    }

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model,
        temperature: 0.4,
        max_tokens: 120,
        messages: [
          { role: 'system', content: RATIONALE_SYSTEM_PROMPT },
          { role: 'user', content: buildRationaleUserPrompt(packet) },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = payload.choices?.[0]?.message?.content?.trim();
    return content ? sanitizeCopyText(content) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function enhanceAtmosphereRationale(
  packet: AtmospherePacket
): Promise<AtmospherePacket> {
  const config = getAtmosphereRationaleLlmConfig();
  if (!isAtmosphereRationaleLlmAvailable(config)) {
    return packet;
  }

  const prose = await requestRationaleProse(packet, config);
  if (!prose || prose.length < 12) {
    return packet;
  }

  return {
    ...packet,
    dominantDriver: {
      ...packet.dominantDriver,
      rationale: prose,
    },
    provenance: [...packet.provenance, `rationale-llm-${config.provider}`],
  };
}