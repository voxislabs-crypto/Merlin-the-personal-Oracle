import {
  explainHitsInDomain,
  mechanicsLine,
  rewriteLayReason,
} from '@/lib/astrology/pressure-engine/lay-reason';
import type { LifeRiskDomain, LifeRiskDomainHit, LifeRiskPacket } from '@/lib/atmosphere/types';

export interface DomainHitCopy {
  id: string;
  label: string;
  kind: 'friction' | 'support' | 'mixed';
  explanation: string;
  mechanics: string | null;
  reason?: string;
  daysToPeak?: number;
}

export interface DomainDetailPayload {
  domain: LifeRiskDomain;
  pressure: number;
  opportunity: number;
  hits: DomainHitCopy[];
}

export function transitIdentityKey(label: string): string {
  return (label || '')
    .toLowerCase()
    .replace(/\bnatal\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pushUnique(hits: DomainHitCopy[], hit: DomainHitCopy) {
  const key = transitIdentityKey(hit.mechanics || hit.label);
  if (!key) return;
  if (hits.some((existing) => transitIdentityKey(existing.mechanics || existing.label) === key)) {
    return;
  }
  hits.push(hit);
}

function hitFromNamed(
  _domain: LifeRiskDomain,
  row: Pick<LifeRiskDomainHit, 'label' | 'kind' | 'reason' | 'daysToPeak'>,
  id: string,
): DomainHitCopy {
  return {
    id,
    label: row.label,
    kind: row.kind,
    reason: row.reason,
    daysToPeak: row.daysToPeak,
    explanation: '',
    mechanics: mechanicsLine({ label: row.label }),
  };
}

function uniquifyExplanations(hits: DomainHitCopy[], domain: LifeRiskDomain): DomainHitCopy[] {
  const lines = explainHitsInDomain(hits, domain);
  return hits.map((hit, index) => ({ ...hit, explanation: lines[index] || hit.explanation }));
}

export function domainHitsFromRisk(
  risk: LifeRiskPacket | null | undefined,
  domain: LifeRiskDomain,
): DomainHitCopy[] {
  if (!risk) return [];
  const hits: DomainHitCopy[] = [];

  const scored = risk.domains?.find((row) => row.name === domain);
  for (const row of scored?.hits || []) {
    pushUnique(hits, hitFromNamed(domain, row, `score-${row.label}`));
  }

  const windows = [...(risk.frictionWindows || []), ...(risk.supportWindows || [])];
  for (const window of windows) {
    if (!window.domains?.includes(domain)) continue;
    pushUnique(hits, {
      id: window.id,
      label: window.label,
      kind: window.kind,
      daysToPeak: window.daysToPeak,
      explanation: '',
      mechanics: mechanicsLine({ label: window.label }),
    });
  }

  for (const driver of risk.topDrivers || []) {
    if (!driver.domains?.includes(domain)) continue;
    pushUnique(hits, {
      id: `driver-${driver.label}`,
      label: driver.label,
      kind: driver.kind,
      explanation: '',
      mechanics: mechanicsLine({ label: driver.label }),
    });
  }

  return uniquifyExplanations(hits.slice(0, 8), domain);
}

export function buildDomainDetailPayload(
  risk: LifeRiskPacket | null | undefined,
  item: {
    id: LifeRiskDomain;
    friction: number;
    support: number;
    hits?: LifeRiskDomainHit[];
  },
): DomainDetailPayload {
  const scored = risk?.domains?.find((row) => row.name === item.id);
  let hits = domainHitsFromRisk(risk, item.id);
  if (!hits.length) {
    const fallback: DomainHitCopy[] = [];
    for (const row of item.hits || []) {
      pushUnique(fallback, hitFromNamed(item.id, row, `item-${row.label}`));
    }
    hits = uniquifyExplanations(fallback, item.id);
  }
  return {
    domain: item.id,
    pressure: scored?.friction ?? item.friction,
    opportunity: scored?.support ?? item.support,
    hits,
  };
}

export function uniqueExplanations(hits: DomainHitCopy[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const hit of hits) {
    const key = (hit.explanation || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(hit.explanation);
  }
  return out;
}

export function uniqueMechanics(hits: DomainHitCopy[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const hit of hits) {
    const line = (hit.mechanics || '').trim();
    const key = transitIdentityKey(line);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}

export function moodLayReason(
  themeLabel: string | null | undefined,
  driverReason: string | null | undefined,
): string {
  const rewritten = rewriteLayReason(driverReason || '');
  if (!themeLabel) return rewritten;
  return rewritten;
}
