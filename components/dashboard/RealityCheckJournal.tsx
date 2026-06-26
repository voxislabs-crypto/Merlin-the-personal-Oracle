'use client';

interface RealityCheckJournalProps {
  optIn: boolean;
  text: string;
  onOptInChange: (enabled: boolean) => void;
  onTextChange: (text: string) => void;
}

export function RealityCheckJournal({
  optIn,
  text,
  onOptInChange,
  onTextChange,
}: RealityCheckJournalProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-300/80">Reality check</p>
          <p className="mt-1 text-sm text-slate-300/90">
            Optional one-line journal sharpens how heavy today feels for you.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(event) => onOptInChange(event.target.checked)}
            className="rounded border-slate-500 bg-slate-900 text-violet-400 focus:ring-violet-400/40"
          />
          Include journal
        </label>
      </div>

      {optIn ? (
        <textarea
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          rows={2}
          maxLength={280}
          placeholder="One line: how are you actually feeling right now?"
          className="mt-3 w-full resize-none rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-300/40 focus:outline-none focus:ring-1 focus:ring-violet-300/30"
        />
      ) : null}
    </div>
  );
}