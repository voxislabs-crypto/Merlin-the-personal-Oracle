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
  clerkClient: jest.fn(),
}));

jest.mock('@/lib/pattern-mirror', () => ({
  logInteractionEvent: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    userInteractionEvent: {
      findMany: jest.fn(),
    },
  },
}));

import { GET, POST } from '../../app/api/dashboard-events/route';
import { logInteractionEvent } from '../../lib/pattern-mirror';
import { prisma } from '../../lib/prisma';
import { auth, clerkClient } from '@clerk/nextjs/server';

describe('dashboard-events route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_1' });
    (clerkClient as unknown as jest.Mock).mockResolvedValue({
      users: {
        getUser: jest.fn().mockResolvedValue({
          publicMetadata: { role: 'admin' },
        }),
      },
    });
  });

  it('returns 401 for anonymous POST', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ userId: null });

    const request = {
      json: async () => ({ eventName: 'dashboard_first_chart_completed' }),
    } as unknown as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('returns 400 for missing eventName in POST', async () => {
    const request = {
      json: async () => ({}),
    } as unknown as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('returns 403 for mismatched userId in POST', async () => {
    const request = {
      json: async () => ({
        userId: 'someone_else',
        eventName: 'dashboard_first_chart_completed',
      }),
    } as unknown as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.success).toBe(false);
  });

  it('logs event and returns success for valid POST', async () => {
    const request = {
      json: async () => ({
        userId: 'user_1',
        eventName: 'dashboard_first_ask_submitted',
        detail: { section: 'wheel' },
      }),
    } as unknown as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(logInteractionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_1',
        type: 'dashboard_event',
        content: 'dashboard_first_ask_submitted',
      })
    );
  });

  it('returns summarized counts for GET', async () => {
    (prisma.userInteractionEvent.findMany as jest.Mock).mockResolvedValue([
      {
        id: '1',
        userId: 'user_1',
        content: 'dashboard_first_chart_completed',
        metadataJson: null,
        createdAt: new Date('2026-03-27T12:00:00.000Z'),
      },
      {
        id: '2',
        userId: 'user_1',
        content: 'dashboard_first_ask_submitted',
        metadataJson: null,
        createdAt: new Date('2026-03-27T12:05:00.000Z'),
      },
      {
        id: '3',
        userId: 'user_2',
        content: null,
        metadataJson: JSON.stringify({ eventName: 'dashboard_daily_checkin' }),
        createdAt: new Date('2026-03-27T12:10:00.000Z'),
      },
    ]);

    const request = {
      url: 'http://localhost/api/dashboard-events?days=30',
    } as Request;
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.totalEvents).toBe(3);
    expect(json.data.uniqueUsers).toBe(2);
    expect(json.data.countsByEvent.dashboard_first_chart_completed).toBe(1);
    expect(json.data.countsByEvent.dashboard_first_ask_submitted).toBe(1);
    expect(json.data.countsByEvent.dashboard_daily_checkin).toBe(1);
    expect(json.data.funnel.firstChart).toBe(1);
    expect(json.data.funnel.firstAsk).toBe(1);
    expect(json.data.funnel.dailyCheckins).toBe(1);
  });

  it('returns 403 for non-admin GET', async () => {
    (clerkClient as unknown as jest.Mock).mockResolvedValueOnce({
      users: {
        getUser: jest.fn().mockResolvedValue({
          publicMetadata: { role: 'member' },
        }),
      },
    });

    const request = {
      url: 'http://localhost/api/dashboard-events?days=30',
    } as Request;

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.success).toBe(false);
  });
});
