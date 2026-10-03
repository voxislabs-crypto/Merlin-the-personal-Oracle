jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock('@/lib/feedback/record-reading-signal', () => ({
  recordReadingSignal: jest.fn(),
}));

import { POST } from '../../app/api/oracle-feedback/route';
import { recordReadingSignal } from '@/lib/feedback/record-reading-signal';

describe('oracle feedback route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes the hit into the shared reading pipeline', async () => {
    (recordReadingSignal as jest.Mock).mockResolvedValue({ pattern: true, resonance: true });
    const request = {
      json: async () => ({
        userId: 'user_1',
        message: 'Name the pattern, then one bounded act.',
        feedback: 'hit',
        date: '2026-10-03',
      }),
    };

    const response = await POST(request as never);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      pattern: true,
      resonance: true,
    });
    expect(recordReadingSignal).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_1',
        aspectId: 'daily-oracle-2026-10-03',
        theme: 'daily-oracle',
        signal: 'hit',
      }),
    );
  });

  it('rejects a vote when neither store can keep it', async () => {
    (recordReadingSignal as jest.Mock).mockResolvedValue({ pattern: false, resonance: false });
    const request = {
      json: async () => ({ userId: 'user_1', feedback: 'missed', message: 'nope' }),
    };
    const response = await POST(request as never);
    expect(response.status).toBe(503);
  });
});
