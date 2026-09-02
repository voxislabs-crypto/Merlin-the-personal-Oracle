/**
 * Personal Today copy — this chart, this type, this hour.
 * Templates are allowed to name the hit if they translate it in the same breath.
 */

import type { LifeRiskDomain, LifeRiskPacket } from '@/lib/atmosphere/types';
import { personalityFrame } from '@/lib/atmosphere/today-oracle/personality-lens';
import { composeDualLayerCard } from '@/lib/self/dual-layer-maps';
import type {
  RankedTheme,
  TodayThemeId,
  TransitFact,
} from '@/lib/atmosphere/today-oracle/types';

export interface CheckinSnapshot {
  mood: number | null;
  stress: number | null;
  energy: number | null;
  notes: string | null;
  createdAt?: string;
}

export interface PersonalCopyContext {
  date: string;
  held: boolean;
  mbtiType?: string | null;
  maskType?: string | null;
  sunSign?: string | null;
  moonSign?: string | null;
  moonPhase?: string | null;
  streak?: number | null;
  yesterdayCheckin?: CheckinSnapshot | null;
  intensity?: number | null;
  risk?: LifeRiskPacket | null;
}

const DOMAIN_PHRASE: Record<LifeRiskDomain, string> = {
  love: 'relationships',
  career: 'work',
  money: 'money',
  family: 'home',
  health: 'energy',
  self: 'pace',
};

const DOMAIN_LABEL: Record<LifeRiskDomain, string> = {
  love: 'Relationships',
  career: 'Career',
  money: 'Money',
  family: 'Home',
  health: 'Energy',
  self: 'Self',
};

const PLANET_AXIS: Record<string, string> = {
  sun: 'identity and dignity',
  moon: 'mood and home weather',
  mercury: 'words and decisions',
  venus: 'relationship and self-worth axis',
  mars: 'drive and conflict',
  jupiter: 'expansion pressure',
  saturn: 'duty and limits',
  uranus: 'sudden-split instinct',
  neptune: 'fog and story',
  pluto: 'power and control',
};

const PLANET_SHORT: Record<string, string> = {
  sun: 'identity',
  moon: 'mood',
  mercury: 'communication',
  venus: 'relationships',
  mars: 'conflict',
  jupiter: 'expansion',
  saturn: 'commitments',
  uranus: 'sudden shifts',
  neptune: 'clarity',
  pluto: 'power dynamics',
};

const ASPECT_VERB: Record<string, string> = {
  square: 'squaring',
  opposition: 'opposing',
  oppose: 'opposing',
  conjunction: 'conjunct',
  conjunct: 'conjunct',
  trine: 'trining',
  sextile: 'sextiling',
  quincunx: 'adjusting against',
  inconjunct: 'adjusting against',
};

const NOT_A: Record<string, string> = {
  venus: 'mood swing',
  moon: 'verdict on your character',
  mars: 'reason to pick a fight',
  mercury: 'personality rewrite',
  sun: 'life-identity crisis',
  saturn: 'proof you are failing',
  jupiter: 'green light to overcommit',
  uranus: 'excuse to detonate',
  neptune: 'sign to trust the cinematic story',
  pluto: 'mandate to purge',
};

function titlePlanet(name: string): string {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function joinTwo(items: string[]): string {
  const unique = Array.from(new Set(items.filter(Boolean)));
  if (unique.length === 0) return '';
  if (unique.length === 1) return unique[0];
  return `${unique[0]} and ${unique[1]}`;
}

export function domainPhrase(domain?: LifeRiskDomain | string | null): string {
  if (!domain) return 'pace';
  return DOMAIN_PHRASE[domain as LifeRiskDomain] || String(domain);
}

export function primaryDomains(theme: RankedTheme, risk?: LifeRiskPacket | null): LifeRiskDomain[] {
  const hot =
    risk?.domains
      ?.filter((d) => d.friction >= 48)
      .sort((a, b) => b.friction - a.friction)
      .map((d) => d.name) || [];
  const fromTheme = theme.domains || [];
  const merged: LifeRiskDomain[] = [];
  for (const d of [...hot, ...fromTheme]) {
    if (!merged.includes(d)) merged.push(d);
  }
  return merged.slice(0, 2);
}

export function quietDomains(risk?: LifeRiskPacket | null, hot: LifeRiskDomain[] = []): LifeRiskDomain[] {
  const all: LifeRiskDomain[] = ['love', 'career', 'money', 'health', 'family'];
  return all.filter((d) => {
    if (hot.includes(d)) return false;
    const score = risk?.domains?.find((row) => row.name === d);
    if (!score) return true;
    return score.friction < 42;
  });
}

function aspectVerb(aspect: string): string {
  return ASPECT_VERB[aspect.toLowerCase()] || aspect.toLowerCase();
}

/** "Uranus is squaring your Venus today. That's the relationship and self-worth axis, not a mood swing." */
export function buildLeadFactLine(fact: TransitFact | undefined): string {
  if (!fact) return '';
  const transiting = titlePlanet(fact.transiting);
  const natal = titlePlanet(fact.natal);
  const verb = aspectVerb(fact.aspect);
  const axis = PLANET_AXIS[fact.natal] || PLANET_AXIS[fact.transiting] || 'live pressure';
  const misread = NOT_A[fact.natal] || NOT_A[fact.transiting] || 'generic mood swing';
  if (verb === 'conjunct') {
    return `${transiting} is conjunct your ${natal} today. That's the ${axis}, not a ${misread}.`;
  }
  return `${transiting} is ${verb} your ${natal} today. That's the ${axis}, not a ${misread}.`;
}

export function planetShort(name: string): string {
  return PLANET_SHORT[name.toLowerCase()] || name.toLowerCase();
}

export function natalAxisPhrase(natal?: string | null): string {
  if (!natal) return '';
  return PLANET_AXIS[natal.toLowerCase()] || '';
}

/** One collapsed driver line. No second weather paragraph. */
export function buildDrivenByLine(
  facts: TransitFact[],
  held: boolean,
): string {
  const top = facts.slice(0, 2);
  if (!top.length) return held ? 'Same condition as yesterday — still on.' : '';

  const bits = top.map((fact) => {
    const domain = planetShort(fact.natal) || planetShort(fact.transiting);
    return `${fact.display} (${domain})`;
  });
  const lead = bits.length === 1 ? `Driven by ${bits[0]}.` : `Driven by ${bits[0]} and ${bits[1]}.`;
  return held ? `${lead.replace(/\.$/, '')} — same condition as yesterday, still on.` : lead;
}

const SUN_COLLISION: Partial<
  Record<TodayThemeId, Partial<Record<string, string>>>
> = {
  'sudden-shift': {
    aries: '"I need this over" colliding with "I don\'t want to look like I ran."',
    taurus: '"I need a different arrangement" colliding with "don\'t touch my stability."',
    gemini: '"I need to say it" colliding with "if I say it, I can\'t unsay it."',
    cancer: '"I need more space" colliding with "I don\'t want the nest to notice."',
    leo: '"I need more space" colliding with "I don\'t want to be the one who leaves."',
    virgo: '"This isn\'t working" colliding with "if I name it, I have to fix it."',
    libra: '"I need the truth" colliding with "I don\'t want to be the one who unbalances it."',
    scorpio: '"I need out of this intensity" colliding with "all or nothing is the only honest move."',
    sagittarius: '"I need air" colliding with "I already promised I\'d stay."',
    capricorn: '"I want a private change" colliding with "duty says keep the structure."',
    aquarius: '"I need distance" colliding with "the person still matters."',
    pisces: '"I need a boundary" colliding with "if I name it, I disappear."',
  },
  'relationship-value': {
    aries: '"Say the preference" colliding with "don\'t start a war."',
    taurus: '"Name the real want" colliding with "buying peace is easier."',
    gemini: '"Be honest" colliding with "keep it light so no one has to feel it."',
    cancer: '"Ask for care" colliding with "don\'t be the needy one."',
    leo: '"Be valued" colliding with "don\'t look like you asked."',
    virgo: '"Correct the thing" colliding with "don\'t make it a character issue."',
    libra: '"The real no" colliding with "keep the room pleasant."',
    scorpio: '"Tell the whole truth" colliding with "one sentence is safer."',
    sagittarius: '"Keep it honest" colliding with "don\'t trap anyone, including you."',
    capricorn: '"Be respectable" colliding with "say the unglamorous want."',
    aquarius: '"Stay independent" colliding with "the bond still has a vote."',
    pisces: '"Keep the dream" colliding with "name the actual terms."',
  },
  'emotional-heat': {
    leo: '"This slight is the whole story" colliding with "I will not be the dramatic one."',
    cancer: '"I am flooded" colliding with "if I show it, I lose the room."',
    scorpio: '"This is betrayal-sized" colliding with "it might just be a spike."',
  },
  'communication-friction': {
    gemini: '"Win the thread" colliding with "the point was smaller than this."',
    virgo: '"Correct the record" colliding with "the relationship is the record."',
    aquarius: '"Be right" colliding with "be understood."',
  },
  'identity-pressure': {
    leo: '"This feedback is a verdict" colliding with "I still have to show up."',
    capricorn: '"I am behind" colliding with "one duty is not a career funeral."',
    aries: '"Prove it now" colliding with "don\'t make it a scene."',
  },
  'expansion-opening': {
    sagittarius: '"Yes to the horizon" colliding with "keep none of it if you say yes to all of it."',
    leo: '"Take the stage" colliding with "don\'t overpromise the encore."',
    gemini: '"Say yes to the idea" colliding with "calendar it before it evaporates."',
  },
  'fog-clarity': {
    pisces: '"The story feels true" colliding with "the facts are softer than they look."',
    cancer: '"This feeling is the answer" colliding with "sleep on the vow."',
    leo: '"The cinematic version" colliding with "don\'t sign it tonight."',
  },
};

function sunKey(sunSign?: string | null): string | null {
  const s = (sunSign || '').trim().toLowerCase();
  if (!s) return null;
  const first = s.split(/\s+/)[0];
  return first || null;
}

function articleFor(word: string): 'a' | 'an' {
  return /^[AEIOU]/i.test(word) ? 'an' : 'a';
}

/** Lived collision from the chart. No type labels — dual-layer maps handle that job. */
export function buildLivedCollision(
  theme: RankedTheme,
  ctx: PersonalCopyContext,
): string {
  const sun = sunKey(ctx.sunSign);
  const core = (ctx.mbtiType || '').trim().toUpperCase();
  const hasType = /^[IE][NS][TF][JP]$/.test(core);
  const table = SUN_COLLISION[theme.id];
  const collision = sun && table ? table[sun] : undefined;

  if (collision && sun) {
    const sunLabel = titlePlanet(sun);
    return `For ${articleFor(sunLabel)} ${sunLabel} Sun, that usually shows up as ${collision}`;
  }
  if (hasType) {
    const frame = personalityFrame(core);
    if (frame === 'intuition') {
      return 'The body-level no arrives before the story you can defend.';
    }
    if (frame === 'structure') {
      return 'The urge is to name a criterion and close the loop before the weather has finished speaking.';
    }
    if (frame === 'action') {
      return 'The first move will want to be physical — a send, a walk, a start — before the meaning is clear.';
    }
    return 'The mix wants to be spoken so no one has to guess — including you.';
  }
  return '';
}

/**
 * Dual layer as a procedure, not a slogan.
 * Weather card: soothe Core, coach Mask, never print type labels.
 */
export function buildOperationalTension(
  coreType?: string | null,
  maskType?: string | null,
  domain = 'the situation',
  options?: { deadline?: string | null; transitAxis?: string | null },
): string | null {
  const dual = composeDualLayerCard({
    coreType,
    maskType,
    deadline: options?.deadline || '6pm',
    transitAxis: options?.transitAxis || domain,
    domain,
  });
  if (!dual || dual.source === 'core-only') return null;
  return dual.why;
}

export interface ConstraintMove {
  move: string;
  deadline: string;
  watchFor: string;
  doNot: string;
  watchWindow: string;
}

const DOMAIN_VARIABLES: Record<LifeRiskDomain | 'default', string> = {
  love: 'the time you answer, the room you sit in, or the sentence you refuse to say',
  family: 'the chore you take, the ask you make, or the conversation you postpone',
  career: 'the meeting you skip, the draft you send, or the thread you don\'t open',
  money: 'the cart you freeze, the number you recheck, or the yes you delay',
  health: 'the extra task you drop, the meal you actually eat, or the earlier night',
  self: 'the hour you protect, the decision you delay, or the identity rewrite you refuse',
  default: 'the time, the room, or the sentence you refuse to say',
};

const DOMAIN_EXIT: Record<LifeRiskDomain | 'default', string> = {
  love: 'a walk around the block',
  family: 'leaving the room for ten minutes',
  career: 'parking the reply until morning',
  money: 'closing the tab',
  health: 'stopping at food and water',
  self: 'a quiet hour with no audience',
  default: 'stopping and writing one sentence',
};

const THEME_REWRITE: Record<TodayThemeId, string> = {
  'emotional-restraint': 'the whole self-trial',
  'emotional-heat': 'the whole feeling as a verdict',
  'communication-friction': 'the whole thread',
  'communication-opening': 'the five-year talk',
  'identity-pressure': 'who you are',
  'relationship-value': 'the relationship',
  'action-block': 'the breakthrough',
  'action-surge': 'five new fronts',
  'structure-duty': 'your entire standard',
  'expansion-opening': 'the whole horizon',
  'sudden-shift': 'the whole arrangement',
  'fog-clarity': 'the cinematic story',
  'power-dynamics': 'a full purge',
  'home-mood': 'the household weather',
};

const THEME_DO_NOT: Record<TodayThemeId, string> = {
  'emotional-restraint': 'Treat a heavy mood as a verdict on you or someone else.',
  'emotional-heat': 'Send the first draft of a feeling as if it were the final word.',
  'communication-friction': 'Win the thread instead of making the point.',
  'communication-opening': 'Leave the useful sentence unsaid because the day feels fine.',
  'identity-pressure': 'Make an identity-level decision from a bruised ego.',
  'relationship-value': 'Buy peace — with money, a yes, or a blurry promise.',
  'action-block': 'Force a breakthrough when the real win is one brick.',
  'action-surge': 'Open five fronts because the energy is there.',
  'structure-duty': 'Argue with the clock instead of meeting the real constraint.',
  'expansion-opening': 'Say yes to the whole horizon and keep none of it.',
  'sudden-shift': 'Rebuild the whole arrangement because one square is exact.',
  'fog-clarity': 'Sign, promise, or spend while the story still feels cinematic.',
  'power-dynamics': 'Run a purge when one honest sentence would do.',
  'home-mood': 'Let the day\'s weather become the household\'s weather.',
};

function deadlineFor(domains: LifeRiskDomain[], themeId: TodayThemeId): string {
  if (themeId === 'communication-friction' || themeId === 'communication-opening') return 'noon';
  if (domains[0] === 'career' || domains[0] === 'money') return '3pm';
  return '6pm';
}

function watchWindowFor(domains: LifeRiskDomain[], themeId: TodayThemeId, band: TransitFact['band']): string {
  if (themeId.startsWith('communication')) return '10am–1pm';
  if (domains[0] === 'career') return '2–5pm';
  if (band === 'hard' || themeId === 'sudden-shift' || themeId === 'emotional-heat') return '4–7pm';
  return 'late afternoon';
}

function moonBit(ctx: PersonalCopyContext): string {
  const sign = (ctx.moonSign || '').trim();
  const phase = (ctx.moonPhase || '').trim();
  const waning = /waning|last quarter|third quarter/i.test(phase);
  const waxing = /waxing|first quarter/i.test(phase);
  const phaseWord = waning ? 'waning' : waxing ? 'waxing' : '';
  if (sign && phaseWord) return `${phaseWord} ${sign} Moon`;
  if (sign) return `${sign} Moon`;
  if (phaseWord) return `${phaseWord} Moon`;
  return '';
}

export function buildConstraintMove(
  theme: RankedTheme,
  facts: TransitFact[],
  ctx: PersonalCopyContext,
  domains: LifeRiskDomain[],
): ConstraintMove {
  const primary = domains[0] || 'self';
  const domainWord = domainPhrase(primary);
  const deadline = deadlineFor(domains, theme.id);
  const window = watchWindowFor(domains, theme.id, facts[0]?.band || 'hard');
  const variables = DOMAIN_VARIABLES[primary] || DOMAIN_VARIABLES.default;
  const exit = DOMAIN_EXIT[primary] || DOMAIN_EXIT.default;
  const rewrite = THEME_REWRITE[theme.id];
  const moon = moonBit(ctx);
  const hard = facts[0]?.band === 'hard' || facts[0]?.aspect === 'square' || facts[0]?.aspect === 'opposition';

  const move =
    theme.id === 'sudden-shift' || theme.id === 'relationship-value'
      ? `Run one small test by ${deadline}: ${variables}. If it spikes, stop at ${exit}.`
      : theme.polarity === 'opening'
        ? `Use the open lane in ${domainWord} by ${deadline}: one reversible step only. If it expands past one yes, stop at ${exit}.`
        : `Don't rebuild ${rewrite}. Run one ${domainWord} test by ${deadline}: ${variables}. If it spikes, stop at ${exit}.`;

  const trigger =
    theme.id === 'sudden-shift'
      ? 'restlessness into a speech you can\'t take back'
      : theme.id === 'emotional-heat'
        ? 'a spike into a message you can\'t unsend'
        : theme.id === 'communication-friction'
          ? 'a clarifying question into a pile-on'
          : theme.id === 'fog-clarity'
            ? 'a true-feeling story into a signature'
            : theme.id === 'expansion-opening'
              ? 'one opening into three commitments'
              : 'a small friction into an irreversible move';

  const skyBit = moon
    ? hard
      ? `the ${facts[0]?.aspect || 'aspect'} plus a ${moon}`
      : `a ${moon}`
    : hard
      ? `the ${facts[0]?.display || 'hard aspect'}`
      : 'this weather';

  const watchFor = `Watch for the ${window} window. That's when ${skyBit} tends to turn ${trigger}.`;

  return {
    move,
    deadline,
    watchFor,
    doNot: THEME_DO_NOT[theme.id],
    watchWindow: window,
  };
}

export function buildChartWhy(options: {
  leadFact: string;
  lived: string;
  operational: string | null;
  facts: TransitFact[];
}): string {
  const { lived, operational, facts } = options;
  const lead = facts[0];
  const transitingAxis = lead ? PLANET_AXIS[lead.transiting] : '';
  const natalAxis = lead ? PLANET_AXIS[lead.natal] : '';
  const mechanic =
    lead && transitingAxis && natalAxis && transitingAxis !== natalAxis
      ? `${titlePlanet(lead.natal)} is the ${natalAxis.replace(/ axis$/, ' planet')}. ${titlePlanet(lead.transiting)} is the ${transitingAxis.replace(/ axis$/, ' planet')}.`
      : '';

  const parts = [lived, mechanic, operational].filter(
    (part): part is string => Boolean(part),
  );
  // Dedup accidental repeats
  const out: string[] = [];
  for (const part of parts) {
    const key = part.slice(0, 40).toLowerCase();
    if (out.some((existing) => existing.toLowerCase().startsWith(key))) continue;
    out.push(part);
  }
  const assembled = out.join(' ').replace(/\s+/g, ' ').trim();
  return assembled || options.leadFact;
}

export function buildPersonalHook(
  ctx: PersonalCopyContext,
  deadline: string,
  themeLabel: string,
): string | null {
  const notes = (ctx.yesterdayCheckin?.notes || '').trim();
  const auto = /auto check-in/i.test(notes);
  const restlessNotes = !auto && /restless|itch|urge|snap|explod|detonat|wired|anxious|irritab/i.test(notes);
  const mood = ctx.yesterdayCheckin?.mood;
  const stress = ctx.yesterdayCheckin?.stress;
  const flaggedRestless =
    restlessNotes ||
    (typeof stress === 'number' && stress >= 7) ||
    (typeof mood === 'number' && mood <= 4 && typeof stress === 'number' && stress >= 6);

  if (flaggedRestless && ctx.held) {
    return `You flagged restlessness yesterday. Today's weather is the same condition, one day later. Don't treat it as a new crisis.`;
  }
  if (flaggedRestless) {
    return `You flagged restlessness yesterday. Today's ${themeLabel.toLowerCase()} is the same family of weather — don't escalate just because the calendar flipped.`;
  }
  if (ctx.held) {
    return `Same condition as yesterday — still on. Don't escalate. Keep today's test small.`;
  }
  if ((ctx.streak ?? 0) <= 1) {
    return `First return. Tomorrow's read gets sharper if you mark whether the ${deadline} constraint held.`;
  }
  if ((ctx.streak ?? 0) >= 2) {
    return `Day ${ctx.streak} back. The constraint is the experiment — not a new personality.`;
  }
  return null;
}

export function buildConfidenceWhy(options: {
  chartConfidence: number;
  readConfidence: number;
  domains: LifeRiskDomain[];
  held: boolean;
}): string {
  const domainBit = joinTwo(options.domains.map((d) => domainPhrase(d))) || 'today\'s friction';
  const held = options.held
    ? ' The "still applies" flag means yesterday\'s condition didn\'t break overnight — don\'t escalate.'
    : '';
  return `${options.readConfidence}% that the ${domainBit} friction is the real weather. ${options.chartConfidence}% that the move above is the right size.${held}`;
}

export function buildDomainJob(
  hot: LifeRiskDomain[],
  quiet: LifeRiskDomain[],
): string {
  if (!hot.length) {
    return 'No single domain is loud enough to spend the whole caution budget. Keep the move small.';
  }
  const hotBit = joinTwo(hot.map((d) => DOMAIN_LABEL[d] || d));
  const verb = hot.length === 1 ? 'is the pressure point' : 'are the pressure points';
  if (!quiet.length) {
    return `${hotBit} ${verb}. Keep the caution budget there.`;
  }
  const quietBit = joinTwo(quiet.slice(0, 3).map((d) => DOMAIN_LABEL[d] || d));
  const quietVerb = quiet.slice(0, 3).length === 1 ? 'is' : 'are';
  return `${hotBit} ${verb}. ${quietBit} ${quietVerb} stable enough to ignore today. Don't spend the caution budget there.`;
}


