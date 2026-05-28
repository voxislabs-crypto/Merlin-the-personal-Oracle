# Phase-Gate Rubric: Baseline to Advanced Models

Purpose: Prevent premature complexity by requiring measurable quality and trust gains before upgrading model sophistication.

Scope: Mood-intelligence enrichment used in Merlin forecast generation and explanation layers.

## Model Ladder
- Level 0: Rule-based heuristics and deterministic templates.
- Level 1: Lexicon baseline (example: VADER) with confidence bands.
- Level 2: Lightweight supervised model (classical ML).
- Level 3: Transformer-based classifier/regressor.
- Level 4: Ensemble or hybrid with personalization layer.

Progress only one level at a time.

## Gate Requirements (must pass all)

### Gate A: Data Readiness
- Opt-in consent capture rate is stable and auditable.
- Minimum sample threshold reached for target cohorts.
- Missingness for required fields under agreed threshold.
- Data retention and deletion pathways tested.

Evidence required:
- Data quality report.
- Consent audit log.

### Gate B: Offline Quality Uplift
- Candidate model beats current production baseline on primary metric.
- Improvement is statistically credible on holdout data.
- No severe regression on lowest-performing cohort.

Evidence required:
- Evaluation notebook/report with confidence intervals.
- Cohort slice table with worst-case performance callout.

### Gate C: Online/Shadow Safety
- Shadow run demonstrates stable outputs under real traffic patterns.
- Output latency and failure rate stay within SLO.
- Explanations remain available and readable.

Evidence required:
- Shadow metrics dashboard snapshot.
- Error budget report.

### Gate D: Trust and Transparency
- Source transparency appears in >= target percentage of outputs.
- Uncertainty labels appear in >= target percentage of outputs.
- No prohibited wording (causal overclaim, medical certainty).

Evidence required:
- Prompt/output audit sample.
- Compliance checklist sign-off.

### Gate E: Rollout and Reversal
- Feature flag rollout plan exists (1%, 10%, 25%, 50%, 100%).
- Automatic rollback trigger thresholds are configured.
- Incident owner and communication path are assigned.

Evidence required:
- Runbook link.
- Rollback simulation result.

## Hard Stop Conditions
Do not advance if any condition is true:
- Quality uplift is not better than baseline after uncertainty bounds.
- Lowest cohort degrades beyond agreed tolerance.
- Transparency or uncertainty display drops below threshold.
- Consent or policy compliance is unresolved.

## Recommended Threshold Template
Customize these values per release cycle.

- Primary quality metric uplift: >= 5% relative.
- Worst-cohort regression: <= 1% absolute.
- Transparency inclusion rate: >= 99%.
- Uncertainty inclusion rate: >= 99%.
- P95 added latency from model upgrade: <= 150 ms.
- Runtime failure rate increase: <= 0.1% absolute.

## Approval Matrix
- Tech lead: quality and reliability approval.
- Product lead: user-facing wording and positioning approval.
- Safety/compliance owner: consent, retention, and claim framing approval.

All three approvals are required.

## Upgrade Decision Record Template
- Current model level:
- Candidate model level:
- Date:
- Decision: Approve | Hold | Reject
- Primary evidence links:
- Risks accepted:
- Mitigations required before next gate:

## Quick Checklist
- [ ] Data readiness passed.
- [ ] Offline uplift passed.
- [ ] Shadow safety passed.
- [ ] Trust and transparency passed.
- [ ] Rollout and rollback readiness passed.
- [ ] Cross-functional approvals recorded.
