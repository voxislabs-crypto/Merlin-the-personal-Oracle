/**
 * Storm Playbook — user-facing storm packaging.
 * Maps raw transit storms into: life category, confidence, when, actionable steps.
 */

import { composeDualLayerCard } from '@/lib/self/dual-layer-maps';

export type StormLifeCategory = 'social' | 'work' | 'financial' | 'health';

export const STORM_CATEGORY_META: Record<
  StormLifeCategory,
  {
    id: StormLifeCategory;
    label: string;
    shortLabel: string;
    blurb: string;
    /** Tailwind / hex tokens for UI */
    textClass: string;
    borderClass: string;
    bgClass: string;
    badgeClass: string;
    hex: string;
    icon: 'heart' | 'briefcase' | 'wallet' | 'heart-pulse';
  }
> = {
  social: {
    id: 'social',
    label: 'Social & relationships',
    shortLabel: 'Social',
    blurb: 'People, bonds, communication, and how you show up with others.',
    textClass: 'text-rose-200',
    borderClass: 'border-rose-400/40',
    bgClass: 'bg-rose-950/30',
    badgeClass: 'border-rose-400/40 bg-rose-500/15 text-rose-100',
    hex: '#fb7185',
    icon: 'heart',
  },
  work: {
    id: 'work',
    label: 'Work & ambition',
    shortLabel: 'Work',
    blurb: 'Career pressure, authority, drive, identity under performance stress.',
    textClass: 'text-amber-200',
    borderClass: 'border-amber-400/40',
    bgClass: 'bg-amber-950/30',
    badgeClass: 'border-amber-400/40 bg-amber-500/15 text-amber-100',
    hex: '#fbbf24',
    icon: 'briefcase',
  },
  financial: {
    id: 'financial',
    label: 'Financial & resources',
    shortLabel: 'Financial',
    blurb: 'Money decisions, spending impulses, resource stress, deals.',
    textClass: 'text-emerald-200',
    borderClass: 'border-emerald-400/40',
    bgClass: 'bg-emerald-950/30',
    badgeClass: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
    hex: '#34d399',
    icon: 'wallet',
  },
  health: {
    id: 'health',
    label: 'Health & energy',
    shortLabel: 'Health',
    blurb: 'Body load, sleep, nervous system, fatigue, and recovery bandwidth.',
    textClass: 'text-sky-200',
    borderClass: 'border-sky-400/40',
    bgClass: 'bg-sky-950/30',
    badgeClass: 'border-sky-400/40 bg-sky-500/15 text-sky-100',
    hex: '#38bdf8',
    icon: 'heart-pulse',
  },
};

export interface StormWhenInfo {
  date: string;
  dayName: string;
  /** e.g. "Thu, Aug 7" */
  dateLabel: string;
  /** e.g. "in 3 days" | "today" | "tomorrow" */
  relativeLabel: string;
  daysUntil: number;
  phase: 'brewing' | 'peak' | 'unknown';
  /** e.g. "Peak window: afternoon → evening" */
  windowLabel: string;
  /** One-line when sentence */
  summary: string;
}

export interface StormPlaybookFields {
  category: StormLifeCategory;
  /** Optional second category if the hit spans domains */
  secondaryCategory?: StormLifeCategory;
  categoryLabel: string;
  /** 0–100 forecast confidence */
  confidence: number;
  when: StormWhenInfo;
  /** Short non-jargon title */
  plainTitle: string;
  /** What to expect in one sentence */
  plainExpect: string;
  /** Concrete navigation checklist */
  actionableSteps: string[];
  /** What to avoid this window */
  avoidSteps: string[];
}

export type StormLike = {
  date: string;
  dayName: string;
  title: string;
  intensity: 'severe' | 'moderate' | 'mild';
  transitingPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  lifeArea: string;
  description: string;
  navigation: string;
  personalityReaction?: string;
  recoveryNote?: string;
  peakWindow?: string;
  intensityScore?: number;
  phase?: 'brewing' | 'peak';
  keywords?: string[];
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function normalizePlanet(name: string): string {
  return (name || '').trim().toLowerCase();
}

function daysUntilDate(dateStr: string, now = new Date()): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return 0;
  const target = new Date(y, m - 1, d, 12, 0, 0);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

function formatDateLabel(dateStr: string, dayName: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dayName || dateStr;
  const dt = new Date(y, m - 1, d);
  const short = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return short;
}

function relativeLabel(daysUntil: number): string {
  if (daysUntil <= 0) return 'today';
  if (daysUntil === 1) return 'tomorrow';
  if (daysUntil < 7) return `in ${daysUntil} days`;
  if (daysUntil < 14) return 'next week';
  return `in ~${daysUntil} days`;
}

/**
 * Map natal hit + transit flavor → life category.
 * Social · Work · Financial · Health
 */
export function classifyStormCategory(storm: StormLike): {
  category: StormLifeCategory;
  secondaryCategory?: StormLifeCategory;
} {
  const natal = normalizePlanet(storm.natalPlanet);
  const transit = normalizePlanet(storm.transitingPlanet);
  const area = (storm.lifeArea || '').toLowerCase();
  const keys = (storm.keywords || []).join(' ').toLowerCase();
  const blob = `${area} ${keys} ${storm.description || ''}`.toLowerCase();

  const scores: Record<StormLifeCategory, number> = {
    social: 0,
    work: 0,
    financial: 0,
    health: 0,
  };

  // Natal planet primary domain
  if (natal === 'venus') {
    scores.social += 4;
    scores.financial += 2;
  } else if (natal === 'moon') {
    scores.social += 2;
    scores.health += 3;
  } else if (natal === 'mercury') {
    scores.social += 3;
    scores.work += 2;
  } else if (natal === 'sun' || natal === 'ascendant' || natal === 'rising') {
    scores.work += 3;
    scores.health += 1;
    scores.social += 1;
  } else if (natal === 'mars') {
    scores.work += 3;
    scores.health += 2;
    scores.social += 1;
  } else if (natal === 'saturn') {
    scores.work += 4;
    scores.financial += 2;
  } else if (natal === 'jupiter') {
    scores.work += 2;
    scores.financial += 3;
  } else if (natal === 'neptune' || natal === 'pluto') {
    scores.health += 3;
    scores.social += 1;
  } else if (natal === 'uranus') {
    scores.work += 2;
    scores.social += 1;
  }

  // Transiting planet flavor
  if (transit === 'venus') {
    scores.social += 2;
    scores.financial += 2;
  } else if (transit === 'mars') {
    scores.work += 2;
    scores.health += 1;
    scores.social += 1;
  } else if (transit === 'saturn') {
    scores.work += 2;
    scores.financial += 2;
  } else if (transit === 'jupiter') {
    scores.financial += 2;
    scores.work += 1;
  } else if (transit === 'neptune' || transit === 'pluto') {
    scores.health += 2;
  } else if (transit === 'uranus') {
    scores.work += 1;
    scores.social += 1;
  }

  // Life-area / keyword boosts
  if (/love|relation|bond|partner|social|communication|mind|presentation/.test(blob)) {
    scores.social += 3;
  }
  if (/career|work|ambition|discipline|structure|drive|conflict|identity|confidence|authority/.test(blob)) {
    scores.work += 3;
  }
  if (/money|financ|resource|spend|purchase|wealth|value/.test(blob)) {
    scores.financial += 4;
  }
  if (/health|body|energy|fatigue|sleep|nervous|wellbeing|emotional wellbeing|recovery|immune/.test(blob)) {
    scores.health += 3;
  }

  // Venus–Saturn classic: love + money
  if (
    (transit === 'saturn' && natal === 'venus') ||
    (transit === 'venus' && natal === 'saturn')
  ) {
    scores.social += 2;
    scores.financial += 3;
  }

  const ranked = (Object.keys(scores) as StormLifeCategory[]).sort(
    (a, b) => scores[b] - scores[a]
  );
  const category = ranked[0] || 'work';
  const secondary =
    ranked[1] && scores[ranked[1]] >= scores[category] - 1 && scores[ranked[1]] >= 3
      ? ranked[1]
      : undefined;

  return { category, secondaryCategory: secondary === category ? undefined : secondary };
}

export function computeStormConfidence(storm: StormLike): number {
  const score10 =
    typeof storm.intensityScore === 'number' && Number.isFinite(storm.intensityScore)
      ? storm.intensityScore
      : storm.intensity === 'severe'
        ? 8
        : storm.intensity === 'moderate'
          ? 6
          : 4;

  let confidence = score10 * 9; // ~36–90

  // Tighter orb → more confident the window is real
  if (storm.orb < 0.5) confidence += 10;
  else if (storm.orb < 1) confidence += 6;
  else if (storm.orb < 1.5) confidence += 3;
  else confidence -= 4;

  if (storm.intensity === 'severe') confidence += 6;
  if (storm.intensity === 'mild') confidence -= 4;

  if (storm.phase === 'peak') confidence += 5;
  if (storm.phase === 'brewing') confidence += 2;

  // Outer planet hits tend to be slower but more reliable as "weather systems"
  const transit = normalizePlanet(storm.transitingPlanet);
  if (['saturn', 'pluto', 'uranus', 'neptune'].includes(transit)) confidence += 3;

  return clamp(confidence, 42, 94);
}

export function buildStormWhen(storm: StormLike, now = new Date()): StormWhenInfo {
  const daysUntil = daysUntilDate(storm.date, now);
  const dateLabel = formatDateLabel(storm.date, storm.dayName);
  const rel = relativeLabel(daysUntil);
  const phase = storm.phase || 'unknown';
  const windowLabel =
    storm.peakWindow ||
    (phase === 'peak'
      ? 'Most active through the day — peak pressure midday to evening.'
      : 'Building pressure; exact peak may land within a day of this date.');

  const phaseWord =
    phase === 'peak' ? 'peaking' : phase === 'brewing' ? 'building toward peak' : 'active';

  const summary =
    daysUntil <= 0
      ? `${phaseWord.charAt(0).toUpperCase() + phaseWord.slice(1)} today (${dateLabel}). ${windowLabel}`
      : `${phaseWord.charAt(0).toUpperCase() + phaseWord.slice(1)} ${rel} · ${dateLabel}. ${windowLabel}`;

  return {
    date: storm.date,
    dayName: storm.dayName,
    dateLabel,
    relativeLabel: rel,
    daysUntil,
    phase: phase === 'peak' || phase === 'brewing' ? phase : 'unknown',
    windowLabel,
    summary,
  };
}

function plainTitleFor(
  category: StormLifeCategory,
  intensity: StormLike['intensity'],
  phase?: string
): string {
  const severity =
    intensity === 'severe' ? 'High' : intensity === 'moderate' ? 'Elevated' : 'Mild';
  const timing = phase === 'peak' ? 'now' : phase === 'brewing' ? 'building' : 'ahead';

  switch (category) {
    case 'social':
      return `${severity} social friction ${timing}`;
    case 'work':
      return `${severity} work pressure ${timing}`;
    case 'financial':
      return `${severity} money / resource stress ${timing}`;
    case 'health':
      return `${severity} energy / body load ${timing}`;
    default:
      return `${severity} life friction ${timing}`;
  }
}

/** Aspect/planet soup that fails Merlin voice — never lead the card with this. */
function looksLikeAspectSoup(text: string): boolean {
  return /\b(challenging angle|opposes? your natal|squares? your natal|opposition between|conjunction amplifies|merges with your natal|squares? your|trines? your natal|aspect)\b/i.test(
    text,
  );
}

/**
 * Human "what to expect" — coach language first.
 * Technical transit labels stay in Sky driver / pills, not the hero sentence.
 */
function plainExpect(storm: StormLike, category: StormLifeCategory): string {
  const intensity = storm.intensity || 'moderate';
  const peakish = storm.phase === 'peak';

  let base: string;
  switch (category) {
    case 'social':
      base = peakish
        ? 'People dynamics feel sharp now — misreads and short fuses are more likely if you force big talks.'
        : 'People dynamics may feel sharper — misreads, tension, or distance rise if you push conversations cold.';
      break;
    case 'work':
      base = peakish
        ? 'Work pressure is loud — authority, deadlines, or ego heat need a slower, cleaner response.'
        : 'Performance pressure rises. Prefer one priority and reversible commitments until the peak passes.';
      break;
    case 'financial':
      base =
        'Money decisions carry extra weight. Impulse spends and fuzzy deals are higher risk until this window eases.';
      break;
    case 'health':
      base = peakish
        ? 'Body and bandwidth are taking the hit — fatigue and reactivity are plausible. Protect sleep before heroics.'
        : 'Body and nervous system take more of the load. Fatigue, reactivity, or sleep dips are plausible under stress.';
      break;
    default:
      base = 'Life friction is elevated in this window — pace yourself and prefer reversible moves.';
  }

  if (intensity === 'severe') {
    base = `${base} Shrink the plate; half the list is still a win.`;
  }

  // Only use engine description if it already reads human (not aspect soup)
  const raw = (storm.description || '').replace(/\s+/g, ' ').trim();
  const first = raw.match(/^(.+?[.!?])(?:\s|$)/)?.[1] || raw;
  if (first && first.length >= 40 && first.length <= 160 && !looksLikeAspectSoup(first)) {
    return first;
  }

  return base;
}

const CATEGORY_DO_STEPS: Record<StormLifeCategory, string[]> = {
  social: [
    'Have one clear conversation — or none. Avoid pile-on texts.',
    'Name the need, not the accusation.',
    'Leave a 24h cool-down before relationship ultimatums.',
  ],
  work: [
    'Pick one priority deliverable. Defer everything else.',
    'Document decisions; don’t argue them twice.',
    'Prefer reversible commitments until the peak passes.',
  ],
  financial: [
    'Freeze non-essential spending over your personal threshold for 48h.',
    'Sleep on any deal, subscription, or “must buy now” impulse.',
    'Check one real number (balance, invoice, budget) before you act.',
  ],
  health: [
    'Protect sleep and food first — don’t white-knuckle on empty.',
    'Cut one stimulant or late-night screen block tonight.',
    'Move the body lightly; skip hero workouts if depleted.',
  ],
};

const CATEGORY_AVOID: Record<StormLifeCategory, string[]> = {
  social: [
    'Don’t process big relationship drama over text at peak hours.',
    'Avoid recruiting an audience for a private conflict.',
  ],
  work: [
    'Don’t launch high-stakes projects or hard confrontations at peak.',
    'Avoid multitasking under ego heat — errors compound.',
  ],
  financial: [
    'Don’t “fix” stress with shopping or speculative bets.',
    'Avoid signing anything you haven’t re-read sober.',
  ],
  health: [
    'Don’t skip recovery to prove toughness.',
    'Avoid stacking caffeine + conflict + late nights.',
  ],
};

export const GENERIC_STORM_NAV_RE =
  /when this storm approaches|slow down\. reflect on what this area|navigate with patience/i;

export function isGenericStormNav(text: string | null | undefined): boolean {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (!t) return true;
  return GENERIC_STORM_NAV_RE.test(t);
}

const STORM_DOMAIN: Record<StormLifeCategory, string> = {
  social: 'relationships',
  work: 'work',
  financial: 'money',
  health: 'body and energy',
};

/** Same Core/Mask compose rule as Today — category is the domain, not a costume. */
export function composeStormLead(options: {
  category: StormLifeCategory;
  coreType?: string | null;
  maskType?: string | null;
  transitAxis?: string | null;
  deadline?: string | null;
}): { lead: string; avoid: string } | null {
  const dual = composeDualLayerCard({
    coreType: options.coreType,
    maskType: options.maskType,
    deadline: options.deadline || 'tonight',
    domain: STORM_DOMAIN[options.category],
    transitAxis: options.transitAxis,
  });
  if (!dual) return null;

  const threatened = dual.threatened.replace(/\s+—.*$/, '').trim();
  let lead: string;
  switch (options.category) {
    case 'social':
      lead = `${dual.resolution} In this people window: ${dual.behaviorTell}`;
      break;
    case 'work':
      lead = `${dual.resolution} Don't turn ${threatened} into a performance problem.`;
      break;
    case 'financial':
      lead = `Sleep on the spend. ${dual.resolution} Don't buy a feeling of ${threatened}.`;
      break;
    case 'health':
      lead = `Protect sleep and food first. ${dual.resolution} Depletion makes ${threatened} feel like an emergency.`;
      break;
    default:
      lead = dual.resolution;
  }

  return {
    lead: lead.replace(/\s+/g, ' ').trim(),
    avoid: dual.avoid,
  };
}

function uniqueLines(lines: string[], cap: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of lines) {
    const s = raw.replace(/\s+/g, ' ').trim();
    if (!s || isGenericStormNav(s)) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= cap) break;
  }
  return out;
}

/**
 * Overlay Core/Mask compose onto an already-packaged storm.
 * Safe on cached payloads that still carry the old generic "slow down" line.
 */
export function applyDualStormPlaybook<T extends StormLike & Partial<StormPlaybookFields>>(
  storm: T,
  coreType?: string | null,
  maskType?: string | null,
): T {
  const category = storm.category || classifyStormCategory(storm).category;
  const composed = composeStormLead({
    category,
    coreType,
    maskType,
    transitAxis: `${storm.transitingPlanet} to natal ${storm.natalPlanet}`,
    deadline: 'tonight',
  });
  const existingSteps = [...(storm.actionableSteps || [])];
  const existingAvoid = [...(storm.avoidSteps || [])];
  if (!composed) {
    return {
      ...storm,
      category,
      actionableSteps: uniqueLines([...existingSteps, ...CATEGORY_DO_STEPS[category]], 4),
      avoidSteps: uniqueLines([...existingAvoid, ...CATEGORY_AVOID[category]], 2),
    };
  }
  return {
    ...storm,
    category,
    navigation: composed.lead,
    actionableSteps: uniqueLines([composed.lead, ...existingSteps], 4),
    avoidSteps: uniqueLines([composed.avoid, ...existingAvoid], 2),
  };
}

/**
 * Build 3–4 concrete navigate steps + 1–2 avoid lines.
 */
export function buildActionableSteps(
  storm: StormLike,
  category: StormLifeCategory
): { actionableSteps: string[]; avoidSteps: string[] } {
  const baseDo = [...CATEGORY_DO_STEPS[category]];
  const avoid = [...CATEGORY_AVOID[category]];

  // Personalize with engine navigation (first sentence only) — never the generic proverb.
  const nav = (storm.navigation || '').replace(/\s+/g, ' ').trim();
  if (nav && !isGenericStormNav(nav)) {
    const navLine = nav.match(/^(.+?[.!?])(?:\s|$)/)?.[1] || nav.slice(0, 140);
    if (navLine.length > 20) {
      baseDo.unshift(navLine);
    }
  }

  if (storm.recoveryNote?.trim()) {
    baseDo.push(`After peak: ${storm.recoveryNote.trim()}`);
  }

  // Intensity tweak
  if (storm.intensity === 'severe') {
    baseDo.unshift('Shrink the day: half the commitments, double the recovery buffer.');
  }

  // Dedupe and cap
  const seen = new Set<string>();
  const actionableSteps = baseDo
    .map((s) => s.trim())
    .filter((s) => {
      const key = s.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return s.length > 0;
    })
    .slice(0, 4);

  return {
    actionableSteps,
    avoidSteps: avoid.slice(0, 2),
  };
}

/** Attach playbook fields to a raw storm */
export function buildStormPlaybook(storm: StormLike, now = new Date()): StormPlaybookFields {
  const { category, secondaryCategory } = classifyStormCategory(storm);
  const confidence = computeStormConfidence(storm);
  const when = buildStormWhen(storm, now);
  const { actionableSteps, avoidSteps } = buildActionableSteps(storm, category);
  const meta = STORM_CATEGORY_META[category];

  return {
    category,
    secondaryCategory,
    categoryLabel: meta.label,
    confidence,
    when,
    plainTitle: plainTitleFor(category, storm.intensity, storm.phase),
    plainExpect: plainExpect(storm, category),
    actionableSteps,
    avoidSteps,
  };
}

export type EnrichedStorm<T extends StormLike = StormLike> = T & StormPlaybookFields;

export function enrichStorm<T extends StormLike>(storm: T, now = new Date()): EnrichedStorm<T> {
  return { ...storm, ...buildStormPlaybook(storm, now) };
}

export function enrichStorms<T extends StormLike>(storms: T[], now = new Date()): EnrichedStorm<T>[] {
  return storms.map((s) => enrichStorm(s, now));
}

export function groupStormsByCategory<T extends EnrichedStorm>(
  storms: T[]
): Record<StormLifeCategory, T[]> {
  const groups: Record<StormLifeCategory, T[]> = {
    social: [],
    work: [],
    financial: [],
    health: [],
  };
  for (const s of storms) {
    groups[s.category].push(s);
  }
  // Sort each group: soonest first, then higher confidence
  for (const key of Object.keys(groups) as StormLifeCategory[]) {
    groups[key].sort((a, b) => {
      const da = a.when?.daysUntil ?? 99;
      const db = b.when?.daysUntil ?? 99;
      if (da !== db) return da - db;
      return (b.confidence || 0) - (a.confidence || 0);
    });
  }
  return groups;
}

export const STORM_CATEGORY_ORDER: StormLifeCategory[] = [
  'social',
  'work',
  'financial',
  'health',
];
