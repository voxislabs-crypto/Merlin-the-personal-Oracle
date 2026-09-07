'use client';

import { useState } from 'react';
import type { DomainStripItem, DomainTrend } from '@/lib/atmosphere/domain-strip';
import type { LifeRiskDomain, LifeRiskPacket } from '@/lib/atmosphere/types';
import { domainHitsFromRisk } from '@/lib/atmosphere/domain-detail';
import { domainInPlainWords, domainSurfaceLine } from '@/lib/astrology/pressure-engine/lay-reason';
import { ShowMechanics } from '@/components/dashboard/ShowMechanics';

export interface LifeDomainStripProps {
  items: DomainStripItem[];
  riskPercent?: number | null;
  risk?: LifeRiskPacket | null;
  className?: string;
  onOpenTransitList?: () => void;
}

function trendClass(trend: DomainStripItem['trend']): string {
  if (trend === 'up') return 'text-sky-100 border-sky-400/40 bg-sky-500/15';
  if (trend === 'down') return 'text-rose-100 border-rose-400/40 bg-rose-500/15';
  return 'text-slate-200 border-white/15 bg-white/5';
}

function trendToTone(trend: DomainTrend): 'pressure' | 'opportunity' | 'neutral' {
  if (trend === 'down') return 'pressure';
  if (trend === 'up') return 'opportunity';
  return 'neutral';
}

/**
 * First screen: a colored sentence. Mechanics stay behind a toggle.
 */
export function LifeDomainStrip({
  items,
  riskPercent,
  risk = null,
  className = '',
  onOpenTransitList,
}: LifeDomainStripProps) {
  const [openId, setOpenId] = useState<LifeRiskDomain | null>(null);
  if (!items.length && riskPercent == null) return null;

  const openItem = items.find((item) => item.id === openId) || null;
  const hits = openId ? domainHitsFromRisk(risk, openId) : [];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:text-xs ${trendClass(item.trend)} ${
              openId === item.id ? 'ring-1 ring-white/40' : ''
            }`}
            title={domainSurfaceLine(item.id, trendToTone(item.trend))}
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            aria-expanded={openId === item.id}
          >
            {domainSurfaceLine(item.id, trendToTone(item.trend))}
          </button>
        ))}
        {typeof riskPercent === 'number' ? (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-100 sm:text-xs"
            title="Hard-aspect load for this window — not the Storm Watch alarm"
          >
            <span className="text-sky-300/80 font-medium">Friction</span>
            <span className="tabular-nums">{riskPercent}%</span>
          </span>
        ) : null}
      </div>

      {openItem ? (
        <div className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5">
          <p className={`text-sm font-semibold ${openItem.trend === 'down' ? 'text-rose-100' : openItem.trend === 'up' ? 'text-sky-100' : 'text-slate-200'}`}>
            {domainSurfaceLine(openItem.id, trendToTone(openItem.trend))}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Only what is touching {domainInPlainWords(openItem.id)} right now.
          </p>
          {hits.length ? (
            <ul className="mt-2 space-y-2">
              {hits.map((hit) => (
                <li key={hit.id} className="rounded-md bg-black/30 px-2.5 py-2">
                  <p className="text-xs leading-relaxed text-slate-200">{hit.explanation}</p>
                  <ShowMechanics className="mt-1.5" lines={[hit.mechanics]} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-400">Quiet in this area — no specific transit is scoring it today.</p>
          )}
          {onOpenTransitList ? (
            <button
              type="button"
              onClick={onOpenTransitList}
              className="mt-2 text-[11px] font-medium text-sky-300 underline-offset-2 hover:underline"
            >
              See full transit list
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
