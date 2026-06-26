'use client';

import React from 'react';

interface IdentityPatternCardProps {
  archetypeName?: string;
  patternSignature?: string;
  coreContradiction?: string;
  compact?: boolean;
}

export function IdentityPatternCard({
  archetypeName,
  patternSignature,
  coreContradiction,
  compact = false,
}: IdentityPatternCardProps) {
  if (!archetypeName && !patternSignature && !coreContradiction) {
    return null;
  }

  return (
    <div className={`rounded-lg border border-fuchsia-500/30 bg-fuchsia-950/15 ${compact ? 'p-3' : 'p-4'}`}>
      <p className="text-xs uppercase tracking-wider text-fuchsia-300/85 mb-2">Identity Imprint</p>
      {archetypeName ? <p className={`font-semibold text-fuchsia-100 ${compact ? 'text-sm' : 'text-base'}`}>{archetypeName}</p> : null}
      {patternSignature ? <p className="text-xs text-fuchsia-200/80 mt-1">Pattern: {patternSignature}</p> : null}
      {coreContradiction ? <p className="text-xs text-fuchsia-100/85 mt-2 leading-relaxed">{coreContradiction}</p> : null}
    </div>
  );
}
