import { buildEdgeTakeaway } from '@/lib/self/edge-takeaway';
import { buildOperatingSystemProfile } from '@/lib/self/operating-system';

describe('buildOperatingSystemProfile', () => {
  it('builds evergreen traits from core type', () => {
    const traits = buildOperatingSystemProfile({ coreType: 'INFJ' });
    expect(traits.map((t) => t.id)).toEqual(
      expect.arrayContaining([
        'decision',
        'stress',
        'communication',
        'recharge',
        'strengths',
        'blind_spots',
      ]),
    );
    expect(traits.find((t) => t.id === 'decision')?.value).toMatch(/Values/i);
  });

  it('notes dual decision style when mask T and core F', () => {
    const traits = buildOperatingSystemProfile({ coreType: 'INFJ', maskType: 'INTJ' });
    expect(traits.find((t) => t.id === 'decision')?.value).toMatch(/Heart first|proof/i);
  });

  it('returns empty without a valid type', () => {
    expect(buildOperatingSystemProfile({})).toEqual([]);
  });
});

describe('buildEdgeTakeaway', () => {
  it('writes a memorable F-core T-mask edge', () => {
    const edge = buildEdgeTakeaway({ coreType: 'INFJ', maskType: 'INTJ' });
    expect(edge?.title).toBe('Your edge');
    expect(edge?.body).toMatch(/empathy|compass|proof|over-analysis/i);
  });

  it('returns null without types', () => {
    expect(buildEdgeTakeaway({})).toBeNull();
  });
});
