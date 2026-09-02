import {
  DEFAULT_GROQ_FAST_MODEL,
  DEFAULT_GROQ_MODEL,
  buildChatCompletionBody,
  extractChatDeltaText,
  extractChatMessageText,
  getLlmConfig,
  isReasoningModel,
  resolveGroqModel,
} from '@/lib/llm-config';

describe('resolveGroqModel', () => {
  it('maps the retired Llama 3.3 70B id that 404s on Groq', () => {
    expect(resolveGroqModel('llama-3.3-70b-versatile')).toBe(DEFAULT_GROQ_MODEL);
  });

  it('maps the retired Llama 3.1 8B instant id', () => {
    expect(resolveGroqModel('llama-3.1-8b-instant')).toBe(DEFAULT_GROQ_FAST_MODEL);
  });

  it('keeps a current Groq model unchanged', () => {
    expect(resolveGroqModel('openai/gpt-oss-120b')).toBe('openai/gpt-oss-120b');
  });

  it('falls back when the requested model is empty', () => {
    expect(resolveGroqModel('', DEFAULT_GROQ_MODEL)).toBe(DEFAULT_GROQ_MODEL);
  });
});

describe('getLlmConfig groq', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rewrites GROQ_MODEL when the env still points at a retired Llama id', () => {
    process.env = {
      ...originalEnv,
      LLM_PROVIDER: 'groq',
      GROQ_API_KEY: 'gsk_test',
      GROQ_MODEL: 'llama-3.3-70b-versatile',
    };

    const config = getLlmConfig();
    expect(config.provider).toBe('groq');
    expect(config.model).toBe(DEFAULT_GROQ_MODEL);
  });
});

describe('reasoning chat bodies', () => {
  it('detects Groq GPT-OSS as a reasoning model', () => {
    expect(isReasoningModel('openai/gpt-oss-120b')).toBe(true);
    expect(isReasoningModel('grok-3-fast')).toBe(false);
  });

  it('asks Groq GPT-OSS for visible content, not a hidden reasoning dump', () => {
    const body = buildChatCompletionBody(
      {
        messages: [{ role: 'user', content: 'hi' }],
        maxTokens: 1800,
        stream: true,
        model: 'openai/gpt-oss-120b',
      },
      {
        provider: 'groq',
        apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: 'gsk_test',
        model: 'openai/gpt-oss-120b',
        envKeyName: 'GROQ_API_KEY',
      },
    );

    expect(body.max_completion_tokens).toBe(1800);
    expect(body.include_reasoning).toBe(false);
    expect(body.max_tokens).toBeUndefined();
    expect(body.stream).toBe(true);
  });

  it('reads visible delta.content and ignores reasoning-only chunks', () => {
    expect(
      extractChatDeltaText({
        choices: [{ delta: { reasoning: 'thinking…', content: null } }],
      }),
    ).toBe('');
    expect(
      extractChatDeltaText({
        choices: [{ delta: { content: 'Hello' } }],
      }),
    ).toBe('Hello');
    expect(
      extractChatMessageText({
        choices: [{ message: { content: '  Done.  ', reasoning: 'hidden' } }],
      }),
    ).toBe('Done.');
  });
});
