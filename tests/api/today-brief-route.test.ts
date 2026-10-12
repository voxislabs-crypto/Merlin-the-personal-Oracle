jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock('@/lib/atmosphere/today-oracle/personal-ai', () => ({
  polishTodayBrief: jest.fn(),
}));

import { POST } from '../../app/api/today-brief/route';
import { polishTodayBrief } from '@/lib/atmosphere/today-oracle/personal-ai';

function requestWith(text: () => Promise<string>): Request {
  return { text } as unknown as Request;
}

describe('today-brief route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 400 without warning when the body was cut off', async () => {
    const response = await POST(
      requestWith(async () => {
        throw new SyntaxError('Unexpected end of JSON input');
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ success: false, error: 'Invalid JSON' });
    expect(polishTodayBrief).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('returns 400 for an empty body', async () => {
    const response = await POST(requestWith(async () => ''));

    expect(response.status).toBe(400);
    expect(polishTodayBrief).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('returns 400 when date or lead fact is missing', async () => {
    const response = await POST(requestWith(async () => JSON.stringify({ date: '2026-10-04' })));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Missing date or lead fact',
    });
    expect(polishTodayBrief).not.toHaveBeenCalled();
  });

  it('returns the polish when the body is complete', async () => {
    (polishTodayBrief as jest.Mock).mockResolvedValue({
      chartWhy: 'The threat is the unfinished loop, and the chart only names the hour it gets loud.',
      watchFor: 'Between 2 and 4, notice the urge to reopen the thread.',
      operationalTension: null,
      source: 'llm',
    });

    const response = await POST(
      requestWith(async () =>
        JSON.stringify({
          date: '2026-10-04',
          leadFact: 'Moon squares natal Mars',
          chartWhy: 'Deterministic why that is already long enough to send.',
        }),
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        chartWhy: 'The threat is the unfinished loop, and the chart only names the hour it gets loud.',
        watchFor: 'Between 2 and 4, notice the urge to reopen the thread.',
        operationalTension: null,
        source: 'llm',
      },
    });
    expect(polishTodayBrief).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-10-04',
        leadFact: 'Moon squares natal Mars',
      }),
    );
  });

  it('warns when reading the body fails for a real reason', async () => {
    const response = await POST(
      requestWith(async () => {
        throw new Error('socket exploded');
      }),
    );

    expect(response.status).toBe(500);
    expect(console.warn).toHaveBeenCalled();
  });
});
