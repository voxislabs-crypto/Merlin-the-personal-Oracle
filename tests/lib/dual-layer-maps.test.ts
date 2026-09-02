import {
  composeDualLayerCard,
  containsMbtiLabel,
  letterDiffs,
  NEAR_SPLITS,
  parseMbtiType,
} from '@/lib/self/dual-layer-maps';

describe('dual-layer maps', () => {
  it('treats INFP→INTP as a near-split and soothes Core, coaches Mask', () => {
    expect(letterDiffs('INFP', 'INTP')).toEqual(['tf']);
    expect(NEAR_SPLITS['INFP>INTP']).toBeTruthy();

    const card = composeDualLayerCard({
      coreType: 'INFP',
      maskType: 'INTP',
      deadline: '6pm',
      transitAxis: 'relationship and self-worth',
    });

    expect(card?.source).toBe('near-split');
    expect(card?.tension).toMatch(/Heart vs logic/i);
    expect(card?.move.toLowerCase()).toMatch(/value/);
    expect(card?.move).toMatch(/6pm/);
    expect(card?.move.toLowerCase()).toMatch(/sentence|test/);
    expect(card?.why.toLowerCase()).toMatch(/authenticit|feel/);
    expect(card?.why.toLowerCase()).toMatch(/relationship|self-worth/);
    expect(card?.why.toLowerCase()).toMatch(/not a logic problem/);
    expect(card?.watchFor.toLowerCase()).toMatch(/briefing|feeling/);
    expect(card?.avoid.toLowerCase()).toMatch(/explaining|proving you are fine/);
    expect(containsMbtiLabel(card?.move)).toBe(false);
    expect(containsMbtiLabel(card?.why)).toBe(false);
    expect(containsMbtiLabel(card?.watchFor)).toBe(false);
    expect(containsMbtiLabel(card?.avoid)).toBe(false);
  });

  it('generates INFP→ENTJ from axis rules plus maps, not a canned essay', () => {
    expect(letterDiffs('INFP', 'ENTJ').length).toBeGreaterThan(1);
    expect(NEAR_SPLITS['INFP>ENTJ']).toBeUndefined();

    const card = composeDualLayerCard({
      coreType: 'INFP',
      maskType: 'ENTJ',
      deadline: '6pm',
      transitAxis: 'duty and limits',
    });

    expect(card?.source).toBe('axis');
    expect(card?.why.toLowerCase()).toMatch(/authenticit|feel|value/);
    expect(card?.move.toLowerCase()).toMatch(/objective|value|metric|sentence/);
    expect(card?.avoid.toLowerCase()).toMatch(/rewriting the story|noble|pace|campaign/);
    expect(containsMbtiLabel(`${card?.move} ${card?.why}`)).toBe(false);
  });

  it('does not invent a missing type', () => {
    expect(parseMbtiType('not-a-type')).toBeNull();
    expect(composeDualLayerCard({ coreType: 'WIZARD', maskType: 'INTP' })).toBeNull();
  });

  it('uses Core maps when Mask matches Core', () => {
    const card = composeDualLayerCard({ coreType: 'INTJ', deadline: '3pm' });
    expect(card?.source).toBe('core-only');
    expect(card?.why.toLowerCase()).toMatch(/competence/);
    expect(card?.move.toLowerCase()).toMatch(/experiment|question|plan/);
    expect(containsMbtiLabel(card?.move || '')).toBe(false);
  });

  it('changes the threatened thing and failure mode for INFP/INTP vs INFJ/INTP on the same sky', () => {
    const sky = {
      deadline: '6pm',
      transitAxis: 'relationship and self-worth',
      domain: 'relationships',
    };
    const infp = composeDualLayerCard({ coreType: 'INFP', maskType: 'INTP', ...sky });
    const infj = composeDualLayerCard({ coreType: 'INFJ', maskType: 'INTP', ...sky });
    expect(infp?.threatened.toLowerCase()).toMatch(/authenticit|feel/);
    expect(infj?.threatened.toLowerCase()).toMatch(/coherence|vision|pattern/);
    expect(infp?.whyThisPerson).not.toBe(infj?.whyThisPerson);
    expect(infp?.coreNotices).not.toBe(infj?.coreNotices);
    expect(infp?.behaviorTell).not.toBe(infj?.behaviorTell);
    const infpSansLabels = (infp?.whyThisPerson || '').replace(/\bINF[PJ]\b/g, '');
    const infjSansLabels = (infj?.whyThisPerson || '').replace(/\bINF[PJ]\b/g, '');
    expect(infpSansLabels).not.toBe(infjSansLabels);
    expect(infp?.whyThisPerson).toMatch(/INFP/);
    expect(infj?.whyThisPerson).toMatch(/INFJ/);
    expect(infp?.move).toBeTruthy();
    expect(infp?.avoid).toBeTruthy();
    expect(infp?.weeklyCharacter?.title).toMatch(/Quiet Knower/);
    expect(infj?.weeklyCharacter?.title).toMatch(/Pattern Witness/);
    expect(infp?.move.toLowerCase()).toMatch(/bond|value|test/);
    expect(infj?.move.toLowerCase()).toMatch(/pattern|feeling|vision|analysis/);
    const infpMoveSans = (infp?.move || '').replace(/\bINF[PJ]\b/g, '');
    const infjMoveSans = (infj?.move || '').replace(/\bINF[PJ]\b/g, '');
    expect(infpMoveSans).not.toBe(infjMoveSans);
  });

  it('changes the headline arena when the hot domain changes', () => {
    const infpBond = composeDualLayerCard({
      coreType: 'INFP',
      maskType: 'INTP',
      deadline: '6pm',
      domain: 'relationships',
    });
    const infpHome = composeDualLayerCard({
      coreType: 'INFP',
      maskType: 'INTP',
      deadline: '6pm',
      domain: 'home life',
    });
    expect(infpBond?.move.toLowerCase()).toMatch(/bond/);
    expect(infpHome?.move.toLowerCase()).toMatch(/home/);
    expect(infpBond?.move).not.toBe(infpHome?.move);
    expect(infpBond?.move.toLowerCase()).not.toMatch(/change one variable/);
  });
});
