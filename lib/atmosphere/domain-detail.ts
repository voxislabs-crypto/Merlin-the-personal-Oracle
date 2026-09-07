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

export function domainHitsFromRisk(
  risk: LifeRiskPacket | null | undefined,
  domain: LifeRiskDomain,
): DomainHitCopy[] {
  if (!risk) return [];
  const hits: DomainHitCopy[] = [];

  const windows = [...(risk.frictionWindows || []), ...(risk.supportWindows || [])];
  for (const window of windows) {
    if (!window.domains?.includes(domain)) continue;
    hits.push({
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
    if (hits.some((hit) => hit.label === driver.label)) continue;
    hits.push({
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

export function moodLayReason(
  themeLabel: string | null | undefined,
  driverReason: string | null | undefined,
): string {
  const rewritten = rewriteLayReason(driverReason || '');
  if (!themeLabel) return rewritten;
  return rewritten;
}
