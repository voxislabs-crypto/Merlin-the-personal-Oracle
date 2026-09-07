'use client';

import { useState } from 'react';
import type { DomainScore, DomainTone } from '@/types/astrology';
import {
  domainInPlainWords,
  domainSurfaceLine,
  explainDriverInDomain,
  mechanicsLine,
} from '@/lib/astrology/pressure-engine/lay-reason';
import { ShowMechanics } from '@/components/dashboard/ShowMechanics';

function toneClass(tone: DomainTone): string {
  if (tone === 'pressure') return 'border-rose-400/40 bg-rose-950/30 text-rose-100';
  if (tone === 'opportunity') return 'border-sky-400/40 bg-sky-950/30 text-sky-100';
  return 'border-white/15 bg-slate-900/50 text-slate-200';
}

export function DomainScoreList({
  domains,
  onOpenTransitList,
}: {
  domains: DomainScore[];
  onOpenTransitList?: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (!domains.length) return null;

  return (
    <div className="space-y-2">
      {domains.map((domain) => {
        const open = openId === domain.domain;
        const tone = domain.tone || domainToneFromLegacy(domain);
        return (
          <div key={domain.domain} className={`rounded-lg border ${toneClass(tone)}`}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
              onClick={() => setOpenId(open ? null : domain.domain)}
              aria-expanded={open}
            >
              <span className="text-sm font-semibold">{domainSurfaceLine(domain.domain, tone)}</span>
            </button>
            {open ? (
              <div className="space-y-2 border-t border-white/10 px-3 py-2.5">
                <p className="text-[11px] text-slate-400">
                  Only what is touching {domainInPlainWords(domain.domain)} right now.
                </p>
                {domain.topDrivers.length ? (
                  <div className="rounded-md bg-black/25 px-2.5 py-2">
                    {Array.from(
                      new Set(
                        domain.topDrivers.map((driver) =>
                          explainDriverInDomain(driver, domain.domain),
                        ),
                      ),
                    ).map((line) => (
                      <p key={line} className="text-xs leading-relaxed text-slate-200">
                        {line}
                      </p>
                    ))}
                    <ShowMechanics
                      className="mt-1.5"
                      lines={domain.topDrivers.map((driver) =>
                        mechanicsLine({
                          label: driver.label,
                          transitingPlanet: driver.transitingPlanet,
                          aspect: driver.aspect,
                          natalPlanet: driver.natalPlanet,
                          orbDeg: driver.orbDeg,
                        }),
                      )}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Quiet here — no transit is scoring this area today.</p>
                )}
                {onOpenTransitList ? (
                  <button
                    type="button"
                    onClick={onOpenTransitList}
                    className="text-[11px] font-medium text-sky-300 underline-offset-2 hover:underline"
                  >
                    See full transit list
                  </button>
                ) : null}
              </div>
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
