import {
  getAtmosphereRationaleLlmConfig,
  isAtmosphereRationaleLlmAvailable,
} from '@/lib/atmosphere/rationale-ai';

describe('rationale-ai config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.ATMOSPHERE_RATIONALE_LLM_ENABLED;
    delete process.env.ATMOSPHERE_RATIONALE_LLM_PROVIDER;
    delete process.env.OLLAMA_BASE_URL;
    delete process.env.OPENROUTER_API_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('is unavailable when feature flag is off', () => {
    process.env.ATMOSPHERE_RATIONALE_LLM_PROVIDER = 'ollama';
    expect(isAtmosphereRationaleLlmAvailable()).toBe(false);
  });

  it('detects ollama when enabled without api key', () => {
    process.env.ATMOSPHERE_RATIONALE_LLM_ENABLED = 'true';
    process.env.ATMOSPHERE_RATIONALE_LLM_PROVIDER = 'ollama';
    const config = getAtmosphereRationaleLlmConfig();
    expect(config.provider).toBe('ollama');
    expect(config.apiUrl).toContain('11434');
    expect(isAtmosphereRationaleLlmAvailable(config)).toBe(true);
  });

  it('requires api key for openrouter', () => {
    process.env.ATMOSPHERE_RATIONALE_LLM_ENABLED = 'true';
    process.env.ATMOSPHERE_RATIONALE_LLM_PROVIDER = 'openrouter';
    expect(isAtmosphereRationaleLlmAvailable()).toBe(false);

    process.env.OPENROUTER_API_KEY = 'sk-or-test';
    expect(isAtmosphereRationaleLlmAvailable()).toBe(true);
  });
});