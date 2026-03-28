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

jest.mock('../../lib/prisma', () => ({
  prisma: {
    userInteractionEvent: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

import { GET, PATCH } from '../../app/api/prophecy-history/route';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../lib/prisma';

describe('prophecy-history route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_1' });
  });

  it('returns 401 for anonymous GET', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ userId: null });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('returns mapped history on GET', async () => {
    (prisma.userInteractionEvent.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'evt_1',
        content: 'Tablet Omen: Jupiter in Leo',
        metadataJson: JSON.stringify({
          style: 'sonnet',
          era: 'babylonian',
          prophecy: 'line1\nline2',
          signals: { blessingPlanet: 'Jupiter', blessingSign: 'Leo', challengePlanet: 'Saturn', challengeSign: 'Scorpio' },
          meter: { score: 82, averageSyllables: 10.2 },
        }),
        feedbackSignal: 'fulfilled',
        createdAt: new Date('2026-03-28T10:00:00.000Z'),
      },
    ]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data[0].fulfilled).toBe(true);
    expect(json.data[0].style).toBe('sonnet');
  });

  it('updates fulfillment status on PATCH', async () => {
    (prisma.userInteractionEvent.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

    const request = {
      json: async () => ({ id: 'evt_1', fulfilled: true }),
    } as unknown as Request;

    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prisma.userInteractionEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'evt_1', userId: 'user_1' }),
      })
    );
  });
});
