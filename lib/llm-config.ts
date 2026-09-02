/**
 * Shared LLM provider config for Merlin.
 * Default: Groq (OpenAI-compatible). Set LLM_PROVIDER=xai to use xAI Grok.
 */

export type LlmProvider = 'groq' | 'xai';

export interface LlmConfig {
  provider: LlmProvider;
  apiUrl: string;
  apiKey: string | undefined;
  model: string;
  envKeyName: string;
}

/** Groq's recommended replacement after the 2026-08-16 Llama shutdown (free/developer). */
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';
export const DEFAULT_GROQ_FAST_MODEL = 'openai/gpt-oss-20b';

/**
 * Groq retired these IDs for free/developer tiers on 2026-08-16.
 * Requests now 404 with "model not found".
 * @see https://console.groq.com/docs/deprecations
 */
export const GROQ_MODEL_REPLACEMENTS: Record<string, string> = {
  'llama-3.3-70b-versatile': DEFAULT_GROQ_MODEL,
  'llama-3.1-70b-versatile': DEFAULT_GROQ_MODEL,
  'llama3-70b-8192': DEFAULT_GROQ_MODEL,
  'llama-3.1-8b-instant': DEFAULT_GROQ_FAST_MODEL,
  'llama3-8b-8192': DEFAULT_GROQ_FAST_MODEL,
};

export function resolveGroqModel(model?: string | null, fallback = DEFAULT_GROQ_MODEL): string {
  const requested = (model || fallback).trim();
  const replacement = GROQ_MODEL_REPLACEMENTS[requested];
  if (replacement && replacement !== requested) {
    console.warn(`[LLM:groq] ${requested} was retired; using ${replacement}`);
    return replacement;
  }
  return requested || fallback;
}

export function getLlmProvider(): LlmProvider {
  const raw = (process.env.LLM_PROVIDER || 'groq').toLowerCase();
  return raw === 'xai' ? 'xai' : 'groq';
}

/**
 * Chat completions config used by Oracle, interpretations, tone engine, etc.
 */
export function getLlmConfig(): LlmConfig {
  const provider = getLlmProvider();

  if (provider === 'xai') {
    return {
      provider,
      apiUrl: process.env.XAI_API_URL || 'https://api.x.ai/v1/chat/completions',
      apiKey: process.env.XAI_API_KEY,
      model: process.env.XAI_MODEL || 'grok-3-fast',
      envKeyName: 'XAI_API_KEY',
    };
  }

  return {
    provider: 'groq',
    // Accept either full chat completions URL or base URL ending in /v1
    apiUrl: normalizeChatCompletionsUrl(
      process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions'
    ),
    apiKey: process.env.GROQ_API_KEY,
    model: resolveGroqModel(process.env.GROQ_MODEL, DEFAULT_GROQ_MODEL),
    envKeyName: 'GROQ_API_KEY',
  };
}

function normalizeChatCompletionsUrl(url: string): string {
  const trimmed = url.replace(/\/$/, '');
  if (trimmed.endsWith('/chat/completions')) return trimmed;
  if (trimmed.endsWith('/v1')) return `${trimmed}/chat/completions`;
  return trimmed;
}

export function isLlmConfigured(config = getLlmConfig()): boolean {
  return Boolean(config.apiKey && config.apiUrl && config.model);
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Override model for this call */
  model?: string;
}

/** Groq GPT-OSS / Qwen3-class models that reason before they write. */
export function isReasoningModel(model?: string | null): boolean {
  const id = (model || '').toLowerCase();
  return /gpt-oss|qwen\/qwen3|minimax-m/.test(id);
}

export interface ChatCompletionBodyOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
  stream?: boolean;
}

/**
 * OpenAI-compatible request body that won't starve GPT-OSS of visible tokens.
 * Reasoning models: max_completion_tokens + include_reasoning:false so the
 * answer lands in delta.content instead of only delta.reasoning.
 */
export function buildChatCompletionBody(
  options: ChatCompletionBodyOptions,
  config = getLlmConfig(),
): Record<string, unknown> {
  const model = options.model || config.model;
  const maxTokens = options.maxTokens ?? 1500;
  const body: Record<string, unknown> = {
    model,
    messages: options.messages,
    temperature: options.temperature ?? 0.75,
    stream: options.stream === true,
  };

  if (isReasoningModel(model) && config.provider === 'groq') {
    body.max_completion_tokens = maxTokens;
    body.include_reasoning = false;
  } else {
    body.max_tokens = maxTokens;
  }

  return body;
}

function textFromContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          const record = part as Record<string, unknown>;
          if (typeof record.text === 'string') return record.text;
          if (typeof record.content === 'string') return record.content;
        }
        return '';
      })
      .join('');
  }
  return '';
}

/** Visible assistant text from a streaming chat chunk (never the hidden CoT). */
export function extractChatDeltaText(parsed: unknown): string {
  if (!parsed || typeof parsed !== 'object') return '';
  const choices = (parsed as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== 'object') return '';
  const delta = (choices[0] as { delta?: unknown }).delta;
  if (!delta || typeof delta !== 'object') return '';
  return textFromContent((delta as { content?: unknown }).content);
}

/** Visible assistant text from a non-stream chat completion. */
export function extractChatMessageText(parsed: unknown): string {
  if (!parsed || typeof parsed !== 'object') return '';
  const choices = (parsed as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== 'object') return '';
  const message = (choices[0] as { message?: unknown }).message;
  if (!message || typeof message !== 'object') return '';
  return textFromContent((message as { content?: unknown }).content).trim();
}

/**
 * Non-streaming OpenAI-compatible chat completion (Groq or xAI).
 */
export async function chatCompletion(
  options: ChatCompletionOptions,
  config = getLlmConfig()
): Promise<string> {
  if (!config.apiKey) {
    throw new Error(`${config.envKeyName} not configured`);
  }

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(
      buildChatCompletionBody(
        {
          messages: options.messages,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          model: options.model,
          stream: false,
        },
        config,
      ),
    ),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error(`[LLM:${config.provider}] API error:`, response.status, errorText.slice(0, 300));
    throw new Error(`${config.provider} API error: ${response.status}`);
  }

  const data = await response.json();
  const content = extractChatMessageText(data);
  if (!content) {
    throw new Error(`No content returned from ${config.provider}`);
  }
  return content;
}
