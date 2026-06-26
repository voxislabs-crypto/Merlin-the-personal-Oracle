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
      create: jest.fn(),
    },
  },
}));

import { POST } from '../../app/api/checkin/route';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../lib/prisma';

describe('checkin route POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_1' });
    (prisma.userInteractionEvent.create as jest.Mock).mockResolvedValue({
      id: 'evt_1',
      createdAt: new Date('2026-05-19T12:00:00.000Z'),
    });
  });

  it('returns 401 for anonymous request', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ userId: null });

    const request = {
      json: async () => ({ mood: 5, stress: 5, energy: 5 }),
    } as unknown as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('returns 400 for invalid scale values', async () => {
    const request = {
      json: async () => ({ mood: 11, stress: 4, energy: 4 }),
    } as unknown as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('creates checkin record for valid payload', async () => {
    const request = {
      json: async () => ({
        mood: 6,
        stress: 4,
        energy: 7,
        confidence: 5,
        domains: { career: 8, love: 5 },
        notes: 'Felt focused after noon.',
      }),
    } as unknown as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prisma.userInteractionEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user_1',
          type: 'checkin_entry',
        }),
      })
    );
  });
});
