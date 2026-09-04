import { buildIdentityPacket, resolveSelfMbtiType } from '@/lib/self';

describe('buildIdentityPacket', () => {
  it('builds a Self pillar packet with placements and MBTI', () => {
    const packet = buildIdentityPacket({
      sunSign: 'Libra',
      moonSign: 'Pisces',
      risingSign: 'Gemini',
      mbtiType: 'enfp',
      calcSource: 'Swiss real',
      chartHasHouses: true,
    });

    expect(packet.pillar).toBe('self');
    expect(packet.placements.sunSign).toBe('Libra');
    expect(packet.mbti.primary?.type).toBe('ENFP');
    expect(packet.headline).toContain('Libra');
    expect(packet.headline).toContain('ENFP');
    expect(packet.provenance.chartHasHouses).toBe(true);
    expect(packet.provenance.confidenceSource).toBe('mbti_fusion');
    expect(packet.operatingSystem.length).toBeGreaterThanOrEqual(5);
    expect(packet.operatingSystem.some((t) => t.id === 'decision')).toBe(true);
    expect(packet.edgeTakeaway?.body.length).toBeGreaterThan(20);
  });

  it('headlines core before mask when dual layers differ', () => {
    const packet = buildIdentityPacket({
      sunSign: 'Virgo',
      mbtiPrimary: { type: 'INFJ', role: 'primary' },
      mbtiSecondary: { type: 'INTP', role: 'secondary' },
    });
    expect(packet.headline).toMatch(/Core INFJ/i);
    expect(packet.headline).toMatch(/Mask INTP/i);
  });

  it('prefers archetype in headline when present', () => {
    const packet = buildIdentityPacket({
      archetypeName: 'The Bridge',
      mbtiType: 'INFJ',
    });

    expect(packet.headline).toMatch(/The Bridge/);
    expect(packet.provenance.confidenceSource).toBe('identity_pack');
  });

  it('resolves weather MBTI from Self core, not a hardcoded INFJ', () => {
    expect(
      resolveSelfMbtiType({
        dualOverlay: {
          firmware: { mbtiType: 'ENTP' },
          hardware: { mbtiType: 'ESTP' },
          finalType: 'INFJ',
        },
        mbtiType: 'INFJ',
      }),
    ).toBe('ENTP');
    expect(resolveSelfMbtiType({})).toBeUndefined();
  });

  it('lets a user Core override beat the engine firmware', () => {
    expect(
      resolveSelfMbtiType({
        coreOverride: 'INFJ',
        dualOverlay: {
          firmware: { mbtiType: 'INFP' },
          hardware: { mbtiType: 'INTP' },
          finalType: 'INFP',
        },
        mbtiType: 'INFP',
      }),
    ).toBe('INFJ');
  });

  it('falls back when only empty inputs are given', () => {
    const packet = buildIdentityPacket({});
    expect(packet.pillar).toBe('self');
    expect(packet.headline).toMatch(/personalizes life weather/i);
    expect(packet.provenance.confidenceSource).toBe('chart_only');
  });
});
