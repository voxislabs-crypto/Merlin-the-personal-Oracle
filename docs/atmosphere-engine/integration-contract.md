# Atmosphere Engine — Integration Contract

**Last updated:** 2026-06-26

## Consumers

| Surface | Input | Output |
|---------|-------|--------|
| Home hero | `AtmospherePacket` | intensity, feltIntensity, tone, whyLine |
| Wheel forecast strip | `AtmospherePacket` (compact) | same tone tokens |
| Oracle chat | `atmospherePacket` in context | authoritative sky tone block |
| Telemetry | `buildAtmosphereRenderedDetail()` | provenance + pattern metadata |

## Server endpoints

| Route | Purpose |
|-------|---------|
| `POST /api/atmosphere` | Full packet for premium charts |
| `POST /api/pressure-window` | Pressure + `patternProfile` |
| `POST /api/calibration/recompute` | Calibration + pattern store refresh |

## Optional rationale LLM

Template rationale is always the fallback. Enable prose refinement only when a local/cloud LLM is configured.

```env
ATMOSPHERE_RATIONALE_LLM_ENABLED=true
ATMOSPHERE_RATIONALE_LLM_PROVIDER=ollama   # ollama | openrouter | groq | xai
ATMOSPHERE_RATIONALE_LLM_MODEL=llama3.2
ATMOSPHERE_RATIONALE_LLM_TIMEOUT_MS=2500
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

When disabled or unreachable, `/api/atmosphere` returns template copy with no latency penalty.

## Deferred external inputs

Adapter interfaces live in `lib/atmosphere/adapters/types.ts`:

- `BiometricsAdapter` — sleep, HRV, readiness (Oura, Apple Health)
- `CalendarDensityAdapter` — meeting load / focus time

Not wired until opt-in UX is defined.