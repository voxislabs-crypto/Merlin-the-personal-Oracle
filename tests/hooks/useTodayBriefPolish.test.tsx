import { act, renderHook } from '@testing-library/react';
import {
  mergeTodayBriefPolish,
  useTodayBriefPolish,
  type TodayBriefPolishSnapshot,
} from '@/hooks/useTodayBriefPolish';

const MEANING =
  'Career pressure and a Gemini Moon make the private read move faster than the public face can close it.';
const NEXT =
  'Money pressure and a Gemini Moon make the private read hesitate before the public face commits.';

function snap(overrides: Partial<TodayBriefPolishSnapshot> = {}): TodayBriefPolishSnapshot {
  return {
    date: '2026-11-12',
    leadFact: 'Moon squares natal Mars',
    leadFactDisplay: 'Moon square Mars',
    chartWhy: 'The deterministic why names the hour the pace splits from the private read.',
    move: 'Say the difference once, then stop.',
    watchFor: 'Between 2 and 4, notice the snap.',
    operationalTension: 'The private standard and the public pace are asking for different speeds.',
    doNot: 'Do not reopen the finished thread.',
    coreType: 'INFP',
    maskType: 'INTJ',
    sunSign: 'Scorpio',
    moonSign: 'Gemini',
    moonPhase: 'Waxing',
    domains: ['Work'],
    supportingFacts: ['Work: a decision is waiting'],
    heldFromYesterday: false,
    yesterdayRestless: false,
    streak: 2,
    loading: false,
    ...overrides,
  };
}

function responseFor(chartWhy: string) {
  return {
    ok: true,
    json: async () => ({
      success: true,
      data: {
        chartWhy,
        watchFor: 'Between 2 and 4, the public face answers before the private read is finished.',
        operationalTension:
          'The private read wants one more pass while the public face wants the step closed.',
        source: 'llm' as const,
      },
    }),
  };
}

describe('useTodayBriefPolish', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  it('clears polish when the evidence changes and ignores the outdated response', async () => {
    let resolveFirst: ((value: unknown) => void) | null = null;
    const fetchMock = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(() => Promise.resolve(responseFor(NEXT)));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result, rerender } = renderHook(
      (props: TodayBriefPolishSnapshot) => useTodayBriefPolish(props),
      { initialProps: snap() },
    );

    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstBody = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(firstBody.domains).toEqual(['Work']);
    expect(firstBody.supportingFacts).toEqual(['Work: a decision is waiting']);
    expect(firstBody.moonPhase).toBe('Waxing');
    expect(firstBody.moonSign).toBe('Gemini');

    rerender(snap({ move: 'Wait until the window closes.' }));
    expect(result.current).toBeNull();

    await act(async () => {
      resolveFirst?.(responseFor(MEANING));
      await Promise.resolve();
    });
    expect(result.current).toBeNull();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current?.chartWhy).toBe(NEXT);

    rerender(snap());
    expect(result.current?.chartWhy).toBe(MEANING);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('hides polish while the brief is loading and does not retry a failed packet', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: null }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result, rerender } = renderHook(
      (props: TodayBriefPolishSnapshot) => useTodayBriefPolish(props),
      { initialProps: snap() },
    );

    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    expect(result.current).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    rerender(snap({ loading: true }));
    expect(result.current).toBeNull();

    rerender(snap({ loading: false }));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current).toBeNull();
  });

  it('retries a failed polish after the page session is recreated', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const first = renderHook(() => useTodayBriefPolish(snap()));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.result.current).toBeNull();

    first.rerender(snap());
    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    first.unmount();
    renderHook(() => useTodayBriefPolish(snap()));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('drops the previous polish when the core override changes', async () => {
    global.fetch = jest.fn().mockResolvedValue(responseFor(MEANING)) as unknown as typeof fetch;
    const { result, rerender } = renderHook(
      (props: TodayBriefPolishSnapshot) => useTodayBriefPolish(props),
      { initialProps: snap() },
    );

    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    expect(result.current?.chartWhy).toBe(MEANING);

    rerender(snap({ coreType: 'ENTP' }));
    expect(result.current).toBeNull();
  });
});

describe('mergeTodayBriefPolish', () => {
  const brief = {
    chartWhy: 'Deterministic why.',
    watchFor: 'Between 2 and 4, notice the snap.',
    operationalTension: 'The private standard and the public pace are asking for different speeds.',
    tensionLine: 'Core wants another pass. Mask wants it closed.',
    behaviorTell: 'The public face answers early.',
  };

  it('keeps the engine lines until a real polish arrives', () => {
    expect(mergeTodayBriefPolish(brief, null)).toEqual({
      chartWhy: brief.chartWhy,
      watchFor: brief.watchFor,
      tensionLine: brief.tensionLine,
      behaviorTell: brief.behaviorTell,
    });
  });

  it('replaces only the why, the watch line, and the tension line', () => {
    expect(
      mergeTodayBriefPolish(brief, {
        chartWhy: MEANING,
        watchFor: 'Between 2 and 4, the public face answers before the private read is finished.',
        operationalTension: 'The private read wants one more pass while the public face wants the step closed.',
        source: 'llm',
      }),
    ).toEqual({
      chartWhy: MEANING,
      watchFor: 'Between 2 and 4, the public face answers before the private read is finished.',
      tensionLine: 'The private read wants one more pass while the public face wants the step closed.',
      behaviorTell: undefined,
    });
  });

  it('keeps the engine tension and behavior tell when those lines were rejected', () => {
    expect(
      mergeTodayBriefPolish(brief, {
        chartWhy: MEANING,
        watchFor: brief.watchFor,
        operationalTension: brief.operationalTension,
        source: 'llm',
      }),
    ).toEqual({
      chartWhy: MEANING,
      watchFor: brief.watchFor,
      tensionLine: brief.tensionLine,
      behaviorTell: brief.behaviorTell,
    });
  });
});
