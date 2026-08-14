/**
 * Layer 2 — Meaning engine.
 * Merge facts into life themes. Still no narrative.
 */

import type { LifeRiskDomain } from '@/lib/atmosphere/types';
import type {
  RankedTheme,
  TodayThemeId,
  TodayThemePolarity,
  TransitFact,
} from '@/lib/atmosphere/today-oracle/types';

export interface ThemeSpec {
  id: TodayThemeId;
  label: string;
  polarity: TodayThemePolarity;
  /** Weather, not events — what this condition usually feels like */
  usuallyBrings: string;
  watch: string;
  moves: [string, string, string];
  /** Same weather, different life room */
  domainMoves?: Partial<Record<LifeRiskDomain, [string, string, string]>>;
}

export const THEME_CATALOG: Record<TodayThemeId, ThemeSpec> = {
  'emotional-restraint': {
    id: 'emotional-restraint',
    label: 'Emotional restraint',
    polarity: 'friction',
    usuallyBrings: 'Mood runs heavy. Duties feel louder than they are. Isolation is the cheap exit.',
    watch: 'Treating a heavy mood as a verdict on you or someone else.',
    moves: [
      'Name the weight in one sentence, then do one small duty — not the whole pile.',
      'Ask for the concrete need. Skip the self-trial.',
      'Protect a quiet hour before you take on anyone else’s standard.',
    ],
    domainMoves: {
      career: [
        'Do the one owed work item. Do not audit your whole career from a low mood.',
        'Send the status, not the self-critique.',
        'Shorten the workday if you can. Precision beats volume.',
      ],
      love: [
        'Ask for the concrete need. Skip the “maybe I am the problem” spiral.',
        'Keep the talk under ten minutes. No character trial.',
        'Sit next to the feeling with them — do not solve them.',
      ],
    },
  },
  'emotional-heat': {
    id: 'emotional-heat',
    label: 'Emotional heat',
    polarity: 'friction',
    usuallyBrings: 'Feelings spike fast. Small slights feel like the whole story.',
    watch: 'Sending the first draft of a feeling as if it were the final word.',
    moves: [
      'Write the raw version first. Send only the one-sentence version.',
      'Step out of the spike: one fact, one feeling, then stop.',
      'Walk or wait twenty minutes before the hard reply.',
    ],
    domainMoves: {
      career: [
        'Park the heated reply. Send the fact-only version after a walk.',
        'Take the fight to the task, not the person in the thread.',
        'One clarifying question. No stack of grievances.',
      ],
      love: [
        'Name one feeling. Do not audit the whole relationship.',
        'Walk first if it is hot. Come back with one sentence.',
        'Keep tonight’s talk to this issue — not the archive.',
      ],
    },
  },
  'communication-friction': {
    id: 'communication-friction',
    label: 'Communication friction',
    polarity: 'friction',
    usuallyBrings: 'Words come out sharper than you mean. Threads escalate.',
    watch: 'Winning the thread instead of making the point.',
    moves: [
      'Draft first. Send the shorter version after a pause.',
      'Ask one clarifying question instead of stacking three issues.',
      'Move the tense talk to a note or a walk — not a live pile-on.',
    ],
    domainMoves: {
      career: [
        'Send the update in three bullets. Leave the argument.',
        'Ask one clarifying question on the work, not the person.',
        'If the thread is hot, switch to a voice note or a walk.',
      ],
      love: [
        'Say the one clear thing. Do not stack three issues into one talk.',
        'Repeat back what you heard before you argue.',
        'Move it off text if it is getting clever instead of kind.',
      ],
    },
  },
  'communication-opening': {
    id: 'communication-opening',
    label: 'Communication opening',
    polarity: 'opening',
    usuallyBrings: 'The useful sentence lands more easily than usual — if you say it.',
    watch: 'Leaving the useful sentence unsaid because the day feels “fine.”',
    moves: [
      'Send the update you have been sitting on.',
      'Say the useful thing out loud. Keep it specific.',
      'Name the plan in three bullets and share it.',
    ],
    domainMoves: {
      career: [
        'Send the work update or ask you have been sitting on.',
        'Pitch the idea in one paragraph while the lane is open.',
        'Name the plan in three bullets and share it.',
      ],
      love: [
        'Say the preference out loud. Leave the five-year talk.',
        'Send the kind, specific note you have been meaning to send.',
        'Make one simple plan together. Do not overbuild it.',
      ],
    },
  },
  'identity-pressure': {
    id: 'identity-pressure',
    label: 'Identity pressure',
    polarity: 'friction',
    usuallyBrings: 'The day pokes at dignity. Small feedback can feel like a verdict.',
    watch: 'Making an identity-level decision from a bruised ego.',
    moves: [
      'Do one thing that is yours, then stop performing.',
      'Delay any call that feels like a verdict on who you are.',
      'Lead with one clear preference instead of a speech.',
    ],
  },
  'relationship-value': {
    id: 'relationship-value',
    label: 'Values and bonds',
    polarity: 'mixed',
    usuallyBrings: 'Taste, money, and affection blur. Easy to buy peace.',
    watch: 'Buying peace — with money, a yes, or a blurry promise.',
    moves: [
      'Say the real preference. Skip the people-pleasing yes.',
      'Keep money and affection decisions small and reversible.',
      'Offer one specific kindness, not a grand gesture.',
    ],
  },
  'action-block': {
    id: 'action-block',
    label: 'Blocked drive',
    polarity: 'friction',
    usuallyBrings: 'Effort meets a wall. Force makes it worse. Small bricks still count.',
    watch: 'Forcing a breakthrough when the real win is one brick.',
    moves: [
      'Pick the smallest next brick and lay it. Skip the heroics.',
      'Work a short focused block, then stop. Endurance beats force.',
      'Rename the blocker in one sentence so you can plan around it.',
    ],
    domainMoves: {
      career: [
        'One work brick only. Do not force the career breakthrough today.',
        'Rename the blocker in one sentence, then work around it for an hour.',
        'Protect focus. Defer the non-critical meeting.',
      ],
      love: [
        'Do not pick the relationship fight you cannot finish cleanly.',
        'Ask for one practical change. Leave the character debate.',
        'Lower the load at home. One calm ask beats a confrontation.',
      ],
    },
  },
  'action-surge': {
    id: 'action-surge',
    label: 'Drive is up',
    polarity: 'opening',
    usuallyBrings: 'Fuel is in the tank. Easy to start five things and finish none.',
    watch: 'Opening five fronts because the energy is there.',
    moves: [
      'Start the thing you have been circling. Twenty focused minutes.',
      'Use the drive to finish, not to open a second war.',
      'Make the bold move that is still reversible by Friday.',
    ],
  },
  'structure-duty': {
    id: 'structure-duty',
    label: 'Duty and structure',
    polarity: 'friction',
    usuallyBrings: 'Limits get honest. The unglamorous piece is the real work.',
    watch: 'Arguing with the clock instead of meeting the real constraint.',
    moves: [
      'Do the overdue duty in a short block. Skip the self-trial.',
      'A clear no is kinder than a late yes.',
      'Put the next deadline on paper and meet a slice of it today.',
    ],
  },
  'expansion-opening': {
    id: 'expansion-opening',
    label: 'Expansion opening',
    polarity: 'opening',
    usuallyBrings: 'A real opening — and a temptation to overcommit.',
    watch: 'Saying yes to the whole horizon and keeping none of it.',
    moves: [
      'Say yes to one real opening — a message, a pitch, a hello.',
      'Write the upside and the cost before you leap.',
      'Share the idea. Delay the overcommit.',
    ],
  },
  'sudden-shift': {
    id: 'sudden-shift',
    label: 'Sudden shift',
    polarity: 'mixed',
    usuallyBrings: 'Restlessness, a true preference, and the urge to detonate.',
    watch: 'Torching a bridge because restlessness showed up before dinner.',
    moves: [
      'Change one variable, not the whole life. Keep an exit ramp.',
      'Try the new version as a 48-hour experiment.',
      'Name the restlessness. Do not quit in the spike.',
    ],
  },
  'fog-clarity': {
    id: 'fog-clarity',
    label: 'Clarity is thin',
    polarity: 'friction',
    usuallyBrings: 'The story feels true and cinematic. Facts are softer than they look.',
    watch: 'Signing, promising, or spending while the story still feels cinematic.',
    moves: [
      'Verify one fact before you trust the story.',
      'Sleep on the vow, the spend, or the spiritual high.',
      'Keep the dream. Date-stamp the decision.',
    ],
  },
  'power-dynamics': {
    id: 'power-dynamics',
    label: 'Power dynamics',
    polarity: 'friction',
    usuallyBrings: 'Control struggles. Something old wants to compost.',
    watch: 'Running a purge when one honest sentence would do.',
    moves: [
      'Name the control struggle. Drop the extra leverage play.',
      'Tell the one true sentence. Do not run a full purge.',
      'If it is a power fight, pause until you can be specific.',
    ],
  },
  'home-mood': {
    id: 'home-mood',
    label: 'Home and mood',
    polarity: 'mixed',
    usuallyBrings: 'The day’s weather wants to become the household’s weather.',
    watch: 'Letting the day’s weather become the household’s weather.',
    moves: [
      'Check the body first — food, pause, then people.',
      'Tend one home-base need, then rejoin the day.',
      'Give the feeling a job: write it down, then pick one next step.',
    ],
  },
};

function involves(fact: TransitFact, planet: string): boolean {
  return fact.transiting === planet || fact.natal === planet;
}

function pair(fact: TransitFact, a: string, b: string): boolean {
  return (
    (fact.transiting === a && fact.natal === b) ||
    (fact.transiting === b && fact.natal === a)
  );
}

/** Specific pairs first. One primary theme per fact. */
export function themeIdForFact(fact: TransitFact): TodayThemeId {
  if (pair(fact, 'moon', 'saturn')) return 'emotional-restraint';
  if (pair(fact, 'moon', 'pluto') || pair(fact, 'moon', 'mars')) return 'emotional-heat';
  if (pair(fact, 'mars', 'saturn')) return 'action-block';
  if (pair(fact, 'sun', 'saturn')) return 'identity-pressure';

  if (involves(fact, 'neptune')) return 'fog-clarity';
  if (involves(fact, 'pluto')) return 'power-dynamics';
  if (involves(fact, 'uranus')) return 'sudden-shift';

  if (involves(fact, 'mercury')) {
    return fact.band === 'soft' ? 'communication-opening' : 'communication-friction';
  }
  if (involves(fact, 'venus')) return 'relationship-value';
  if (involves(fact, 'jupiter')) return 'expansion-opening';
  if (involves(fact, 'saturn')) return 'structure-duty';
  if (involves(fact, 'mars')) {
    return fact.band === 'soft' ? 'action-surge' : 'action-block';
  }
  if (involves(fact, 'sun')) return 'identity-pressure';
  if (involves(fact, 'moon')) return fact.band === 'hard' ? 'emotional-heat' : 'home-mood';
  return 'home-mood';
}

function factWeight(fact: TransitFact): number {
  const orb = fact.orbDeg;
  const tightness = orb === null ? 0.62 : Math.max(0.28, 1 - Math.min(orb, 8) / 8);
  const personal =
    ['moon', 'mercury', 'sun', 'venus', 'mars'].includes(fact.transiting) ? 1.18 : 1;
  const hard = fact.band === 'hard' ? 1.08 : fact.band === 'soft' ? 0.92 : 1;
  return fact.score * tightness * personal * hard;
}

export function mergeFactsIntoThemes(facts: TransitFact[]): RankedTheme[] {
  const buckets = new Map<TodayThemeId, TransitFact[]>();
  for (const fact of facts) {
    const id = themeIdForFact(fact);
    const list = buckets.get(id) || [];
    list.push(fact);
    buckets.set(id, list);
  }

  const ranked: RankedTheme[] = [];
  const bucketEntries = Array.from(buckets.entries());
  for (let i = 0; i < bucketEntries.length; i += 1) {
    const id = bucketEntries[i][0];
    const themeFacts = bucketEntries[i][1];
    const spec = THEME_CATALOG[id];
    const score = themeFacts.reduce((sum, fact) => sum + factWeight(fact), 0);
    const domains: LifeRiskDomain[] = [];
    for (const fact of themeFacts) {
      for (const domain of fact.domains) {
        if (!domains.includes(domain)) domains.push(domain);
      }
    }
    ranked.push({
      id,
      label: spec.label,
      polarity: spec.polarity,
      score,
      facts: [...themeFacts].sort((a, b) => factWeight(b) - factWeight(a)),
      domains,
    });
  }

  return ranked.sort((a, b) => b.score - a.score);
}

/** Themes within this fraction of the winner count as mixed weather. */
export const CLOSE_THEME_RATIO = 0.78;

export function selectCloseThemes(
  themes: RankedTheme[],
  ratio = CLOSE_THEME_RATIO,
  max = 3,
): RankedTheme[] {
  if (!themes.length) return [];
  const top = themes[0].score || 1;
  return themes.filter((theme) => theme.score >= top * ratio).slice(0, max);
}
