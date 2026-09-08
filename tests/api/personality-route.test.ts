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
  validateFeatureAccess: jest.fn().mockResolvedValue(true),
}));

import { POST } from '@/app/api/personality/route';

describe('/api/personality POST', () => {
  it('returns overlay-off INFJ and overlay-on INFP for the Norfolk natal', async () => {
    const request = {
      json: async () => ({
        birthDate: '1983-08-14',
        birthTime: '12:21',
        lat: 36.8468,
        lon: -76.2855,
        timezoneOffset: -4,
        retrogradeOverlay: false,
      }),
    } as unknown as Request;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.hardware).toBe('INTP');
    expect(body.data.firmware).toBe('INFJ');
    expect(body.data.firmwareBase).toBe('INFJ');
    expect(body.data.firmwareRx).toBe('INFP');
    expect(body.data.dualOverlayBase.firmware.mbtiType).toBe('INFJ');
    expect(body.data.dualOverlayRx.firmware.mbtiType).toBe('INFP');
    expect(body.data.dualOverlay.firmware.mbtiType).toBe('INFJ');
  });

  it('selects INFP firmware when the Rx overlay flag is on', async () => {
    const request = {
      json: async () => ({
        birthDate: '1983-08-14',
        birthTime: '12:21',
        lat: 36.8468,
        lon: -76.2855,
        timezoneOffset: -4,
        retrogradeOverlay: true,
      }),
    } as unknown as Request;

    const response = await POST(request);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.firmware).toBe('INFP');
    expect(body.data.firmwareBase).toBe('INFJ');
    expect(body.data.dualOverlay.firmware.mbtiType).toBe('INFP');
    expect(body.data.hardware).toBe('INTP');
  });
});
