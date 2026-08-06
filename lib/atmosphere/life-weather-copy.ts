/**
 * Short, sharp life-weather copy for the Today brief.
 *
 * Product contract (not horoscope):
 * - Story = how the day *feels* in plain life terms (domains + pressure)
 * - Why   = domain friction + technical drivers (pills)
 * - Move  = one concrete action (not "stay mindful of cosmic energies")
 */

import { sanitizeCopyText } from '@/lib/safety/copy-safety';
import { applyMerlinVoicePass, failsMerlinVoiceTest } from '@/lib/voice/merlin-voice';
import type { AtmospherePacket, LifeRiskDomain, LifeRiskPacket } from '@/lib/atmosphere/types';

export interface LifeWeatherBriefCopy {
  /** One or two sentences: how life feels today */
  story: string;
  /** Concrete why (domain first, technical second) */
  why: string;
  /** Single actionable move */
  move: string;
  eyebrow: string;
  askLabel: string;
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
export function buildFeltStory(options: {
  intensity: number;
  domains: string;
  driverWhy?: string | null;
  forecastSummary?: string | null;
}): string {
  const { intensity, domains, driverWhy, forecastSummary } = options;
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
    s = s.replace(SUN_SIGN_ADDRESS_RE, 'today').replace(/\s+/g, ' ').trim();
    if (
      !isFluffyLifeWeatherCopy(s) &&
      s.length > 24 &&
      !/sky is|doors|bandwidth|friction is low|cooperative/i.test(s)
    ) {
      color = ` ${s.replace(/\.$/, '')}.`;
    }
  }

  return voiceSafe(`${lead} ${texture}${color}`.replace(/\s+/g, ' ').trim());
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

/** One concrete move — domain-aware, never fluff. */
export function buildTodayMove(options: {
  intensity: number;
  risk?: LifeRiskPacket | null;
  transitDo?: string | null;
  forecastAdvice?: string | null;
  predictiveMove?: string | null;
  domainsPhrase?: string;
}): string {
  const candidates = [
    options.transitDo,
    options.forecastAdvice,
    options.predictiveMove,
    options.risk?.move,
  ];

  for (const c of candidates) {
    const t = (c || '').trim();
    if (!t || isFluffyLifeWeatherCopy(t)) continue;
    // Prefer short actionable lines
    if (t.length > 160) return voiceSafe(firstSentence(t, 140));
    return voiceSafe(t);
  }

  const hot = hotDomainKeys(options.risk);
  const primary = hot[0];
  const intensity = options.intensity;

  if (intensity >= 75) {
    if (primary === 'career') {
      return 'Protect focus. Defer non-critical meetings and decisions until the pressure eases.';
    }
    if (primary === 'love') {
      return 'Keep hard talks short and specific. Skip the pile-on argument.';
    }
    if (primary === 'money') {
      return 'No big money moves today. Confirm numbers twice before you send.';
    }
    if (primary === 'health') {
      return 'Cut the day short if you can. Sleep and food beat heroics.';
    }
    if (primary === 'family') {
      return 'Lower the household load. One calm ask beats a full confrontation.';
    }
    return 'Protect bandwidth. Delay non-essential decisions until the pressure eases.';
  }

  if (intensity >= 55) {
    if (primary === 'career') {
      return 'One work priority only. Leave slack for a mid-afternoon reset.';
    }
    if (primary === 'love' || primary === 'family') {
      return 'Say the one clear thing. Do not stack three issues into one talk.';
    }
    if (primary === 'money') {
      return 'Review, don’t commit. Sleep on any spend over your comfort line.';
    }
    if (primary === 'health') {
      return 'Guard energy: shorter list, real break, earlier night.';
    }
    return 'One clear priority only. Leave room to adjust by evening.';
  }

  if (intensity >= 40) {
    if (primary === 'career') {
      return 'Ship one reversible work step — draft, scout, or schedule — before you lock a big call.';
    }
    if (primary === 'love') {
      return 'Make one honest check-in. Keep it concrete, not a full relationship summit.';
    }
    return 'Move on one reversible step — talk, draft, or scout — before you commit hard.';
  }

  if (primary === 'career') {
    return 'Use the calm: finish one real work item and stop there.';
  }
  if (primary === 'love' || primary === 'family') {
    return 'Use the calm: one thoughtful message or plan, then leave space.';
  }
  return 'Use the calm: finish one meaningful thing and leave the rest for later.';
}

// Note: fallback moves above already pass Merlin Test (human stakes + action).

export interface BuildLifeWeatherBriefInput {
  packet?: AtmospherePacket | null;
  forecastSummary?: string | null;
  forecastAdvice?: string | null;
  transitDo?: string | null;
  predictiveMove?: string | null;
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
      story: 'Full life weather is on a paid plan.',
      why: 'Your chart is ready; depth forecast unlocks with premium.',
      move: 'Upgrade when you want daily intensity, storms, and a clear move.',
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

  const move = buildTodayMove({
    intensity,
    risk: risk ?? null,
    transitDo: input.transitDo,
    forecastAdvice: input.forecastAdvice,
    predictiveMove: input.predictiveMove,
    domainsPhrase: domains,
  });

  return { story, why, move, eyebrow, askLabel };
}
