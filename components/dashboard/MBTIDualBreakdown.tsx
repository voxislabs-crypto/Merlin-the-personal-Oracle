'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronDown, Theater, Eye } from 'lucide-react';
import type { DualOverlay } from '@/lib/personality/dual-overlay';
import {
  buildBlendSynthesis,
  getDimensionMeta,
  type BlendSynthesis,
} from '@/lib/personality/mbti-blend-synthesis';

type DimensionKey = 'e_i' | 's_n' | 't_f' | 'j_p';

const DIMENSION_KEYS: DimensionKey[] = ['e_i', 's_n', 't_f', 'j_p'];

interface MBTIDualBreakdownProps {
  dualOverlay: DualOverlay;
}

function DimensionToggle({
  left,
  right,
  selected,
  accent,
}: {
  left: string;
  right: string;
  selected: string;
  accent: 'orange' | 'violet';
}) {
  const activeClass =
    accent === 'orange'
      ? 'bg-orange-500/30 text-orange-100 border-orange-400/50'
      : 'bg-violet-500/30 text-violet-100 border-violet-400/50';
  const inactiveClass = 'bg-slate-800/60 text-slate-500 border-slate-700/40';

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {[left, right].map((letter) => {
        const active = letter === selected;
        return (
          <div
            key={letter}
            className={`rounded-md border px-2 py-1.5 text-center text-sm font-bold transition-colors ${
              active ? activeClass : inactiveClass
            }`}
          >
            {letter}
          </div>
        );
      })}
    </div>
  );
}

function LayerColumn({
  layer,
  accent,
  expandedReasoning,
  onToggleReasoning,
}: {
  layer: DualOverlay['hardware'];
  accent: 'orange' | 'violet';
  expandedReasoning: boolean;
  onToggleReasoning: () => void;
}) {
  const borderClass = accent === 'orange' ? 'border-orange-400/30' : 'border-violet-400/30';
  const textClass = accent === 'orange' ? 'text-orange-200' : 'text-violet-200';
  const subtextClass = accent === 'orange' ? 'text-orange-300/70' : 'text-violet-300/70';
  const Icon = accent === 'orange' ? Theater : Eye;

  return (
    <div className={`rounded-xl border ${borderClass} bg-slate-900/50 p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${textClass}`} />
        <div>
          <p className={`text-xs uppercase tracking-widest font-semibold ${subtextClass}`}>
            {layer.sublabel}
          </p>
          <p className={`text-lg font-bold ${textClass}`}>{layer.mbtiType}</p>
        </div>
        <span className="ml-auto text-xs text-slate-500">{layer.confidence}%</span>
      </div>

      <div className="space-y-3">
        {DIMENSION_KEYS.map((key) => {
          const meta = getDimensionMeta(key);
          const value = layer.breakdown[key];
          return (
            <div key={key}>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{meta.label}</p>
              <DimensionToggle
                left={meta.left}
                right={meta.right}
                selected={value}
                accent={accent}
              />
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onToggleReasoning}
        className="mt-4 flex w-full items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <span>Chart signals</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedReasoning ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expandedReasoning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2 border-t border-slate-700/40 pt-2">
              {DIMENSION_KEYS.map((key) => {
                const meta = getDimensionMeta(key);
                const value = layer.breakdown[key];
                const reasoningKey =
                  key === 'e_i'
                    ? 'extraversion'
                    : key === 's_n'
                      ? 'intuition'
                      : key === 't_f'
                        ? 'thinking'
                        : 'judging';
                const reasons = layer.breakdown.reasoning[reasoningKey].slice(0, 2);
                if (!reasons.length) return null;
                const activeName = value === meta.left ? meta.leftName : meta.rightName;
                return (
                  <div key={key}>
                    <p className="text-[10px] font-semibold text-slate-400">{activeName}</p>
                    <ul className="text-[11px] text-slate-500 space-y-0.5">
                      {reasons.map((r) => (
                        <li key={r} className="flex gap-1">
                          <span className="text-slate-600">·</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BlendCard({ blend, dualOverlay }: { blend: BlendSynthesis; dualOverlay: DualOverlay }) {
  return (
    <div className="rounded-xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 to-slate-900/60 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="h-4 w-4 text-amber-300" />
        <p className="text-xs uppercase tracking-widest font-semibold text-amber-300/80">The Blend</p>
      </div>
      <p className="text-base font-semibold text-amber-100">{blend.headline}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{blend.summary}</p>

      {!blend.sameType && blend.splitDimensions.length > 0 && (
        <div className="mt-3 space-y-2">
          {blend.splitDimensions.map((split) => {
            const meta = getDimensionMeta(split.key);
            return (
              <div
                key={split.key}
                className="rounded-lg border border-slate-700/40 bg-slate-900/40 px-3 py-2"
              >
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  {meta.label}: {split.mask} mask · {split.core} core
                </p>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">{split.note}</p>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-xs text-amber-200/60">
        Integrated type: <span className="font-semibold text-amber-200">{dualOverlay.finalType}</span>
        {' · '}
        {dualOverlay.finalConfidence}% confidence
      </p>
    </div>
  );
}

export function MBTIDualBreakdown({ dualOverlay }: MBTIDualBreakdownProps) {
  const [maskReasoningOpen, setMaskReasoningOpen] = useState(false);
  const [coreReasoningOpen, setCoreReasoningOpen] = useState(false);
  const blend = buildBlendSynthesis(dualOverlay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div>
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-300" />
          Dimension Map
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          E/I · S/N · T/F · J/P for Mask and Core — highlighted letter is what your chart favors.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LayerColumn
          layer={dualOverlay.hardware}
          accent="orange"
          expandedReasoning={maskReasoningOpen}
          onToggleReasoning={() => setMaskReasoningOpen((v) => !v)}
        />
        <LayerColumn
          layer={dualOverlay.firmware}
          accent="violet"
          expandedReasoning={coreReasoningOpen}
          onToggleReasoning={() => setCoreReasoningOpen((v) => !v)}
        />
      </div>

      <BlendCard blend={blend} dualOverlay={dualOverlay} />
    </motion.div>
  );
}