/**
 * Short, sharp life-weather copy for the Today brief.
 *
 * Product contract (not horoscope):
 * - Story = how the day *feels* in plain life terms (domains + pressure)
 * - Why   = domain friction + technical drivers (pills)
 * - Move  = one concrete action (not "stay mindful of cosmic energies")
 */

import { sanitizeCopyText } from '@/lib/safety/copy-safety';
import { isGenericTransitDo } from '@/lib/transit-lookup';
import { applyMerlinVoicePass, failsMerlinVoiceTest } from '@/lib/voice/merlin-voice';
import type { AtmospherePacket, LifeRiskDomain, LifeRiskPacket } from '@/lib/atmosphere/types';
import { composeTodayOracle } from '@/lib/atmosphere/today-oracle';
import { personalityFrame } from '@/lib/atmosphere/today-oracle/personality-lens';
import { buildCoreMaskTension } from '@/lib/self/dual-layer-lens';
import type { CheckinSnapshot } from '@/lib/atmosphere/today-oracle/personal-copy';
import type { TodayMoveMemory, TodayThemeId } from '@/lib/atmosphere/today-oracle/types';

export interface LifeWeatherBriefCopy {
  /** One or two sentences: how life feels today */
  story: string;
  /** Concrete why (domain first, technical second) */
  why: string;
  /** Single actionable move */
  move: string;
  eyebrow: string;
  askLabel: string;
  /** Oracle synthesis: why this move is tied to today's facts */
  whyToday?: string;
  usuallyBrings?: string;
  navigate?: string;
  watchFor?: string;
  supportingSignals?: Array<{ id: string; label: string; hint: string; polarity?: string }>;
  chartConfidence?: number;
  readConfidence?: number;
  chartConfidenceLabel?: 'High' | 'Steady' | 'Tentative';
  readConfidenceLabel?: 'High' | 'Steady' | 'Tentative';
  moveConfidence?: number;
  confidenceLabel?: 'High' | 'Steady' | 'Tentative';
  mixedSignals?: boolean;
  themeLabel?: string;
  themeId?: TodayThemeId;
  leadFactKey?: string;
  leadFactDisplay?: string;
  heldFromYesterday?: boolean;
  weatherPrinciple?: string;
  leadFact?: string;
  chartWhy?: string;
  operationalTension?: string | null;
  doNot?: string;
  personalHook?: string | null;
  confidenceWhy?: string;
  domainJob?: string;
  deadline?: string;
  coreNotices?: string;
  maskWants?: string;
  tensionLine?: string;
  resolution?: string;
  whyThisPerson?: string;
  behaviorTell?: string;
  weeklyCharacter?: {
    title: string;
    strength: string;
    blindSpot: string;
  };
}

function firstSentence(text: string, maxLen = 220): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const match = cleaned.match(/^(.+?[.!?])(?:\s|$)/);
  const sentence = (match?.[1] || cleaned).trim();
  if (sentence.length <= maxLen) return sentence;
  return `${sentence.slice(0, maxLen - 1).trim()}…`;
}

/** Sun-sign blurb shape: "…today, Leo—pace yourself" */
const SUN_SIGN_ADDRESS_RE =
  /\b(today|you)[,\s]+(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/i;

/** Chart-guessed type dumped into weather: "As an INFJ, today's transits…" */
const MBTI_ADDRESS_RE = /^as an? [IE][NS][TF][JP]\b[,:]?\s*/i;

/**
 * Rejects copy that fails Merlin voice (docs/MERLIN_VOICE.md).
 * Prefer human stakes over horoscope filler.
 */
export function isFluffyLifeWeatherCopy(text: string | null | undefined): boolean {
  const t = (text || '').trim();
  if (!t) return true;
  if (failsMerlinVoiceTest(t)) return true;
  if (SUN_SIGN_ADDRESS_RE.test(t) && /pace yourself|stay flexible|protect your energy/i.test(t)) {
    return true;
  }
  if (MBTI_ADDRESS_RE.test(t)) {
    return true;
  }
  if (/^stay (mindful|present|open|grounded)\b/i.test(t) && t.length < 48) return true;
  return false;
}

function voiceSafe(text: string): string {
  return applyMerlinVoicePass(sanitizeCopyText(text));
}

/** Friction lead for the Why line (domain-first framing). */
export function frictionLeadForWhy(intensity: number): string {
  if (intensity >= 75) return 'High friction';
  if (intensity >= 55) return 'Elevated friction';
  if (intensity >= 40) return 'Mixed pressure';
  return 'Low friction';
}

const DOMAIN_PHRASE: Record<LifeRiskDomain, string> = {
  love: 'relationships',
  career: 'work',
  money: 'money',
  family: 'home life',
  health: 'body and energy',
  self: 'identity and pace',
};

/** Planet → life domain phrase when risk domains are missing. */
const PLANET_DOMAIN_PHRASE: Array<{ re: RegExp; phrase: string }> = [
  { re: /\bmercury\b/i, phrase: 'communication' },
  { re: /\bvenus\b/i, phrase: 'relationships' },
  { re: /\bmars\b/i, phrase: 'conflict' },
  { re: /\bmoon\b/i, phrase: 'mood' },
  { re: /\bsun\b/i, phrase: 'identity' },
  { re: /\bsaturn\b/i, phrase: 'commitments' },
  { re: /\bjupiter\b/i, phrase: 'opportunity' },
  { re: /\buranus\b/i, phrase: 'sudden shifts' },
  { re: /\bneptune\b/i, phrase: 'clarity' },
  { re: /\bpluto\b/i, phrase: 'power dynamics' },
  { re: /\b(ascendant|rising)\b/i, phrase: 'how you show up' },
];

const ASPECT_RE =
  /\b(square|opposition|oppose[sd]?|trine|sextile|conjunction|conjunct|quincunx|inconjunct)\b/i;

/**
 * True when a driver label looks like technical transit jargon
 * (planet + aspect) rather than plain life language.
 */
export function looksLikeTechnicalTransit(label: string): boolean {
  const t = label.trim();
  if (!t || t.length > 80) return false;
  if (ASPECT_RE.test(t)) return true;
  const planetHits = PLANET_DOMAIN_PHRASE.filter((p) => p.re.test(t)).length;
  return planetHits >= 2 && t.split(/\s+/).length <= 6;
}

function joinDomainPhrases(phrases: string[]): string {
  const unique = Array.from(new Set(phrases.filter(Boolean)));
  if (unique.length === 0) return '';
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(', ')}, and ${unique[unique.length - 1]}`;
}

/**
 * Prefer hot risk domains; fall back to planet→domain inference from the technical label.
 */
export function resolveWhyDomains(
  risk: LifeRiskPacket | null | undefined,
  technicalLabel?: string | null,
): string {
  const fromRisk =
    risk?.domains
      ?.filter((d) => d.friction >= 48)
      .sort((a, b) => b.friction - a.friction)
      .slice(0, 2)
      .map((d) => DOMAIN_PHRASE[d.name] || d.label.toLowerCase()) || [];

  if (fromRisk.length) return joinDomainPhrases(fromRisk);

  const fromDrivers =
    risk?.topDrivers?.[0]?.domains
      ?.slice(0, 2)
      .map((d) => DOMAIN_PHRASE[d] || d) || [];
  if (fromDrivers.length) return joinDomainPhrases(fromDrivers);

  if (technicalLabel) {
    const inferred = PLANET_DOMAIN_PHRASE.filter((p) => p.re.test(technicalLabel)).map(
      (p) => p.phrase,
    );
    if (inferred.length) return joinDomainPhrases(inferred.slice(0, 2));
  }

  return 'pace and energy';
}

export interface WhyDriverPill {
  id: string;
  /** Short technical label for the pill chip */
  label: string;
  /** One-line human hint */
  hint: string;
}

function shortenTransitLabel(label: string): string {
  return label
    .replace(/\bopposition\b/gi, 'Opp')
    .replace(/\bconjunction\b/gi, 'Conj')
    .replace(/\bsquare\b/gi, 'Sqr')
    .replace(/\btrine\b/gi, 'Tri')
    .replace(/\bsextile\b/gi, 'Sex')
    .replace(/\bquincunx\b|\binconjunct\b/gi, 'Qui')
    .replace(/\s+/g, ' ')
    .trim();
}

function hintForDriverLabel(label: string, domains?: LifeRiskDomain[]): string {
  if (domains?.length) {
    const names = domains
      .slice(0, 2)
      .map((d) => DOMAIN_PHRASE[d] || d)
      .filter(Boolean);
    if (names.length) return `Pressure on ${joinDomainPhrases(names)}`;
  }

  const l = label.toLowerCase();
  if (l.includes('uranus')) return 'Expect the unexpected';
  if (l.includes('neptune') && (l.includes('mars') || l.includes('mercury'))) {
    return 'Watch for fog in communication';
  }
  if (l.includes('neptune')) return 'Clarity may thin out';
  if (l.includes('saturn')) return 'Commitments feel heavier';
  if (l.includes('pluto')) return 'Power dynamics in play';
  if (l.includes('mars') && l.includes('moon')) return 'Emotional heat rises fast';
  if (l.includes('mars')) return 'Drive and conflict are louder';
  if (l.includes('mercury')) return 'Words carry more weight';
  if (l.includes('venus')) return 'Values and bonds shift';
  if (l.includes('jupiter')) return 'Expansion pressure';
  if (l.includes('moon')) return 'Mood moves the day';
  return 'Active signal today';
}

/**
 * Up to 3 transit/driver pills for Why UI — technical chip + plain hint.
 */
export function buildWhyDriverPills(
  risk?: LifeRiskPacket | null,
  dominantLabel?: string | null,
  max = 3,
): WhyDriverPill[] {
  const seen = new Set<string>();
  const out: WhyDriverPill[] = [];

  for (const driver of risk?.topDrivers || []) {
    const raw = driver.label?.trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `drv-${out.length}`,
      label: shortenTransitLabel(raw),
      hint: hintForDriverLabel(raw, driver.domains),
    });
    if (out.length >= max) return out;
  }

  const dom = dominantLabel?.trim();
  if (dom && looksLikeTechnicalTransit(dom) && !seen.has(dom.toLowerCase())) {
    out.push({
      id: 'dom-0',
      label: shortenTransitLabel(dom),
      hint: hintForDriverLabel(dom),
    });
  }

  return out.slice(0, max);
}

/**
 * Domain-first Why: "Elevated friction in communication due to Mars square Pluto."
 * When driver pills will carry technical labels, keep the sentence domain-only.
 */
export function formatWhyLine(options: {
  intensity: number;
  driverLabel?: string | null;
  driverWhy?: string | null;
  risk?: LifeRiskPacket | null;
  horizonNote?: string;
}): string {
  const { intensity, driverLabel, driverWhy, risk, horizonNote = '' } = options;
  const label = driverLabel?.trim() || '';
  const rationale = driverWhy?.trim() || '';
  const technical = looksLikeTechnicalTransit(label) ? label : '';
  const domains = resolveWhyDomains(risk, technical || label);
  const lead = frictionLeadForWhy(intensity);
  const pillsAvailable = buildWhyDriverPills(risk, label, 3).length > 0;

  let core: string;

  if (technical && pillsAvailable) {
    core = `${lead} in ${domains}.`;
    const plain =
      rationale && !looksLikeTechnicalTransit(rationale) && !isFluffyLifeWeatherCopy(rationale)
        ? firstSentence(rationale, 100)
        : '';
    if (plain && plain.length <= 90) {
      core = `${core.slice(0, -1)} — ${plain.replace(/\.$/, '')}.`;
    }
  } else if (technical) {
    core = `${lead} in ${domains} due to ${technical}.`;
    const plain =
      rationale && !looksLikeTechnicalTransit(rationale) && !isFluffyLifeWeatherCopy(rationale)
        ? firstSentence(rationale, 120)
        : '';
    if (plain && !core.toLowerCase().includes(plain.slice(0, 24).toLowerCase()) && plain.length <= 90) {
      core = `${core.slice(0, -1)} — ${plain.replace(/\.$/, '')}.`;
    }
  } else if (label && rationale && !isFluffyLifeWeatherCopy(rationale)) {
    const whyBit = firstSentence(rationale, 140);
    core = `${lead} in ${domains}: ${whyBit}${whyBit.endsWith('.') ? '' : '.'}`;
  } else if (label && !isFluffyLifeWeatherCopy(label)) {
    core = `${lead} in ${domains} — main signal: ${label}.`;
  } else if (rationale && !isFluffyLifeWeatherCopy(rationale)) {
    core = firstSentence(rationale, 160);
  } else if (horizonNote) {
    core = `Today is relatively even.`;
  } else {
    core = 'No single storm dominates today — watch pace and energy, not drama.';
  }

  return voiceSafe(`${core}${horizonNote}`.replace(/\s+/g, ' ').trim());
}

/**
 * How the day feels — memorable life texture, not documentation.
 * Same meaning as pressure bands; richer weather metaphor + lived detail.
 */
function personalityFeltBeat(mbtiType: string, intensity: number, maskType?: string | null): string {
  const tension = buildCoreMaskTension(
    mbtiType,
    maskType,
    intensity >= 60 ? 'friction' : intensity >= 40 ? 'mixed' : 'opening',
  );
  if (tension) return ` ${tension}`;
  const frame = personalityFrame(mbtiType);
  const article = /^[AEIOU]/i.test(mbtiType) ? 'an' : 'a';
  if (intensity >= 60) {
    if (frame === 'intuition') {
      return ` As ${article} ${mbtiType}, trust the body-level no before you talk yourself into pushing.`;
    }
    if (frame === 'structure') {
      return ` As ${article} ${mbtiType}, name one criterion, then take the next inch.`;
    }
    if (frame === 'action') {
      return ` As ${article} ${mbtiType}, move the task for ten minutes, then reassess.`;
    }
    return ` As ${article} ${mbtiType}, keep one other person in the loop without handing them the day.`;
  }
  if (frame === 'intuition') {
    return ` As ${article} ${mbtiType}, follow the pull, then name it in one sentence so it stays real.`;
  }
  if (frame === 'structure') {
    return ` As ${article} ${mbtiType}, put one useful opening on the calendar before it evaporates.`;
  }
  if (frame === 'action') {
    return ` As ${article} ${mbtiType}, start while the energy is here — stop at one win.`;
  }
  return ` As ${article} ${mbtiType}, say the mixed weather out loud so no one has to guess.`;
}

export function buildFeltStory(options: {
  intensity: number;
  domains: string;
  driverWhy?: string | null;
  forecastSummary?: string | null;
  mbtiType?: string | null;
  maskType?: string | null;
}): string {
  const { intensity, domains, driverWhy, forecastSummary, mbtiType, maskType } = options;
  const d = domains && domains !== 'pace and energy' ? domains : '';

  let lead: string;
  let texture: string;

  if (intensity >= 80) {
    lead = 'The sky is stacking pressure today.';
    texture = d
      ? `Doors stick more than they open—especially around ${d}. Conversations and plans take more force than they should.`
      : 'Doors stick more than they open. Conversations and plans take more force than they should. Shrink the plate before something forces you to.';
  } else if (intensity >= 60) {
    lead = 'The weather is elevated—usable, but not free.';
    texture = d
      ? `Bandwidth thins first in ${d}. Small frictions stack; leave slack so one snag doesn't become the whole day.`
      : 'Bandwidth thins as the day goes. Small frictions stack; leave slack so one snag does not become the whole day.';
  } else if (intensity >= 40) {
    lead = 'The sky is mixed—part clear, part drag.';
    texture = d
      ? `Some lanes open while others resist. ${d.charAt(0).toUpperCase()}${d.slice(1)} may need a mid-course adjust more than the rest.`
      : 'Some lanes open while others resist. Plan for one reset rather than a perfect straight line.';
  } else {
    lead = 'The sky is unusually cooperative today.';
    texture = d
      ? `Doors aren't magically opening—but they aren't sticking either. ${d.charAt(0).toUpperCase()}${d.slice(1)} has less resistance than usual. If you've been waiting to send or ship something, today is probably easier than tomorrow.`
      : "Doors aren't magically opening—but they aren't sticking either. Conversations have less resistance than usual. If you've been waiting to send something, today is probably easier than tomorrow.";
  }

  // Optional human color from driver (not fluff, not jargon)
  let color = '';
  if (driverWhy && !looksLikeTechnicalTransit(driverWhy) && !isFluffyLifeWeatherCopy(driverWhy)) {
    const beat = firstSentence(driverWhy, 100).replace(/\.$/, '');
    if (beat && !lead.toLowerCase().includes(beat.slice(0, 20).toLowerCase())) {
      color = ` ${beat}.`;
    }
  } else if (forecastSummary && !isFluffyLifeWeatherCopy(forecastSummary)) {
    let s = firstSentence(forecastSummary, 110);
    s = s
      .replace(MBTI_ADDRESS_RE, '')
      .replace(SUN_SIGN_ADDRESS_RE, 'today')
      .replace(/\s+/g, ' ')
      .trim();
    if (
      !isFluffyLifeWeatherCopy(s) &&
      s.length > 24 &&
      !/sky is|doors|bandwidth|friction is low|cooperative/i.test(s)
    ) {
      color = ` ${s.replace(/\.$/, '')}.`;
    }
  }

  const selfType = (mbtiType || '').trim().toUpperCase();
  const typeBeat =
    /^[IE][NS][TF][JP]$/.test(selfType) && !MBTI_ADDRESS_RE.test(`${lead} ${texture}${color}`)
      ? personalityFeltBeat(selfType, intensity, maskType)
      : '';

  return voiceSafe(`${lead} ${texture}${color}${typeBeat}`.replace(/\s+/g, ' ').trim());
}

function hotDomainKeys(risk?: LifeRiskPacket | null): LifeRiskDomain[] {
  return (
    risk?.domains
      ?.filter((d) => d.friction >= 48)
      .sort((a, b) => b.friction - a.friction)
      .slice(0, 2)
      .map((d) => d.name) || []
  );
}

/** True when a move is fluff, empty, or the stuck generic placeholder. */
export function isGenericTodayMove(text: string | null | undefined): boolean {
  const t = (text || '').trim();
  if (!t) return true;
  if (isGenericTransitDo(t)) return true;
  if (isFluffyLifeWeatherCopy(t)) return true;
  return false;
}

export function hashSalt(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickDatedLine(lines: readonly string[], salt: string): string {
  const usable = lines.map((s) => s.trim()).filter((s) => s && !isGenericTodayMove(s));
  if (!usable.length) return '';
  return usable[hashSalt(salt) % usable.length];
}

export interface TransitDoSource {
  transit_aspect?: string;
  do?: string[];
  orb?: string;
  score?: number;
  adjustedScore?: number;
}

const PERSONAL_LEAD = ['moon', 'mercury', 'sun', 'venus', 'mars'];

function transitLeadPlanet(aspect?: string): string {
  return (aspect || '').trim().split(/\s+/)[0]?.toLowerCase() || '';
}

function orbNumber(orb?: string): number {
  if (!orb) return 99;
  const match = orb.match(/[\d.]+/);
  return match ? Number.parseFloat(match[0]) : 99;
}

/**
 * Prefer a Moon / personal-planet transit (they change daily), then rotate
 * among that transit's specific do-lines by calendar date.
 */
export function pickDailyTransitDo(
  transits: TransitDoSource[] | null | undefined,
  date?: string | null,
): string | null {
  if (!transits?.length) return null;
  const dated = date || 'today';

  const ranked = [...transits].sort((a, b) => {
    const pa = PERSONAL_LEAD.indexOf(transitLeadPlanet(a.transit_aspect));
    const pb = PERSONAL_LEAD.indexOf(transitLeadPlanet(b.transit_aspect));
    const ra = pa === -1 ? 50 : pa;
    const rb = pb === -1 ? 50 : pb;
    if (ra !== rb) return ra - rb;
    const oa = orbNumber(a.orb);
    const ob = orbNumber(b.orb);
    if (oa !== ob) return oa - ob;
    return (b.adjustedScore ?? b.score ?? 0) - (a.adjustedScore ?? a.score ?? 0);
  });

  for (const transit of ranked) {
    const picked = pickDatedLine(transit.do || [], `${dated}:${transit.transit_aspect || ''}`);
    if (picked) return picked;
  }
  return null;
}

type MoveBand = 'storm' | 'elevated' | 'mixed' | 'calm';

function moveBand(intensity: number): MoveBand {
  if (intensity >= 75) return 'storm';
  if (intensity >= 55) return 'elevated';
  if (intensity >= 40) return 'mixed';
  return 'calm';
}

const DATED_FALLBACKS: Record<MoveBand, Partial<Record<LifeRiskDomain | 'default', string[]>>> = {
  storm: {
    career: [
      'Protect focus. Defer non-critical meetings and decisions until the pressure eases.',
      'One work deliverable only. Park the rest until the spike passes.',
      'Cancel the optional meeting. Finish the one thing that is actually due.',
    ],
    love: [
      'Keep hard talks short and specific. Skip the pile-on argument.',
      'Name one feeling, then stop. Do not audit the whole relationship.',
      'If it is hot, walk first. Come back with one sentence.',
    ],
    money: [
      'No big money moves today. Confirm numbers twice before you send.',
      'Review the bill or the ask. Do not authorize anything new.',
      'Freeze the cart. Recheck in the morning.',
    ],
    health: [
      'Cut the day short if you can. Sleep and food beat heroics.',
      'Stop at good enough. Water, food, earlier night.',
      'Protect the body: shorter list, real break, no extra reps.',
    ],
    family: [
      'Lower the household load. One calm ask beats a full confrontation.',
      'Handle the one practical thing. Leave the history lesson.',
      'Take a chore off someone instead of a debate.',
    ],
    self: [
      'Protect bandwidth. Delay non-essential decisions until the pressure eases.',
      'Shrink the plate. One next hour, not the whole identity question.',
      'Quiet first. Then one reversible move.',
    ],
    default: [
      'Protect bandwidth. Delay non-essential decisions until the pressure eases.',
      'Shrink the plate. One reversible move, then reassess.',
      'Handle the next hour well. Leave the life rewrite.',
    ],
  },
  elevated: {
    career: [
      'One work priority only. Leave slack for a mid-afternoon reset.',
      'Ship the draft. Do not open a second front.',
      'Block ninety focused minutes. Then stop.',
    ],
    love: [
      'Say the one clear thing. Do not stack three issues into one talk.',
      'One honest check-in. Leave the summit for a calmer day.',
      'Ask the real question. Skip the scorekeeping.',
    ],
    family: [
      'Say the one clear thing. Do not stack three issues into one talk.',
      'Handle one household item together. Leave the archive.',
      'One calm ask. No pile-on after dinner.',
    ],
    money: [
      'Review, don’t commit. Sleep on any spend over your comfort line.',
      'Check the number twice. Decide tomorrow if it is still yes.',
      'Move money only if it is already planned. No new bets.',
    ],
    health: [
      'Guard energy: shorter list, real break, earlier night.',
      'Eat a real meal before the next push.',
      'Walk or stretch once. Then cut the list.',
    ],
    default: [
      'One clear priority only. Leave room to adjust by evening.',
      'Do the next useful inch. Leave the rest labeled for tomorrow.',
      'Pick one lane and stay in it until dinner.',
    ],
  },
  mixed: {
    career: [
      'Ship one reversible work step — draft, scout, or schedule — before you lock a big call.',
      'Send the update. Leave the strategy rewrite.',
      'Book the next conversation. Do not decide the whole quarter.',
    ],
    love: [
      'Make one honest check-in. Keep it concrete, not a full relationship summit.',
      'Say the preference out loud. Leave the five-year talk.',
      'Offer one specific plan, not a mood.',
    ],
    default: [
      'Take one useful step you can undo — a draft, a question, a scout.',
      'Move the ball one square. Do not flip the board.',
      'Choose the option that still works if tomorrow disagrees.',
    ],
  },
  calm: {
    career: [
      'Use the calm: finish one real work item and stop there.',
      'Close a loop you have been carrying. Then leave the desk.',
      'Ship the small thing while the lane is open.',
    ],
    love: [
      'Use the calm: one thoughtful message or plan, then leave space.',
      'Send the kind, specific note you have been meaning to send.',
      'Make the simple plan. Do not overbuild it.',
    ],
    family: [
      'Use the calm: one thoughtful message or plan, then leave space.',
      'Do the small kindness at home without a speech.',
      'Share the plan for the week in one paragraph.',
    ],
    default: [
      'Use the calm: finish one meaningful thing and leave the rest for later.',
      'While it is easy, send or ship the thing you have been sitting on.',
      'Complete one real item. Protect the leftover quiet.',
    ],
  },
};

function datedFallbackMove(intensity: number, primary: LifeRiskDomain | undefined, date?: string | null): string {
  const band = moveBand(intensity);
  const table = DATED_FALLBACKS[band];
  const lines = (primary && table[primary]) || table.default || DATED_FALLBACKS.mixed.default!;
  const salt = `${date || 'today'}:${band}:${primary || 'default'}`;
  return pickDatedLine(lines, salt) || lines[0];
}

/** One concrete move — domain-aware, never fluff, rotates by date when templates are used. */
export function buildTodayMove(options: {
  intensity: number;
  risk?: LifeRiskPacket | null;
  transitDo?: string | null;
  transitLookup?: TransitDoSource[] | null;
  forecastAdvice?: string | null;
  predictiveMove?: string | null;
  domainsPhrase?: string;
  date?: string | null;
}): string {
  const datedTransitDo =
    pickDailyTransitDo(options.transitLookup, options.date) ||
    (isGenericTodayMove(options.transitDo) ? null : options.transitDo?.trim());

  const candidates = [
    datedTransitDo,
    options.forecastAdvice,
    options.predictiveMove,
    options.risk?.move,
  ];

  for (const c of candidates) {
    const t = (c || '').trim();
    if (!t || isGenericTodayMove(t)) continue;
    // Prefer short actionable lines
    if (t.length > 160) return voiceSafe(firstSentence(t, 140));
    return voiceSafe(t);
  }

  const hot = hotDomainKeys(options.risk);
  return voiceSafe(datedFallbackMove(options.intensity, hot[0], options.date));
}

// Note: fallback moves above already pass Merlin Test (human stakes + action).

export interface BuildLifeWeatherBriefInput {
  packet?: AtmospherePacket | null;
  forecastSummary?: string | null;
  forecastAdvice?: string | null;
  transitDo?: string | null;
  transitLookup?: TransitDoSource[] | null;
  predictiveMove?: string | null;
  date?: string | null;
  moveMemory?: TodayMoveMemory | null;
  mbtiType?: string | null;
  maskType?: string | null;
  sunSign?: string | null;
  moonSign?: string | null;
  moonPhase?: string | null;
  streak?: number | null;
  yesterdayCheckin?: CheckinSnapshot | null;
  loading?: boolean;
  premiumLocked?: boolean;
  errorMessage?: string | null;
}

/**
 * Build the three-beat Today brief: story · why · move.
 */
export function buildLifeWeatherBrief(input: BuildLifeWeatherBriefInput): LifeWeatherBriefCopy {
  const eyebrow = "Today's life weather";
  const askLabel = 'Ask Merlin about today';

  if (input.loading) {
    return {
      eyebrow,
      askLabel,
      story: 'Reading life weather for your chart…',
      why: 'Station is still locking signals.',
      move: 'Hang tight — your forecast is assembling.',
    };
  }

  if (input.premiumLocked) {
    return {
      eyebrow,
      askLabel,
      story: 'Today’s life weather sample unlocks with your chart on free.',
      why: 'Full storm radar, weekly horizon, and depth stay on paid plans.',
      move: 'Upgrade when you want multi-day intensity, storms, and a full playbook.',
    };
  }

  if (input.errorMessage) {
    return {
      eyebrow,
      askLabel,
      story: voiceSafe(input.errorMessage),
      why: 'The weather feed hiccuped.',
      move: 'Refresh in a moment, or ask Merlin to re-read today.',
    };
  }

  const packet = input.packet;
  const intensity = packet?.intensity ?? 45;
  const risk = packet?.risk;
  const driverLabel = packet?.dominantDriver?.label?.trim();
  const driverWhy = packet?.dominantDriver?.rationale?.trim();
  const domains = resolveWhyDomains(risk, driverLabel);

  const story = buildFeltStory({
    intensity,
    domains,
    driverWhy,
    // Only use forecast summary as optional color if it is not horoscope fluff
    forecastSummary: input.forecastSummary,
    mbtiType: input.mbtiType,
    maskType: input.maskType,
  });

  const horizonNote =
    risk?.elevatedDisruption && risk.nextFrictionPeak?.label
      ? ` Horizon: ${risk.nextFrictionPeak.label}${
          typeof risk.nextFrictionPeak.daysToPeak === 'number'
            ? ` (~${risk.nextFrictionPeak.daysToPeak}d)`
            : ''
        }.`
      : '';

  const why = formatWhyLine({
    intensity,
    driverLabel,
    driverWhy,
    risk: risk ?? null,
    horizonNote,
  });

  const date = input.date || packet?.date || null;
  const oracle = composeTodayOracle({
    date,
    packet,
    transitLookup: input.transitLookup,
    memory: input.moveMemory ?? null,
    mbtiType: input.mbtiType,
    maskType: input.maskType,
    sunSign: input.sunSign,
    moonSign: input.moonSign,
    moonPhase: input.moonPhase,
    streak: input.streak,
    yesterdayCheckin: input.yesterdayCheckin,
  });

  const move =
    oracle?.move ||
    buildTodayMove({
      intensity,
      risk: risk ?? null,
      transitDo: input.transitDo,
      transitLookup: input.transitLookup,
      forecastAdvice: input.forecastAdvice,
      predictiveMove: input.predictiveMove,
      domainsPhrase: domains,
      date,
    });

  const personalStory = oracle?.whyThisPerson || oracle?.chartWhy || oracle?.leadFact || story;
  const personalWhy = oracle?.whyThisPerson || oracle?.whyToday || why;

  return {
    story: personalStory,
    why: personalWhy,
    move,
    eyebrow,
    askLabel,
    whyToday: oracle?.whyToday,
    usuallyBrings: oracle?.usuallyBrings || undefined,
    navigate: oracle?.operationalTension || undefined,
    watchFor: oracle?.watchFor,
    supportingSignals: oracle?.supportingSignals,
    chartConfidence: oracle?.chartConfidence,
    readConfidence: oracle?.readConfidence,
    chartConfidenceLabel: oracle?.chartConfidenceLabel,
    readConfidenceLabel: oracle?.readConfidenceLabel,
    moveConfidence: oracle?.confidence,
    confidenceLabel: oracle?.confidenceLabel,
    mixedSignals: oracle?.mixedSignals,
    themeLabel: oracle?.themeLabel,
    themeId: oracle?.themeId,
    leadFactKey: oracle?.leadFactKey,
    leadFactDisplay: oracle?.leadFactDisplay,
    heldFromYesterday: oracle?.heldFromYesterday,
    weatherPrinciple: oracle?.principle,
    leadFact: oracle?.leadFact,
    chartWhy: oracle?.chartWhy,
    operationalTension: oracle?.operationalTension,
    doNot: oracle?.doNot,
    personalHook: oracle?.personalHook,
    confidenceWhy: oracle?.confidenceWhy,
    domainJob: oracle?.domainJob,
    deadline: oracle?.deadline,
    coreNotices: oracle?.coreNotices,
    maskWants: oracle?.maskWants,
    tensionLine: oracle?.tensionLine,
    resolution: oracle?.resolution,
    whyThisPerson: oracle?.whyThisPerson,
    behaviorTell: oracle?.behaviorTell,
    weeklyCharacter: oracle?.weeklyCharacter,
  };
}
