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

import { GET } from '../../app/api/checkin/history/route';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../lib/prisma';

describe('checkin history route GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_1' });
    (prisma.userInteractionEvent.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'evt_1',
        content: 'checkin',
        metadataJson: JSON.stringify({ mood: 6, stress: 4, energy: 7, domains: { career: 8 }, notes: 'steady day' }),
        createdAt: new Date('2026-05-19T10:00:00.000Z'),
      },
    ]);
  });

  it('returns 401 for anonymous request', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ userId: null });

    const request = { url: 'http://localhost/api/checkin/history?days=7' } as Request;
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('returns parsed checkin entries', async () => {
    const request = { url: 'http://localhost/api/checkin/history?days=14' } as Request;
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.total).toBe(1);
    expect(json.data.entries[0].mood).toBe(6);
    expect(json.data.entries[0].domains.career).toBe(8);
  });
});
