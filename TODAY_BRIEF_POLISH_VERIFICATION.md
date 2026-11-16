# Merlin Today Brief Polish — Verification & LLM Integration Prompt

## Context
Merlin's deterministic engine (transits, Core/Mask, domains, watch window) produces rock-solid structured data. The prose layer is flat because the LLM was over-constrained. Goal: keep the engine as spine, give the LLM a narrow job — turn supplied evidence into prose that sounds like it knows something.

## Architecture (as designed)
- **Server cache**: stores full and partial successes only. Total failures (timeout, malformed JSON, thrown call, both chartWhy + watch line rejected) return null and do NOT call serverCache.set. Next identical request re-runs the model.
- **Client** (useTodayBriefPolish + useRef map): remembers null per evidence key for the page session to avoid re-request spam. Not localStorage — dies on refresh, which correctly retries the server.
- **Partial acceptance**: stored intentionally, deterministic fallback text included for rejected lines. Unit test locks the mix.

## Verification Plan

### 1. Live integration
- Deterministic lines remain visible while the polish request is in flight.
- Valid polish replaces ONLY chartWhy, the watch line, and the tension line.
- Changing evidence or Core/Mask immediately invalidates previous polish.
- Partial acceptance: covered by unit tests; do not force during live session.

### 2. Model quality (the open product question)
Contrasting packets must differ in the evidence the prompt claims to use:
- Storm day vs open day
- Core/Mask matching vs Core/Mask split
- One hot domain vs several
- Different Moon conditions

Pass criteria: chartWhy uses the supplied hit and domains; watch line preserves the engine's chosen window. Generic astrology that fits any chart = packet too thin.

### 3. Regression
- Core/Mask override propagates through prompt, client cache key, and server cache key.
- Chart provenance is a SEPARATE path: Today Brief never reads calculationSource. That fix is uncommitted and does not need re-proving through this cache pass.

### 4. Client failure suppression
Explicitly test: failed request suppressed within current page session, retried after refresh. This validates intended behavior — do not treat the useRef null memoization as a cache defect.

## LLM Integration Direction
Narrow the model's job. Feed it the deterministic hits, domains, and watch window as structured context. Let it write like it sees the chart, not like it read a disclaimer. The 70%+ edge was real before the lobotomy — the prose layer is where it comes back.

## Note
useTodayBriefPolish / chartWhy / polish path symbols were not found on any pushed branch (clean-main or feature branches) as of this check. This work is local/uncommitted. First step: locate the local files, commit to a branch, then run this plan.
