# VoxisLabs Milestone Board (Q2 to Q3 2026)

This board maps delivery to branch and pull request workflow for Merlin, CAFE, and Voxis AIOS with a primary lane and optional upgrade lane.

## Scope

- Primary lane: stabilize and ship forecast-language foundation work from feature/forecast-language-system
- Optional lane: chronobiology, wearables, and proactive co-pilot incubation behind feature flags
- Base branch: clean-main
- Integration branch for optional upgrades: feature/cognitive-climate-upgrades

## Delivery Rules

### Branching Model

- Keep feature/forecast-language-system focused on currently active forecast contract and payload delivery
- Merge small, vertical slices into clean-main for production-safe improvements
- Route optional upgrades through feature/cognitive-climate-upgrades and child branches

### PR Slicing Rules

- One capability per PR, ideally 200 to 600 lines changed excluding generated files
- PRs must include contract impact note and rollback note
- API or schema changes require matching docs and tests in same PR
- UI-only PRs cannot silently alter contract behavior

### Merge Gates (Required)

- npm run build passes
- no new TypeScript diagnostics in touched files
- endpoint contract examples updated when API payload changes
- safety wording check passes for forecast copy changes
- reviewer sign-off from product or architecture owner for behavior changes

## Week-by-Week Milestone Plan

## Week 1: Close Forecast Foundation

### Focus

- Final hardening of v1 forecast path and legacy fallback compatibility

### Branches

- active: feature/forecast-language-system

### Planned PRs

- PR-1: Forecast contract validation hardening
- PR-2: Forecast history endpoint persistence and query constraints
- PR-3: Intake wiring cleanup and null-safety pass

### Deliverables

- stable dual-path forecast handling
- persisted history flow in dashboard path
- no fallback regressions for legacy payload

### Exit Gates

- build green and no contract regressions
- manual dashboard smoke test for forecast refresh and history

## Week 2: Observability and Provenance Baseline

### Focus

- Add forecast provenance metadata and operational telemetry

### Branches

- primary: feature/forecast-language-system
- optional prep: feature/cognitive-climate-upgrades

### Planned PRs

- PR-4: Forecast provenance fields in response metadata
- PR-5: Telemetry events for forecast generation and failures

### Deliverables

- source confidence and freshness metadata baseline
- operational metrics for forecast latency and error categories

### Exit Gates

- telemetry visible for at least core forecast endpoints
- API docs updated for new metadata fields

## Week 3: Chronobiology Foundation (Optional Lane Starts)

### Focus

- Deterministic chronobiology baseline without external wearable dependency

### Branches

- optional parent: feature/cognitive-climate-upgrades
- child: feature/chronobiology-foundation

### Planned PRs

- PR-6: shared chronobiology contracts
- PR-7: chronobiology scoring module and API endpoint scaffold

### Deliverables

- baseline cognitive and recovery windows from local time and check-in trends
- feature flag gates for chronobiology inclusion

### Exit Gates

- no production behavior change when flag is disabled
- deterministic outputs for fixed test fixtures

## Week 4: Wearables Abstraction and Consent Layer

### Focus

- Build provider-agnostic ingestion interfaces and consent policy

### Branches

- child: feature/wearables-consent-and-ingest

### Planned PRs

- PR-8: wearable contracts and normalization layer
- PR-9: consent schema and ingestion endpoint scaffold

### Deliverables

- health provider abstraction that avoids lock-in
- explicit consent state required before ingestion

### Exit Gates

- no raw biometric data persistence without consent
- docs include on-device and remote data boundaries

## Week 5: Signal Blending v1

### Focus

- Blend symbolic, behavioral, environmental, and chronobiology signals

### Branches

- child: feature/atmosphere-provenance-confidence

### Planned PRs

- PR-10: confidence engine and signal blending logic
- PR-11: expanded forecast payload with provenance breakdown

### Deliverables

- weighted fusion model with confidence outputs
- explainability payload for why and what influenced score

### Exit Gates

- bounded confidence and score outputs
- no deterministic language regressions

## Week 6: Proactive Agent Dry-Run

### Focus

- Evaluate intervention triggers without user-facing notifications

### Branches

- child: feature/proactive-agent-dry-run

### Planned PRs

- PR-12: trigger engine with dry-run evaluation mode
- PR-13: intervention policy and simulation logs

### Deliverables

- proactive decision engine in silent mode
- quality telemetry: false positives, trigger reason coverage

### Exit Gates

- dry-run only, no production notifications
- reviewable trigger audit log available

## Week 7: Dashboard Upgrade Surface

### Focus

- Add optional co-pilot insight panels and chronobiology windows in UI

### Branches

- primary plus optional integration as needed

### Planned PRs

- PR-14: dashboard co-pilot panel behind feature flag
- PR-15: forecast card enhancements for timing windows

### Deliverables

- visible but optional timing and recovery guidance
- no disruption to current default forecast flow

### Exit Gates

- feature flags verified in both states
- mobile and desktop visual QA passed

## Week 8: Integration Consolidation

### Focus

- Integrate optional lane into umbrella branch and harden

### Branches

- integration: feature/cognitive-climate-upgrades

### Planned PRs

- PR-16: merge chronobiology branch into umbrella
- PR-17: merge wearables abstraction and proactive dry-run into umbrella

### Deliverables

- coherent integration branch with testable end-to-end flow
- decision packet for what merges into clean-main now versus later

### Exit Gates

- integration build green
- risk register reviewed and updated

## Week 9: Pilot Preparation

### Focus

- Prepare controlled pilot for proactive quality validation

### Branches

- integration and release prep branches

### Planned PRs

- PR-18: pilot toggles, guardrails, and cohort gating
- PR-19: intervention feedback capture and reporting endpoint

### Deliverables

- opt-in pilot controls and safe rollout checklist
- feedback loop instrumentation for intervention quality

### Exit Gates

- pilot runbook complete
- rollback plan documented and tested

## Week 10: Pilot and Decision Week

### Focus

- Run pilot, assess signal quality, and choose merge strategy

### Branches

- integration branch only until decision

### Planned PRs

- PR-20: decision merge set into clean-main for approved features

### Deliverables

- pilot summary report with acceptance criteria outcomes
- approved feature set merged or deferred with rationale

### Exit Gates

- trust and quality thresholds met for any user-facing proactive features
- deferred features documented with next review date

## PR Workflow Map

- Day 1 to Day 2 each week:
  - open branch-specific implementation PRs
  - run contract and build checks before review request
- Day 3:
  - review and patch cycle
  - resolve blocking comments
- Day 4:
  - merge eligible PRs
  - deploy to staging and execute smoke tests
- Day 5:
  - close weekly milestone summary
  - update risk register and next week scope

## Ownership Suggestion

- Product and orchestration: Voxis lane owner
- Symbolic and forecasting: Merlin lane owner
- Signal blending and proactive systems: CAFE lane owner
- Safety and language governance: shared reviewer role on all user-facing PRs

## Success Criteria for This Board

- Forecast foundation remains stable while optional innovation lane progresses
- No roadmap drift between branch reality and milestone commitments
- Optional upgrades remain reversible until pilot thresholds are met
