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
    if (aspect === 'square' || aspect === 'opposition') {
      text = `${left} is tightening ${right} — things feel heavier than they are.`;
    } else if (aspect === 'trine' || aspect === 'sextile') {
      text = `${left} is easing ${right} — a usable opening if you take it.`;
    } else {
      text = `${left} is sitting on ${right} — the volume is up.`;
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
const ALL_VERBS = [...FRICTION_VERBS, ...SUPPORT_VERBS, ...MIXED_VERBS];

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

function pickUnused(preferred: string, bank: readonly string[], used: Set<string>): string {
  if (!used.has(preferred)) return preferred;
  return bank.find((item) => !used.has(item)) || preferred;
}

function pickVerb(kind: 'friction' | 'support' | 'mixed', used: Set<string>, feel: string): string {
  const inner = (feel || '').toLowerCase();
  const ranked = [...preferredVerbs(kind), ...ALL_VERBS].filter(
    (verb, index, list) => list.indexOf(verb) === index && !inner.includes(verb),
  );
  const available = ranked.filter((verb) => !used.has(verb));
  return available[0] || ALL_VERBS.find((verb) => !used.has(verb)) || 'stirring';
}

function driverFeel(driver: DomainHitExplainInput): string {
  const specific = driver.layReason || driver.reason || '';
  const source =
    specific && !isGenericNarrative(specific) && specific.replace(/\s+/g, ' ').trim() !== (driver.label || '').trim()
      ? specific
      : driver.label || specific;
  return rewriteLayReason(source);
}

function decap(text: string): string {
  const trimmed = (text || '').replace(/\s+/g, ' ').trim().replace(/\.+$/, '');
  if (!trimmed) return 'something in the day is leaning on you';
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

/**
 * One transit, one sentence. Lists must go through `explainHitsInDomain`
 * so verbs and time windows stay unique.
 */
export function explainDriverInDomain(driver: DomainHitExplainInput, domain: string): string {
  return explainHitsInDomain([driver], domain)[0];
}

/**
 * Verb bank + unique time windows. No two lines share a verb or a timeframe,
 * and generic "next N days" skeletons are discarded.
 */
export function explainHitsInDomain(drivers: DomainHitExplainInput[], domain: string): string[] {
  const area = domainInPlainWords(domain);
  const usedVerbs = new Set<string>();
  const usedWindows = new Set<string>();
  return (drivers || []).map((driver) => {
    const feel = driverFeel(driver);
    const verb = pickVerb(kindFromDriver(driver), usedVerbs, feel);
    const window = pickUnused(preferredWindow(daysFromDriver(driver)), TIME_WINDOWS, usedWindows);
    usedVerbs.add(verb);
    usedWindows.add(window);
    return `This is ${verb} ${area} ${window} — ${decap(feel)}.`;
  });
}

export function inferValence(aspect?: string | null): number {
  const a = (aspect || '').toLowerCase();
  if (a.includes('square') || a.includes('opposition')) return -0.4;
  if (a.includes('trine') || a.includes('sextile')) return 0.35;
  if (a.includes('quincunx') || a.includes('inconjunct')) return -0.2;
  return 0.05;
}
