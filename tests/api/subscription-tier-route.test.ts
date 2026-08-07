/** @jest-environment node */

import { GET } from '@/app/api/subscription/tier/route';

jest.mock('@/lib/subscription-validation', () => ({
  getUserTier: jest.fn(),
  getTierFeatures: jest.fn(),
}));

const { getUserTier, getTierFeatures } = jest.requireMock('@/lib/subscription-validation');

describe('/api/subscription/tier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getTierFeatures.mockImplementation((tier: string) => ({
      canCalculateChart: true,
      // Freemium: free gets Today forecast + personality; paid gets full depth.
      canAccessForecast: true,
      canAccessTransits: tier !== 'free',
      canAccessInterpretations: tier !== 'free',
      canAccessWeeklyForecast: tier !== 'free',
      canAccessLifeArc: tier !== 'free',
      canAccessPersonality: true,
      canAccessGrokNarrative: tier !== 'free',
      canAccessSoulReading: tier !== 'free',
      canAccessSynastry: tier !== 'free',
      canAccessStorms: tier !== 'free',
      maxChartsPerDay: 3,
      maxChartsTotal: 3,
    }));
  });

  it('returns lifetime premium flags', async () => {
    getUserTier.mockResolvedValue('lifetime');

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        success: true,
        tier: 'lifetime',
        premiumInsights: true,
        features: expect.objectContaining({
          canAccessForecast: true,
          canAccessTransits: true,
          canAccessStorms: true,
        }),
      })
    );
  });

  it('returns free tier freemium flags', async () => {
    getUserTier.mockResolvedValue('free');

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tier).toBe('free');
    expect(body.premiumInsights).toBe(false);
    expect(body.features.canAccessForecast).toBe(true);
    expect(body.features.canAccessPersonality).toBe(true);
    expect(body.features.canAccessStorms).toBe(false);
    expect(body.features.canAccessTransits).toBe(false);
  });
});