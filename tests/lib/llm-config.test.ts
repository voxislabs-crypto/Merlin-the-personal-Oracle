import {
  DEFAULT_GROQ_FAST_MODEL,
  DEFAULT_GROQ_MODEL,
  getLlmConfig,
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
