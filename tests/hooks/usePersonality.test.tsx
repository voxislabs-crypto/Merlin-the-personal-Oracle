import { renderHook, act, waitFor } from '@testing-library/react';
import { usePersonality } from '@/hooks/usePersonality';

describe('usePersonality', () => {
  const birth = {
    date: '1983-08-14',
    time: '12:21',
    latitude: 36.8468,
    longitude: -76.2855,
  };

  beforeEach(() => {
    (global.fetch as jest.Mock | undefined)?.mockClear?.();
    global.fetch = jest.fn();
  });

  it('always POSTs /api/personality instead of using cached overlay state', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        source: 'swiss-real',
        data: {
          firmware: 'INFJ',
          hardware: 'INTP',
          finalType: 'INFJ',
          dualOverlay: {
            firmware: { mbtiType: 'INFJ' },
            hardware: { mbtiType: 'INTP' },
            finalType: 'INFJ',
          },
        },
      }),
    });

    const { result } = renderHook(() => usePersonality());

    await act(async () => {
      await result.current.calculatePersonality(birth, { retrogradeOverlay: false });
    });

    await waitFor(() => {
      expect(result.current.mbtiType).toBe('INFJ');
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/personality');
    expect(init.method).toBe('POST');
    expect(init.cache).toBe('no-store');
    const body = JSON.parse(init.body);
    expect(body.birthDate).toBe('1983-08-14');
    expect(body.birthTime).toBe('12:21');
    expect(body.retrogradeOverlay).toBe(false);
    expect(result.current.dualOverlay?.firmware.mbtiType).toBe('INFJ');
    expect(result.current.dualOverlay?.hardware.mbtiType).toBe('INTP');
  });

  it('sends retrogradeOverlay on a fresh API call when the toggle changes', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        source: 'swiss-real',
        data: {
          firmware: 'INFP',
          hardware: 'INTP',
          finalType: 'INFP',
          dualOverlay: {
            firmware: { mbtiType: 'INFP' },
            hardware: { mbtiType: 'INTP' },
            finalType: 'INFP',
          },
        },
      }),
    });

    const { result } = renderHook(() => usePersonality());

    await act(async () => {
      await result.current.calculatePersonality(birth, { retrogradeOverlay: true });
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.retrogradeOverlay).toBe(true);
    expect(result.current.mbtiType).toBe('INFP');
  });
});
