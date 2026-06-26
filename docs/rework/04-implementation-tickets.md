# Merlin Rework Implementation Tickets

This document is issue-ready. Each ticket includes scope, file touchpoints, dependencies, and acceptance criteria.

## Epic 1: Probabilistic Pressure Intelligence Foundation

### Ticket 1.1 - Create pressure engine module skeleton

Type: Platform
Priority: P0
Depends on: none

Summary:
Create the new pressure engine module structure and shared types.

File touchpoints:
- [lib/astrology/pressure-engine](lib/astrology/pressure-engine)
- [types/astrology.ts](types/astrology.ts)
- [types/astrology.d.ts](types/astrology.d.ts)

Tasks:
- Add module files: weights.ts, temporal-pressure.ts, personalization.ts, domains.ts, archetypes.ts, explainability.ts, safety.ts
- Add canonical interfaces for DomainScore, TransitDriver, ExplainabilityPacket, SafetyGuidance
- Add bridge exports if component-level type imports are still required

Acceptance criteria:
- New modules compile in TypeScript without any runtime wiring yet
- Shared types are importable from one stable path
- No existing route breaks

### Ticket 1.2 - Implement weighted transit pressure scoring v1

Type: Platform
Priority: P0
Depends on: Ticket 1.1

Summary:
Compute raw and normalized pressure scores using weighted transit factors.

File touchpoints:
- [lib/astrology/predictive-transits.ts](lib/astrology/predictive-transits.ts)
- [lib/astrology/resonance-weights.ts](lib/astrology/resonance-weights.ts)
- [lib/astrology/pressure-engine/weights.ts](lib/astrology/pressure-engine/weights.ts)
- [lib/astrology/pressure-engine/temporal-pressure.ts](lib/astrology/pressure-engine/temporal-pressure.ts)

Tasks:
- Add class-weight and exactness-weight tables
- Add stack density and duration modifiers
- Clamp final intensity to 0-100
- Return top contributing factors per event

Acceptance criteria:
- Reproducible score outputs for fixed test fixtures
- Top 3 contributing drivers included per event/window
- Existing predictive event generation remains functional

### Ticket 1.3 - Add domain scoring layer v1

Type: Platform
Priority: P0
Depends on: Ticket 1.2

Summary:
Generate per-domain pressure, volatility, and confidence scores.

File touchpoints:
- [lib/astrology/pressure-engine/domains.ts](lib/astrology/pressure-engine/domains.ts)
- [lib/astrology/predictive-transits.ts](lib/astrology/predictive-transits.ts)
- [lib/astrology/confluence-detector.ts](lib/astrology/confluence-detector.ts)

Tasks:
- Define domain affinity matrix
- Calculate domain scores from weighted events
- Attach top drivers and rationales to each domain

Acceptance criteria:
- Domain outputs generated for required domains in technical spec
- No empty domain payloads for normal chart inputs
- Confidence available per domain

## Epic 2: Explainability and Safety

### Ticket 2.1 - Build explainability packet generator

Type: Product Platform
Priority: P0
Depends on: Ticket 1.2

Summary:
Provide transparent why-now and why-you explanations for each pressure window.

File touchpoints:
- [lib/astrology/pressure-engine/explainability.ts](lib/astrology/pressure-engine/explainability.ts)
- [app/api/transits/route.ts](app/api/transits/route.ts)
- [app/api/forecast/route.ts](app/api/forecast/route.ts)

Tasks:
- Add explanation sections: topDrivers, weightingBreakdown, personalizationBreakdown
- Add confidence rationale text and value
- Return explainability packet in API response

Acceptance criteria:
- Every major score has at least 3 rationale lines
- Payload includes machine-readable breakdown fields
- Confidence is explicitly non-deterministic in wording

### Ticket 2.2 - Enforce high-intensity safety inserts

Type: Safety
Priority: P0
Depends on: Ticket 2.1

Summary:
Add mandatory grounding and uncertainty guidance for high-pressure windows.

File touchpoints:
- [lib/astrology/pressure-engine/safety.ts](lib/astrology/pressure-engine/safety.ts)
- [docs/rework/03-safe-copy-guidelines.md](docs/rework/03-safe-copy-guidelines.md)
- [app/api/forecast/route.ts](app/api/forecast/route.ts)
- [app/api/transits/route.ts](app/api/transits/route.ts)

Tasks:
- Add policy trigger at pressure >= 75
- Inject grounding, uncertainty, and defer-conclusion prompts
- Add tests for safety insertion

Acceptance criteria:
- 100 percent of high-intensity responses include safety block
- No blocked deterministic phrases in high-intensity copy outputs

### Ticket 2.3 - Add copy safety lint and phrase blocker tests

Type: Safety QA
Priority: P1
Depends on: Ticket 2.2

Summary:
Automate content checks for prohibited deterministic and fear-amplifying language.

File touchpoints:
- [tests](tests)
- [docs/rework/03-safe-copy-guidelines.md](docs/rework/03-safe-copy-guidelines.md)

Tasks:
- Add blocked phrase test set
- Add CI check for generated interpretation text samples

Acceptance criteria:
- CI fails on blocked phrase appearance
- CI passes for approved phrasing patterns

## Epic 3: API Contracts and UI Integration

### Ticket 3.1 - Add pressure-window API endpoint

Type: API
Priority: P0
Depends on: Ticket 1.3, Ticket 2.1

Summary:
Create endpoint for explainable pressure windows and domain scoring.

File touchpoints:
- [app/api/pressure-window/route.ts](app/api/pressure-window/route.ts)
- [app/api/transits/route.ts](app/api/transits/route.ts)
- [lib/astrology/pressure-engine](lib/astrology/pressure-engine)

Tasks:
- Add POST endpoint with existing request conventions
- Return success/data/error contract
- Include explainability packet and domain scores

Acceptance criteria:
- Endpoint returns under p95 target for standard 7-day window
- Response contract matches all required fields in technical spec

### Ticket 3.2 - Add domain-forecast API endpoint

Type: API
Priority: P1
Depends on: Ticket 1.3

Summary:
Expose domain-focused forecast view for UI widgets and future automations.

File touchpoints:
- [app/api/domain-forecast/route.ts](app/api/domain-forecast/route.ts)
- [lib/astrology/pressure-engine/domains.ts](lib/astrology/pressure-engine/domains.ts)

Tasks:
- Add endpoint for date range domain pressure outputs
- Include confidence and top-drivers by domain

Acceptance criteria:
- Returns complete domain matrix for range requests
- Includes deterministic fallback behavior for empty ranges

### Ticket 3.3 - Add hook for pressure-window consumption

Type: Frontend
Priority: P0
Depends on: Ticket 3.1

Summary:
Create a hook for pressure window data consumption.

File touchpoints:
- [hooks/usePressureWindow.tsx](hooks/usePressureWindow.tsx)
- [hooks/useTransits.tsx](hooks/useTransits.tsx)

Tasks:
- Add loading, error, reset pattern aligned with current hooks
- Parse explainability packet and domain scores

Acceptance criteria:
- Hook API matches existing house style
- Hook handles non-200 and logical failures consistently

### Ticket 3.4 - Add explainability panel UI

Type: Frontend
Priority: P0
Depends on: Ticket 3.3

Summary:
Expose score rationale and confidence in dashboard UI.

File touchpoints:
- [components/astrology/ActiveTransits.tsx](components/astrology/ActiveTransits.tsx)
- [components/astrology/DailyForecast.tsx](components/astrology/DailyForecast.tsx)
- [components/astrology/ChartInterpretation.tsx](components/astrology/ChartInterpretation.tsx)
- [app/dashboard](app/dashboard)

Tasks:
- Add Why this score panel
- Add top drivers and confidence language
- Add safety and grounding card placement

Acceptance criteria:
- Explainability panel accessible from each primary score card
- Top drivers and confidence shown without hidden interactions

## Epic 4: Longitudinal Learning and Calibration

### Ticket 4.1 - Create check-in API and persistence

Type: API Data
Priority: P0
Depends on: none

Summary:
Persist user check-ins for calibration and trend visibility.

File touchpoints:
- [app/api/checkin/route.ts](app/api/checkin/route.ts)
- [app/api/checkin/history/route.ts](app/api/checkin/history/route.ts)
- [prisma](prisma)
- [shared](shared)

Tasks:
- Add check-in create endpoint
- Add history endpoint with range filters
- Define storage model and migration

Acceptance criteria:
- Check-ins persist and can be fetched by date range
- Input validation enforces expected scales

### Ticket 4.2 - Create check-in hook and UI surface

Type: Frontend
Priority: P1
Depends on: Ticket 4.1

Summary:
Enable user reflection logging from dashboard contexts.

File touchpoints:
- [hooks/useCheckins.tsx](hooks/useCheckins.tsx)
- [components/astrology/FeedbackCollector.tsx](components/astrology/FeedbackCollector.tsx)
- [components/astrology/FeedbackPrompt.tsx](components/astrology/FeedbackPrompt.tsx)

Tasks:
- Add check-in submission and history retrieval hook
- Add low-friction check-in form and completion state

Acceptance criteria:
- User can submit check-in in under 30 seconds
- History fetch and render works for at least 30 days

### Ticket 4.3 - Implement calibration recompute job v1

Type: Platform Data
Priority: P1
Depends on: Ticket 4.1, Ticket 1.2

Summary:
Compute and apply bounded user-specific calibration modifiers.

File touchpoints:
- [app/api/calibration/recompute/route.ts](app/api/calibration/recompute/route.ts)
- [lib/astrology/feedback/calibration.ts](lib/astrology/feedback/calibration.ts)
- [lib/astrology/resonance-weights.ts](lib/astrology/resonance-weights.ts)

Tasks:
- Add calibration profile builder from check-in correlations
- Add clamped modifier persistence and retrieval
- Integrate calibration modifier into pressure calculations

Acceptance criteria:
- Calibration modifiers remain within configured bounds
- Modifier provenance is auditable in logs and response metadata

## Epic 5: Rollout, Metrics, and Guardrails

### Ticket 5.1 - Shadow mode rollout with feature flags

Type: Platform
Priority: P0
Depends on: Ticket 3.1

Summary:
Run new scoring engine in shadow mode against current outputs.

File touchpoints:
- [app/api/transits/route.ts](app/api/transits/route.ts)
- [app/api/forecast/route.ts](app/api/forecast/route.ts)
- [app/api/dashboard-events/route.ts](app/api/dashboard-events/route.ts)

Tasks:
- Add shadow calculations and non-user-visible logging
- Compare output drift and confidence stability metrics

Acceptance criteria:
- Shadow output stored for baseline comparison
- No regression to existing user-facing payloads during shadow period

### Ticket 5.2 - Add trust and explainability instrumentation

Type: Product Analytics
Priority: P1
Depends on: Ticket 3.4

Summary:
Measure trust-oriented behavior and explainability usage.

File touchpoints:
- [app/api/dashboard-events/route.ts](app/api/dashboard-events/route.ts)
- [components/astrology/ActiveTransits.tsx](components/astrology/ActiveTransits.tsx)
- [components/astrology/DailyForecast.tsx](components/astrology/DailyForecast.tsx)

Tasks:
- Track explainability panel opens
- Track grounding prompt exposure and interaction
- Track check-in completion after high-intensity windows

Acceptance criteria:
- Events are queryable by user and time range
- KPI dashboard can compute adoption and trust proxies

### Ticket 5.3 - Beta launch and safety incident runbook

Type: Operations
Priority: P1
Depends on: Ticket 2.2, Ticket 5.1

Summary:
Prepare controlled release with fast rollback and triage.

File touchpoints:
- [docs/rework/02-sprint-roadmap.md](docs/rework/02-sprint-roadmap.md)
- [docs/rework/03-safe-copy-guidelines.md](docs/rework/03-safe-copy-guidelines.md)

Tasks:
- Define beta cohort and flag strategy
- Define alert thresholds and incident response owner
- Define rollback criteria

Acceptance criteria:
- One-page beta runbook approved
- Rollback tested in staging

## Suggested Labels

- rework
- pressure-engine
- explainability
- safety
- api
- frontend
- data
- calibration
- analytics
- rollout

## Suggested Milestones

1. Foundation and Safety Baseline
2. Explainable Pressure v1
3. Feedback and Calibration v1
4. Beta and GA
