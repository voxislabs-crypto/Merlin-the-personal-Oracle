import {
  explainDriverInDomain,
  mechanicsLine,
  rewriteLayReason,
} from '@/lib/astrology/pressure-engine/lay-reason';
import type { LifeRiskDomain, LifeRiskPacket } from '@/lib/atmosphere/types';

export interface DomainHitCopy {
  id: string;
  label: string;
  kind: 'friction' | 'support' | 'mixed';
  explanation: string;
  mechanics: string | null;
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

export function domainHitsFromRisk(
  risk: LifeRiskPacket | null | undefined,
  domain: LifeRiskDomain,
): DomainHitCopy[] {
  if (!risk) return [];
  const hits: DomainHitCopy[] = [];

  const windows = [...(risk.frictionWindows || []), ...(risk.supportWindows || [])];
  for (const window of windows) {
    if (!window.domains?.includes(domain)) continue;
    pushUnique(hits, {
      id: window.id,
      label: window.label,
      kind: window.kind,
      explanation: explainDriverInDomain(
        {
          label: window.label,
          reason: window.label,
          valence: window.kind === 'support' ? 0.4 : window.kind === 'friction' ? -0.4 : 0,
        },
        domain,
      ),
      mechanics: mechanicsLine({ label: window.label }),
    });
  }

  for (const driver of risk.topDrivers || []) {
    if (!driver.domains?.includes(domain)) continue;
    pushUnique(hits, {
      id: `driver-${driver.label}`,
      label: driver.label,
      kind: driver.kind,
      explanation: explainDriverInDomain(
        {
          label: driver.label,
          reason: driver.label,
          valence: driver.kind === 'support' ? 0.4 : driver.kind === 'friction' ? -0.4 : 0,
        },
        domain,
      ),
      mechanics: mechanicsLine({ label: driver.label }),
    });
  }

  return hits.slice(0, 8);
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
