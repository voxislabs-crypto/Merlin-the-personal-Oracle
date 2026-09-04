'use client';

import { useState } from 'react';
import type { MBTIType } from '@/lib/mbti-overlay';
import { MBTI_TYPE_CODES } from '@/lib/personality/mbti-override';

export interface MbtiCoreOverrideControlProps {
  calculatedCore?: string | null;
  coreOverride?: string | null;
  onSet: (type: MBTIType) => void | Promise<void>;
  onClear: () => void | Promise<void>;
  saving?: boolean;
  disabled?: boolean;
}

/**
 * Firmware-only type pick: Calculated (engine) vs I set this (user layer).
 * Sits next to the Rx overlay on You.
 */
export function MbtiCoreOverrideControl({
  calculatedCore,
  coreOverride,
  onSet,
  onClear,
  saving = false,
  disabled = false,
}: MbtiCoreOverrideControlProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const userSet = Boolean(coreOverride);
  const engineLabel = calculatedCore ? `Calculated` : 'Calculated';

  return (
    <div className="inline-flex flex-col items-end gap-1.5">
      <div className="inline-flex flex-wrap items-center gap-1.5">
        <div
          className="inline-flex rounded-full border border-white/15 bg-black/25 p-0.5"
          role="group"
          aria-label="Core type source"
        >
          <button
            type="button"
            disabled={disabled || saving}
            aria-pressed={!userSet}
            title={
              calculatedCore
                ? `Use the engine Core (${calculatedCore})`
                : 'Use the engine Core from your chart'
            }
            onClick={() => {
              setPickerOpen(false);
              if (userSet) void onClear();
            }}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              !userSet
                ? 'bg-slate-100/15 text-slate-50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {engineLabel}
          </button>
          <button
            type="button"
            disabled={disabled || saving}
            aria-pressed={userSet}
            aria-expanded={pickerOpen}
            title="I already know my Core type"
            onClick={() => setPickerOpen((open) => !open)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              userSet
                ? 'bg-amber-500/30 text-amber-50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {userSet && coreOverride ? `I set this · ${coreOverride}` : 'I set this'}
          </button>
        </div>
        {userSet ? (
          <button
            type="button"
            disabled={disabled || saving}
            onClick={() => {
              setPickerOpen(false);
              void onClear();
            }}
            className="text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-rose-300 hover:underline"
          >
            Use engine
          </button>
        ) : null}
      </div>

      {pickerOpen ? (
        <div className="z-20 w-[min(100vw-2rem,18rem)] rounded-xl border border-amber-400/30 bg-slate-950/95 p-2 shadow-xl shadow-black/40">
          <p className="px-1 pb-1.5 text-[10px] uppercase tracking-[0.16em] text-amber-200/80">
            Core · firmware only
          </p>
          <div className="grid grid-cols-4 gap-1">
            {MBTI_TYPE_CODES.map((type) => {
              const selected = coreOverride === type;
              const engine = calculatedCore === type;
              return (
                <button
                  key={type}
                  type="button"
                  disabled={disabled || saving}
                  onClick={() => {
                    void onSet(type);
                    setPickerOpen(false);
                  }}
                  className={`rounded-md px-1.5 py-1 text-[11px] font-semibold tabular-nums transition-colors ${
                    selected
                      ? 'bg-amber-500/35 text-amber-50'
                      : engine
                        ? 'border border-white/15 text-slate-200 hover:bg-white/10'
                        : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
          {calculatedCore ? (
            <p className="px-1 pt-1.5 text-[10px] text-slate-500">
              Engine currently reads {calculatedCore}. Mask stays calculated.
            </p>
          ) : (
            <p className="px-1 pt-1.5 text-[10px] text-slate-500">
              Mask stays calculated. This does not rescore the chart.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
