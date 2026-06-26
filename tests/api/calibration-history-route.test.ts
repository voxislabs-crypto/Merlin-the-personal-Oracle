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

jest.mock('@/lib/prisma', () => ({
  prisma: {
    userInteractionEvent: {
      findMany: jest.fn(),
    },
  },
}));

import { GET } from '../../app/api/calibration/history/route';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../lib/prisma';

describe('calibration history route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_1' });
    (prisma.userInteractionEvent.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'evt_1',
        metadataJson: JSON.stringify({
          windowDays: 90,
          sampleSize: 34,
          minSamples: 3,
          strongestModifier: { planet: 'Saturn', multiplier: 1.12 },
          modifierCount: 4,
          modifiers: { Saturn: 1.12, Moon: 0.94 },
          modifierDelta: [{ planet: 'Saturn', previous: 1.07, current: 1.12, delta: 0.05 }],
        }),
        createdAt: new Date('2026-05-19T12:00:00.000Z'),
      },
    ]);
  });

  it('returns 401 when unauthenticated', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ userId: null });

    const request = { url: 'http://localhost/api/calibration/history?days=30' } as Request;
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('returns parsed history entries', async () => {
    const request = { url: 'http://localhost/api/calibration/history?days=30' } as Request;
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.total).toBe(1);
    expect(json.data.entries[0].strongestModifier.planet).toBe('Saturn');
    expect(json.data.entries[0].modifierCount).toBe(4);
    expect(json.data.entries[0].modifiers.Saturn).toBe(1.12);
    expect(json.data.entries[0].modifierDelta[0].delta).toBe(0.05);
    expect(json.data.entries[0].impactScore).toBe(0.05);
  });

  it('filters malformed modifier delta payloads', async () => {
    (prisma.userInteractionEvent.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 'evt_bad',
        metadataJson: JSON.stringify({
          modifierDelta: [
            { planet: 'Mars', previous: 1.02, current: 1.11, delta: 0.09 },
            { planet: 'Moon', previous: 'oops', current: 0.95, delta: -0.03 },
            null,
          ],
        }),
        createdAt: new Date('2026-05-19T18:00:00.000Z'),
      },
    ]);

    const request = { url: 'http://localhost/api/calibration/history?days=30' } as Request;
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.entries[0].modifierDelta).toEqual([
      { planet: 'Mars', previous: 1.02, current: 1.11, delta: 0.09 },
    ]);
    expect(json.data.entries[0].impactScore).toBe(0.09);
  });
});
