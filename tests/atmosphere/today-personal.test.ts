import {
  buildConstraintMove,
  buildDrivenByLine,
  buildLeadFactLine,
  buildLivedCollision,
  buildOperationalTension,
  buildPersonalHook,
  buildDomainJob,
} from '@/lib/atmosphere/today-oracle/personal-copy';
import type { RankedTheme, TransitFact } from '@/lib/atmosphere/today-oracle/types';

function uranusVenus(): TransitFact {
  return {
    key: 'Uranus square Venus',
    transiting: 'uranus',
    aspect: 'square',
    natal: 'venus',
    display: 'Uranus square Venus',
    orbDeg: 0.3,
    band: 'hard',
    score: 96,
    domains: ['love'],
    source: 'transit-lookup',
  };
}

function suddenShiftTheme(domains: RankedTheme['domains'] = ['love', 'family']): RankedTheme {
  return {
    id: 'sudden-shift',
    label: 'Sudden shift',
    polarity: 'mixed',
    score: 90,
    facts: [uranusVenus()],
    domains,
  };
}

describe('personal today copy', () => {
  it('opens with the hit and translates it in the same breath', () => {
    const line = buildLeadFactLine(uranusVenus());
    expect(line).toMatch(/^Uranus is squaring your Venus today\./);
    expect(line.toLowerCase()).toMatch(/relationship and self-worth/);
    expect(line.toLowerCase()).toMatch(/not a mood swing/);
  });

  it('makes dual-layer a sequence with a timebox, not a slogan', () => {
    const line = buildOperationalTension('INFP', 'INTP', 'relationships', {
      deadline: '6pm',
      transitAxis: 'relationship and self-worth',
    });
    expect(line?.toLowerCase()).toMatch(/authenticit|feel|self-worth|logic/);
    expect(line).not.toMatch(/\b(INFP|INTP)\b/);
    expect(line).not.toMatch(/Instinct \(INFP\) says feel it first/);
  });

  it('builds a 6pm constraint with an exit ramp for relationship weather', () => {
    const move = buildConstraintMove(suddenShiftTheme(), [uranusVenus()], {
      date: '2026-09-01',
      held: false,
      moonSign: 'Taurus',
      moonPhase: 'Waning Gibbous',
    }, ['love', 'family']);
    expect(move.move).toMatch(/6pm/);
    expect(move.move.toLowerCase()).toMatch(/exit/);
    expect(move.watchFor).toMatch(/4–7pm/);
    expect(move.watchFor.toLowerCase()).toMatch(/waning taurus moon/);
    expect(move.doNot.toLowerCase()).toMatch(/rebuild/);
  });

  it('uses yesterday restlessness as a hook, not a new crisis', () => {
    const hook = buildPersonalHook(
      {
        date: '2026-09-01',
        held: true,
        yesterdayCheckin: { mood: 4, stress: 8, energy: 5, notes: 'restless all afternoon' },
      },
      '6pm',
      'Sudden shift',
    );
    expect(hook).toMatch(/restlessness yesterday/i);
    expect(hook).toMatch(/same condition|don't treat it as a new crisis/i);
  });

  it('names a Leo + INFP collision for sudden-shift weather', () => {
    const lived = buildLivedCollision(suddenShiftTheme(), {
      date: '2026-09-01',
      held: false,
      sunSign: 'Leo',
      mbtiType: 'INFP',
    });
    expect(lived).toMatch(/Leo Sun/);
    expect(lived).not.toMatch(/\bINFP\b/);
    expect(lived.toLowerCase()).toMatch(/space|leave/);
  });

  it('gives domains a job instead of listing every chip', () => {
    const line = buildDomainJob(['love', 'family'], ['career', 'money', 'health']);
    expect(line).toMatch(/Relationships/);
    expect(line).toMatch(/Home/);
    expect(line).toMatch(/Career/);
    expect(line.toLowerCase()).toMatch(/ignore today|caution budget/);
  });

  it('collapses two facts into one driven-by line', () => {
    const line = buildDrivenByLine(
      [
        uranusVenus(),
        {
          ...uranusVenus(),
          key: 'Jupiter square Moon',
          transiting: 'jupiter',
          natal: 'moon',
          display: 'Jupiter square Moon',
          aspect: 'square',
        },
      ],
      true,
    );
    expect(line).toMatch(/Uranus square Venus/);
    expect(line).toMatch(/Jupiter square Moon/);
    expect(line.toLowerCase()).toMatch(/still on/);
  });
});
