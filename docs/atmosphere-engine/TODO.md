# Atmosphere Engine — Execution TODO

Track implementation progress. Full context: [ROADMAP.md](./ROADMAP.md).

**Legend:** `[ ]` pending · `[~]` in progress · `[x]` done

---

## Phase 0 — Alignment

- [x] Review `atmosphere_engine_next_steps.md`
- [x] Review `Enhancing Merlin's Predictive Capabilities_ Beyond Transits.md`
- [x] Audit Merlin codebase (pressure-engine, predictive-transits, confluence, page memos)
- [x] Write ROADMAP.md + TODO.md
- [x] Sign off `AtmospherePacket` schema (Section 6 of ROADMAP)
- [x] Sign off intensity priority chain (pressure → storms → rating → fallback)

---

## Phase 1 — Engine core (Week 1) · PR-1

### Scaffold

- [x] Create `lib/atmosphere/types.ts` — `AtmospherePacket` and related types
- [x] Create `lib/atmosphere/tone.ts` — `resolveTone(intensity)` → `AtmosphereTone` (single source)
- [x] Create `lib/atmosphere/intensity.ts` — priority chain + progressed Moon modifier
- [x] Create `lib/atmosphere/headline.ts` — dominant driver + safe rationale
- [x] Create `lib/atmosphere/confluence.ts` — Triple Hit v0.5 signal builder
- [x] Create `lib/atmosphere/compute.ts` — `computeAtmosphere(input)` orchestrator
- [x] Create `lib/atmosphere/index.ts` — public exports

### Inputs (read-only wiring)

- [x] Define `ComputeAtmosphereInput` (date, pressure, storms, forecast, predictive, calibration)
- [x] Map pressure-engine / predictive top event → base intensity
- [x] Map storms top entry → when pressure absent (priority: pressure first per sign-off)
- [x] Map `forecast.day_rating` → fallback via `ratingToIntensity` from `cosmic-rating.ts`
- [x] Read progressed Moon → `baselineTemperature` + intensity modifier
- [x] Call `confluence-detector` → `confluence.aligned` + themes
- [x] Run rationale through `copy-safety` linter

### Tests

- [x] `tests/atmosphere/intensity.test.ts` — priority chain
- [x] `tests/atmosphere/tone.test.ts` — threshold boundaries (39/40/59/60/79/80)
- [x] `tests/atmosphere/compute.test.ts` — end-to-end fixture
- [ ] Norfolk validation case (Aug 14 1983 12:21) — snapshot or bounds check

### PR checklist

- [x] `npx tsc --noEmit` — no new errors in atmosphere files
- [x] `npm test -- tests/atmosphere` passes (19 tests)
- [x] No UI changes in PR-1

---

## Phase 2 — API + hook (Week 2) · PR-2

- [x] Create `app/api/atmosphere/route.ts`
  - [x] POST: birthDate, birthTime, lat, lon, timezoneOffset, mbtiType?, userId?, clientDate?
  - [x] Subscription gate (`canAccessForecast`)
  - [x] Compose chart + pressure + storms + forecast server-side
  - [x] Return `{ success, data: AtmospherePacket }`
- [x] Create `hooks/useAtmosphere.tsx`
  - [x] Loading / error / reset / `applyAtmosphere`
  - [x] Optional `clientDate` param
- [x] Feature flag `NEXT_PUBLIC_MERLIN_ATMOSPHERE_ENGINE_V1`
- [x] `lib/atmosphere/from-dashboard.ts` — client compose fallback
- [x] `page.tsx`: atmosphere packet drives intensity + whyLine when flag on
- [x] Dev diagnostics: `atmosphereProvenance` in `HomeTabPanel`
- [x] `.env.example` documents flag

### PR checklist

- [ ] API returns valid packet for logged-in premium user with chart (manual QA)
- [x] Flag off → legacy memos still work
- [x] Flag on → hero uses atmosphere packet (API + client fallback)

---

## Phase 3 — UI unification (Week 3) · PR-3

### Component work

- [x] Create `components/dashboard/AtmosphereHeader.tsx`
  - [x] `hero` + `compact` variants, loading skeletons
  - [x] Tone icon, label, %, `DayRatingBadge`, lunar line, sky tone bar
  - [x] `getAtmosphereShellClassName()` for card chrome
- [x] Refactor `CosmicStoryCard` — uses `AtmosphereHeader` + shared shell
- [x] Remove duplicate `weatherTone` / `clampIntensity` from `CosmicStoryCard`
- [x] Update `WheelTransitPanel` — compact `AtmosphereHeader` strip
- [x] Delete `CosmicWeatherWidget.tsx` (unused duplicate)
- [x] Extend `AtmosphereTone` with `shellBg` in `lib/atmosphere/tone.ts`
- [x] `resolveAtmosphereIntensity()` helper in tone module

### Design (parallel)

- [ ] Wireframe: Home hero (atmosphere + story + move)
- [ ] Wireframe: collapsed forecast details
- [ ] Wireframe: wheel forecast strip
- [ ] Wireframe: onboarding blurb (1 checklist step)
- [x] Token sheet: `lib/atmosphere/tone.ts` is single source for thresholds + Tailwind tokens

### PR checklist

- [ ] Visual QA: Home hero matches pre-refactor within one tone band (manual)
- [x] Wheel strip uses same intensity/dayRating as Home (`page.tsx` wiring)
- [x] Only `lib/atmosphere/tone.ts` defines tone thresholds

---

## Phase 4 — Meaning handoff (Week 4) · PR-4

- [x] `CosmicStoryCard` / `HomeTabPanel`: `whyLine` = `dominantDriver.rationale`
- [x] `ephemeris.ts` `buildSummary()`: respect `dayRating` — no positive opening on red
- [x] Oracle: pass `AtmospherePacket` into today context (`queueAskContext` / chat adapter)
- [x] Optional: confluence chip on hero when `confluence.aligned === true`
- [ ] QA: 10 charts — 0 tone vs story contradictions

---

## Phase 5 — Launch (Week 5) · PR-5

- [x] Analytics: `atmosphere_rendered` with `provenance` payload (2026-06-25)
- [x] Analytics: `atmosphere_source_pressure|storm|rating` (2026-06-25)
- [x] `DashboardOnboardingChecklist`: step “Your sky tone updates daily from your chart” (2026-06-25)
- [x] Remove `atmosphere_engine_v1` flag for premium (default on; env `false` rollback) (2026-06-25)
- [x] Update this TODO with completion dates (2026-06-25)
- [x] Update ROADMAP Section 12 definition-of-done checkboxes (2026-06-25)

---

## Phase 6 — Triple Hit v1 (Weeks 6–12)

### Solar arcs

- [x] Create `lib/astrology/solar-arc.ts` (2026-06-25)
- [x] Compute directed positions (1°/year) (2026-06-25)
- [x] Detect exact aspects to natal (≤1° orb) (2026-06-25)
- [x] Export event windows with dates (2026-06-25)
- [x] Tests with known chart fixtures (2026-06-25)

### Profections

- [x] Create `lib/astrology/profections.ts` (2026-06-25)
- [x] Age → profected sign → time lord (2026-06-25)
- [x] Export `themeOfYear` string (2026-06-25)
- [x] Tests (age 0, 1, 30, 42 boundary cases) (2026-06-25)

### Confluence v2

- [x] Extend `confluence-detector` sources: `solar-arc`, `profection` (2026-06-25)
- [x] Triple-hit amplification in `intensity.ts` (×1.25 when aligned) (2026-06-25)
- [x] Add profection + solar arc fields to `AtmosphereTemporalContext` (2026-06-25)
- [x] Life Timeline: solar arc peak markers (2026-06-25)

### Phase 6b — Returns

- [x] Solar Return chart generator (2026-06-25)
- [x] Annual briefing UI near birthday (2026-06-25)
- [x] Lunar Return → monthly emotional weather module (2026-06-25)

---

## Phase 7 — Cognitive layer (Weeks 13–20)

### Reality check (lite → full)

- [x] `lib/atmosphere/reality-check.ts` — `readinessModifier` from calibration (2026-06-26)
- [x] Surface check-in sentiment score (when check-in API exists) (2026-06-26)
- [x] Opt-in journal field + lightweight sentiment (no cloud requirement for MVP) (2026-06-26)
- [x] `feltIntensity` formula in compute path (2026-06-26)
- [x] Guidance copy branches: storm + calm sentiment vs storm + heavy sentiment (2026-06-26)

### Memory

- [x] Pattern store design (Prisma JSON vs pgvector — decision doc) (2026-06-26)
- [x] Recurring transit sensitivity tags per user (2026-06-26)
- [x] Feed patterns into `personalization.ts` / calibration (2026-06-26)

### Local AI (optional)

- [ ] Spike: Ollama/OpenRouter routing for rationale prose
- [ ] Fallback to template rationale when local unavailable
- [ ] Document in integration contract

### Deferred hooks (design only)

- [ ] Biometrics adapter interface (Oura, Apple Health)
- [ ] Calendar density adapter interface

---

## Spikes (schedule as needed)

- [ ] **2-day spike:** `profections.ts` — validate time lord against known chart
- [ ] **2-day spike:** solar arc exact hit dates for one test life event
- [ ] **1-day spike:** `/api/atmosphere` latency with cached ephemeris

---

## Cleanup (ongoing)

- [ ] Remove dead `CosmicWeatherWidget` imports (if any remain)
- [ ] Remove duplicate `ratingToIntensity` from `page.tsx` after Phase 2
- [ ] Link `docs/atmosphere-engine/` from `docs/rework/README.md` (optional)

---

## Current sprint focus

**Start here:**

1. Manual QA: Recalibrate updates pattern store; storm transit you've thumbs-downed amplifies felt intensity
2. Manual QA: felt vs sky line appears when check-in/journal diverges from storm sky
2. Manual QA: solar return card within 30 days of birthday; lunar cycle card updates each month
2. Manual QA: 10 charts — 0 tone vs story contradictions (PR-4 carryover)
3. Optional: `NEXT_PUBLIC_MERLIN_ATMOSPHERE_ENGINE_V1=false` to test premium rollback