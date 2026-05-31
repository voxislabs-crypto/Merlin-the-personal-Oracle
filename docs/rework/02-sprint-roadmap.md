# Merlin Rework Sprint Roadmap

Note: For the updated cross-product strategy and phased roadmap spanning Merlin, CAFE, and Voxis AIOS, see [docs/VOXIS_COGNITIVE_CLIMATE_ROADMAP.md](docs/VOXIS_COGNITIVE_CLIMATE_ROADMAP.md).

## Planning Horizon

- Total duration: 12 to 16 weeks
- Sprint length: 2 weeks
- Track: Product + Platform + Safety

## Sprint 0 - Alignment and Instrumentation

Goals:
- Finalize rework scope and success metrics
- Add baseline telemetry to current flows

Deliverables:
- Rework PRD signed off
- Baseline metrics dashboard
- Feature flags for new forecast pipeline

Acceptance criteria:
- Metrics available for daily active users, forecast engagement, and user trust proxies
- New flags toggle safely in non-prod and prod

## Sprint 1 - Probabilistic Language Refactor

Goals:
- Remove deterministic language from key UI and API interpretation strings
- Introduce pressure-window framing

Deliverables:
- New message templates and content linter checks
- Updated API response wording in forecast endpoints

Acceptance criteria:
- Automated content scan finds no blocked deterministic phrases
- UX review passes for safe and agency-forward framing

## Sprint 2 - Weighted Transit Engine v1

Goals:
- Implement weighted transit pressure model
- Support top-driver extraction

Deliverables:
- pressure-engine module with configurable weights
- Unit tests for weighting and clamping behavior

Acceptance criteria:
- Weighted output reproducible across test fixtures
- Top 3 drivers returned with rationale fields

## Sprint 3 - Domain Scoring v1

Goals:
- Add separate scoring by life domain
- Expose domain forecasts in API and UI

Deliverables:
- Domain matrix configuration
- Domain cards/radar in enhanced dashboard

Acceptance criteria:
- All required domains populated with pressure and confidence
- No generic-only fallback for normal requests

## Sprint 4 - Explainability UX

Goals:
- Make score rationale transparent and useful
- Increase trust and comprehension

Deliverables:
- "Why this score" panel
- Timeline reason markers
- Confidence explanation tooltip

Acceptance criteria:
- Explainability panel opens from every major score card
- At least 3 explicit rationale statements visible per window

## Sprint 5 - Archetypes and Narrative Layer

Goals:
- Add memorable narrative wrappers around major transit patterns

Deliverables:
- Archetype mapping ruleset
- Archetype UI cards with rationale and practical framing

Acceptance criteria:
- Archetype assignment includes rationale and no fatalistic language
- Narrative output remains aligned with domain and driver data

## Sprint 6 - Feedback Check-ins and Data Pipeline

Goals:
- Launch user check-ins
- Store and query check-in history

Deliverables:
- Check-in API and UI
- Trend summaries and data retention policy

Acceptance criteria:
- Users can submit and view historical check-ins
- Check-in completion rate metric tracked

## Sprint 7 - Calibration Engine v1

Goals:
- Correlate check-in trends with pressure windows
- Apply user-specific calibration modifiers

Deliverables:
- Calibration batch job
- Per-user calibration profile and safety guardrails

Acceptance criteria:
- Calibration modifiers are bounded and auditable
- Calibration improves subjective accuracy in beta surveys

## Sprint 8 - Safety Hardening and Beta Rollout

Goals:
- Ensure psychologically safe behavior in edge conditions
- Roll out to controlled beta cohort

Deliverables:
- Safety policy enforcement tests
- Beta launch runbook
- Incident triage protocol for harmful interpretations

Acceptance criteria:
- High-pressure windows always include grounding and uncertainty cues
- Beta cohort runs for two weeks with no critical trust incidents

## Sprint 9 - GA Launch and Post-Launch Optimization

Goals:
- General availability release
- Improve retention and interpretation quality

Deliverables:
- GA release checklist
- Post-launch KPI review and optimization backlog

Acceptance criteria:
- Launch KPIs meet threshold for trust, engagement, and retention
- Prioritized optimization roadmap published

## KPI Targets

Primary:
- +20 percent explainability panel engagement
- +15 percent weekly retention in active forecast users
- +20 percent self-reported usefulness

Trust and safety:
- Zero policy violations in deterministic guarantees
- Less than 2 percent support contacts tied to anxiety-amplifying phrasing

Operational:
- p95 response under 500ms for core forecast endpoints
- Error rate under 1 percent

## Team Split Recommendation

Platform:
- Pressure engine
- API contracts
- Storage and calibration jobs

Product:
- Domain and archetype UX
- Explainability interactions
- Check-in experience

Safety and content:
- Language guidelines
- Prompt and copy audits
- Guardrail test suites

## Risks and Mitigations

Risk: Over-complex scoring reduces interpretability
Mitigation: Require top-driver rationale and visibility in every output

Risk: Personalization overfits early data
Mitigation: Clamp modifiers and require minimum check-in count before activation

Risk: Narrative layer drifts into determinism
Mitigation: Content linting and manual review gates
