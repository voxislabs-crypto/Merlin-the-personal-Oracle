/**
 * Today's Move headline — sky first, then a typed inch.
 * Maps only. No LLM. Dual-layer body copy stays in composeDualLayerCard.
 */

import type { LifeRiskDomain, LifeRiskPacket } from '@/lib/atmosphere/types';
import {
  domainPhrase,
  natalAxisPhrase,
  tightDomainsFromRisk,
} from '@/lib/atmosphere/today-oracle/personal-copy';
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

function decap(text: string): string {
  const t = (text || '').trim();
  if (!t) return t;
  return t.charAt(0).toLowerCase() + t.slice(1);
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

function phaseBit(
  phase?: string | null,
  daysToPeak?: number | null,
): string {
  if (phase === 'building') {
    if (typeof daysToPeak === 'number' && daysToPeak > 0) {
      return daysToPeak === 1 ? 'Still gathering — about a day from peak.' : `Still gathering — about ${daysToPeak} days from peak.`;
    }
    return 'Still gathering.';
  }
  if (phase === 'peaking' || daysToPeak === 0) return 'This is the peak.';
  if (phase === 'releasing') return "The peak has already passed.";
  if (typeof daysToPeak === 'number' && daysToPeak > 0 && daysToPeak <= 2) {
    return daysToPeak === 1 ? 'The peak is about a day out.' : `The peak is about ${daysToPeak} days out.`;
  }
  return '';
}

function meaningfulTiming(input: {
  window?: string | null;
  lead?: TransitFact | null;
  phase?: string | null;
  daysToPeak?: number | null;
}): string | null {
  const window = (input.window || '').trim();
  const mapped = Boolean(window && window !== 'late afternoon' && window !== 'this afternoon');
  const mercury =
    input.lead?.transiting === 'mercury' || input.lead?.natal === 'mercury';
  const peaking = input.phase === 'peaking' || input.daysToPeak === 0;
  if (!mapped && !mercury && !peaking && input.phase !== 'building' && input.phase !== 'releasing') {
    return null;
  }
  if ((mapped || mercury) && (peaking || mercury)) {
    const slot = mapped ? window : mercury ? '10am–1pm' : '';
    if (slot) return `The sharper hours are ${slot}.`;
  }
  return null;
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
  const phase = phaseBit(input.phase, input.daysToPeak);
  let what: string;
  if (input.polarity === 'carryover') {
    what = `Same ${input.sky} as yesterday.`;
  } else if (input.polarity === 'support') {
    what = input.crowded
      ? 'A usable opening is in the mix.'
      : `A usable opening is forming around ${input.domain}.`;
  } else if (input.themeId === 'fog-clarity' || /thin clarity|clarity is thin/.test(input.sky)) {
    what = 'Clarity is thinner than usual right now.';
  } else if (input.crowded) {
    what = 'Several life areas are tight at once.';
  } else {
    what = `Something is tightening around ${input.domain}.`;
  }
  return phase ? `${what} ${phase}` : what;
}

function whyMeSlot(input: {
  polarity: HeadlinePolarity;
  domain: string;
  crowded: boolean;
  names: string[];
  natalAxis?: string | null;
  coreType?: string | null;
  maskType?: string | null;
}): string {
  const place = input.crowded
    ? `This is landing across ${joinAnd(input.names)}, not one room.`
    : `This is landing in ${input.domain}.`;
  if (input.polarity === 'carryover') {
    return `${place} Don't re-diagnose it.`;
  }
  const core = parseMbtiType(input.coreType);
  const mask = parseMbtiType(input.maskType);
  const notices = core ? CORE_THREAT[core].notices.replace(/\.+$/, '') : '';
  const wants = mask ? MASK_SYMPTOM[mask].wants.replace(/\.+$/, '').replace(/^To /i, '') : '';
  const axis = (input.natalAxis || '').trim();
  const axisBit = axis ? ` That's the ${axis} — not a random mood.` : '';
  if (notices && wants) {
    return `${place} ${notices} — while ${decap(wants)}.${axisBit}`;
  }
  if (notices) return `${place} ${notices}.${axisBit}`;
  return `${place}${axisBit}`;
}

function rideSlot(input: {
  polarity: HeadlinePolarity;
  avoid: string;
  timing: string | null;
  mixedSignals?: boolean;
  dont?: string | null;
}): string {
  const bits: string[] = [];
  if (input.polarity === 'carryover') {
    bits.push("Don't add a second task.");
  } else {
    bits.push(period(input.avoid));
  }
  if (input.timing) bits.push(input.timing);
  if (input.mixedSignals) bits.push("Don't treat this as the only weather.");
  const dont = (input.dont || '').replace(/\s+/g, ' ').trim();
  if (
    dont &&
    dont.length < 90 &&
    !/\b(mercury|neptune|saturn|uranus|pluto|jupiter|venus|mars)\b/i.test(dont) &&
    !bits.some((bit) => bit.toLowerCase().includes(dont.toLowerCase().slice(0, 18)))
  ) {
    bits.push(period(dont));
  }
  return bits.join(' ').replace(/\s+/g, ' ').trim();
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
  const timing = meaningfulTiming({
    window: input.window,
    lead: input.lead,
    phase: input.phase,
    daysToPeak: input.daysToPeak,
  });
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
    natalAxis: natalAxisPhrase(input.lead?.natal),
    coreType: core,
    maskType: mask,
  });
  const ride = rideSlot({
    polarity,
    avoid,
    timing,
    mixedSignals: input.mixedSignals,
    dont: input.lead?.dont?.[0] || null,
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
