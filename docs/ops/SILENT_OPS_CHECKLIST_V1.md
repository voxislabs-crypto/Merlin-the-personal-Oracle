# Merlin Silent Ops Checklist v1

Purpose: Maintain a high-trust, high-learning execution rhythm for mood-intelligence and forecasting features.

Principles:
- Sequence over intensity.
- Measurement over opinion.
- Transparency over black-box confidence.
- Personalization over one-size-fits-all guidance.

## Daily Operating Loop

### Morning (plan and align)
- Confirm one calibration metric for today (example: Brier score by cohort).
- Confirm one trust metric for today (example: source transparency inclusion rate).
- Pick one smallest shippable improvement for opt-in flow, NLP pipeline, or explanation UX.
- Review unresolved risk flags from prior day.

Definition of done:
- The team can answer: what single thing will improve model quality or user trust today?

### Midday (ship one thing)
- Implement one smallest testable change.
- Add or update tests for changed behavior.
- Validate no regression in baseline forecast quality.
- Capture before/after metric snapshot.

Definition of done:
- Change is deployed behind a flag or merged with rollback path.

### Afternoon (validate and challenge)
- Review dashboard overlays for astro-mood patterns.
- Label one pattern as likely signal and one as likely noise.
- Confirm uncertainty display is present and human-readable.
- Verify outputs include source transparency text.

Definition of done:
- At least one potential false pattern is documented and tracked.

### End of day (learn and queue)
- Log one insight, one risk, one next experiment.
- Record whether today improved quality, trust, both, or neither.
- Update the next-day priority queue with exactly one top item.

Definition of done:
- Tomorrow starts with a single obvious high-leverage action.

## Weekly Rhythm

### Monday
- Lock weekly hypothesis (example: post-meal walk timing improves energy-report calibration).
- Define success threshold and stop condition.

### Wednesday
- Mid-week checkpoint on data quality, cohort balance, and model drift.
- Re-scope if signal-to-noise is below threshold.

### Friday
- Run phase-gate review for model complexity changes.
- Publish short method note: what was tested, what improved, what did not.

## Product Guardrails
- Never present causal claims when only correlation is measured.
- Never hide uncertainty when data is sparse.
- Never ship personalization logic without fallback for missing user context.
- Never remove source transparency text from user-facing outputs.

## Required Transparency Footer (user-facing)
Use this pattern in every forecast:
- Based on <N> opt-in check-ins over <time_window>, plus regional trends.
- Confidence: <low|medium|high>.
- Main uncertainty drivers: <list of top 1-3 drivers>.

## Minimal Daily Checklist
- [ ] One calibration metric selected.
- [ ] One trust metric selected.
- [ ] One smallest shippable change delivered.
- [ ] One false-pattern candidate documented.
- [ ] End-of-day insight/risk/next experiment logged.
