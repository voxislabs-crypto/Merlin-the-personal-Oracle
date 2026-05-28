# Mood Intelligence Scorecard Template

Purpose: Create a compact, repeatable reporting format that balances model quality, user trust, and operational safety.

## Daily Scorecard (single page)

Date: YYYY-MM-DD
Owner: <name>
Branch/PR: <link or id>

### 1) Outcome Summary
- Daily objective:
- Status: Green | Yellow | Red
- What changed today:
- User-facing impact:

### 2) Quality Metrics
- Calibration (Brier or ECE):
  - Overall:
  - By cohort (chronotype/timezone/data-density):
- Discrimination (AUC/F1 where relevant):
- Coverage (fraction of users receiving a forecast):
- Freshness (median age of inputs):

### 3) Trust and Transparency Metrics
- Source transparency inclusion rate (% outputs with complete source line):
- Uncertainty display inclusion rate:
- Explanation readability pass rate (internal rubric):
- User-reported trust delta (if available):

### 4) Data Health
- New opt-in check-ins:
- Missingness rate by key fields:
- Consent compliance checks passed/failed:
- Regional or cohort imbalance warnings:

### 5) Risk Register (daily)
- Top risk 1:
  - Severity: High | Medium | Low
  - Mitigation owner:
  - ETA:
- Top risk 2:
- Top risk 3:

### 6) Decisions
- Kept:
- Changed:
- Deferred:
- Rolled back:

### 7) End-of-Day Log
- One insight:
- One false signal to monitor:
- One next experiment:

## Weekly Scorecard (leadership view)

Week of: YYYY-MM-DD

### A) Executive Snapshot
- Weekly objective:
- Net quality movement: Up | Flat | Down
- Net trust movement: Up | Flat | Down
- Merge recommendation: Proceed | Proceed with guardrails | Hold

### B) Core Trend Table
| Metric | Start of Week | End of Week | Delta | Target | Status |
|---|---:|---:|---:|---:|---|
| Calibration (overall) |  |  |  |  |  |
| Calibration (lowest cohort) |  |  |  |  |  |
| Transparency inclusion rate |  |  |  |  |  |
| Uncertainty display rate |  |  |  |  |  |
| Data freshness |  |  |  |  |  |
| User trust signal |  |  |  |  |  |

### C) Safety and Ethics Checks
- Correlation-vs-causation language violations:
- Any unsupported medical framing surfaced:
- Any consent or retention policy violations:
- Action taken:

### D) Experiment Review
- Experiment 1: hypothesis, result, confidence level, keep/stop.
- Experiment 2: hypothesis, result, confidence level, keep/stop.
- Experiment 3: hypothesis, result, confidence level, keep/stop.

### E) Next Week Plan
- Priority 1:
- Priority 2:
- Priority 3:
- Explicit non-goals:

## Suggested Scoring Rubric (optional)
Score each 0-2:
- Quality uplift
- Trust uplift
- Risk control
- Delivery reliability

Weekly total:
- 7-8 = accelerate carefully
- 4-6 = continue with focused fixes
- 0-3 = pause feature expansion and repair foundations
