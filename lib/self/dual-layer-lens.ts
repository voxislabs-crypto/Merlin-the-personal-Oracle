/**
 * Dual-layer personality as navigation copy — Core vs Mask.
 * Does not change sky intensity. Only how to move through the weather.
 */

export type DualPolarity = 'friction' | 'opening' | 'mixed';

export interface DualLayerLens {
  likelyPattern: string;
  blindSpot: string;
  bestMove24h: string;
  avoidNow: string;
  tension: string | null;
}

function parseType(type?: string | null): {
  raw: string;
  e: 'E' | 'I';
  n: 'S' | 'N';
  t: 'T' | 'F';
  j: 'J' | 'P';
} | null {
  const raw = (type || '').trim().toUpperCase();
  if (!/^[IE][NS][TF][JP]$/.test(raw)) return null;
  return {
    raw,
    e: raw[0] as 'E' | 'I',
    n: raw[1] as 'S' | 'N',
    t: raw[2] as 'T' | 'F',
    j: raw[3] as 'J' | 'P',
  };
}

function article(type: string): 'a' | 'an' {
  return /^[AEIOU]/i.test(type) ? 'an' : 'a';
}

/**
 * One sentence when Core and Mask disagree.
 * The fireworks / inner-room split.
 */
export function buildCoreMaskTension(
  coreType?: string | null,
  maskType?: string | null,
  polarity: DualPolarity = 'mixed',
): string | null {
  const core = parseType(coreType);
  const mask = parseType(maskType);
  if (!core || !mask || core.raw === mask.raw) return null;

  const inner = `${article(core.raw)} ${core.raw}`;
  const outer = `${article(mask.raw)} ${mask.raw}`;

  if (core.e !== mask.e) {
    if (core.e === 'I' && mask.e === 'E') {
      return polarity === 'opening'
        ? `The ${outer} face can take the opening — don't let the show outrun the ${core.raw} core that still needs a beat.`
        : `Your ${core.raw} core wants to process; the ${mask.raw} mask wants a show. Let the inside pick the next inch.`;
    }
    return polarity === 'friction'
      ? `The room may read ${mask.raw} while you are ${core.raw} inside — don't perform the wait; name it.`
      : `Inside is ${core.raw}; the face is ${mask.raw}. Decide which layer is driving before you move.`;
  }

  if (core.t !== mask.t) {
    if (core.t === 'F' && mask.t === 'T') {
      return `Instinct (${core.raw}) says feel it first; the ${mask.raw} mask wants proof. Trust the felt read, then pressure-test.`;
    }
    return `The ${core.raw} core wants a clean model; the ${mask.raw} face will soften it for the room. Don't outsource the call to charm.`;
  }

  if (core.j !== mask.j) {
    if (core.j === 'J' && mask.j === 'P') {
      return `Core (${core.raw}) already wants the loop closed; the ${mask.raw} mask looks flexible. If the call is made, stop collecting options.`;
    }
    return `Inside (${core.raw}) wants options; the ${mask.raw} face looks decided. Leave one reversible exit.`;
  }

  if (core.n !== mask.n) {
    return `The ${core.raw} core sees the pattern; the ${mask.raw} mask wants something concrete. Bring one hard example, then the insight.`;
  }

  return `You run ${inner} inside and ${outer} to the world — pick which layer is driving this weather.`;
}

export function buildSelfMbtiLens(options: {
  coreType?: string | null;
  maskType?: string | null;
  intensity?: number;
}): DualLayerLens {
  const core = parseType(options.coreType);
  const mask = parseType(options.maskType);
  const tension = buildCoreMaskTension(options.coreType, options.maskType, 'mixed');
  const high = (options.intensity ?? 50) >= 60;

  if (!core) {
    return {
      likelyPattern: 'You may swing between overthinking and reaction while this weather builds.',
      blindSpot: 'Assuming urgency means certainty.',
      bestMove24h: 'Name one concrete action, then execute before over-analysis returns.',
      avoidNow: 'Major irreversible decisions made in an emotional spike.',
      tension: null,
    };
  }

  const likelyPattern = tension
    ? `Inside you are ${core.raw}; the room often meets ${mask?.raw || 'a different face'}. ${
        core.e === 'I' ? 'You process first, then reveal.' : 'You think out loud, then refine.'
      }`
    : core.e === 'I'
      ? `As ${article(core.raw)} ${core.raw}, you process internally first, then reveal conclusions once they feel complete.`
      : `As ${article(core.raw)} ${core.raw}, you process out loud — dialogue is how you sharpen direction.`;

  const blindSpot = tension
    ? core.t === 'F'
      ? 'Letting the mask win the argument while the core never got a vote.'
      : 'Treating the felt signal as noise because the public face is so competent.'
    : core.t === 'T'
      ? 'Treating emotional signals as noise instead of data.'
      : 'Smoothing tension too quickly before naming the real issue.';

  const bestMove24h = tension
    ? high
      ? `${tension} One reversible step only.`
      : `${tension}`
    : core.j === 'J'
      ? 'Set one structured checkpoint today and make a deliberate call by then.'
      : 'Run a low-risk experiment today and use the result to decide your next move.';

  const avoidNow = tension
    ? high
      ? 'Performing certainty for the room while the core is still unsorted.'
      : 'Acting from the mask just to keep the fireworks going.'
    : 'Major irreversible decisions made in an emotional spike.';

  return {
    likelyPattern,
    blindSpot,
    bestMove24h,
    avoidNow,
    tension,
  };
}
