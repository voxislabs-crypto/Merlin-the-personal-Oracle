import { parseStorylineFallback } from '@/components/dashboard/ActiveStorylinePanel';

describe('parseStorylineFallback', () => {
  it('extracts themes and peak windows from prose', () => {
    const text =
      'Right now the strongest storyline is transformation (4 aligned signals) with secondary emphasis on inner work (5 aligned signals). The clearest timing windows are Uranus Opposition Uranus peaking Aug 3 and Neptune Trine Uranus peaking Aug 3.';

    const { themes, windows } = parseStorylineFallback(text);

    expect(themes.length).toBeGreaterThanOrEqual(2);
    expect(themes.some((t) => /transformation/i.test(t.title) && t.signalCount === 4)).toBe(true);
    expect(themes.some((t) => /inner work/i.test(t.title) && t.signalCount === 5)).toBe(true);
    expect(windows.length).toBeGreaterThanOrEqual(2);
    expect(windows[0].title).toMatch(/Uranus/i);
  });

  it('returns empty for blank input', () => {
    expect(parseStorylineFallback('').themes).toEqual([]);
    expect(parseStorylineFallback(null).windows).toEqual([]);
  });
});
