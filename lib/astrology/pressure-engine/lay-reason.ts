/**
 * Everyday-language rewrite of transit reasons.
 * No planet names, no aspect jargon — a friend talking.
 */

const PLANET_FEEL: Array<[RegExp, string]> = [
  [/\bsaturn\b/gi, 'a heavy, slow pressure'],
  [/\buranus\b/gi, 'a sudden jolt'],
  [/\bpluto\b/gi, 'a deep, stubborn force'],
  [/\bneptune\b/gi, 'a foggy, hard-to-pin-down feeling'],
  [/\bjupiter\b/gi, 'a widening, hopeful pull'],
  [/\bmars\b/gi, 'heat and urgency'],
  [/\bvenus\b/gi, 'how you connect and what you value'],
  [/\bmercury\b/gi, 'conversations and plans'],
  [/\bmoon\b/gi, 'your mood'],
  [/\bsun\b/gi, 'your sense of self'],
  [/\bchiron\b/gi, 'an old sore spot'],
  [/\bascendant\b|\brising\b/gi, 'how you show up'],
  [/\bmidheaven\b|\bmc\b/gi, 'your public work'],
];

const ASPECT_FEEL: Array<[RegExp, string]> = [
  [/\b(square|squares|squaring)\b/gi, 'friction'],
  [/\b(opposition|opposes|opposing|opposite)\b/gi, 'a tug-of-war'],
  [/\b(trine|trines|trining)\b/gi, 'an easier current'],
  [/\b(sextile|sextiles)\b/gi, 'a usable opening'],
  [/\b(conjunction|conjunct|meets)\b/gi, 'volume turned up'],
  [/\b(quincunx|inconjunct)\b/gi, 'an awkward mismatch'],
  [/\bin aspect\b/gi, 'pressing on'],
];

const JARGON_SWAPS: Array<[RegExp, string]> = [
  [/\bnatal\b/gi, 'your'],
  [/\btransit(ing|s)?\b/gi, ''],
  [/\baspect\b/gi, 'pressure'],
  [/\borb\b/gi, 'closeness'],
  [/\bmalefic\b/gi, 'harsh'],
  [/\bbenefic\b/gi, 'helpful'],
  [/\bhouse\b/gi, 'life area'],
];

const PLANET_OR_ASPECT =
  /\b(saturn|uranus|pluto|neptune|jupiter|mars|venus|mercury|moon|sun|chiron|ascendant|rising|midheaven|square|opposition|trine|sextile|conjunction|conjunct|quincunx|natal|transit)\b/i;

export function hasAstroJargon(text: string): boolean {
  return PLANET_OR_ASPECT.test(text || '');
}

const PLANET_FEEL_NAME: Record<string, string> = {
  saturn: 'a heavy, slow pressure',
  uranus: 'a sudden jolt',
  pluto: 'a deep, stubborn force',
  neptune: 'a foggy, hard-to-pin-down feeling',
  jupiter: 'a widening, hopeful pull',
  mars: 'heat and urgency',
  venus: 'how you connect and what you value',
  mercury: 'conversations and plans',
  moon: 'your mood',
  sun: 'your sense of self',
  chiron: 'an old sore spot',
  ascendant: 'how you show up',
  rising: 'how you show up',
  midheaven: 'your public work',
};

function planetFeel(name: string): string {
  return PLANET_FEEL_NAME[name.trim().toLowerCase()] || name.toLowerCase();
}

function copulaFor(subject: string): 'is' | 'are' {
  const text = (subject || '').trim();
  if (/\band\b/i.test(text)) return 'are';
  if (/^(conversations|plans|things|feelings)\b/i.test(text)) return 'are';
  return 'is';
}

export function rewriteLayReason(raw: string | null | undefined): string {
  let text = (raw || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    return 'Something in the day is leaning on you — name it before you react.';
  }

  const labeled = text.match(
    /^([A-Za-z][A-Za-z\s]*?)\s+(square|opposition|trine|sextile|conjunction|conjunct|quincunx)\s+([A-Za-z][A-Za-z\s]*?)(?:[.!]|$)/i,
  );
  if (labeled) {
    const left = planetFeel(labeled[1]);
    const right = planetFeel(labeled[3]);
    const aspect = labeled[2].toLowerCase();
    const copula = copulaFor(left);
    if (aspect === 'square' || aspect === 'opposition') {
      text = `${left} ${copula} leaning on ${right} — things feel heavier than they are.`;
    } else if (aspect === 'trine' || aspect === 'sextile') {
      text = `${left} ${copula} easing ${right} — a usable opening if you take it.`;
    } else {
      text = `${left} ${copula} sitting on ${right} — the volume is up.`;
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  for (const [re, swap] of ASPECT_FEEL) text = text.replace(re, swap);
  for (const [re, swap] of PLANET_FEEL) text = text.replace(re, swap);
  for (const [re, swap] of JARGON_SWAPS) text = text.replace(re, swap);

  text = text
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/^[,.;:\s]+/, '')
    .trim();

  if (!text.endsWith('.') && !text.endsWith('!') && !text.endsWith('?')) {
    text = `${text}.`;
  }

  // Capitalize first letter
  text = text.charAt(0).toUpperCase() + text.slice(1);

  if (hasAstroJargon(text)) {
    text = text.replace(PLANET_OR_ASPECT, '').replace(/\s{2,}/g, ' ').trim();
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  if (text.length < 24) {
    return 'A heavy, slow pressure is sitting on the day — things feel louder than they are.';
  }

  return text;
}

const DOMAIN_LAY: Record<string, string> = {
  identity: 'how you see yourself',
  career: 'work and ambition',
  relationships: 'relationships',
  finances: 'money and security',
  mental_strain: 'your nerves and focus',
  creativity: 'making and play',
  spiritual_growth: 'meaning and inner life',
  social_connection: 'home and people nearby',
  reinvention: 'the urge to change course',
  love: 'relationships',
  money: 'money',
  family: 'home',
  health: 'energy and body',
  self: 'pace and identity',
  career_work: 'work',
};

export function domainInPlainWords(domain: string): string {
  return DOMAIN_LAY[domain] || domain.replace(/_/g, ' ');
}

const DOMAIN_SURFACE: Record<string, { noun: string; verb: 'is' | 'are' }> = {
  identity: { noun: 'Self', verb: 'is' },
  career: { noun: 'Career', verb: 'is' },
  relationships: { noun: 'Relationships', verb: 'are' },
  finances: { noun: 'Finances', verb: 'are' },
  mental_strain: { noun: 'Energy', verb: 'is' },
  creativity: { noun: 'Creativity', verb: 'is' },
  spiritual_growth: { noun: 'Inner life', verb: 'is' },
  social_connection: { noun: 'Home', verb: 'is' },
  reinvention: { noun: 'Change', verb: 'is' },
  love: { noun: 'Relationships', verb: 'are' },
  money: { noun: 'Finances', verb: 'are' },
  family: { noun: 'Home', verb: 'is' },
  health: { noun: 'Energy', verb: 'is' },
  self: { noun: 'Self', verb: 'is' },
};

export type DomainSurfaceTone = 'pressure' | 'opportunity' | 'neutral';

/** First-screen sentence. Color does the rest. */
export function domainSurfaceLine(domain: string, tone: DomainSurfaceTone): string {
  const meta = DOMAIN_SURFACE[domain] || {
    noun: domain.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    verb: 'is' as const,
  };
  if (tone === 'pressure') return `${meta.noun} ${meta.verb} tight`;
  if (tone === 'opportunity') return `${meta.noun} ${meta.verb} opening up`;
  return `${meta.noun} ${meta.verb} mixed`;
}

export function mechanicsLine(input: {
  label?: string | null;
  transitingPlanet?: string | null;
  aspect?: string | null;
  natalPlanet?: string | null;
  orbDeg?: number | null;
}): string | null {
  const named = [input.transitingPlanet, input.aspect, input.natalPlanet].filter(Boolean).join(' ');
  const base = named || (input.label || '').trim();
  if (!base) return null;
  if (typeof input.orbDeg === 'number' && Number.isFinite(input.orbDeg)) {
    return `${base} · ${input.orbDeg.toFixed(1)}° orb`;
  }
  return base;
}

export type DomainHitExplainInput = {
  label?: string;
  reason?: string;
  layReason?: string;
  valence?: number;
  aspect?: string;
  kind?: 'friction' | 'support' | 'mixed';
  daysToPeak?: number;
};

const FRICTION_VERBS = ['tightening', 'pressuring', 'warning', 'straining'] as const;
const SUPPORT_VERBS = ['opening', 'loosening', 'easing'] as const;
const MIXED_VERBS = ['stirring', 'nudging', 'shifting'] as const;

const TIME_WINDOWS = [
  'right now',
  'today',
  'over the next couple of days',
  'this week',
  'through this stretch',
  'before the week turns',
] as const;

const GENERIC_NARRATIVE =
  /reactive choices can create avoidable fallout|momentum is available|small disciplined actions compound|this week'?s vibe|pressure is building around your|this transit is peaking now around|the peak has passed|complacency can waste a strong opening|if you stay deliberate under pressure|treat the next opening like a real door|survival mode is loud|pause high-stakes launches|prepare now so the peak|act cleanly, speak directly|harvest the lesson/i;

export function isGenericNarrative(text: string | null | undefined): boolean {
  return GENERIC_NARRATIVE.test(text || '');
}

function preferredVerbs(kind: 'friction' | 'support' | 'mixed'): readonly string[] {
  if (kind === 'support') return SUPPORT_VERBS;
  if (kind === 'friction') return FRICTION_VERBS;
  return MIXED_VERBS;
}

function kindFromDriver(driver: DomainHitExplainInput): 'friction' | 'support' | 'mixed' {
  if (driver.kind === 'support' || driver.kind === 'friction' || driver.kind === 'mixed') {
    return driver.kind;
  }
  const valence = typeof driver.valence === 'number' ? driver.valence : inferValence(driver.aspect);
  if (valence >= 0.2) return 'support';
  if (valence <= -0.15) return 'friction';
  return 'mixed';
}

function daysFromDriver(driver: DomainHitExplainInput): number | undefined {
  if (typeof driver.daysToPeak === 'number' && Number.isFinite(driver.daysToPeak)) {
    return driver.daysToPeak;
  }
  const match = `${driver.reason || ''} ${driver.layReason || ''}`.match(/next\s+(\d+)\s+days?/i);
  return match ? Number(match[1]) : undefined;
}

function preferredWindow(days: number | undefined): string {
  if (days == null) return 'through this stretch';
  if (days <= 0) return 'right now';
  if (days <= 1) return 'today';
  if (days <= 3) return 'over the next couple of days';
  if (days <= 7) return 'this week';
  return 'before the week turns';
}

export const MAX_DOMAIN_EXPLAIN_LINES = 4;

const FORBIDDEN_CLAUSES = [
  'how you connect and what you value',
  'foggy, hard-to-pin-down feeling',
];

const TIGHT_BODY = /\b(tightening|pressuring|straining|heavier|weighing)\b/i;
const OPEN_BODY = /\b(opening|loosening|easing)\b/i;
const OPEN_VERBS = new Set(['opening', 'loosening', 'easing']);
const TIGHT_VERBS = new Set(['tightening', 'pressuring', 'warning', 'straining']);

type AspectClass = 'hard' | 'soft' | 'meet';

export function parseTransitLabel(label: string | null | undefined): {
  transiting: string;
  aspect: string;
  natal: string;
} | null {
  const text = (label || '').replace(/\s+/g, ' ').trim();
  const match = text.match(
    /^([A-Za-z][A-Za-z\s]*?)\s+(square|opposition|trine|sextile|conjunction|conjunct|quincunx)\s+(?:natal\s+)?([A-Za-z][A-Za-z\s]*?)$/i,
  );
  if (!match) return null;
  return {
    transiting: match[1].trim().toLowerCase(),
    aspect: match[2].trim().toLowerCase(),
    natal: match[3].trim().toLowerCase(),
  };
}

function aspectClassOf(aspect: string): AspectClass {
  const a = aspect.toLowerCase();
  if (a.includes('trine') || a.includes('sextile')) return 'soft';
  if (a.includes('conjunct')) return 'meet';
  return 'hard';
}

export function mechanismKey(label: string | null | undefined): string {
  const parsed = parseTransitLabel(label);
  if (!parsed) return (label || '').replace(/\s+/g, ' ').trim().toLowerCase();
  return `${parsed.transiting}|${aspectClassOf(parsed.aspect)}`;
}

export function groupDriversByMechanism<T extends { label?: string }>(drivers: T[]): T[][] {
  const order: string[] = [];
  const groups = new Map<string, T[]>();
  for (const driver of drivers || []) {
    const key = mechanismKey(driver.label) || `row-${order.length}`;
    if (!groups.has(key)) {
      order.push(key);
      groups.set(key, []);
    }
    groups.get(key)!.push(driver);
  }
  return order.map((key) => groups.get(key) || []);
}

function pickUnused(preferred: string, bank: readonly string[], used: Set<string>): string {
  if (!used.has(preferred)) return preferred;
  return bank.find((item) => !used.has(item)) || preferred;
}

function pickVerb(kind: 'friction' | 'support' | 'mixed', used: Set<string>): string {
  const bank = preferredVerbs(kind);
  return bank.find((verb) => !used.has(verb)) || bank[0];
}

function areaNoun(domain: string): string {
  const key = (domain || '').toLowerCase();
  if (key === 'love' || key === 'relationships') return 'the bond';
  if (key === 'money' || key === 'finances') return 'money';
  if (key === 'career') return 'work';
  if (key === 'family' || key === 'social_connection') return 'home';
  if (key === 'health' || key === 'mental_strain') return 'your energy';
  if (key === 'self' || key === 'identity') return 'how you show up';
  return domainInPlainWords(domain);
}

/** Mechanism banks: transiting planet + aspect class. No recycled Venus/Neptune clauses. */
const MECHANISM: Record<string, Record<AspectClass, string[]>> = {
  uranus: {
    hard: [
      'a sudden jolt is rattling {noun} — wait out the spike before you decide',
      'the ground under {noun} just shifted — do not rebuild the whole house tonight',
    ],
    soft: ['an unusual option is open around {noun} if you take the odd path'],
    meet: ['surprise is sitting on {noun} — the change is already in the room'],
  },
  venus: {
    hard: [
      'wanting and friction are tangled in {noun} — name one thing, not ten',
      'affection is scoring every small slight — pick the real slight and leave the rest',
    ],
    soft: [
      'warmth has a usable opening around {noun} if you keep the gesture small',
      'a small kindness around {noun} lands farther than a speech',
    ],
    meet: [
      'closeness is turned up around {noun} — volume is not a verdict',
      'what you care about is louder — notice it without making it a project',
    ],
  },
  neptune: {
    hard: [
      'the picture of the other person is blurry — check the facts before you fill them in',
      'idealizing is doing extra work around {noun} — ask what is actually in the room',
    ],
    soft: ['softness is available around {noun} — let the edge down one notch, not the whole wall'],
    meet: ['feelings are harder to pin down around {noun} — name one true thing and leave the rest'],
  },
  saturn: {
    hard: ['duty is sitting on {noun} — the conversation wants patience, not a verdict'],
    soft: ['a slower, sturdier current is available around {noun} if you keep the promise small'],
    meet: ['a heavy, slow pressure is sitting on {noun} — patience over a snap decision'],
  },
  pluto: {
    hard: ['something old is asking to be named in {noun} — do not force a confession'],
    soft: ['a deep honesty has an opening around {noun} if you stay specific'],
    meet: ['a deep pull is asking {noun} to get more honest — one true sentence is enough'],
  },
  mars: {
    hard: ['heat is in the room around {noun} — pause before you pick a fight that is not the real one'],
    soft: ['useful urgency is available around {noun} if you spend it on one move'],
    meet: ['heat is turned up around {noun} — use it, do not spray it'],
  },
  mercury: {
    hard: ['talk is running hot around {noun} — say less until you know what you mean'],
    soft: ['a cleaner conversation is available around {noun} if you keep it short'],
    meet: ['conversations and plans are louder around {noun} — write it down before you send it'],
  },
  moon: {
    hard: ['mood is coloring {noun} — wait until the weather inside you settles'],
    soft: ['the emotional current around {noun} is easier if you eat and sleep first'],
    meet: ['feelings are sitting on {noun} — name the feeling, then the ask'],
  },
  sun: {
    hard: ['pride is in the way of {noun} — drop the performance'],
    soft: ['a clearer sense of self is available around {noun} if you stop proving it'],
    meet: ['your sense of self is turned up around {noun} — let it show without a speech'],
  },
  jupiter: {
    hard: ['a too-big promise around {noun} will cost you — keep the yes small'],
    soft: ['a widening, hopeful pull is available around {noun} if you take one concrete step'],
    meet: ['hope is loud around {noun} — one real step beats a grand plan'],
  },
};

const FALLBACK_MECHANISM: Record<AspectClass, string[]> = {
  hard: [
    'pressure is leaning on {noun} — pick one reversible move',
    'friction is up around {noun} — leave an exit ramp',
  ],
  soft: [
    'a usable opening is around {noun} if you take it',
    'the current is easier around {noun} — spend it on one thing',
  ],
  meet: [
    'the volume is up around {noun} — notice it before you react',
    'this area is louder than usual — name it, then choose',
  ],
};

function fillNoun(template: string, domain: string): string {
  return template.replace(/\{noun\}/g, areaNoun(domain));
}

function polarityOk(kind: 'friction' | 'support' | 'mixed', body: string): boolean {
  if (kind === 'support' && TIGHT_BODY.test(body)) return false;
  if (kind === 'friction' && OPEN_BODY.test(body)) return false;
  return true;
}

function containsForbidden(body: string, usedClauses: Set<string>): boolean {
  const lower = body.toLowerCase();
  for (const clause of FORBIDDEN_CLAUSES) {
    if (lower.includes(clause) && usedClauses.has(clause)) return true;
  }
  return false;
}

function markForbidden(body: string, usedClauses: Set<string>) {
  const lower = body.toLowerCase();
  for (const clause of FORBIDDEN_CLAUSES) {
    if (lower.includes(clause)) usedClauses.add(clause);
  }
}

function mechanismBody(
  driver: DomainHitExplainInput,
  domain: string,
  kind: 'friction' | 'support' | 'mixed',
  usedBodies: Set<string>,
  usedClauses: Set<string>,
): string {
  const specific = driver.layReason || driver.reason || '';
  if (
    specific &&
    !isGenericNarrative(specific) &&
    specific.replace(/\s+/g, ' ').trim() !== (driver.label || '').trim() &&
    polarityOk(kind, specific) &&
    !containsForbidden(specific, usedClauses)
  ) {
    const rewritten = rewriteLayReason(specific);
    if (polarityOk(kind, rewritten) && !containsForbidden(rewritten, usedClauses) && !usedBodies.has(rewritten.toLowerCase())) {
      return rewritten;
    }
  }

  const parsed = parseTransitLabel(driver.label || '');
  const planet = parsed?.transiting || '';
  const cls: AspectClass = parsed ? aspectClassOf(parsed.aspect) : kind === 'support' ? 'soft' : kind === 'mixed' ? 'meet' : 'hard';
  const bank = [...(MECHANISM[planet]?.[cls] || []), ...FALLBACK_MECHANISM[cls]];
  for (const template of bank) {
    const body = fillNoun(template, domain);
    const key = body.toLowerCase();
    if (usedBodies.has(key)) continue;
    if (!polarityOk(kind, body)) continue;
    if (containsForbidden(body, usedClauses)) continue;
    return body;
  }
  return fillNoun(FALLBACK_MECHANISM[cls][0], domain);
}

function decap(text: string): string {
  const trimmed = (text || '').replace(/\s+/g, ' ').trim().replace(/\.+$/, '');
  if (!trimmed) return 'something in the day is leaning on you';
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

function linePolarityOk(verb: string, body: string): boolean {
  if (OPEN_VERBS.has(verb) && TIGHT_BODY.test(body)) return false;
  if (TIGHT_VERBS.has(verb) && OPEN_BODY.test(body)) return false;
  return true;
}

/**
 * One transit, one sentence. Lists go through `explainHitsInDomain`.
 */
export function explainDriverInDomain(driver: DomainHitExplainInput, domain: string): string {
  return explainHitsInDomain([driver], domain)[0];
}

/**
 * Merge lookalike transits, cap at four, unique verb + window + mechanism.
 * Wrapper and body stay the same polarity. Recycled Venus/Neptune clauses stay gone.
 */
export function explainHitsInDomain(drivers: DomainHitExplainInput[], domain: string): string[] {
  const grouped = groupDriversByMechanism(drivers || []).slice(0, MAX_DOMAIN_EXPLAIN_LINES);
  const reps = grouped.map((group) => group[0]).filter(Boolean);
  const area = domainInPlainWords(domain);
  const usedVerbs = new Set<string>();
  const usedWindows = new Set<string>();
  const usedBodies = new Set<string>();
  const usedClauses = new Set<string>();

  return reps.map((driver) => {
    const kind = kindFromDriver(driver);
    const verb = pickVerb(kind, usedVerbs);
    const window = pickUnused(preferredWindow(daysFromDriver(driver)), TIME_WINDOWS, usedWindows);
    let body = mechanismBody(driver, domain, kind, usedBodies, usedClauses);
    if (!linePolarityOk(verb, body)) {
      const cls: AspectClass = kind === 'support' ? 'soft' : kind === 'mixed' ? 'meet' : 'hard';
      body = fillNoun(FALLBACK_MECHANISM[cls][0], domain);
    }
    usedVerbs.add(verb);
    usedWindows.add(window);
    usedBodies.add(body.toLowerCase());
    markForbidden(body, usedClauses);
    return `This is ${verb} ${area} ${window} — ${decap(body)}.`;
  });
}

export function inferValence(aspect?: string | null): number {
  const a = (aspect || '').toLowerCase();
  if (a.includes('square') || a.includes('opposition')) return -0.4;
  if (a.includes('trine') || a.includes('sextile')) return 0.35;
  if (a.includes('quincunx') || a.includes('inconjunct')) return -0.2;
  return 0.05;
}
