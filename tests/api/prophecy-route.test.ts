jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

import { POST } from '../../app/api/prophecy/route';

describe('prophecy route', () => {
  it('returns 400 for missing chart', async () => {
    const request = {
      json: async () => ({ style: 'omen' }),
    } as unknown as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('returns 400 for invalid style', async () => {
    const request = {
      json: async () => ({
        style: 'epic',
        birthChart: {
          planets: [{ name: 'Jupiter', sign: 'Leo', longitude: 100 }],
          jd: 2451545,
        },
      }),
    } as unknown as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('returns omen prophecy for valid chart', async () => {
    const request = {
      json: async () => ({
        style: 'omen',
        birthChart: {
          jd: 2451545,
          planets: [
            { name: 'Jupiter', sign: 'Leo', house: 10 },
            { name: 'Saturn', sign: 'Scorpio', house: 8 },
          ],
        },
      }),
    } as unknown as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.style).toBe('omen');
    expect(typeof json.data.prophecy).toBe('string');
    expect(json.data.prophecy.length).toBeGreaterThan(40);
  });

  it('returns sonnet prophecy with 14 lines', async () => {
    const request = {
      json: async () => ({
        style: 'sonnet',
        birthChart: {
          jd: 2451545,
          planets: [
            { name: 'Sun', sign: 'Aries', house: 1 },
            { name: 'Mars', sign: 'Capricorn', house: 10 },
          ],
        },
      }),
    } as unknown as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.style).toBe('sonnet');
    const lineCount = String(json.data.prophecy).split('\n').length;
    expect(lineCount).toBe(14);
  });
});
