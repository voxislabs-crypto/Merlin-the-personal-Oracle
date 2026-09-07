'use client';

import { useState } from 'react';

/**
 * Chart-literate layer. Hidden until asked — jargon stays off the first screen.
 */
export function ShowMechanics({
  lines,
  className = '',
}: {
  lines: Array<string | null | undefined>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const mechanics = lines.map((line) => (line || '').trim()).filter(Boolean);
  if (!mechanics.length) return null;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="text-[11px] font-medium text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
      >
        {open ? 'Hide the mechanics' : 'Show the mechanics'}
      </button>
      {open ? (
        <ul className="mt-1.5 space-y-1 rounded-md border border-white/10 bg-black/30 px-2.5 py-2 font-mono text-[11px] leading-relaxed text-slate-300">
          {mechanics.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
