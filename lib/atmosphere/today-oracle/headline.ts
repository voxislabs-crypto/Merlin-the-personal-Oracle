/**
 * Today's Move headline — sky first, then a typed inch.
 * Maps only. No LLM. Dual-layer body copy stays in composeDualLayerCard.
 *
 * Hierarchy: selected theme → domain → phase/intensity → Core/Mask → move.
 */

import type { LifeRiskDomain, LifeRiskPacket } from '@/lib/atmosphere/types';
import { domainPhrase, tightDomainsFromRisk } from '@/lib/atmosphere/today-oracle/personal-copy';
import type { RankedTheme, TodayThemeId, TransitFact } from '@/lib/atmosphere/today-oracle/types';
import { CORE_THREAT, parseMbtiType } from '@/lib/self/dual-layer-maps';

export type HeadlinePolarity = 'storm' | 'support' | 'carryover';
export type InterventionLevel = 'active' | 'small' | 'hold' | 'none';

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

const TIGHT_SUPPORT = 48;

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

function leadIsHard(lead?: TransitFact | null): boolean {
  if (!lead) return false;
  return lead.band === 'hard' || lead.aspect === 'square' || lead.aspect === 'opposition';
}

/**
 * Selected theme is authoritative.
 * Domain loudness cannot retitle the day.
 * A soft aspect cannot convert a friction theme (fog, restraint, etc.) into support.
 */
export function isSupportWeather(
  theme: RankedTheme,
  lead?: TransitFact | null,
  _risk?: LifeRiskPacket | null,
): boolean {
  if (theme.polarity === 'friction') return false;
  if (leadIsHard(lead)) return false;
  if (theme.polarity === 'opening') return true;
  return lead?.band === 'soft';
}

export function plainSkyPhrase(lead?: TransitFact | null, themeLabel?: string | null): string {
  if (!lead) {
    const label = (themeLabel || 'the weather').replace(/\s+/g, ' ').trim().toLowerCase();
    return label || 'the weather';
  }
  const t = lead.transiting;
  const n = lead.natal;
  const hard = leadIsHard(lead);
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

function skyAsWeatherNoun(sky: string): string {
  const t = (sky || 'the weather').replace(/\s+/g, ' ').trim();
  return t.replace(/^(an?|the)\s+/i, '') || 'weather';
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

function asThemeId(id: string): TodayThemeId | null {
  return id as TodayThemeId;
}

function winningDomains(
  polarity: HeadlinePolarity,
  risk: LifeRiskPacket | null | undefined,
  fallback: LifeRiskDomain[],
  themeDomains: LifeRiskDomain[],
): LifeRiskDomain[] {
  const rows = risk?.domains || [];
  const theme = themeDomains.length ? themeDomains : fallback;
  if (polarity === 'support') {
    const open = [...rows]
      .filter((row) => row.support > row.friction && row.support >= TIGHT_SUPPORT)
      .sort((a, b) => b.support - a.support)
      .map((row) => row.name);
    const themed = open.filter((name) => theme.includes(name));
    const pick = (themed.length ? themed : open).slice(0, 3);
    if (pick.length) return pick;
    return theme.slice(0, 2);
  }
  const tight = tightDomainsFromRisk(risk);
  if (tight.length) return tight;
  return (theme.length ? theme : fallback).slice(0, 2);
}

function weatherMagnitude(input: {
  polarity: HeadlinePolarity;
  lead?: TransitFact | null;
  risk?: LifeRiskPacket | null;
  intensity?: number | null;
  tripleHit?: boolean;
}): number {
  const rows = input.risk?.domains || [];
  const domainMag =
    input.polarity === 'support'
      ? Math.max(0, ...rows.map((row) => row.support))
      : Math.max(0, ...rows.map((row) => row.friction));
  let mag = Math.max(input.lead?.score ?? 0, domainMag, input.intensity ?? 0);
  if (input.tripleHit) mag = Math.max(mag, 75);
  return mag;
}

export function interventionLevel(input: {
  polarity: HeadlinePolarity;
  phase?: string | null;
  daysToPeak?: number | null;
  lead?: TransitFact | null;
  risk?: LifeRiskPacket | null;
  intensity?: number | null;
  tripleHit?: boolean;
}): InterventionLevel {
  if (input.polarity === 'carryover') return 'none';
  const mag = weatherMagnitude(input);
  const orb = input.lead?.orbDeg;
  const releasing = input.phase === 'releasing';
  const building = input.phase === 'building';
  const days = input.daysToPeak;

  if (releasing && mag < 60) return 'none';
  if (releasing && mag < 72) return 'hold';
  if (typeof orb === 'number' && orb >= 3.5 && mag < 55) return 'none';
  if (mag < 48) return 'none';
  if (mag < 58) return 'hold';
  if (building && typeof days === 'number' && days >= 2 && mag < 78) return 'small';
  if (mag < 70) return 'small';
  return 'active';
}

function weatherWhatLine(
  themeId: string,
  sky: string,
  polarity: HeadlinePolarity,
  domain: string,
  crowded: boolean,
): string {
  if (themeId === 'fog-clarity' || /thin clarity|softer words|clarity is thin/.test(sky)) {
    return polarity === 'support'
      ? 'Clarity is thinner than usual right now. Stories will still outrun the facts.'
      : 'Clarity is thinner than usual right now. Stories will feel truer than the facts.';
  }
  if (polarity === 'support') {
    return crowded
      ? 'There is a real opening. Keep it small enough to use.'
      : `There is a real opening around ${domain}.`;
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
  if (themeId === 'action-block' || /blocked drive/.test(sky)) {
    return crowded
      ? 'Drive is meeting a wall in more than one part of life.'
      : `Drive is meeting a wall around ${domain}.`;
  }
  if (themeId === 'emotional-heat') {
    return crowded
      ? 'Feelings are spiking faster than the facts.'
      : `Feelings are spiking faster than the facts around ${domain}.`;
  }
  if (themeId === 'identity-pressure' || /identity pressure/.test(sky)) {
    return crowded
      ? 'The day is poking at dignity in more than one part of life.'
      : `The day is poking at dignity around ${domain}.`;
  }
  if (themeId === 'power-dynamics') {
    return crowded
      ? 'A control struggle is in the weather.'
      : `A control struggle is in the weather around ${domain}.`;
  }
  if (themeId === 'relationship-value') {
    return crowded
      ? 'Values and bonds are under review.'
      : `Values and bonds are under review around ${domain}.`;
  }
  if (themeId === 'expansion-opening' || /too-big yes/.test(sky)) {
    return crowded
      ? 'A too-big yes is in the weather.'
      : `A too-big yes is in the weather around ${domain}.`;
  }
  if (themeId === 'structure-duty') {
    return crowded
      ? 'Limits are getting honest.'
      : `Limits are getting honest around ${domain}.`;
  }
  if (themeId === 'action-surge') {
    return crowded
      ? 'Drive is up — easy to start five things.'
      : `Drive is up around ${domain}.`;
  }
  if (themeId === 'home-mood') {
    return "The day's weather wants to become the household's weather.";
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

function themeLandsLine(themeId: string, polarity: HeadlinePolarity): string {
  if (polarity === 'support' || polarity === 'carryover') return '';
  if (themeId === 'action-block') return 'This is resistance, not a verdict on will.';
  if (themeId === 'identity-pressure') return 'Small feedback can feel like a verdict on you.';
  if (themeId === 'power-dynamics') return 'Control is the weather, not the assignment.';
  if (themeId === 'expansion-opening') return 'The yes is bigger than the day can keep.';
  if (themeId === 'emotional-heat') return 'The first spike is not the last word.';
  if (themeId === 'relationship-value') return 'Easy to buy peace instead of saying the preference.';
  if (themeId === 'structure-duty') return 'The unglamorous piece is the real work.';
  if (themeId === 'home-mood') return 'Body first, then the household.';
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
    return `Same ${skyAsWeatherNoun(input.sky)} as yesterday. Nothing material changed.`;
  }
  const body = weatherWhatLine(input.themeId, input.sky, input.polarity, input.domain, input.crowded);
  const phase = phaseClause(input.phase, input.daysToPeak);
  return phase ? `${body} ${phase}` : body;
}

function whyMeSlot(input: {
  polarity: HeadlinePolarity;
  themeId: string;
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
  const landing = themeLandsLine(input.themeId, input.polarity);
  const sense = coreSensesLine(input.coreType, input.polarity);
  const habit = maskHabitLine(input.maskType, input.polarity);
  return [place, landing, sense, habit].filter(Boolean).join(' ');
}

function fogPersonalityRide(coreType?: string | null, maskType?: string | null): string {
  const core = parseMbtiType(coreType);
  const mask = parseMbtiType(maskType);
  if (core?.[1] === 'N' && core?.[2] === 'F' && core?.[3] === 'J' && mask?.[2] === 'T') {
    return "Don't turn the pattern into a theory before you name what you need.";
  }
  if (core?.[2] === 'F' && mask?.[2] === 'T') {
    return "Don't force certainty.";
  }
  if (core?.[2] === 'T') {
    return 'One testable next step. Leave the rest of the model open.';
  }
  return period(typedAvoid(coreType, maskType, 'storm'));
}

function themeRide(input: {
  polarity: HeadlinePolarity;
  themeId: string;
  level: InterventionLevel;
  coreType?: string | null;
  maskType?: string | null;
}): string {
  if (input.polarity === 'carryover') {
    return "Don't add a second task.";
  }
  if (input.level === 'none') {
    return "Don't add a task to leftover weather.";
  }
  if (input.level === 'hold') {
    return "Hold. Don't escalate it.";
  }
  const mask = parseMbtiType(input.maskType);
  if (input.polarity === 'support') {
    if (input.themeId === 'expansion-opening') return "Use the opening. Don't take the whole horizon.";
    if (input.themeId === 'action-surge') return "Use the drive to finish. Don't open a second front.";
    return mask?.[2] === 'T'
      ? "Use the opening. Don't turn it into a plan."
      : "Use the opening. Don't turn it into a project.";
  }
  switch (input.themeId) {
    case 'fog-clarity':
      return fogPersonalityRide(input.coreType, input.maskType);
    case 'action-block':
      return "Don't force the breakthrough. One brick.";
    case 'sudden-shift':
      return "Don't treat the jolt as a verdict.";
    case 'communication-friction':
      return "Don't win the thread.";
    case 'emotional-restraint':
      return "Don't treat the heavy mood as a verdict.";
    case 'emotional-heat':
      return "Don't send the first draft.";
    case 'identity-pressure':
      return "Don't make an identity call from a bruise.";
    case 'power-dynamics':
      return 'Drop the extra leverage play.';
    case 'relationship-value':
      return "Don't buy peace.";
    case 'expansion-opening':
      return "Don't take the whole horizon.";
    case 'structure-duty':
      return "Meet the constraint. Don't argue with the clock.";
    case 'home-mood':
      return 'Check the body first.';
    case 'action-surge':
      return "Use the drive to finish. Don't open a second front.";
    default:
      return fogPersonalityRide(input.coreType, input.maskType);
  }
}

function smallThemeMove(themeId: string, polarity: HeadlinePolarity): string {
  if (polarity === 'support') return 'One small yes. Stop there.';
  if (themeId === 'action-block') return 'One brick. Stop there.';
  if (themeId === 'fog-clarity') return "Don't decide from the story today.";
  if (themeId === 'sudden-shift') return "Don't quit in the spike.";
  if (themeId === 'communication-friction') return 'Shorten the reply. Send later if needed.';
  if (themeId === 'emotional-restraint') return 'One small duty. Not the pile.';
  if (themeId === 'expansion-opening') return 'Keep the yes small. Delay the overcommit.';
  return "Keep it small. Don't add a second task.";
}

function activeThemeMove(input: {
  polarity: HeadlinePolarity;
  themeId: string;
  coreType?: string | null;
  maskType?: string | null;
}): string {
  const c = parseMbtiType(input.coreType);
  const m = parseMbtiType(input.maskType);
  if (input.polarity === 'support') {
    if (input.themeId === 'communication-opening') {
      if (c === 'INFP') return "Say the one useful sentence. Don't save it.";
      if (c === 'INFJ') return 'Say the useful thing. Then stop.';
      if (c === 'INTP' || c === 'INTJ' || m === 'INTP') return "Send the update. Don't research it into a plan.";
      return 'Say the useful thing out loud. Keep it specific.';
    }
    if (input.themeId === 'expansion-opening') {
      return 'Say yes to one real opening. Delay the overcommit.';
    }
    if (input.themeId === 'action-surge') {
      return 'Twenty focused minutes on the thing you have been circling.';
    }
    if (c === 'INFP') return "Take one small yes. Don't save it.";
    if (c === 'INFJ') return 'One quiet alignment move, then stop.';
    return 'Take the opening. One yes, then stop.';
  }
  switch (input.themeId) {
    case 'fog-clarity':
      return typedStormMove(input.coreType, input.maskType);
    case 'action-block':
      if (c === 'INFP') return "Lay one brick. Don't turn the wall into a story.";
      if (c === 'INFJ') return 'One bounded push, then stop.';
      if (c === 'INTJ' || c === 'INTP') return 'Rename the blocker in one sentence. Work around it for an hour.';
      return 'Pick the smallest next brick. Skip the heroics.';
    case 'sudden-shift':
      if (c === 'INFP') return 'Name the restlessness. Do not quit in the spike.';
      if (c === 'INFJ') return 'Name the true preference. Delay the detonation.';
      return 'One small test, not a verdict.';
    case 'communication-friction':
      return 'Send the shorter version. Leave the rest.';
    case 'emotional-restraint':
      if (c === 'INFP') return 'Name the weight in one sentence, then one small duty.';
      if (c === 'INFJ') return 'Ask for the concrete need. Skip the self-trial.';
      return 'Name the weight. Do one small duty — not the whole pile.';
    case 'emotional-heat':
      return 'One feeling, one fact, then stop.';
    case 'identity-pressure':
      return 'Delay the verdict. Do one thing that is yours.';
    case 'power-dynamics':
      return "Tell the one true sentence. Don't run a purge.";
    case 'relationship-value':
      return 'Say the real preference. Keep it reversible.';
    case 'expansion-opening':
      return 'Write the upside and the cost. Delay the overcommit.';
    case 'structure-duty':
      return 'Do the overdue duty in a short block. Skip the self-trial.';
    case 'home-mood':
      return 'Tend one home-base need, then rejoin the day.';
    case 'action-surge':
      return 'Start the thing you have been circling. Twenty focused minutes.';
    default:
      return typedStormMove(input.coreType, input.maskType);
  }
}

function themeAvoid(input: {
  polarity: HeadlinePolarity;
  themeId: string;
  coreType?: string | null;
  maskType?: string | null;
}): string {
  if (input.polarity === 'support') {
    if (input.themeId === 'communication-opening') return "Don't sit on the useful sentence.";
    if (input.themeId === 'expansion-opening') return "Don't say yes to the whole horizon.";
    return typedAvoid(input.coreType, input.maskType, 'support');
  }
  if (input.themeId === 'action-block') return "Don't force a breakthrough today.";
  if (input.themeId === 'sudden-shift') return "Don't quit in the spike.";
  if (input.themeId === 'expansion-opening') return "Don't take the whole horizon.";
  if (input.themeId === 'emotional-restraint') return "Don't treat the mood as a verdict.";
  if (input.themeId === 'communication-friction') return "Don't win the thread.";
  return typedAvoid(input.coreType, input.maskType, input.polarity === 'carryover' ? 'storm' : input.polarity);
}

function conclusionMove(input: {
  polarity: HeadlinePolarity;
  themeId: string;
  level: InterventionLevel;
  coreType?: string | null;
  maskType?: string | null;
  heldMove?: string | null;
}): string {
  const fresh = activeThemeMove({
    polarity: input.polarity === 'support' ? 'support' : 'storm',
    themeId: input.themeId,
    coreType: input.coreType,
    maskType: input.maskType,
  });
  if (input.polarity !== 'carryover') {
    if (input.level === 'none') return 'Nothing new needs to happen.';
    if (input.level === 'hold') return "Watch it. Don't start a new project.";
    if (input.level === 'small') return smallThemeMove(input.themeId, input.polarity);
    return fresh;
  }

  const held = (input.heldMove || '').replace(/\s+/g, ' ').trim();
  const freshNorm = fresh.replace(/\s+/g, ' ').trim().toLowerCase();
  const heldNorm = held.toLowerCase();
  if (!held || heldNorm === freshNorm || /no new assignment|nothing new needs to happen/i.test(held)) {
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
  intensity?: number | null;
  tripleHit?: boolean;
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
  const names = winningDomains(polarity, input.risk, input.domains, input.theme.domains || []);
  const crowded = names.length > 2;
  const domain = crowded ? 'a wide plate' : domainPhrase(names[0] || input.domains[0]) || 'the day';
  const sky = plainSkyPhrase(input.lead, input.theme.label);
  const core = input.coreType;
  const mask = input.maskType;
  const themeId = asThemeId(input.theme.id) || input.theme.id;
  const level = interventionLevel({
    polarity,
    phase: input.phase,
    daysToPeak: input.daysToPeak,
    lead: input.lead,
    risk: input.risk,
    intensity: input.intensity,
    tripleHit: input.tripleHit,
  });
  const avoid = themeAvoid({
    polarity,
    themeId,
    coreType: core,
    maskType: mask,
  });
  const what = whatSlot({
    polarity,
    sky,
    themeId,
    domain,
    crowded,
    phase: input.phase,
    daysToPeak: input.daysToPeak,
  });
  const whyMe = whyMeSlot({
    polarity,
    themeId,
    domain,
    crowded,
    names: names.map((name) => domainPhrase(name)),
    natal: input.lead?.natal,
    coreType: core,
    maskType: mask,
  });
  const ride = themeRide({
    polarity,
    themeId,
    level,
    coreType: core,
    maskType: mask,
  });
  const move = conclusionMove({
    polarity,
    themeId,
    level,
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
