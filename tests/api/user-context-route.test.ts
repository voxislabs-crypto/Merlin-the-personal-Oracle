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

jest.mock('@/lib/user-context', () => ({
  getUserContextSnapshot: jest.fn(),
  upsertUserContextSnapshot: jest.fn(),
}));

import { GET, POST } from '../../app/api/user-context/route';
import { auth } from '@clerk/nextjs/server';
import { getUserContextSnapshot, upsertUserContextSnapshot } from '@/lib/user-context';

describe('user-context route', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_1' });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns 401 for anonymous GET', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ userId: null });

    const request = {
      url: 'http://localhost/api/user-context?userId=user_1',
    } as Request;

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns 400 for GET without userId', async () => {
    const request = {
      url: 'http://localhost/api/user-context',
    } as Request;

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ success: false, error: 'Missing userId' });
  });

  it('returns 403 for GET with mismatched userId', async () => {
    const request = {
      url: 'http://localhost/api/user-context?userId=user_2',
    } as Request;

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ success: false, error: 'Forbidden' });
  });

  it('returns 503 when context loading fails on GET', async () => {
    (getUserContextSnapshot as jest.Mock).mockRejectedValue(new Error('db unavailable'));

    const request = {
      url: 'http://localhost/api/user-context?userId=user_1',
    } as Request;

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json).toEqual({ success: false, error: 'Failed to load user context' });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[user-context] Failed to load context:',
      expect.any(Error)
    );
  });

  it('returns stored context on GET success', async () => {
    (getUserContextSnapshot as jest.Mock).mockResolvedValue({
      userId: 'user_1',
      situation: 'In transition',
      mood: 'hopeful',
      goals: ['Finish the application'],
      lastFeedbackNotes: 'Momentum is back',
      updatedAt: '2026-05-28T12:00:00.000Z',
    });

    const request = {
      url: 'http://localhost/api/user-context?userId=user_1',
    } as Request;

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.situation).toBe('In transition');
  });

  it('returns 503 when context persistence fails on POST', async () => {
    (upsertUserContextSnapshot as jest.Mock).mockRejectedValue(new Error('db unavailable'));

    const request = {
      json: async () => ({
        userId: 'user_1',
        situation: 'Couch surfing',
        mood: 'anxious',
        goals: ['Land a role'],
        lastFeedbackNotes: 'Interview froze me',
      }),
    } as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json).toEqual({ success: false, error: 'Failed to persist user context' });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[user-context] Failed to persist context:',
      expect.any(Error)
    );
  });

  it('returns 401 for anonymous POST', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ userId: null });

    const request = {
      json: async () => ({ userId: 'user_1' }),
    } as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns 400 for POST without userId', async () => {
    const request = {
      json: async () => ({ situation: 'In transition' }),
    } as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ success: false, error: 'Missing userId' });
  });

  it('returns 403 for POST with mismatched userId', async () => {
    const request = {
      json: async () => ({ userId: 'user_2', situation: 'In transition' }),
    } as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ success: false, error: 'Forbidden' });
  });
});