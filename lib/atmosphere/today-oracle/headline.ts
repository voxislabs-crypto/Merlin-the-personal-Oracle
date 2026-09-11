/**
 * Today's Move headline — sky first, then a typed inch.
 * Maps only. No LLM. Dual-layer body copy stays in composeDualLayerCard.
 */

import type { LifeRiskDomain, LifeRiskPacket } from '@/lib/atmosphere/types';
import { domainPhrase, tightDomainsFromRisk } from '@/lib/atmosphere/today-oracle/personal-copy';
import type { RankedTheme, TransitFact } from '@/lib/atmosphere/today-oracle/types';
import { CORE_THREAT, MASK_SYMPTOM, parseMbtiType } from '@/lib/self/dual-layer-maps';

export type HeadlinePolarity = 'storm' | 'support' | 'carryover';

export interface TodayMoveSlots {
  polarity: HeadlinePolarity;
  /** Slot 1 */
  what: string;
  /** Slot 2 */
  whyMe: string;
  /** Slot 3 */
  ride: string;
  /** Slot 4 — conclusion. Also aliased as headline for older callers. */
  move: string;
  headline: string;
  avoid: string;
}

export function isHomeworkHeadline(text: string | null | undefined): boolean {
  const t = (text || '').trim();
  if (!t) return false;
  return (
    /write the one-sentence test/i.test(t) ||
    /one value that will not move/i.test(t) ||
    /by 6pm, write/i.test(t) ||
    /run one small test by/i.test(t) ||
    /run one \w+ test by/i.test(t) ||
    /change one (visible )?variable/i.test(t) ||
    /keep an exit ramp/i.test(t) ||
    /not the whole life/i.test(t)
  );
}

/** Carryover is yesterday's sky still applying — never today's own snapshot. */
export function isPriorDayMemory(today?: string | null, memoryDate?: string | null): boolean {
  if (!today || !memoryDate) return false;
  return memoryDate !== today;
}

export function resolveHeadlinePolarity(input: {
  held?: boolean;
  sameSky?: boolean;
  today?: string | null;
  memoryDate?: string | null;
  theme: RankedTheme;
  lead?: TransitFact | null;
  risk?: LifeRiskPacket | null;
}): HeadlinePolarity {
  const fromYesterday = isPriorDayMemory(input.today, input.memoryDate);
  if (fromYesterday && (input.held || input.sameSky)) return 'carryover';
  if (isSupportWeather(input.theme, input.lead, input.risk)) return 'support';
  return 'storm';
}

/** Ease on the loudest domain beats a leftover storm chore. */
export function isSupportWeather(
  theme: RankedTheme,
  lead?: TransitFact | null,
  risk?: LifeRiskPacket | null,
): boolean {
  const domains = risk?.domains || [];
  if (domains.length) {
    const loudest = [...domains].sort(
      (a, b) => Math.max(b.friction, b.support) - Math.max(a.friction, a.support),
    )[0];
    if (loudest && loudest.support > loudest.friction) return true;
  }
  if (lead?.band === 'soft') return true;
  if (theme.polarity === 'opening' && lead?.band !== 'hard') return true;
  return false;
}

export function plainSkyPhrase(lead?: TransitFact | null, themeLabel?: string | null): string {
  if (!lead) {
    const label = (themeLabel || 'the weather').replace(/\s+/g, ' ').trim().toLowerCase();
    return label || 'the weather';
  }
  const t = lead.transiting;
  const n = lead.natal;
  const hard = lead.band === 'hard' || lead.aspect === 'square' || lead.aspect === 'opposition';
  const pair = (a: string, b: string) =>
    (t === a && n === b) || (t === b && n === a);

  if (pair('mercury', 'neptune')) return hard ? 'thin clarity' : 'softer words';
  if (pair('uranus', 'venus')) return hard ? 'a jolt in the bond' : 'a new option in the bond';
  if (pair('moon', 'saturn')) return hard ? 'heavy mood' : 'steadier mood';
  if (pair('mars', 'saturn')) return hard ? 'blocked drive' : 'usable heat';
  if (pair('sun', 'saturn')) return hard ? 'identity pressure' : 'a sturdier self';
  if (t === 'mercury' || n === 'mercury') return hard ? 'talk running hot' : 'a cleaner conversation';
  if (t === 'venus' || n === 'venus') return hard ? 'friction in the bond' : 'easier warmth';
  if (t === 'jupiter' || n === 'jupiter') return hard ? 'a too-big yes' : 'a usable opening';
  if (t === 'neptune' || n === 'neptune') return hard ? 'thin clarity' : 'softer edges';
  if (t === 'uranus' || n === 'uranus') return hard ? 'a sudden jolt' : 'a new option';

  const label = (themeLabel || '').trim().toLowerCase();
  return label || (hard ? 'hard weather' : 'an opening');
}

function period(text: string): string {
  const t = (text || '').replace(/\s+/g, ' ').trim().replace(/\.+$/, '');
  if (!t) return '';
  return `${t}.`;
}

export function typedStormMove(core?: string | null, mask?: string | null): string {
  const c = parseMbtiType(core);
  if (c === 'INFP') return 'One honest sentence, then silence.';
  if (c === 'INFJ') return 'State the feeling before the analysis.';
  if (c === 'INTP') return 'One clause that survives debate. Stop there.';
  if (c) return period(CORE_THREAT[c].help);
  if (parseMbtiType(mask) === 'INTP') return 'One clause, not a briefing.';
  return 'One reversible step. Stop there.';
}

export function typedSupportMove(core?: string | null, mask?: string | null): string {
  const c = parseMbtiType(core);
  const m = parseMbtiType(mask);
  if (c === 'INFP') return 'Go outside — cheap joy, or one small yes.';
  if (c === 'INFJ') return 'One quiet alignment move, then stop.';
  if (c === 'INTP' || m === 'INTP') return 'One time-boxed experiment. Don\'t research the walk.';
  if (c) return `Take the opening: ${CORE_THREAT[c].help.replace(/\.+$/, '').toLowerCase()}.`;
  return 'Take the green hour. One yes, then stop.';
}

export function typedAvoid(core?: string | null, mask?: string | null, polarity: HeadlinePolarity = 'storm'): string {
  const c = parseMbtiType(core);
  const m = parseMbtiType(mask);
  if (polarity === 'support') {
    if (c === 'INFP') return "Don't save the green hour.";
    if (c === 'INFJ') return "Don't turn ease into a mission.";
    if (c === 'INTP' || m === 'INTP') return "Don't research the walk.";
    return "Don't spend the opening on a second project.";
  }
  if (c === 'INFP') return "Don't rewrite it into a brief.";
  if (c === 'INFJ') return "Don't explain the feeling as a theory.";
  if (m === 'INTP' || c === 'INTP') return 'One clause, not a white paper.';
  if (c) return period(`Don't spend the day ${CORE_THREAT[c].hijack}`);
  return "Don't add a second task.";
}

export function nextInchFromHeldMove(
  heldMove?: string | null,
  core?: string | null,
): string {
  const t = (heldMove || '').toLowerCase();
  const c = parseMbtiType(core);
  if (/send the sentence/.test(t)) return 'Take the walk.';
  if (/take the walk|go outside/.test(t)) return 'Keep the small yes. Stop there.';
  if (/write|one-sentence|one honest sentence|value that will not move/.test(t)) {
    return 'Send the sentence.';
  }
  if (/make the one ask/.test(t)) return 'Stop after the ask.';
  if (/alignment|pattern|feeling before/.test(t)) return 'Make the one ask.';
  if (c === 'INFJ') return 'Make the one ask.';
  if (c === 'INFP') return 'Send the sentence.';
  return 'Do the next inch. Stop there.';
}

function joinAnd(items: string[]): string {
  const unique = Array.from(new Set(items.filter(Boolean)));
  if (unique.length === 0) return '';
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(', ')}, and ${unique[unique.length - 1]}`;
}

function winningDomains(
  polarity: HeadlinePolarity,
  risk: LifeRiskPacket | null | undefined,
  fallback: LifeRiskDomain[],
): LifeRiskDomain[] {
  const rows = risk?.domains || [];
  if (polarity === 'support') {
    const open = [...rows]
      .filter((row) => row.support > row.friction)
      .sort((a, b) => b.support - a.support)
      .map((row) => row.name);
    if (open.length) return open.slice(0, 3);
  }
  const tight = tightDomainsFromRisk(risk);
  if (tight.length) return tight;
  return fallback.slice(0, 2);
}

function weatherWhatLine(themeId: string, sky: string, polarity: HeadlinePolarity, domain: string, crowded: boolean): string {
  if (polarity === 'support') {
    return crowded
      ? 'There is a real opening. Keep it small enough to use.'
      : `There is a real opening around ${domain}.`;
  }
  if (themeId === 'fog-clarity' || /thin clarity|clarity is thin/.test(sky)) {
    return 'Clarity is thinner than usual right now. Stories will feel truer than the facts.';
  }
  if (themeId === 'communication-friction' || /talk running hot/.test(sky)) {
    return crowded
      ? 'Words are landing harder than they need to.'
      : `Words are landing harder than they need to around ${domain}.`;
  }
  if (themeId === 'sudden-shift' || /jolt/.test(sky)) {
    return crowded
      ? 'A sudden urge to split or start over is in the air. That is weather, not a verdict.'
      : `A sudden urge to split or start over is pressing on ${domain}.`;
  }
  if (themeId === 'emotional-restraint' || /heavy mood/.test(sky)) {
    return crowded
      ? 'Mood is running heavier than the facts.'
      : `Mood is running heavier than the facts around ${domain}.`;
  }
  if (crowded) return 'Pressure is on in more than one part of life at once.';
  return `Something is tightening around ${domain}.`;
}

function phaseClause(phase?: string | null, daysToPeak?: number | null): string {
  if (phase === 'building' && typeof daysToPeak === 'number' && daysToPeak > 0 && daysToPeak <= 3) {
    return daysToPeak === 1
      ? 'It is still gathering — about a day out.'
      : `It is still gathering — about ${daysToPeak} days out.`;
  }
  if (phase === 'releasing') {
    return 'The worst of it has already passed.';
  }
  return '';
}

function coreSensesLine(core?: string | null, polarity: HeadlinePolarity = 'storm'): string {
  const c = parseMbtiType(core);
  if (!c) return '';
  const feel = c[2] === 'F';
  const think = c[2] === 'T';
  const intuit = c[1] === 'N';
  const judge = c[3] === 'J';
  if (polarity === 'support') {
    if (feel && intuit) {
      return "You'll feel permission before you can justify taking it.";
    }
    if (think) {
      return "You'll want the upside mapped before you step in.";
    }
  }
  if (feel && intuit && judge) {
    return "You'll see the pattern before you have something to ask for.";
  }
  if (feel && intuit) {
    return "You'll feel the uncertainty before you can name it.";
  }
  if (feel) {
    return "You'll feel the shift before you have a clean reason.";
  }
  if (think && judge) {
    return "You'll treat it as a problem to solve before you treat it as weather.";
  }
  if (think) {
    return "You'll want a model before you let the feeling count.";
  }
  return period(CORE_THREAT[c].notices);
}

function maskHabitLine(mask?: string | null, polarity: HeadlinePolarity = 'storm'): string {
  const m = parseMbtiType(mask);
  if (!m) return '';
  if (m[2] === 'T') {
    return polarity === 'support'
      ? "The pull will be to plan instead of take it."
      : "You'll want a stronger justification than you have.";
  }
  if (m[2] === 'F' && m[0] === 'E') {
    return "You'll want the room to stay easy.";
  }
  if (m[3] === 'J') {
    return "You'll want this closed.";
  }
  if (m[3] === 'P') {
    return "You'll want to keep every option open.";
  }
  return '';
}

function whatSlot(input: {
  polarity: HeadlinePolarity;
  sky: string;
  themeId: string;
  domain: string;
  crowded: boolean;
  phase?: string | null;
  daysToPeak?: number | null;
}): string {
  if (input.polarity === 'carryover') {
    return `Same ${input.sky} as yesterday. Nothing material changed.`;
  }
  const body = weatherWhatLine(input.themeId, input.sky, input.polarity, input.domain, input.crowded);
  const phase = phaseClause(input.phase, input.daysToPeak);
  return phase ? `${body} ${phase}` : body;
}

function whyMeSlot(input: {
  polarity: HeadlinePolarity;
  domain: string;
  crowded: boolean;
  names: string[];
  natal?: string | null;
  coreType?: string | null;
  maskType?: string | null;
}): string {
  const place = input.crowded
    ? `It's on ${joinAnd(input.names)} at once.`
    : `It's on ${input.domain}.`;
  if (input.polarity === 'carryover') {
    return `${place} Same place as yesterday. Don't start a new read.`;
  }
  const sense = coreSensesLine(input.coreType, input.polarity);
  const habit = maskHabitLine(input.maskType, input.polarity);
  if (sense && habit) return `${place} ${sense} ${habit}`;
  if (sense) return `${place} ${sense}`;
  return place;
}

function rideSlot(input: {
  polarity: HeadlinePolarity;
  coreType?: string | null;
  maskType?: string | null;
}): string {
  const core = parseMbtiType(input.coreType);
  const mask = parseMbtiType(input.maskType);
  let stance: string;
  if (input.polarity === 'carryover') {
    stance = "Don't add a second task.";
  } else if (input.polarity === 'support') {
    stance = mask?.[2] === 'T'
      ? "Use the opening. Don't turn it into a plan."
      : "Use the opening. Don't turn it into a project.";
  } else if (core?.[1] === 'N' && core?.[2] === 'F' && core?.[3] === 'J' && mask?.[2] === 'T') {
    stance = "Don't turn the pattern into a theory before you name what you need.";
  } else if (core?.[2] === 'F' && mask?.[2] === 'T') {
    stance = "Don't force certainty.";
  } else if (core?.[2] === 'T') {
    stance = 'One testable next step. Leave the rest of the model open.';
  } else {
    stance = period(typedAvoid(input.coreType, input.maskType, input.polarity));
  }
  return stance;
}

function conclusionMove(input: {
  polarity: HeadlinePolarity;
  coreType?: string | null;
  maskType?: string | null;
  heldMove?: string | null;
}): string {
  const fresh =
    input.polarity === 'support'
      ? typedSupportMove(input.coreType, input.maskType)
      : typedStormMove(input.coreType, input.maskType);
  if (input.polarity !== 'carryover') return fresh;

  const held = (input.heldMove || '').replace(/\s+/g, ' ').trim();
  const freshNorm = fresh.replace(/\s+/g, ' ').trim().toLowerCase();
  const heldNorm = held.toLowerCase();
  if (!held || heldNorm === freshNorm || /no new assignment/i.test(held)) {
    return "No new assignment. Keep yesterday's inch.";
  }
  if (heldNorm.includes(freshNorm.replace(/\.$/, ''))) {
    return "No new assignment. Keep yesterday's inch.";
  }
  return nextInchFromHeldMove(held, input.coreType);
}

function sameSkyAsMemory(
  lead: TransitFact | null | undefined,
  memoryFactKey?: string | null,
): boolean {
  const now = (lead?.key || lead?.display || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const was = (memoryFactKey || '').replace(/\s+/g, ' ').trim().toLowerCase();
  return Boolean(now && was && now === was);
}

export function composeTodayHeadline(input: {
  theme: RankedTheme;
  lead?: TransitFact | null;
  domains: LifeRiskDomain[];
  risk?: LifeRiskPacket | null;
  window?: string | null;
  coreType?: string | null;
  maskType?: string | null;
  held?: boolean;
  heldMove?: string | null;
  memoryFactKey?: string | null;
  today?: string | null;
  memoryDate?: string | null;
  phase?: string | null;
  daysToPeak?: number | null;
  mixedSignals?: boolean;
}): TodayMoveSlots {
  const sameSky = sameSkyAsMemory(input.lead, input.memoryFactKey);
  const polarity = resolveHeadlinePolarity({
    held: input.held,
    sameSky,
    today: input.today,
    memoryDate: input.memoryDate,
    theme: input.theme,
    lead: input.lead,
    risk: input.risk,
  });
  const names = winningDomains(polarity, input.risk, input.domains);
  const crowded = names.length > 2;
  const domain = crowded ? 'a wide plate' : domainPhrase(names[0] || input.domains[0]) || 'the day';
  const sky = plainSkyPhrase(input.lead, input.theme.label);
  const core = input.coreType;
  const mask = input.maskType;
  const avoid = typedAvoid(core, mask, polarity === 'carryover' ? 'storm' : polarity);
  const what = whatSlot({
    polarity,
    sky,
    themeId: input.theme.id,
    domain,
    crowded,
    phase: input.phase,
    daysToPeak: input.daysToPeak,
  });
  const whyMe = whyMeSlot({
    polarity,
    domain,
    crowded,
    names: names.map((name) => domainPhrase(name)),
    natal: input.lead?.natal,
    coreType: core,
    maskType: mask,
  });
  const ride = rideSlot({
    polarity,
    coreType: core,
    maskType: mask,
  });
  const move = conclusionMove({
    polarity,
    coreType: core,
    maskType: mask,
    heldMove: input.heldMove,
  });

  return {
    polarity,
    what,
    whyMe,
    ride,
    move,
    headline: move,
    avoid,
  };
}

export function isSameSkyCarryover(
  lead: TransitFact | null | undefined,
  memoryFactKey?: string | null,
  held?: boolean,
  today?: string | null,
  memoryDate?: string | null,
): boolean {
  if (!isPriorDayMemory(today, memoryDate)) return false;
  return Boolean(held || sameSkyAsMemory(lead, memoryFactKey));
}
