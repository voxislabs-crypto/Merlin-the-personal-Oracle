/**
 * Evidence the Today card already calculated, normalized for the polish cache
 * and the client request identity. No interpretation lives here.
 */

export const TODAY_BRIEF_PROMPT_VERSION = 'evidence-v2';
export const TODAY_BRIEF_SCHEMA_VERSION = 'three-lines-v1';

export const TODAY_BRIEF_LIMITS = {
  date: 12,
  leadFact: 280,
  leadFactDisplay: 80,
  chartWhy: 800,
  move: 400,
  watchFor: 280,
  operationalTension: 400,
  doNot: 220,
  coreType: 8,
  maskType: 8,
  sunSign: 24,
  moonSign: 24,
  moonPhase: 40,
  domains: 4,
  domainLength: 80,
  supportingFacts: 4,
  factLength: 180,
} as const;

const HOT_DOMAIN_FRICTION = 48;

export interface TodayBriefEvidenceInput {
  date?: string | null;
  leadFact?: string | null;
  leadFactDisplay?: string | null;
  chartWhy?: string | null;
  move?: string | null;
  watchFor?: string | null;
  operationalTension?: string | null;
  doNot?: string | null;
  coreType?: string | null;
  maskType?: string | null;
  sunSign?: string | null;
  moonSign?: string | null;
  moonPhase?: string | null;
  domains?: string[] | null;
  supportingFacts?: string[] | null;
  heldFromYesterday?: boolean;
  yesterdayRestless?: boolean;
  streak?: number | null;
}

export interface TodayBriefEvidence {
  date: string;
  leadFact: string;
  leadFactDisplay: string;
  chartWhy: string;
  move: string;
  watchFor: string;
  operationalTension: string;
  doNot: string;
  coreType: string;
  maskType: string;
  sunSign: string;
  moonSign: string;
  moonPhase: string;
  domains: string[];
  supportingFacts: string[];
  heldFromYesterday: boolean;
  yesterdayRestless: boolean;
  streak: number | null;
}

function clipText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function clipList(values: unknown, limit: number, max: number): string[] {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const text = clipText(raw, max);
    if (!text) continue;
    const id = text.toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}

/** Same evidence must produce the same identity, including prompt and schema versions. */
export function normalizeTodayBriefEvidence(input: TodayBriefEvidenceInput): TodayBriefEvidence {
  const streak =
    typeof input.streak === 'number' && Number.isFinite(input.streak) ? input.streak : null;
  return {
    date: clipText(input.date, TODAY_BRIEF_LIMITS.date),
    leadFact: clipText(input.leadFact, TODAY_BRIEF_LIMITS.leadFact),
    leadFactDisplay: clipText(input.leadFactDisplay, TODAY_BRIEF_LIMITS.leadFactDisplay),
    chartWhy: clipText(input.chartWhy, TODAY_BRIEF_LIMITS.chartWhy),
    move: clipText(input.move, TODAY_BRIEF_LIMITS.move),
    watchFor: clipText(input.watchFor, TODAY_BRIEF_LIMITS.watchFor),
    operationalTension: clipText(input.operationalTension, TODAY_BRIEF_LIMITS.operationalTension),
    doNot: clipText(input.doNot, TODAY_BRIEF_LIMITS.doNot),
    coreType: clipText(input.coreType, TODAY_BRIEF_LIMITS.coreType).toUpperCase(),
    maskType: clipText(input.maskType, TODAY_BRIEF_LIMITS.maskType).toUpperCase(),
    sunSign: clipText(input.sunSign, TODAY_BRIEF_LIMITS.sunSign),
    moonSign: clipText(input.moonSign, TODAY_BRIEF_LIMITS.moonSign),
    moonPhase: clipText(input.moonPhase, TODAY_BRIEF_LIMITS.moonPhase),
    domains: clipList(input.domains, TODAY_BRIEF_LIMITS.domains, TODAY_BRIEF_LIMITS.domainLength),
    supportingFacts: clipList(
      input.supportingFacts,
      TODAY_BRIEF_LIMITS.supportingFacts,
      TODAY_BRIEF_LIMITS.factLength,
    ),
    heldFromYesterday: input.heldFromYesterday === true,
    yesterdayRestless: input.yesterdayRestless === true,
    streak,
  };
}

/** Client request identity. The server hashes this same string. */
export function todayBriefEvidenceKey(evidence: TodayBriefEvidence): string {
  return [
    TODAY_BRIEF_PROMPT_VERSION,
    TODAY_BRIEF_SCHEMA_VERSION,
    evidence.date,
    evidence.leadFact,
    evidence.leadFactDisplay,
    evidence.chartWhy,
    evidence.move,
    evidence.watchFor,
    evidence.operationalTension,
    evidence.doNot,
    evidence.coreType,
    evidence.maskType,
    evidence.sunSign,
    evidence.moonSign,
    evidence.moonPhase,
    evidence.domains.join('\u001f'),
    evidence.supportingFacts.join('\u001f'),
    evidence.heldFromYesterday ? '1' : '0',
    evidence.yesterdayRestless ? '1' : '0',
    evidence.streak === null ? '' : String(evidence.streak),
  ].join('\u001e');
}

/** Hot life domains already scored on the atmosphere packet. Loudest first. */
export function hotDomainLabels(
  domains:
    | Array<{ name?: string | null; label?: string | null; friction?: number | null }>
    | null
    | undefined,
): string[] {
  return [...(domains || [])]
    .filter((domain) => typeof domain.friction === 'number' && domain.friction >= HOT_DOMAIN_FRICTION)
    .sort((a, b) => (b.friction || 0) - (a.friction || 0))
    .slice(0, TODAY_BRIEF_LIMITS.domains)
    .map((domain) => clipText(domain.label || domain.name, TODAY_BRIEF_LIMITS.domainLength))
    .filter(Boolean);
}

/** Short facts the Today card already shows. Domain job is included when present. */
export function supportingFactLines(
  signals: Array<{ label?: string | null; hint?: string | null }> | null | undefined,
  domainJob?: string | null,
): string[] {
  const lines = (signals || [])
    .slice(0, 3)
    .map((signal) =>
      [signal.label, signal.hint]
        .map((part) => clipText(part, TODAY_BRIEF_LIMITS.factLength))
        .filter(Boolean)
        .join(': '),
    )
    .filter(Boolean);
  const job = clipText(domainJob, TODAY_BRIEF_LIMITS.factLength);
  if (job) lines.push(job);
  return lines.slice(0, TODAY_BRIEF_LIMITS.supportingFacts);
}
