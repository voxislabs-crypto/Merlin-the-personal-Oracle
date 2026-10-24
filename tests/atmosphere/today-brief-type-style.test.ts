jest.mock('server-only', () => ({}));

import { composeTodayHeadline, typedStormMove, typedSupportMove } from '@/lib/atmosphere/today-oracle/headline';
import { polishSystemPrompt } from '@/lib/atmosphere/today-oracle/personal-ai';
import type { RankedTheme, TransitFact } from '@/lib/atmosphere/today-oracle/types';
import type { LifeRiskPacket } from '@/lib/atmosphere/types';
import {
  CORE_THREAT,
  MASK_SYMPTOM,
  MBTI_TYPES,
  composeDualLayerCard,
  containsMbtiLabel,
  type MbtiType,
} from '@/lib/self/dual-layer-maps';

const SKY = {
  deadline: '6pm',
  transitAxis: 'relationship and self-worth',
  domain: 'relationships',
};

function mercuryNeptune(): TransitFact {
  return {
    key: 'Mercury square Neptune',
    transiting: 'mercury',
    aspect: 'square',
    natal: 'neptune',
    display: 'Mercury square Neptune',
    orbDeg: 0.8,
    band: 'hard',
    score: 90,
    domains: ['career'],
    source: 'transit-lookup',
  };
}

function fogTheme(): RankedTheme {
  return {
    id: 'fog-clarity',
    label: 'Clarity is thin',
    polarity: 'friction',
    score: 90,
    facts: [mercuryNeptune()],
    domains: ['career'],
  };
}

function forbidLabels(text: string) {
  expect(containsMbtiLabel(text)).toBe(false);
  expect(text.toLowerCase()).not.toMatch(/you will|you'll/);
  expect(text).not.toMatch(/\d+\s*%/);
}

describe('today brief type style', () => {
  it('gives a J/T Core and a P/F Core different sentence shapes on the same sky', () => {
    const intj = composeDualLayerCard({ coreType: 'INTJ', maskType: 'INTJ', ...SKY });
    const infp = composeDualLayerCard({ coreType: 'INFP', maskType: 'INFP', ...SKY });

    expect(intj?.threatened.toLowerCase()).toMatch(/competence/);
    expect(infp?.threatened.toLowerCase()).toMatch(/authenticit/);
    expect(intj?.coreNotices).toMatch(/^Priority:/);
    expect(intj?.coreNotices).not.toMatch(/stay unnamed|This lands close|This can stay gentle/);
    expect(infp?.coreNotices).toMatch(/^This lands close:/);
    expect(infp?.coreNotices).toMatch(/\bso\b/);
    expect(infp?.coreNotices).toMatch(/unnamed/);
    expect(infp?.coreNotices).not.toMatch(/Priority:/);
    expect(intj?.maskWants).toMatch(/^Priority:/);
    expect(infp?.maskWants).toMatch(/^This can stay gentle:/);
    expect(infp?.maskWants).not.toMatch(/Priority:/);
    expect(intj?.coreNotices).not.toBe(infp?.coreNotices);

    const headlineBase = {
      theme: fogTheme(),
      lead: mercuryNeptune(),
      domains: ['career'] as const,
      window: '10am–1pm',
      risk: {
        domains: [{ name: 'career', friction: 70, support: 12, hitCount: 1 }],
      } as LifeRiskPacket,
    };
    const intjMove = composeTodayHeadline({ ...headlineBase, coreType: 'INTJ', maskType: 'INTJ' });
    const infpMove = composeTodayHeadline({ ...headlineBase, coreType: 'INFP', maskType: 'INFP' });
    expect(intjMove.move).toMatch(/^Priority:/);
    expect(intjMove.move.toLowerCase()).toMatch(/experiment|plan/);
    expect(infpMove.move).toMatch(/^This can stay gentle:/);
    expect(infpMove.move.toLowerCase()).toMatch(/honest sentence/);
    expect(infpMove.move).toMatch(/unnamed/);
    expect(infpMove.move).not.toMatch(/^Priority:/);
    expect(intjMove.move).not.toBe(infpMove.move);

    for (const text of [
      intj?.coreNotices,
      infp?.coreNotices,
      intj?.maskWants,
      infp?.maskWants,
      intjMove.move,
      infpMove.move,
    ]) {
      forbidLabels(text || '');
    }
  });

  it('keeps Core style on the notice and Mask style on the action when they differ', () => {
    const card = composeDualLayerCard({ coreType: 'INFP', maskType: 'INTJ', ...SKY });
    expect(card?.coreNotices).toMatch(/^This lands close:/);
    expect(card?.coreNotices).not.toMatch(/Priority:/);
    expect(card?.maskWants).toMatch(/^Priority:/);
    expect(card?.maskWants).not.toMatch(/This lands close|unnamed|gentle/);

    const storm = typedStormMove('INFP', 'INTJ');
    expect(storm).toMatch(/^Priority:/);
    expect(storm.toLowerCase()).toMatch(/honest sentence/);
    expect(storm).not.toMatch(/gentle|unnamed|leave the rest open/);

    const flipped = typedStormMove('INTJ', 'INFP');
    expect(flipped).toMatch(/^This can stay gentle:/);
    expect(flipped.toLowerCase()).toMatch(/experiment|plan/);
    expect(flipped).not.toMatch(/^Priority:/);

    const support = typedSupportMove('INFJ', 'INTP');
    expect(support).toMatch(/^So far,/);
    expect(support.toLowerCase()).toMatch(/alignment/);
    expect(support).toMatch(/leave the rest open/);
    expect(support.toLowerCase()).not.toMatch(/then stop/);

    forbidLabels(`${card?.coreNotices} ${card?.maskWants} ${storm} ${flipped} ${support}`);
  });

  it('adds the Core style note to the polish prompt without a second pass', () => {
    const intj = polishSystemPrompt('INTJ', 'INTJ');
    const infp = polishSystemPrompt('INFP', 'INFP');
    const split = polishSystemPrompt('INFP', 'INTJ');

    expect(intj).toContain('Style for this Core: prefer numbered steps and explicit priorities.');
    expect(intj).not.toContain('flowing, open-ended');
    expect(infp).toContain('Style for this Core: prefer flowing, open-ended phrasing.');
    expect(infp).not.toContain('numbered steps');
    expect(split).toContain('Style for this Core: prefer flowing, open-ended phrasing.');
    expect(split).toContain('Style for the action sentence: prefer numbered steps and explicit priorities.');
    expect(split).toContain('Do not mix both styles in one sentence.');

    for (const prompt of [intj, infp, split]) {
      expect(prompt).toContain('Max 420 characters for chartWhy');
      expect(prompt).toContain('Never print MBTI type codes');
      const notes = prompt.split('\n').filter((line) => line.startsWith('- Style'));
      expect(notes.length).toBeGreaterThan(0);
      expect(notes.join('\n')).not.toMatch(/\b(INFP|INFJ|INTP|INTJ)\b/);
    }
  });
});

const STYLE_LEAD = /^(Priority:|First:|So far\b|This lands close:|What hurts first:|This can stay gentle:)/;

const CORE_STYLE_NOTE: Partial<Record<MbtiType, string>> = {
  INTJ: 'Style for this Core: prefer numbered steps and explicit priorities.',
  INFJ: 'Style for this Core: prefer one explicit priority and a closed next step, in warmer concrete language.',
  INTP: 'Style for this Core: prefer a precise, qualified claim with an open ending.',
  INFP: 'Style for this Core: prefer flowing, open-ended phrasing.',
};

function period(text: string): string {
  const cleaned = text.trim().replace(/\.+$/, '');
  return cleaned ? `${cleaned}.` : '';
}

function stormSky(type: MbtiType) {
  return composeTodayHeadline({
    theme: fogTheme(),
    lead: mercuryNeptune(),
    domains: ['career'],
    window: '10am–1pm',
    phase: 'peaking',
    daysToPeak: 0,
    risk: {
      domains: [{ name: 'career', friction: 80, support: 10, hitCount: 1 }],
    } as LifeRiskPacket,
    coreType: type,
    maskType: type,
  });
}

function supportSky(type: MbtiType) {
  const theme: RankedTheme = {
    id: 'home-mood',
    label: 'Home mood',
    polarity: 'opening',
    score: 82,
    facts: [
      {
        key: 'Venus trine Moon',
        transiting: 'venus',
        aspect: 'trine',
        natal: 'moon',
        display: 'Venus trine Moon',
        orbDeg: 0.6,
        band: 'soft',
        score: 82,
        domains: ['family'],
        source: 'transit-lookup',
      },
    ],
    domains: ['family'],
  };
  return composeTodayHeadline({
    theme,
    lead: theme.facts[0],
    domains: ['family'],
    risk: {
      domains: [{ name: 'family', friction: 18, support: 76, hitCount: 1 }],
    } as LifeRiskPacket,
    coreType: type,
    maskType: type,
  });
}

describe('every MBTI type on one sky', () => {
  const sharedStormLine = stormSky('ISTJ').what;

  it.each(MBTI_TYPES)('%s keeps the mapped move and threat', (type) => {
    const card = composeDualLayerCard({ coreType: type, maskType: type, ...SKY });
    const storm = stormSky(type);
    const support = supportSky(type);
    const prompt = polishSystemPrompt(type, type);
    const styleLines = prompt.split('\n').filter((line) => line.startsWith('- Style'));
    const help = CORE_THREAT[type].help;

    expect(storm.what).toBe(sharedStormLine);
    expect(storm.polarity).toBe('storm');
    expect(support.polarity).toBe('support');
    expect(card?.threatened).toBe(CORE_THREAT[type].threatened);
    expect(card?.coreNotices).toBe(CORE_THREAT[type].notices);
    expect(card?.maskWants).toBe(MASK_SYMPTOM[type].wants);
    expect(storm.move).toBe(typedStormMove(type, type));
    expect(support.move).toBe(typedSupportMove(type, type));
    expect(`${storm.move} ${support.move}`).not.toMatch(/prophecy|numerology|synastry|life arc/i);
    expect(containsMbtiLabel(`${card?.coreNotices} ${card?.maskWants} ${storm.move}`)).toBe(false);

    const note = CORE_STYLE_NOTE[type];
    if (note) {
      expect(styleLines).toEqual([`- ${note} Use it on meaning sentences.`]);
      expect(styleLines.join('\n')).not.toMatch(new RegExp(`\\b${type}\\b`));
      expect(prompt).toContain('Max 420 characters for chartWhy');
      expect(prompt.match(/chatCompletion|second pass|rewrite pass/i)).toBeNull();
    } else {
      expect(styleLines).toEqual([]);
      expect(storm.move).toBe(period(help));
      expect(support.move).toBe(`Take the opening: ${help.replace(/\.+$/, '').toLowerCase()}.`);
      expect(storm.move).not.toMatch(STYLE_LEAD);
      expect(support.move).not.toMatch(STYLE_LEAD);
      expect(card?.coreNotices).not.toMatch(STYLE_LEAD);
      expect(card?.maskWants).not.toMatch(STYLE_LEAD);
    }
  });

  it('shapes the four starter Cores and leaves the other twelve alone', () => {
    expect(stormSky('INTJ').move).toMatch(/^Priority:/);
    expect(stormSky('INTJ').move.toLowerCase()).toMatch(/experiment/);
    expect(stormSky('INFJ').move).toMatch(/^First:/);
    expect(stormSky('INFJ').move.toLowerCase()).toMatch(/feeling before the analysis/);
    expect(stormSky('INTP').move).toMatch(/^So far,/);
    expect(stormSky('INTP').move).toMatch(/leave the rest open/);
    expect(stormSky('INTP').move.toLowerCase()).toMatch(/survives debate/);
    expect(stormSky('INFP').move).toMatch(/^This can stay gentle:/);
    expect(stormSky('INFP').move.toLowerCase()).toMatch(/honest sentence/);
    expect(stormSky('INFP').move).toMatch(/unnamed/);

    expect(supportSky('INTJ').move).toMatch(/^Priority:/);
    expect(supportSky('INFJ').move).toMatch(/^First:/);
    expect(supportSky('INFJ').move.toLowerCase()).toMatch(/alignment/);
    expect(supportSky('INTP').move).toMatch(/^So far,/);
    expect(supportSky('INTP').move.toLowerCase()).toMatch(/time-boxed/);
    expect(supportSky('INFP').move).toMatch(/^This can stay gentle:/);
    expect(supportSky('INFP').move.toLowerCase()).toMatch(/outside/);

    const styledMoves = new Set(['INTJ', 'INFJ', 'INTP', 'INFP'].map((type) => stormSky(type as MbtiType).move));
    expect(styledMoves.size).toBe(4);

    const passedThrough = MBTI_TYPES.filter((type) => !(type in CORE_STYLE_NOTE));
    expect(passedThrough).toHaveLength(12);
    for (const type of passedThrough) {
      expect(stormSky(type).move).not.toMatch(STYLE_LEAD);
    }
  });

  it('does not borrow a starter style when the Mask is outside the starter set', () => {
    const storm = typedStormMove('INFP', 'ENTJ');
    expect(storm).toBe('One honest sentence, then silence.');
    expect(storm).not.toMatch(STYLE_LEAD);

    const card = composeDualLayerCard({ coreType: 'INFP', maskType: 'ENTJ', ...SKY });
    expect(card?.coreNotices).toMatch(/^This lands close:/);
    expect(card?.maskWants).toBe(MASK_SYMPTOM.ENTJ.wants);
    expect(card?.maskWants).not.toMatch(STYLE_LEAD);
    expect(card?.threatened).toBe(CORE_THREAT.INFP.threatened);

    const prompt = polishSystemPrompt('INFP', 'ENTJ');
    expect(prompt).toContain(CORE_STYLE_NOTE.INFP);
    expect(prompt).not.toContain('Style for the action sentence:');
  });
});
