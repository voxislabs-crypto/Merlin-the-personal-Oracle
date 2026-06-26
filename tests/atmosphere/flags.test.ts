import { isAtmosphereEngineV1Enabled } from '@/lib/atmosphere/flags';

describe('isAtmosphereEngineV1Enabled', () => {
  const original = process.env.NEXT_PUBLIC_MERLIN_ATMOSPHERE_ENGINE_V1;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_MERLIN_ATMOSPHERE_ENGINE_V1;
    } else {
      process.env.NEXT_PUBLIC_MERLIN_ATMOSPHERE_ENGINE_V1 = original;
    }
  });

  it('defaults on for premium when env is unset', () => {
    delete process.env.NEXT_PUBLIC_MERLIN_ATMOSPHERE_ENGINE_V1;
    expect(isAtmosphereEngineV1Enabled({ premium: true })).toBe(true);
  });

  it('defaults off for free tier when env is unset', () => {
    delete process.env.NEXT_PUBLIC_MERLIN_ATMOSPHERE_ENGINE_V1;
    expect(isAtmosphereEngineV1Enabled({ premium: false })).toBe(false);
    expect(isAtmosphereEngineV1Enabled()).toBe(false);
  });

  it('honors explicit env true for non-premium', () => {
    process.env.NEXT_PUBLIC_MERLIN_ATMOSPHERE_ENGINE_V1 = 'true';
    expect(isAtmosphereEngineV1Enabled({ premium: false })).toBe(true);
  });

  it('honors explicit env false rollback even for premium', () => {
    process.env.NEXT_PUBLIC_MERLIN_ATMOSPHERE_ENGINE_V1 = 'false';
    expect(isAtmosphereEngineV1Enabled({ premium: true })).toBe(false);
  });
});