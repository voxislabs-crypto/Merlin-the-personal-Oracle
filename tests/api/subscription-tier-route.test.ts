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
      canAccessForecast: tier !== 'free',
      canAccessTransits: tier !== 'free',
      canAccessInterpretations: tier !== 'free',
      canAccessWeeklyForecast: tier !== 'free',
      canAccessLifeArc: tier !== 'free',
      canAccessPersonality: tier !== 'free',
      canAccessGrokNarrative: tier !== 'free',
      canAccessSoulReading: tier !== 'free',
      canAccessSynastry: tier !== 'free',
      maxChartsPerDay: tier === 'free' ? 1 : 50,
      maxChartsTotal: tier === 'free' ? 3 : 9999,
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
        }),
      })
    );
  });

  it('returns free tier flags', async () => {
    getUserTier.mockResolvedValue('free');

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tier).toBe('free');
    expect(body.premiumInsights).toBe(false);
    expect(body.features.canAccessForecast).toBe(false);
  });
});