/**
 * Tokenize Oracle chat copy for colorful rendering:
 * - planet names → per-planet colors
 * - severity phrases → calm / caution / storm tints
 */

export type OracleSeverity = 'calm' | 'neutral' | 'caution' | 'storm';

export type OracleTextToken =
  | { type: 'text'; value: string }
  | { type: 'planet'; value: string; canonical: string }
  | { type: 'severity'; value: string; severity: Exclude<OracleSeverity, 'neutral'> };

/** Longest-first so "North Node" wins over "Node" */
const PLANET_ALIASES: Array<{ pattern: string; canonical: string }> = [
  { pattern: 'North Node', canonical: 'North Node' },
  { pattern: 'South Node', canonical: 'South Node' },
  { pattern: 'True Node', canonical: 'North Node' },
  { pattern: 'Midheaven', canonical: 'Midheaven' },
  { pattern: 'Ascendant', canonical: 'Ascendant' },
  { pattern: 'Rising', canonical: 'Ascendant' },
  { pattern: 'Mercury', canonical: 'Mercury' },
  { pattern: 'Jupiter', canonical: 'Jupiter' },
  { pattern: 'Saturn', canonical: 'Saturn' },
  { pattern: 'Uranus', canonical: 'Uranus' },
  { pattern: 'Neptune', canonical: 'Neptune' },
  { pattern: 'Pluto', canonical: 'Pluto' },
  { pattern: 'Chiron', canonical: 'Chiron' },
  { pattern: 'Lilith', canonical: 'Lilith' },
  { pattern: 'Venus', canonical: 'Venus' },
  { pattern: 'Mars', canonical: 'Mars' },
  { pattern: 'Moon', canonical: 'Moon' },
  { pattern: 'Sun', canonical: 'Sun' },
  { pattern: 'MC', canonical: 'Midheaven' },
];

/** Distinct planet hues for chat (readable on dark slate). */
export const ORACLE_PLANET_HEX: Record<string, string> = {
  Sun: '#fbbf24',
  Moon: '#e2e8f0',
  Mercury: '#94a3b8',
  Venus: '#f9a8d4',
  Mars: '#fb7185',
  Jupiter: '#f59e0b',
  Saturn: '#cbd5e1',
  Uranus: '#22d3ee',
  Neptune: '#818cf8',
  Pluto: '#c084fc',
  Chiron: '#2dd4bf',
  Lilith: '#a78bfa',
  'North Node': '#4ade80',
  'South Node': '#fb923c',
  Ascendant: '#fdba74',
  Midheaven: '#c4b5fd',
};

const SEVERITY_PATTERNS: Array<{
  severity: Exclude<OracleSeverity, 'neutral'>;
  re: RegExp;
}> = [
  {
    severity: 'storm',
    re: /\b(?:storms?|crisis|severe|danger(?:ous)?|collapse|shutdown|volatile|under fire|hard aspects?|break(?:s|ing)? down|meltdown|catastrophic|brutal|crushing|disaster)\b/gi,
  },
  {
    severity: 'caution',
    re: /\b(?:tension|pressure|careful|friction|challenge|strain|heavy|blocked|volatile window|caution|warning|friction|struggle|friction|risk(?:y)?|unstable|difficult|friction)\b/gi,
  },
  {
    severity: 'calm',
    re: /\b(?:ease|easy|open|support|opportunity|harmon(?:y|ious)|clear|flow|grace|relief|stable|gentle|soft landing|green light|window of ease|favorable)\b/gi,
  },
];

export const ORACLE_SEVERITY_SHELL: Record<
  OracleSeverity,
  { bubble: string; text: string; label: string; accent: string }
> = {
  calm: {
    bubble: 'border-emerald-400/35 bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-900',
    text: 'text-emerald-50/95',
    label: 'Clear air',
    accent: 'text-emerald-300',
  },
  neutral: {
    bubble: 'border-slate-700/80 bg-slate-900',
    text: 'text-slate-100',
    label: '',
    accent: 'text-sky-300',
  },
  caution: {
    bubble: 'border-amber-400/40 bg-gradient-to-br from-amber-950/45 via-slate-900 to-slate-900',
    text: 'text-amber-50/95',
    label: 'Elevated',
    accent: 'text-amber-300',
  },
  storm: {
    bubble: 'border-rose-400/45 bg-gradient-to-br from-rose-950/50 via-slate-900 to-slate-900',
    text: 'text-rose-50/95',
    label: 'High pressure',
    accent: 'text-rose-300',
  },
};

export const ORACLE_SEVERITY_SPAN: Record<Exclude<OracleSeverity, 'neutral'>, string> = {
  calm: 'text-emerald-300 font-medium',
  caution: 'text-amber-300 font-semibold',
  storm: 'text-rose-300 font-semibold',
};

function buildPlanetRegex(): RegExp {
  const parts = PLANET_ALIASES.map((p) => p.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(?:${parts.join('|')})\\b`, 'gi');
}

const PLANET_RE = buildPlanetRegex();

function canonicalPlanet(match: string): string {
  const key = match.trim().toLowerCase();
  const hit = PLANET_ALIASES.find((p) => p.pattern.toLowerCase() === key);
  return hit?.canonical || match;
}

type Span = { start: number; end: number; token: OracleTextToken };

/**
 * Score overall message tone for bubble chrome.
 */
export function scoreOracleSeverity(text: string): OracleSeverity {
  if (!text?.trim()) return 'neutral';

  let storm = 0;
  let caution = 0;
  let calm = 0;

  for (const { severity, re } of SEVERITY_PATTERNS) {
    re.lastIndex = 0;
    const matches = text.match(re);
    const n = matches?.length ?? 0;
    if (severity === 'storm') storm += n * 3;
    if (severity === 'caution') caution += n * 2;
    if (severity === 'calm') calm += n;
  }

  // Aspect language leans caution/storm
  if (/\b(square|opposition|hard aspect)\b/i.test(text)) caution += 2;
  if (/\b(trine|sextile)\b/i.test(text)) calm += 1;

  if (storm >= 3 && storm >= caution) return 'storm';
  if (storm >= 2 && caution >= 1) return 'storm';
  if (caution >= 2 && caution > calm) return 'caution';
  if (calm >= 2 && calm > caution && storm === 0) return 'calm';
  if (storm > 0 && storm >= caution) return 'storm';
  if (caution > 0) return 'caution';
  if (calm > 0) return 'calm';
  return 'neutral';
}

/**
 * Split text into plain / planet / severity tokens for rich rendering.
 */
export function tokenizeOracleText(text: string): OracleTextToken[] {
  if (!text) return [];

  const spans: Span[] = [];

  // Planets
  PLANET_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PLANET_RE.exec(text)) !== null) {
    const value = m[0];
    spans.push({
      start: m.index,
      end: m.index + value.length,
      token: { type: 'planet', value, canonical: canonicalPlanet(value) },
    });
  }

  // Severity phrases (skip ranges already claimed by planets)
  for (const { severity, re } of SEVERITY_PATTERNS) {
    re.lastIndex = 0;
    let sm: RegExpExecArray | null;
    while ((sm = re.exec(text)) !== null) {
      const start = sm.index;
      const end = start + sm[0].length;
      const overlaps = spans.some((s) => !(end <= s.start || start >= s.end));
      if (overlaps) continue;
      spans.push({
        start,
        end,
        token: { type: 'severity', value: sm[0], severity },
      });
    }
  }

  spans.sort((a, b) => a.start - b.start || b.end - a.end);

  // Greedy non-overlapping
  const picked: Span[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start < cursor) continue;
    picked.push(span);
    cursor = span.end;
  }

  const tokens: OracleTextToken[] = [];
  let i = 0;
  for (const span of picked) {
    if (span.start > i) {
      tokens.push({ type: 'text', value: text.slice(i, span.start) });
    }
    tokens.push(span.token);
    i = span.end;
  }
  if (i < text.length) {
    tokens.push({ type: 'text', value: text.slice(i) });
  }

  return tokens.length > 0 ? tokens : [{ type: 'text', value: text }];
}
