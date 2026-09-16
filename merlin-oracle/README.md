# Merlin Oracle

A separate, offline-first experimental almanac machine for exploring astronomical timing patterns and historical events. This directory does not import or depend on the production Merlin application.

## Run locally

Open `index.html` directly, or serve this directory with any local static server:

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

All prototype records live in browser `localStorage`. The TimeTrak engine is intentionally labelled `EXPERIMENTAL` and uses a deterministic placeholder calculation. It does not claim prediction, causation, or historical validity.

## Kalshi and the Oracle loop

The Experiments view includes an optional Kalshi importer. Enter a public Kalshi ticker and date range while online; the market metadata and candle rows are normalized, archived, and stored locally. Later experiments can replay that exact snapshot without contacting Kalshi. The Oracle core does not require Kalshi or network access.

Almanac entries use the browser Web Crypto API to store a canonical pre-event snapshot, seal timestamp, and SHA-256 digest. `REVEAL OUTCOME` verifies the digest and shows the original entry beside the later observation. This detects accidental or convenient edits, but it is not an external notarization service: someone with full control of the browser profile can still alter local storage and recompute a new record. A future stronger audit layer could export signed records or anchor hashes externally.

## Shape

- `src/data/` local persistence and archive versioning
- `src/data/kalshi.js` optional Kalshi public API adapter and local snapshot normalization
- `src/almanac/seal.js` canonical snapshots and Web Crypto SHA-256 verification
- `src/timetrak/` placeholder engine, convergence logic, and Historical TimeTrak reconstruction harness
- `src/timetrak/HISTORICAL_TIME_TRAK.md` evidence discipline, candidate versions, and evaluation protocol
- `src/astronomy/`, `src/transits/`, `src/charts/`, `src/experiments/`, `src/almanac/`, `src/archive/` reserved for replaceable domain modules
- `src/ui/` interface and interaction layer
