jest.mock('server-only', () => ({}));

import { composeTodayHeadline, typedStormMove, typedSupportMove } from '@/lib/atmosphere/today-oracle/headline';
import { polishSystemPrompt } from '@/lib/atmosphere/today-oracle/personal-ai';
import type { RankedTheme, TransitFact } from '@/lib/atmosphere/today-oracle/types';
import type { LifeRiskPacket } from '@/lib/atmosphere/types';
import { composeDualLayerCard, containsMbtiLabel } from '@/lib/self/dual-layer-maps';

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
