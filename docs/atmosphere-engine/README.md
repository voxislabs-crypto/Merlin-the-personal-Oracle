# Merlin Atmosphere Engine

Cognitive Atmosphere Forecasting — unified daily sky tone, layered predictive depth, and Brief → Depth UX.

## Documents

| File | Purpose |
|------|---------|
| [ROADMAP.md](./ROADMAP.md) | Vision, architecture, gap analysis, phased plan, user stories, KPIs |
| [TODO.md](./TODO.md) | Execution checklist (start here for implementation) |
| [pattern-store-decision.md](./pattern-store-decision.md) | Prisma JSON vs pgvector decision (Phase 7b) |
| [integration-contract.md](./integration-contract.md) | API surfaces, optional rationale LLM, deferred adapters |

## Source inputs

- Internal UX audit: Daily Briefing Loop (Atmosphere → Meaning → Action → Merlin adds → Depth)
- `docs/rework/01-technical-spec.md` — pressure-engine, explainability, safe copy
- User downloads:
  - `atmosphere_engine_next_steps.md` — platform, design, product priorities
  - `Enhancing Merlin's Predictive Capabilities_ Beyond Transits.md` — Triple Hit, time-lords, returns, reality check

## Status

**Phase 7b / Pattern store** — transit sensitivity tags, `AtmospherePatternRecord`, recalibrate pipeline (2026-06-26).

**Phase 7a / Reality check** — felt intensity, check-in + journal sentiment, guidance branches (2026-06-26).

**Phase 6b / Returns** — solar return briefing, lunar return weather, `/api/returns` (2026-06-25).

Premium users get the atmosphere engine by default (`isAtmosphereEngineV1Enabled`). Roll back with `NEXT_PUBLIC_MERLIN_ATMOSPHERE_ENGINE_V1=false`.

### Key modules

| Module | Role |
|--------|------|
| `lib/atmosphere/compute.ts` | `AtmospherePacket` orchestrator |
| `lib/atmosphere/reality-check.ts` | `feltIntensity`, `readinessModifier`, guidance branches |
| `lib/atmosphere/pattern-store.server.ts` | Learned transit sensitivities (server) |
| `lib/atmosphere/pattern-tags.ts` | Pattern matching + modifier (pure) |
| `POST /api/atmosphere` | Server-side packet for premium charts |
| `POST /api/calibration/recompute` | Calibration + pattern store refresh |

### Next up

See [TODO.md](./TODO.md) — manual QA, optional local AI spike, deferred biometrics/calendar adapters.