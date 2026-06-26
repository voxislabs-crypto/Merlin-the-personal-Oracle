/** @jest-environment node */

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock('@/lib/subscription-validation', () => ({
  getUserTier: jest.fn().mockResolvedValue('lifetime'),
  getTierFeatures: jest.fn().mockReturnValue({
    canAccessInterpretations: true,
  }),
}));

jest.mock('@/lib/user-context', () => ({
  getUserContextSnapshot: jest.fn().mockResolvedValue(null),
}));

import { POST } from '@/app/api/interpret/route';

describe('/api/interpret POST', () => {
  it('returns chart interpretation JSON for Norfolk sample chart', async () => {
    const request = {
      json: async () => ({
        birthDate: '1983-08-14',
        birthTime: '12:21',
        lat: 36.8468,
        lon: -76.2855,
        mode: 'traditional',
        timezoneOffset: -4,
      }),
    } as unknown as Request;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data?.chartSummary).toEqual(expect.any(String));
    expect(body.data?.planetInterpretations?.length).toBeGreaterThan(0);
  });
});