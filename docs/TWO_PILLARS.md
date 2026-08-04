# Merlin Two Pillars — Life Weather & Self

**Status:** Active product architecture  
**Date:** 2026-07-27  
**Principle:** One app, two pillars, one shared foundation. Sell personalized life weather; let people discover who they are.

---

## Product thesis

Merlin’s **primary sell** is **personalized life weather** — what today/this week feels like for *you*, why, and what to do with it.

The **second pillar** is classic astrology identity — birth chart, wheel, placements, dual MBTI — how Merlin knows *who* is standing in that weather. Customers should enjoy and explore Self; we do not lead acquisition with “another birth chart app.”

| Pillar | Working name | User question | Acquisition role |
|--------|--------------|---------------|------------------|
| **A** | **Life weather** (UI: Weather) | “What does *now* feel like for me?” | **Primary sell** — forecast, mood, pressure, storms |
| **B** | **Self** | “Who am I in this weather?” | **Discovery / retention** — wheel, chart, MBTI, identity |
| **Shared** | Foundation | Infrastructure both need | Not a product surface |

**Note on code ids:** Internal tab/pillar keys may still say `sky` (e.g. `DashboardPillar = 'sky'`) to avoid a big rename. **User-facing copy always says life weather / Weather**, never “sky weather.”

**Oracle** is a shared surface that *consumes* both pillars (identity context + atmosphere context). It is not a third pillar.

---

## One-way data flow (hard rule)

```
Birth data
    │
    ▼
Chart engine (Shared)  ──► IdentityPacket (Self)
    │                              │
    ├── Transits / storms / pressure / returns
    │                              │
    └──────────────────────────────┼──► AtmospherePacket (life weather)
                                   │
                                   ▼
                          UI + Oracle (consumers)
```

Rules:

1. **Self never imports life-weather internals.** Chart/MBTI math must not depend on atmosphere, check-ins, or forecast UI.
2. **Life weather may depend on chart types and IdentityPacket.** Weather is personal to the chart.
3. **MBTI is computed on Self**, applied as **tone/presentation on weather + Oracle**, not as weather physics.
4. **Shared** owns Swiss Ephemeris, auth, subscription, birth profile storage, copy safety.

---

## Pillar ownership map

### Life weather (forecast / mood / pressure)

**Owns the answer:** intensity, day rating, tone, dominant driver, storms, pressure windows, weekly/domain forecast, reality-check (felt vs chart), pattern learning from feedback, daily briefing loop.

| Layer | Paths (current → target) |
|-------|---------------------------|
| Core lib | `lib/atmosphere/**` (canonical life-weather package) |
| Weather engines still under astrology | `lib/astrology/storms.ts`, `pressure-engine/`, `predictive-transits.ts`, `transit-windows.ts`, `weekly-whisper.ts`, returns emotional weather |
| APIs | `/api/atmosphere`, `/api/forecast`, `/api/storms`, `/api/pressure-window`, `/api/weekly-forecast`, `/api/domain-forecast`, `/api/transits`, `/api/checkin`, `/api/calibration/*`, `/api/pattern-tracker` |
| Hooks | `useAtmosphere`, `useAtmosphereJournal`, `useForecast`, `useStorms`, `usePressureWindow`, `useWeeklyForecast`, `useDomainForecast`, `useTransits`, `useCheckins` |
| UI | `HomeTabPanel`, `AtmosphereHeader`, `CosmicStoryCard`, `DailyForecast`, `StormsAndNavigations`, `ForecastDetailsSection`, `WheelTransitPanel`, `RealityCheckJournal`, `LunarReturnWeatherCard`, `AnnualBriefingCard`, `dashboard/storm-radar`, forecast-oriented dashboard sections |
| Docs | `docs/atmosphere-engine/**`, this file |

**Product surfaces (IA):**

- **Weather → Today** (default dashboard tab `home`) — Atmosphere briefing, story, oracle pulse, check-in/ritual
- **Weather → Forecast** (tab `forecast`) — Radar, storms, timeline, prophecy, analysis depth

### Self (wheel / birth chart / MBTI)

**Owns the answer:** natal chart structure, wheel visualization, placements, interpretations, dual MBTI / personality overlay, identity brief, archetype/pattern cards, life-arc *identity* framing (not daily weather).

| Layer | Paths (current → target) |
|-------|---------------------------|
| Identity contract | `lib/self/**` (IdentityPacket — mirror of AtmospherePacket) |
| Personality | `lib/personality/**`, `lib/mbti-overlay.ts`, `lib/mbti-system.ts`, `lib/astrology/mbtiFusion.ts`, `lib/astrology/mbti-profiles.ts`, `lib/astrology/planet-personality-bridge.ts` |
| Chart-facing astrology | `lib/astrology/calculate.ts`, `chartCalculations.ts`, `interpretations.ts`, wheel types, synastry, progressions (as chart technique), life-arc engines when used for *who you are* |
| Data | `data/mbti-*.json`, deep-dive / shadow templates as identity content |
| APIs | `/api/calculate-birth-chart`, `/api/chart`, `/api/personality`, `/api/identity-pack`, `/api/interpret`, `/api/synastry`, `/api/soul-*` (identity-adjacent) |
| Hooks | `useBirthChart`, `usePersonality`, `useInterpretations`, `useLifeArc` (Self when about biography; life weather when timed pressure) |
| UI | `BirthChart*`, `WheelVisualization`, `GoldenWheel*`, `PlacementsSidebar`, `ChartInterpretation`, `MBTIDisplay`, `DualPersonalityCards`, `MBTIDualBreakdown`, `ChartIdentityBrief`, `WheelSelectionPanel`, `WheelDetailTabs`, `IdentityPatternCard`, `dashboard/dual-mbti`, `dashboard/chart-reading` |
| Docs | `docs/MBTI_FUSION.md`, `docs/HYBRID_PERSONALITY_MAPPING.md`, this file |

**Product surfaces (IA):**

- **Self → You** (tab `chart`) — wheel, placements, dual MBTI, deep dive, identity
- **Self → Bonds** (tab `relationships`) — synastry / relationship space (identity × other)
- **Self → Numbers** (tab `numerology`) — numerology as identity enrichment (not the sell)

### Shared foundation

| Concern | Paths |
|---------|--------|
| Ephemeris / physics | `lib/engine.ts`, `lib/swiss-ephemeris-core.ts`, `lib/sweph-runtime.ts`, `server-only/engine-sweph.ts`, `ephe/**` |
| Auth / billing | Clerk, Stripe routes, `lib/subscription-*`, `lib/auth.ts` |
| User context store | Prisma models, `lib/user-context.ts`, `/api/user-context` |
| Oracle runtime | `lib/oracle-*`, `/api/oracle-chat`, `/api/daily-oracle`, dashboard Oracle drawer |
| Safety / tone plumbing | `lib/safety/**`, `lib/tone-engine.ts` |
| App shell | `app/layout.tsx`, navigation, checkout, marketing landing |

---

## Dashboard IA (implemented)

Primary navigation is **pillar-grouped**, life weather first:

```
WEATHER (life weather)           SELF
Today  |  Forecast               You  |  Bonds  |  Numbers
(home)    (forecast)             (chart) (relationships) (numerology)
```

- Default landing after chart exists: **Today (life weather)** — weather-first.
- Self is always one click away; not hidden, not the hero sell.
- Hero copy frames Merlin as **personalized life weather**, with Self as how the read is personalized.

Internal tab keys stay stable (`home`, `forecast`, `chart`, …) to avoid a big-bang refactor. Labels and grouping carry the product model.

---

## Contracts

### AtmospherePacket (life weather) — exists

Canonical daily life-weather tone in `lib/atmosphere/types.ts`. Home, forecast, and Oracle should prefer this over ad-hoc intensity chains.

### IdentityPacket (Self) — introduced

Canonical “who is in this weather” summary in `lib/self/types.ts`.

Minimum fields:

- Core placements (Sun / Moon / Rising)
- Dual MBTI (primary + secondary / firmware if present)
- Short identity headline
- Optional archetype / pattern signature from identity pack
- Provenance (chart calc source, confidence)

Life weather and Oracle should eventually take `IdentityPacket` instead of re-picking placements ad hoc in the dashboard mega-page.

---

## Migration phases (do not big-bang)

| Phase | What | Risk |
|-------|------|------|
| **0** ✅ | This doc + weather-first IA labels + IdentityPacket types | Low |
| **1** | Soft folders as files are touched: `components/weather/*` or `components/sky/*`, `components/self/*`; re-exports from old paths | Low–med |
| **2** | Pull weather engines toward `lib/weather/` or keep under astrology with clear ownership comments | Med |
| **3** | Split `app/dashboard/page.tsx` into life-weather shell + Self shell + shared providers | Med–high |
| **4** ✅ | Marketing / landing lead with personalized life weather; chart as “how Merlin knows you” | Low (copy) — 2026-07 |

**Out of scope for now:** splitting repos; folding Voxis `backend/` mood engine into life weather; renaming every astrology file; renaming internal `sky` ids.

---

## Dependency checklist for PRs

When reviewing a change, ask:

1. Does this answer “what does life feel like now?” → **Life weather**
2. Does this answer “who is this person?” → **Self**
3. Is it auth, ephemeris, billing, or oracle transport? → **Shared**
4. Did Self start importing atmosphere internals? → **Reject / rework**
5. Did we lead a new feature with chart chrome when it should be life weather? → **Reconsider IA**
6. Did user-facing copy say “sky weather”? → **Rewrite to life weather**

---

## Marketing alignment (brief)

| Lead with | Don’t lead with |
|-----------|-----------------|
| Personalized life weather / pressure / move | Generic “free birth chart” |
| Forecast & storm radar | Full wheel as the homepage hero |
| “How you actually feel vs the chart” (reality check) | MBTI quiz framing |
| “Sky weather” phrasing | — |

Self content is **delight and depth after** the life-weather habit loop lands (return daily → check weather → optional go deeper into Self).

---

## Related docs

- [`docs/atmosphere-engine/README.md`](./atmosphere-engine/README.md) — life-weather engine detail
- [`docs/MBTI_FUSION.md`](./MBTI_FUSION.md) — Self MBTI calculation
- [`README.md`](../README.md) — product overview
