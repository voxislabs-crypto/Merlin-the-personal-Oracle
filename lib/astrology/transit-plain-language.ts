/**
 * Plain-language blurbs for transit peak titles like "Uranus Opposition Uranus".
 * Used in Active Storyline timing peaks so users aren't left with jargon only.
 */

export interface TransitPlainLanguage {
  /** Short one-liner under the title */
  plain: string;
  /** Optional extra depth */
  detail?: string;
  /** Human aspect word: opposite, squares, etc. */
  aspectWord?: string;
}

const ASPECT_WORDS: Record<string, string> = {
  conjunction: 'meets',
  opposition: 'opposes',
  square: 'squares',
  trine: 'harmonizes with',
  sextile: 'supports',
  quincunx: 'awkwardly links',
  inconjunct: 'awkwardly links',
};

const PLANET_GLANCE: Record<string, string> = {
  sun: 'identity and vitality',
  moon: 'moods, needs, and home base',
  mercury: 'thinking, words, and plans',
  venus: 'love, money, and what you value',
  mars: 'drive, anger, and action',
  jupiter: 'growth, belief, and expansion',
  saturn: 'limits, duty, and structure',
  uranus: 'freedom, shock, and reinvention',
  neptune: 'dreams, fog, and ideals',
  pluto: 'power, endings, and deep change',
  chiron: 'old wounds and healing',
  'north node': 'growth edge',
  'true node': 'growth edge',
  'south node': 'familiar patterns',
};

const ASPECT_FEEL: Record<string, string> = {
  conjunction: 'a merge — volume turned up on both',
  opposition: 'a face-off — awareness through tension or other people',
  square: 'friction that forces a move',
  trine: 'easier flow if you use it',
  sextile: 'a helpful opening if you act',
  quincunx: 'an adjustment that never quite fits until you adapt',
  inconjunct: 'an adjustment that never quite fits until you adapt',
};

function normalize(token: string): string {
  return token.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Parse titles from buildTransitWindows: "Uranus Opposition Uranus"
 */
export function parseTransitTitle(title: string): {
  transiting: string;
  aspect: string;
  natal: string;
} | null {
  const cleaned = title.replace(/\s+/g, ' ').trim();
  const match = cleaned.match(
    /^([A-Za-z][A-Za-z\s]*?)\s+(Conjunction|Opposition|Square|Trine|Sextile|Quincunx|Inconjunct)\s+([A-Za-z][A-Za-z\s]*?)$/i,
  );
  if (!match) return null;
  return {
    transiting: match[1].trim(),
    aspect: match[2].trim(),
    natal: match[3].trim(),
  };
}

function planetGlance(name: string): string {
  return PLANET_GLANCE[normalize(name)] || `${name} themes`;
}

function specialSamePlanetLine(
  planet: string,
  aspect: string,
): TransitPlainLanguage | null {
  const p = normalize(planet);
  const a = normalize(aspect);

  // Classic life-cycle hits
  if (p === 'uranus' && a === 'opposition') {
    return {
      plain: 'Uranus opposite your natal Uranus — a classic “wake-up” cycle (often midlife).',
      detail:
        'Freedom, truth, and restlessness peak. Old scripts feel too small; sudden course-corrections and honesty with yourself are the point — not chaos for its own sake.',
      aspectWord: 'opposes',
    };
  }
  if (p === 'uranus' && a === 'conjunction') {
    return {
      plain: 'Uranus returns to its birth place — a long-cycle reboot of freedom and identity.',
      detail: 'Rare outer-planet return energy: reinvent what “being you” means without waiting for permission.',
      aspectWord: 'meets',
    };
  }
  if (p === 'saturn' && (a === 'conjunction' || a === 'opposition' || a === 'square')) {
    const phase =
      a === 'conjunction'
        ? 'Saturn Return territory — adulthood 2.0, commitments get real.'
        : a === 'opposition'
          ? 'Saturn opposite Saturn — mid-cycle accountability check.'
          : 'Saturn square Saturn — structural pressure to grow up a layer.';
    return {
      plain: phase,
      detail: 'Duty, time, and limits clarify what actually works. Build, prune, or renegotiate — avoid denial.',
      aspectWord: ASPECT_WORDS[a],
    };
  }
  if (p === 'neptune' && a === 'opposition') {
    return {
      plain: 'Neptune opposite natal Neptune — ideals and fog face each other.',
      detail: 'Dreams, spiritual longing, and confusion can mix. Clarify boundaries and don’t romanticize escape.',
      aspectWord: 'opposes',
    };
  }
  if (p === 'pluto' && (a === 'square' || a === 'opposition' || a === 'conjunction')) {
    return {
      plain: 'Pluto pressing your natal Pluto — deep power and rebirth themes.',
      detail: 'Control, survival, and transformation. Something old must compost so something truer can root.',
      aspectWord: ASPECT_WORDS[a],
    };
  }
  if (p === 'chiron' && a === 'conjunction') {
    return {
      plain: 'Chiron Return — the wound becomes a teacher.',
      detail: 'Old tender spots resurface so they can be healed or shared with more wisdom.',
      aspectWord: 'meets',
    };
  }

  if (normalize(planet) === normalize(planet) && a) {
    // same planet general
    return null;
  }
  return null;
}

/**
 * Build a plain-language explanation for a transit peak title.
 */
export function explainTransitTitle(title: string): TransitPlainLanguage {
  const parsed = parseTransitTitle(title);
  if (!parsed) {
    return {
      plain: 'A timed sky window peaking for your chart — open “What this means” or ask Merlin for a personal read.',
    };
  }

  const { transiting, aspect, natal } = parsed;
  const aspectKey = normalize(aspect);
  const samePlanet = normalize(transiting) === normalize(natal);

  if (samePlanet) {
    const special = specialSamePlanetLine(transiting, aspect);
    if (special) return special;
  }

  const aspectWord = ASPECT_WORDS[aspectKey] || aspect.toLowerCase();
  const feel = ASPECT_FEEL[aspectKey] || 'an active link';
  const tGlance = planetGlance(transiting);
  const nGlance = planetGlance(natal);

  if (samePlanet) {
    return {
      plain: `Transiting ${transiting} ${aspectWord} your natal ${natal} — a chapter beat in your ${tGlance} story.`,
      detail: `This is the sky re-hitting the same planet in your birth chart (${feel}). Expect themes of ${tGlance} to get louder and more honest.`,
      aspectWord,
    };
  }

  return {
    plain: `${transiting} ${aspectWord} your natal ${natal} — ${tGlance} presses on ${nGlance}.`,
    detail: `Aspect feel: ${feel}. Peak day is when the angle is most exact; the days around it still count. Use Ask Merlin for how this lands in *your* houses and story.`,
    aspectWord,
  };
}
