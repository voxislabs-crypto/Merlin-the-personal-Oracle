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

/**
 * "this is tightening your finances because…"
 */
export function explainDriverInDomain(
  driver: {
    label?: string;
    reason?: string;
    layReason?: string;
    valence?: number;
    aspect?: string;
  },
  domain: string,
): string {
  const area = domainInPlainWords(domain);
  const why = rewriteLayReason(driver.layReason || driver.reason || driver.label);
  const valence = typeof driver.valence === 'number' ? driver.valence : inferValence(driver.aspect);
  if (valence >= 0.2) {
    return `This is opening ${area} because ${why.charAt(0).toLowerCase()}${why.slice(1)}`;
  }
  if (valence <= -0.15) {
    return `This is tightening ${area} because ${why.charAt(0).toLowerCase()}${why.slice(1)}`;
  }
  return `This is stirring ${area} because ${why.charAt(0).toLowerCase()}${why.slice(1)}`;
}

export function inferValence(aspect?: string | null): number {
  const a = (aspect || '').toLowerCase();
  if (a.includes('square') || a.includes('opposition')) return -0.4;
  if (a.includes('trine') || a.includes('sextile')) return 0.35;
  if (a.includes('quincunx') || a.includes('inconjunct')) return -0.2;
  return 0.05;
}
