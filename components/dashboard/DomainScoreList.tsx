'use client';

import { useState } from 'react';
import type { DomainScore, DomainTone, TransitDriver } from '@/types/astrology';
import { lifeDomainsForDriver } from '@/lib/astrology/pressure-engine/domains';
import {
  domainSurfaceLine,
  explainHitsInDomain,
  mechanicsLine,
} from '@/lib/astrology/pressure-engine/lay-reason';
import { DomainDrillDown } from '@/components/dashboard/DomainDrillDown';

function toneClass(tone: DomainTone): string {
  if (tone === 'pressure') return 'border-rose-400/40 bg-rose-950/30 text-rose-100';
  if (tone === 'opportunity') return 'border-sky-400/40 bg-sky-950/30 text-sky-100';
  return 'border-white/15 bg-slate-900/50 text-slate-200';
}

export interface DomainScoreDetail {
  domain: string;
  pressure: number;
  opportunity: number;
  explanations: string[];
  mechanics: Array<string | null>;
}

function transitsForDomain(domain: DomainScore, fallback: TransitDriver[]): TransitDriver[] {
  if (domain.topDrivers?.length) return domain.topDrivers;
  return (fallback || []).filter((driver) => lifeDomainsForDriver(driver).includes(domain.domain));
}

function buildDomainScoreDetail(
  domain: DomainScore,
  fallbackDrivers: TransitDriver[],
): DomainScoreDetail {
  const transits = transitsForDomain(domain, fallbackDrivers);
  const explanations = explainHitsInDomain(transits, domain.domain);
  const mechanics = transits.map((driver) =>
    mechanicsLine({
      label: driver.label,
      transitingPlanet: driver.transitingPlanet,
      aspect: driver.aspect,
      natalPlanet: driver.natalPlanet,
      orbDeg: driver.orbDeg,
    }),
  );
  return {
    domain: domain.domain,
    pressure: domain.pressure,
    opportunity: domain.opportunity ?? 0,
    explanations,
    mechanics,
  };
}

export function DomainScoreList({
  domains,
  fallbackDrivers = [],
  onOpenTransitList,
}: {
  domains: DomainScore[];
  fallbackDrivers?: TransitDriver[];
  onOpenTransitList?: () => void;
}) {
  const [detail, setDetail] = useState<DomainScoreDetail | null>(null);
  if (!domains.length) return null;

  const openDomain = (domain: DomainScore) => {
    if (detail?.domain === domain.domain) {
      setDetail(null);
      return;
    }
    setDetail(buildDomainScoreDetail(domain, fallbackDrivers));
  };

  return (
    <div className="space-y-2">
      {domains.map((domain) => {
        const open = detail?.domain === domain.domain;
        const tone = domain.tone || domainToneFromLegacy(domain);
        return (
          <div key={domain.domain} className={`rounded-lg border ${toneClass(tone)}`}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
              onClick={() => openDomain(domain)}
              aria-expanded={open}
            >
              <span>
                <span className="block text-sm font-semibold">{domainSurfaceLine(domain.domain, tone)}</span>
                <span className="mt-0.5 block text-[11px] font-medium tabular-nums opacity-80">
                  {`Pressure ${Math.round(domain.pressure)}/100 · Opportunity ${Math.round(domain.opportunity ?? 0)}/100`}
                </span>
              </span>
            </button>
            {open && detail ? (
              <DomainDrillDown
                domain={detail.domain}
                pressure={detail.pressure}
                opportunity={detail.opportunity}
                explanations={detail.explanations}
                mechanics={detail.mechanics}
                onOpenTransitList={onOpenTransitList}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function domainToneFromLegacy(domain: DomainScore): DomainTone {
  if (domain.tone) return domain.tone;
  const opportunity = domain.opportunity ?? 0;
  if (opportunity >= 22 && opportunity >= (domain.pressure || 0) + 6) return 'opportunity';
  if ((domain.pressure || 0) >= 42) return 'pressure';
  return 'neutral';
}
