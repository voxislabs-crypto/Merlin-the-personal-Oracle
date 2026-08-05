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
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
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
    body: JSON.stringify({
      model: options.model || config.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.75,
      max_tokens: options.maxTokens ?? 1500,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error(`[LLM:${config.provider}] API error:`, response.status, errorText.slice(0, 300));
    throw new Error(`${config.provider} API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error(`No content returned from ${config.provider}`);
  }
  return content;
}
