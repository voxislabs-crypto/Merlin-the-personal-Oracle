import { buildCoreMaskTension, buildSelfMbtiLens } from '@/lib/self/dual-layer-lens';
import { personalityCloser } from '@/lib/atmosphere/today-oracle/personality-lens';

describe('buildCoreMaskTension', () => {
  it('returns null when Core and Mask are the same or missing', () => {
    expect(buildCoreMaskTension('INFJ', 'INFJ')).toBeNull();
    expect(buildCoreMaskTension('INFJ', null)).toBeNull();
    expect(buildCoreMaskTension(undefined, 'INTP')).toBeNull();
    expect(buildCoreMaskTension('not-a-type', 'INTP')).toBeNull();
  });

  it('names the INFJ core vs INTP mask as feel-first vs proof', () => {
    const line = buildCoreMaskTension('INFJ', 'INTP');
    expect(line).toMatch(/INFJ/);
    expect(line).toMatch(/INTP/);
    expect(line?.toLowerCase()).toMatch(/feel|proof/);
  });

  it('names an inner-room vs fireworks split on E/I', () => {
    const line = buildCoreMaskTension('INFJ', 'ENFJ', 'friction');
    expect(line).toMatch(/INFJ/);
    expect(line).toMatch(/ENFJ/);
    expect(line?.toLowerCase()).toMatch(/process|show|inside/);
  });

  it('does not invent INFJ when the types are something else', () => {
    const line = buildCoreMaskTension('ENTP', 'ESTP');
    expect(line).not.toMatch(/INFJ/);
    expect(line).toMatch(/ENTP/);
    expect(line).toMatch(/ESTP/);
  });
});

describe('buildSelfMbtiLens', () => {
  it('uses Core as the Self packet, not a static four-letter table', () => {
    const lens = buildSelfMbtiLens({ coreType: 'ENTP', maskType: 'ESTP', intensity: 40 });
    expect(lens.likelyPattern).toMatch(/ENTP/);
    expect(lens.likelyPattern).toMatch(/ESTP/);
    expect(lens.tension).toBeTruthy();
    expect(lens.bestMove24h).toContain(lens.tension as string);
  });

  it('falls back to Core-only copy when there is no Mask split', () => {
    const lens = buildSelfMbtiLens({ coreType: 'INTJ', intensity: 70 });
    expect(lens.likelyPattern).toMatch(/INTJ/);
    expect(lens.tension).toBeNull();
    expect(lens.bestMove24h.toLowerCase()).toMatch(/checkpoint|call/);
  });

  it('does not default missing types to INFJ', () => {
    const lens = buildSelfMbtiLens({});
    expect(lens.likelyPattern).not.toMatch(/INFJ/);
    expect(lens.tension).toBeNull();
  });
});

describe('personalityCloser dual layer', () => {
  it('prefers Core/Mask tension over the static frame closer', () => {
    const closer = personalityCloser('intuition', 'friction', {
      coreType: 'INFJ',
      maskType: 'INTP',
    });
    expect(closer).toMatch(/feel|proof/i);
    expect(closer).not.toMatch(/body-level no/);
  });
});
