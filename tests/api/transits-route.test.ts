/** @jest-environment node */

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

const validateFeatureAccess = jest.fn();
jest.mock('@/lib/subscription-validation', () => ({
  validateFeatureAccess: (...args: unknown[]) => validateFeatureAccess(...args),
}));

jest.mock('@/lib/engine', () => ({
  calculateBirthChart: jest.fn(() => ({
    positions: [{ name: 'Sun', longitude: 140, sign: 'Leo', degree: 20, minute: 0 }],
  })),
}));

jest.mock('@/lib/engine-fallback', () => ({
  calculateBirthChart: jest.fn(() => ({
    positions: [{ name: 'Sun', longitude: 140, sign: 'Leo', degree: 20, minute: 0 }],
  })),
}));

const getCurrentTransits = jest.fn();
jest.mock('@/lib/astrology/transits', () => ({
  getCurrentTransits: (...args: unknown[]) => getCurrentTransits(...args),
  getTransitingPositions: () => [],
  getTransitsForDate: () => [],
}));

jest.mock('@/lib/astrology/predictive-transits', () => ({
  buildPredictiveTransitBundle: jest.fn(async () => ({
    generatedAt: '2026-08-13T12:00:00.000Z',
    windowDays: 7,
    lifeStages: [],
    lunarTiming: {
      phase: 'Waxing Crescent',
      illumination: 0.2,
      isVoidOfCourse: false,
      hoursToNextSign: 12,
      nextSignAt: '2026-08-13T20:00:00.000Z',
      actionBias: 'build',
      guidance: 'Build one small thing.',
    },
    progressedMoon: { sign: 'Cancer', degree: 10, yearsProgressed: 42, emphasis: ['family'] },
    events: [],
  })),
}));

jest.mock('@/lib/astrology/resonance-weights', () => ({
  applyPlanetResonanceWeights: jest.fn((events: unknown) => events),
  getResonanceWeightsProfile: jest.fn(async () => ({
    multipliers: {},
    planetBreakdown: {},
    history: [],
    summary: { feedbackCount: 0 },
  })),
}));

jest.mock('@/lib/astrology/confluence-detector', () => ({
  detectConfluenceThemes: jest.fn(() => []),
  mapPredictiveDomainToThemes: jest.fn(() => []),
}));

jest.mock('@/lib/astrology/transit-windows', () => ({
  buildTransitWindows: jest.fn(() => []),
}));

jest.mock('@/lib/resonance-database', () => ({
  resonanceDB: { ensureUser: jest.fn(async () => undefined) },
}));

jest.mock('@/lib/user-context', () => ({
  getUserContextSnapshot: jest.fn(async () => null),
}));

import { POST } from '@/app/api/transits/route';

describe('/api/transits POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validateFeatureAccess.mockResolvedValue(true);
    getCurrentTransits.mockReturnValue([
      {
        transitingPlanet: 'Moon',
        transitingSign: 'Virgo',
        natalPlanet: 'Sun',
        natalSign: 'Leo',
        aspect: 'Conjunction',
        orb: 0.4,
        exact: true,
        shortDescription: 'Moon conjunct natal Sun',
        description: 'New-moon style activation.',
        tags: ['lunar cycle', 'new beginnings', 'exact'],
      },
    ]);
  });

  it('returns 400 when birth data is missing', async () => {
    const response = await POST({ json: async () => ({}) } as Request);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 403 when the feature is locked', async () => {
    validateFeatureAccess.mockResolvedValueOnce(false);
    const response = await POST({
      json: async () => ({ birthDate: '1983-08-14', birthTime: '12:21' }),
    } as Request);
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.code).toBe('FEATURE_NOT_AVAILABLE');
  });

  it('returns tagged transits and honors clientDate', async () => {
    const response = await POST({
      json: async () => ({
        birthDate: '1983-08-14',
        birthTime: '12:21',
        lat: 36.85,
        lon: -76.29,
        timezoneOffset: -4,
        clientDate: '2026-08-13',
      }),
    } as Request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.all[0].tags).toEqual(expect.arrayContaining(['lunar cycle']));
    expect(body.data.summary.total).toBe(1);
    expect(body.data.mentionWorthy.headline.label).toMatch(/Moon Conjunction natal Sun/);
    expect(body.data.livedThemes.framing).toBe('symbolic-emphasis');
    expect(Array.isArray(body.data.livedThemes.themes)).toBe(true);
    expect(body.data.livedThemes.reflection?.framing).toBe('reflection');
    expect(getCurrentTransits).toHaveBeenCalled();
    const asOf = getCurrentTransits.mock.calls[0][1] as Date;
    expect(asOf.getFullYear()).toBe(2026);
    expect(asOf.getMonth()).toBe(7);
    expect(asOf.getDate()).toBe(13);
  });
});
