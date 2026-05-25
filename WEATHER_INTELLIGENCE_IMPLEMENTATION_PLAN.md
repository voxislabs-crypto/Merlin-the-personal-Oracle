# Merlin Weather Intelligence Plan

## Objective

Transform Merlin into a Human Weather Forecasting Engine that converts astrological + personality signals into practical, actionable navigation.

Principle: lead with human experience, keep astrology as the engine under the hood.

## Branching and Safety (Do This First)

- Keep `clean-main` protected and stable.
- Implement this initiative behind an umbrella branch with focused feature branches.

### Suggested Branch Model

- Umbrella integration branch: `feature/weather-intelligence-v1`
- Vertical branches:
  - `feature/forecast-language-system`
  - `feature/translation-engine-v1`
  - `feature/instant-forecast-ui`
  - `feature/atmospheric-map-ui`
  - `feature/deep-dive-ui`
  - `feature/personalization-loop`

### Git Commands

```bash
git checkout clean-main
git pull origin clean-main
git checkout -b feature/weather-intelligence-v1
git push -u origin feature/weather-intelligence-v1

# Example child branch
git checkout -b feature/forecast-language-system
git push -u origin feature/forecast-language-system
```

## Product Architecture

### Inputs

- Astrology transits and aspect intensity
- House/sign context
- MBTI type + cognitive function profile
- User feedback (predicted vs felt)
- Optional daily mood/energy check-ins

### Translation Engine Outputs

- Instant forecast summary (1 line)
- Domain cards:
  - Emotional Climate
  - Cognitive Weather
  - Social Forecast
  - Momentum Window
- Actionable navigation list (3-5 items)
- Severity, confidence, and duration labels

### UX Layers

1. Layer 1: Instant Forecast (3-second understanding)
2. Layer 2: Atmospheric Map (visual reason model)
3. Layer 3: Deep Dive Analysis (symbolic source + personalization logic)

## Strategic Enhancements (Added)

### Visual Language for Atmospheric Map

- Use weather-style gradients for pressure readability:
  - Deep reds and burnt orange for high tension
  - Muted amber for instability zones
  - Soft blue and teal for flow states
- Animate social and cognitive fronts as moving overlays (subtle, not noisy)
- Keep the map glanceable first, explorable second

### Multi-Time Horizons

- Default view: 24-72 hour windows
- Add easy toggles for:
  - 7-day climate outlook
  - 30-day seasonal pattern view
- Keep a stable output contract across all horizon options

### Team/Relationship Mode (Post Single-User)

- Add consent-based shared atmosphere for couples and small teams
- Surface overlap zones:
  - resonance windows
  - conflict/tension windows
  - communication risk windows
- Gate this behind explicit opt-in and privacy controls

### Optional Data Source Integrations

- Calendar context for demand and scheduling load
- Location and local-time context for day-cycle shifts
- Sleep/wellness tracker signals where consent is provided
- Keep integrations optional and privacy bounded by design

### Light Gamification

- Extend calibration into visible progression:
  - calibration score trend
  - streaks for daily check-ins
  - domain mastery levels
  - insight unlock milestones
- Ensure gamification supports reflection quality, not compulsive usage

## Phase Plan and Checklist

## Phase 0 - Foundations

Status: [ ]

- [ ] Define shared weather vocabulary and taxonomy (climate, turbulence, pressure, windows)
- [ ] Define strict output contract schemas for API/UI
- [ ] Define severity (0-10), confidence (low/med/high), duration model
- [ ] Define language guardrails (no deterministic catastrophe claims)

Primary files:

- `types/astrology.ts`
- `lib/astrology/interpretations.ts`
- `app/api/interpret/route.ts`
- `data/` (new configuration JSON if needed)

Acceptance criteria:

- Every forecast path emits the same contract shape
- Every output sentence maps to an allowed vocabulary class
- No jargon required for default view

## Phase 1 - Translation Engine v1

Status: [ ]

- [ ] Add weighted scoring model for pressure/opportunity/risk
- [ ] Add MBTI sensitivity multipliers to shared scoring logic
- [ ] Convert transit/aspect events into domain forecast objects
- [ ] Generate deterministic recommendations from top scored risks/opportunities

Primary files:

- `lib/astrology/transits.ts`
- `lib/astrology/ephemeris.ts`
- `lib/astrology/interpretations.ts`
- `hooks/useTransits.tsx`
- `hooks/useForecast.tsx`

Acceptance criteria:

- Same input data always yields same base forecast payload
- Forecast includes domain scores + explanation keys + recommendations
- Unit tests cover at least 3 MBTI profiles on same transit set

## Phase 2 - Layer 1 Instant Forecast UI

Status: [ ]

- [ ] Build top-of-screen weather summary panel
- [ ] Add 4 quick forecast cards (emotion, cognition, social, momentum)
- [ ] Add quick navigation checklist with short imperative language
- [ ] Ensure readability in under 3 seconds on mobile and desktop

Primary files:

- `app/enhanced-dashboard/page.tsx`
- `components/astrology/AstroDashboard.tsx`
- `components/astrology/DailyForecast.tsx`
- `app/globals.css`

Acceptance criteria:

- User can interpret current day state without opening deep sections
- No astrology jargon visible in first viewport
- Responsive behavior verified on mobile widths

## Phase 3 - Layer 2 Atmospheric Map

Status: [ ]

- [ ] Build visual pressure map with animated gradients and arcs
- [ ] Map forecast dimensions to visual channels (color, motion, pulse)
- [ ] Add hover/tap explanation labels in plain language
- [ ] Keep render performance acceptable on average devices
- [ ] Implement weather palette tokens for tension/flow gradients
- [ ] Add motion presets for fronts: calm drift, variable, turbulence

Primary files:

- `components/astrology/WheelVisualization.tsx`
- `components/astrology/GoldenWheel.tsx`
- `components/astrology/AstroDashboard.tsx`

Acceptance criteria:

- Visual state changes when forecast pressure changes
- User can identify 1-2 main pressure systems at a glance
- Accessibility labels describe visual meaning

## Phase 4 - Layer 3 Deep Dive Personalization

Status: [ ]

- [ ] Add event-level drilldown (translation, personality impact, strategy)
- [ ] Add MBTI differential impact blocks per event
- [ ] Add severity and duration for each active weather driver
- [ ] Add "why this forecast" transparency panel

Primary files:

- `components/astrology/ChartInterpretation.tsx`
- `app/api/interpret/route.ts`
- `hooks/useInterpretations.tsx`

Acceptance criteria:

- Each deep dive item includes cause, impact, and action
- Personality-specific guidance is non-generic and contrasting by type
- Severity and duration shown consistently

## Phase 5 - Feedback Loop and Calibration

Status: [ ]

- [ ] Add quick daily check-in (mood/energy/social friction/focus)
- [ ] Persist predicted vs actual outcomes
- [ ] Add calibration rules to adjust personality sensitivity weights
- [ ] Add confidence tuning based on recent alignment
- [ ] Add streaks/mastery indicators tied to calibration quality

## Phase 6 - Horizons, Shared Atmosphere, and Integrations

Status: [ ]

- [x] Add consent-first shared atmosphere portal scaffold in dashboard and API
- [x] Add horizon toggles (24h, 72h, 7d, 30d) to forecast APIs and UI
- [x] Build shared atmosphere model for pairs/small teams with consent flows
- [x] Add optional connectors (calendar/location/sleep) behind explicit opt-in
- [x] Add privacy controls and transparent data usage labels in UI

Primary files:

- `app/api/domain-forecast/route.ts`
- `app/api/weekly-forecast/route.ts`
- `app/api/timeline/route.ts`
- `components/astrology/AstroDashboard.tsx`
- `lib/astrology/feedback/calibration.ts`

Acceptance criteria:

- Horizon toggles update forecast outputs without contract breakage
- Shared mode only works with active consent records
- External data integrations are optional and individually revocable
- Users can see what data influences each forecast section
- `components/` (check-in UI)

Acceptance criteria:

- System updates confidence based on recent performance
- Forecast explains whether confidence is rising/falling
- Calibration is bounded and reversible

## Testing and Validation Gates

- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build` (required gate)
- [ ] Mobile/desktop manual QA on `/enhanced-dashboard`
- [ ] Language QA pass for non-generic output quality

Note: this repo treats `npm run build` as the reliable production validation gate.

## Analytics and Product Success Metrics

- Forecast usefulness score (self-reported)
- Daily return rate after forecast consumption
- Recommendation completion rate
- Predicted vs felt alignment score
- Generic-language rejection rate

## Definition of Done (V1)

- Layer 1, Layer 2, and Layer 3 all shipped behind one cohesive weather metaphor
- MBTI adaptation is active in scoring and recommendations
- Forecast language is practical, non-jargon, and actionable
- Calibration loop exists with confidence updates
- Build/test/lint pass on integration branch

## Suggested First Sprint (5-7 days)

1. Complete Phase 0 schema and vocabulary.
2. Implement Phase 1 scoring + deterministic recommendation output.
3. Ship Phase 2 instant forecast cards on `/enhanced-dashboard`.
4. Add minimum tests for contract shape and MBTI-differential scoring.
