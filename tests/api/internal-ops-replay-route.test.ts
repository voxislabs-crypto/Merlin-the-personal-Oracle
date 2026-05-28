jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
}));

jest.mock('@/lib/internal/ops-auth', () => ({
  requireInternalOpsAccess: jest.fn(),
}));

import { readFile } from 'node:fs/promises';
import { requireInternalOpsAccess } from '@/lib/internal/ops-auth';
import { GET } from '../../app/api/internal/ops/replay/route';

describe('internal ops replay route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireInternalOpsAccess as jest.Mock).mockResolvedValue(null);
  });

  it('returns denied response when access guard fails', async () => {
    const denied = {
      status: 403,
      json: async () => ({ success: false, error: 'Forbidden' }),
    };
    (requireInternalOpsAccess as jest.Mock).mockResolvedValueOnce(denied);

    const request = {
      nextUrl: {
        searchParams: new URLSearchParams('scenario=healthy'),
      },
    } as any;

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ success: false, error: 'Forbidden' });
  });

  it('returns replay data for selected scenario', async () => {
    const report = {
      generatedAt: '2026-05-28T19:00:00.000Z',
      scenario: 'degraded',
      latest: {
        phaseGate: {
          currentPhase: 'adaptive',
          metrics: { trustScore: 0.69, driftScore: 0.63 },
        },
      },
      events: [
        {
          type: 'ops_phase_gate_v1',
          content: 'Phase gate adaptive -> trusted (degraded)',
          createdAt: '2026-05-28T18:00:00.000Z',
        },
        {
          type: 'ops_rollback_event_v1',
          content: 'Rollback event (degraded)',
          createdAt: '2026-05-28T18:10:00.000Z',
        },
      ],
    };

    const index = {
      reports: [
        { scenario: 'healthy', file: 'docs/ops/reports/healthy.json' },
        { scenario: 'degraded', file: 'docs/ops/reports/degraded.json' },
      ],
    };

    (readFile as jest.Mock)
      .mockResolvedValueOnce(JSON.stringify(report))
      .mockResolvedValueOnce(JSON.stringify(index));

    const request = {
      nextUrl: {
        searchParams: new URLSearchParams('scenario=degraded'),
      },
    } as any;

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.scenario).toBe('degraded');
    expect(json.data.availableScenarios).toEqual(['healthy', 'degraded']);
    expect(Array.isArray(json.data.timeline)).toBe(true);
    expect(json.data.timeline.length).toBe(2);
    expect(json.data.timeline[1].level).toBe('danger');
  });

  it('returns 500 when report file is missing', async () => {
    (readFile as jest.Mock)
      .mockImplementationOnce(async () => {
        throw new Error('ENOENT');
      })
      .mockResolvedValueOnce(JSON.stringify({ reports: [] }));

    const request = {
      nextUrl: {
        searchParams: new URLSearchParams('scenario=unknown-scenario'),
      },
    } as any;

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
  });
});
