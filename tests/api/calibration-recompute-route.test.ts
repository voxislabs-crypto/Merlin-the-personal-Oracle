jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/astrology/feedback/calibration', () => ({
  recomputeCalibrationProfile: jest.fn(),
}));

jest.mock('@/lib/pattern-mirror', () => ({
  logInteractionEvent: jest.fn(),
}));

import { POST } from '../../app/api/calibration/recompute/route';
import { auth } from '@clerk/nextjs/server';
import { recomputeCalibrationProfile } from '@/lib/astrology/feedback/calibration';
import { logInteractionEvent } from '@/lib/pattern-mirror';

describe('calibration recompute route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_1' });
    (recomputeCalibrationProfile as jest.Mock).mockResolvedValue({
      userId: 'user_1',
      windowDays: 90,
      sampleSize: 12,
      minSamples: 3,
      modifiers: { Saturn: 1.14 },
      strongestModifier: { planet: 'Saturn', multiplier: 1.14 },
    });
  });

  it('returns 401 for anonymous request', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ userId: null });

    const request = { json: async () => ({}) } as unknown as Request;
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('returns 403 when requesting different user', async () => {
    const request = {
      json: async () => ({ userId: 'other_user' }),
    } as unknown as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.success).toBe(false);
  });

  it('recomputes profile and returns payload', async () => {
    const request = {
      json: async () => ({ days: 120, minSamples: 4 }),
    } as unknown as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(recomputeCalibrationProfile).toHaveBeenCalledWith({
      userId: 'user_1',
      days: 120,
      minSamples: 4,
    });
    expect(logInteractionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_1',
        type: 'calibration_recompute',
      })
    );
    expect(json.data.modifiers.Saturn).toBe(1.14);
  });
});
