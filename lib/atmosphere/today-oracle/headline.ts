/**
 * Today's Move headline — sky first, then a typed inch.
 * Maps only. No LLM. Dual-layer body copy stays in composeDualLayerCard.
 */

import type { LifeRiskDomain, LifeRiskPacket } from '@/lib/atmosphere/types';
import { domainPhrase, tightDomainsFromRisk } from '@/lib/atmosphere/today-oracle/personal-copy';
import type { RankedTheme, TransitFact } from '@/lib/atmosphere/today-oracle/types';
import { CORE_THREAT, parseMbtiType } from '@/lib/self/dual-layer-maps';

export type HeadlinePolarity = 'storm' | 'support' | 'carryover';

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

function headlineWindow(
  lead: TransitFact | null | undefined,
  constraintWindow: string | null | undefined,
  polarity: HeadlinePolarity,
): string {
  const given = (constraintWindow || '').trim();
  if (given && given !== 'late afternoon') return given;
  if (lead?.transiting === 'mercury' || lead?.natal === 'mercury') return '10am–1pm';
  if (polarity === 'support') return 'this afternoon';
  return '4–7pm';
}

function domainSlot(input: {
  crowded?: boolean;
  domains: LifeRiskDomain[];
  tight: LifeRiskDomain[];
}): string {
  if (input.crowded && input.tight.length > 2) return 'a wide plate';
  const primary = input.domains[0] || input.tight[0];
  return domainPhrase(primary) || 'the day';
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
}): { headline: string; polarity: HeadlinePolarity; avoid: string } {
  const tight = tightDomainsFromRisk(input.risk);
  const crowded = tight.length > 2;
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
  const sky = plainSkyPhrase(input.lead, input.theme.label);
  const domain = domainSlot({ crowded, domains: input.domains, tight });
  const window = headlineWindow(input.lead, input.window, polarity);
  const core = input.coreType;
  const mask = input.maskType;
  const avoid = typedAvoid(core, mask, polarity);

  if (polarity === 'carryover') {
    const inch = nextInchFromHeldMove(input.heldMove, core);
    return {
      polarity,
      avoid,
      headline: `Same ${sky} as yesterday. Don't add a second task. ${inch}`,
    };
  }

  if (polarity === 'support') {
    return {
      polarity,
      avoid,
      headline: `Window open on ${domain}. ${typedSupportMove(core, mask)}`,
    };
  }

  return {
    polarity,
    avoid,
    headline: `Through ${window}: ${sky} on ${domain}. ${typedStormMove(core, mask)}`,
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
