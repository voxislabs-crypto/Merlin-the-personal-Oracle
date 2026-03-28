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

jest.mock('../../lib/pattern-mirror', () => ({
  logInteractionEvent: jest.fn(),
}));

jest.mock('../../lib/prophecy-polish', () => ({
  polishProphecyWithGroq: jest.fn(),
}));

import { POST } from '../../app/api/prophecy/route';
import { auth } from '@clerk/nextjs/server';
import { logInteractionEvent } from '../../lib/pattern-mirror';
import { polishProphecyWithGroq } from '../../lib/prophecy-polish';

describe('prophecy route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_1' });
  });

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

  it('returns 400 for invalid polish mode', async () => {
    const request = {
      json: async () => ({
        style: 'omen',
        polishMode: 'xai',
        birthChart: {
          jd: 2451545,
          planets: [{ name: 'Jupiter', sign: 'Leo' }],
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
        strictMeter: true,
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
    expect(json.data.meter).toBeDefined();
  });

  it('returns 401 when saving to history without auth', async () => {
    (auth as jest.Mock).mockResolvedValueOnce({ userId: null });

    const request = {
      json: async () => ({
        style: 'omen',
        saveToHistory: true,
        birthChart: {
          jd: 2451545,
          planets: [{ name: 'Jupiter', sign: 'Leo' }],
        },
      }),
    } as unknown as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('logs history when saveToHistory is true', async () => {
    const request = {
      json: async () => ({
        style: 'omen',
        era: 'stoic',
        saveToHistory: true,
        birthChart: {
          jd: 2451545,
          planets: [
            { name: 'Jupiter', sign: 'Leo' },
            { name: 'Saturn', sign: 'Scorpio' },
          ],
        },
      }),
    } as unknown as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(logInteractionEvent).toHaveBeenCalledTimes(1);
  });

  it('uses groq polish when requested and available', async () => {
    (polishProphecyWithGroq as jest.Mock).mockResolvedValueOnce({
      prophecy: 'Polished prophecy from groq.',
      model: 'llama-3.1-8b-instant',
    });

    const request = {
      json: async () => ({
        style: 'omen',
        polishMode: 'groq',
        birthChart: {
          jd: 2451545,
          planets: [
            { name: 'Jupiter', sign: 'Leo' },
            { name: 'Saturn', sign: 'Scorpio' },
          ],
        },
      }),
    } as unknown as Request;

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(polishProphecyWithGroq).toHaveBeenCalledTimes(1);
    expect(json.data.polishedBy).toBe('groq');
    expect(json.data.prophecy).toBe('Polished prophecy from groq.');
  });
});
