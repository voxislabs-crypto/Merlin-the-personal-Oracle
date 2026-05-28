# VoxisLabs Product Roadmap: Merlin + Atmosphere Engine + Voxis AIOS

Prompt received. This roadmap updates the product direction around a Cognitive Climate Interface and positions CAFE as a proactive personal atmosphere co-pilot.

Execution board: [docs/VOXIS_MILESTONE_BOARD_2026_Q2_Q3.md](docs/VOXIS_MILESTONE_BOARD_2026_Q2_Q3.md)

## Vision and Positioning

VoxisLabs is building a Cognitive Climate Interface: a daily operating layer that translates symbolic, physiological, environmental, and behavioral signals into practical, psychologically safe guidance. Merlin remains the symbolic engine, Voxis remains the orchestration brain, and CAFE becomes the adaptive co-pilot that turns insight into daily timing and decision support.

Tagline: Cognitive Climate Interface for your inner and outer weather.

## Strategic Themes

### Current Quarter

- Stabilize CAFE v1 contract and dual-path forecast architecture (legacy + v1)
- Ship local-first forecast history, context-aware intake, and explainability trust layer
- Formalize Voxis orchestration boundaries between symbolic, behavioral, and weather signals
- Introduce chronobiology foundations as an optional enhancement stream behind feature flags

### Next 2 to 3 Quarters

- Transition CAFE from passive forecast display to proactive intervention engine
- Add consent-first wearable ingestion via Apple HealthKit and Google Health Connect
- Expand from static windows to adaptive timing windows driven by circadian and recovery state
- Launch configurable notification policies for gentle, high-signal interventions
- Mature hybrid local-first architecture for Electron desktop and mobile clients

## Phased Roadmap

## Phase 1: MVP (Next 2 to 4 Weeks)

### Key Features

- CAFE v1 forecast request and response contracts operational
- Forecast intake wired to real user context and check-in signals
- Forecast history persistence and retrieval
- Merlin symbolic context endpoint integrated into v1 path
- Explainability-ready output fields: dimensions, confidence, caution, opportunity, recovery

### Technical Tasks

- Hardening of forecast contract validators and error envelopes
- DB-backed forecast history retention and query controls
- Route-level guardrails for malformed and out-of-range signal payloads
- Consistent horizon handling between dashboard and v1 API contract
- Baseline telemetry for forecast generation, retrieval latency, and failure modes

### Integration Points

- Merlin: moon phase and symbolic signal enrichment via internal context endpoint
- Voxis: orchestrated intake shaping for user context, MBTI, and check-in-derived state
- CAFE: translation and output schema compliance at API boundary

### Success Metrics and Deliverables

- Deliverable: stable v1 forecast API in production path with fallback
- Deliverable: history endpoint persistence and retrieval in dashboard flow
- Metric: forecast success rate above 99 percent at normal load
- Metric: p95 response time under 700ms for non-upstream fallback path
- Metric: at least 80 percent of forecasts include complete dimension payloads

## Phase 2: Enhanced Integration (Next 2 Months)

### Key Features

- Environmental signal adapters (weather pressure, air quality, geomagnetic, collective trend)
- Chronobiology baseline model (sleep debt proxy, cognitive windows, recovery windows)
- Optional smartwatch connector scaffolds and consent UI
- Policy-based routing between local model inference and optional cloud fallback
- Forecast memory loop that learns effective interventions over time

### Technical Tasks

- Build adapter services with TTL caching and source health checks
- Introduce chronobiology module with deterministic baseline scoring
- Implement wearable data abstraction and provider-specific mapping layer
- Add feature-flagged intervention recommendation policy engine
- Create signal provenance audit metadata per forecast

### Integration Points

- Merlin: symbolic weighting adjustments tied to timing windows
- Voxis: policy orchestration for signal confidence, source weighting, and fallback behavior
- CAFE: blended scoring over symbolic, behavioral, environmental, and chronobiological inputs

### Success Metrics and Deliverables

- Deliverable: environmental adapters with source-level cache and freshness metadata
- Deliverable: chronobiology module emitting timing windows for deep work and recovery
- Deliverable: wearable connector spec and first provider integration prototype
- Metric: reduced variance in user-rated forecast usefulness after 2 weeks of personalized use
- Metric: at least 60 percent of forecast records include provenance metadata for all active signals

## Phase 3: Proactive Co-Pilot (Next 3 to 6 Months)

### Key Features

- Proactive intervention engine with calm, supportive notifications
- Context-aware nudges tied to recovery debt, HRV trend, and symbolic pressure
- Adaptive notification scheduling based on user behavior and response history
- Intervention library (breathwork, cognitive reset, social pacing, timing recommendations)
- Co-pilot mode with user-adjustable intensity and quiet hours

### Technical Tasks

- Build proactive-agent service for trigger evaluation and dispatch
- Add intervention outcome tracking and recommendation reinforcement loop
- Implement on-device privacy-preserving memory indexing for sensitive inputs
- Add risk-sensitive policy layer to avoid anxiety amplification
- Build simulation harness for notification quality and false-positive control

### Integration Points

- Merlin: symbolic pressure and archetypal context influence timing and framing
- Voxis: central orchestrator for multi-signal confidence and delivery governance
- CAFE: actionable plain-language interventions and timing windows

### Success Metrics and Deliverables

- Deliverable: proactive agent in controlled beta with opt-in cohorts
- Deliverable: intervention outcome feedback loop in product analytics
- Metric: intervention acceptance rate above 35 percent in engaged cohort
- Metric: measurable reduction in reported overwhelm after 30 days for active users
- Metric: false-positive intervention rate below agreed threshold

## Phase 4: Future Scaling

### Key Features

- Cross-device Cognitive Climate Interface (desktop, mobile, wearable)
- Team and relationship climate modes with explicit consent and role-based visibility
- Marketplace-ready modular signal plugins and custom intervention packs
- Enterprise-ready policy controls for wellness and productivity deployments

### Technical Tasks

- Multi-tenant signal orchestration and policy enforcement
- Plugin runtime and contract validation for third-party adapters
- Privacy-preserving analytics layer for aggregate climate insights
- Regional data residency support and compliance hardening

### Integration Points

- Merlin: symbolic engine as a reusable service across products
- Voxis: orchestration and policy governance at ecosystem scale
- CAFE: interface and translation layer across consumer and organizational contexts

### Success Metrics and Deliverables

- Deliverable: cross-platform runtime parity for core forecasting features
- Deliverable: plugin SDK draft with validation suite
- Metric: stable scale under target concurrent forecast volume
- Metric: sustained retention lift attributable to proactive co-pilot usage

## Risks and Dependencies

- Privacy and compliance risk from biometric and journal handling
  - Mitigation: local-first storage, on-device encryption, strict consent surfaces, minimized remote payloads
- Data quality risk in wearable and environmental feeds
  - Mitigation: source confidence scoring, freshness windows, graceful degradation paths
- Trust risk from over-prescriptive or deterministic messaging
  - Mitigation: language guardrails, probabilistic framing, user agency defaults
- Integration complexity across Merlin, Voxis, and CAFE modules
  - Mitigation: strict contracts, versioned APIs, independent module testing
- Notification fatigue and behavior backlash
  - Mitigation: adaptive throttling, quiet-hours defaults, user-controlled intensity settings

## Prioritization Rationale

- The shortest path to user value is improving forecast reliability, personalization inputs, and explainability in existing workflows.
- The highest strategic moat is proactive timing intelligence powered by chronobiology and wearable context.
- Wearables are prioritized as optional progressive enhancement, not a hard dependency for core value.
- Local-first privacy architecture is treated as a product differentiator, not just a technical detail.
- Voxis-centered orchestration prevents product fragmentation while allowing modular growth.

## Smartwatch and Chronobiology: Why This Is a Step-Change

Smartwatch integration plus chronobiology shifts CAFE from descriptive forecasting to adaptive operating support. Instead of saying what the weather is, the system learns when the user is most cognitively ready, when pressure is compounding, and when recovery protects tomorrow’s opportunity. This creates a true daily cognitive operating system: timing, pacing, and intervention guidance aligned to both inner state and external conditions.

## Suggested Modules and File Structure

- src or app level modules
  - wearables/
    - healthkit-adapter.ts
    - health-connect-adapter.ts
    - wearable-normalizer.ts
    - wearable-consent-policy.ts
  - chronobiology/
    - circadian-model.ts
    - recovery-debt.ts
    - cognitive-window-estimator.ts
    - chronobio-scoring.ts
  - proactive-agent/
    - trigger-engine.ts
    - intervention-policy.ts
    - notification-scheduler.ts
    - intervention-library.ts
  - atmosphere/
    - signal-blender.ts
    - confidence-engine.ts
    - provenance-audit.ts
  - voxis-orchestrator/
    - forecast-orchestration.ts
    - policy-router.ts
    - feature-flag-gates.ts

- API endpoints
  - app/api/wearables/ingest/route.ts
  - app/api/chronobiology/window/route.ts
  - app/api/proactive-agent/evaluate/route.ts
  - app/api/proactive-agent/feedback/route.ts

- Contracts and types
  - shared/wearables-contracts.ts
  - shared/chronobiology-contracts.ts
  - shared/proactive-agent-contracts.ts

## Recommended Next 5 Tasks (Priority Order)

1. Add chronobiology contract and deterministic baseline module
2. Build wearable abstraction layer and consent-first schema without provider lock-in
3. Implement proactive trigger engine in dry-run mode (no user notifications yet)
4. Add provenance and confidence metadata to every forecast response
5. Run a 2-week opt-in pilot for intervention quality with strict safety telemetry

## Branch Strategy for Optional Near-Term Upgrade Work

- Keep active delivery branch focused: feature/forecast-language-system
- Create optional umbrella branch: feature/cognitive-climate-upgrades
- Create child branches for isolated progress:
  - feature/chronobiology-foundation
  - feature/wearables-consent-and-ingest
  - feature/proactive-agent-dry-run
  - feature/atmosphere-provenance-confidence

This keeps current delivery velocity while letting you incubate high-upside features safely.
