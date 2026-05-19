# Merlin Rework Technical Spec

## 1. Purpose

Reframe Merlin from deterministic event prediction to probabilistic pressure-intelligence.

Primary outcome:
- Detect periods of elevated psychological, relational, energetic, and decision-making pressure.
- Explain why the signal is elevated.
- Provide grounding and agency-forward action guidance.

Non-goal:
- Predict exact external events.

## 2. Product Principles

1. Probabilistic over deterministic
2. Explainable over opaque
3. Domain-specific over generic
4. Agency-first over fatalistic
5. Personalized over one-size-fits-all
6. Safe framing over fear amplification

## 3. System Architecture Changes

Current high-level pipeline:
- Ephemeris and transit calculations in lib/astrology
- API routes in app/api
- Hook-driven UI fetch and display

Target pipeline:
1. Signal Computation Layer
2. Weighting and Temporal Pressure Layer
3. Personalization Layer
4. Domain Scoring Layer
5. Archetype and Interpretation Layer
6. Safety and Grounding Layer
7. Explainability Layer

Recommended modules:
- lib/astrology/pressure-engine/
  - weights.ts
  - temporal-pressure.ts
  - personalization.ts
  - domains.ts
  - archetypes.ts
  - explainability.ts
  - safety.ts
- lib/astrology/feedback/
  - checkins.ts
  - correlation.ts
  - calibration.ts

## 4. Data Model Specification

Note: Keep types aligned with existing astrology typing conventions. If legacy imports rely on component-defined types, add bridge exports rather than hard breaks.

### 4.1 Core Output Types

```ts
export type LifeDomain =
  | 'identity'
  | 'career'
  | 'relationships'
  | 'finances'
  | 'mental_strain'
  | 'creativity'
  | 'spiritual_growth'
  | 'social_connection'
  | 'reinvention';

export interface TransitDriver {
  transitId: string;
  label: string;
  strength: number; // 0-100
  confidence: number; // 0-100
  reason: string; // Human-readable influence explanation
}

export interface DomainScore {
  domain: LifeDomain;
  pressure: number; // 0-100
  volatility: number; // 0-100
  confidence: number; // 0-100
  topDrivers: TransitDriver[];
}

export interface ArchetypeSignal {
  key: string; // e.g. 'phoenix', 'trial_by_stone'
  title: string;
  intensity: number; // 0-100
  rationale: string;
}

export interface SafetyGuidance {
  grounding: string[];
  caution: string[];
  agency: string[];
  supportPrompt?: string;
}

export interface ExplainabilityPacket {
  windowStartIso: string;
  windowEndIso: string;
  globalPressure: number;
  confidence: number;
  topDrivers: TransitDriver[];
  weightingBreakdown: Record<string, number>;
  personalizationBreakdown: Record<string, number>;
  domainScores: DomainScore[];
  archetypes: ArchetypeSignal[];
  safety: SafetyGuidance;
}
```

### 4.2 Feedback Types

```ts
export interface UserCheckIn {
  userId: string;
  timestampIso: string;
  mood: number; // 1-10
  stress: number; // 1-10
  sleepQuality: number; // 1-10
  focus: number; // 1-10
  relationshipTension: number; // 1-10
  notes?: string;
}

export interface CalibrationProfile {
  userId: string;
  version: number;
  domainSensitivity: Record<LifeDomain, number>; // 0.7-1.3 recommended clamp
  transitSensitivity: Record<string, number>; // transit class multiplier
  updatedAtIso: string;
}
```

## 5. Scoring Model

### 5.1 Base Transit Signal

For each transit event i:

- exactnessFactor_i: based on orb and applying/separating status
- durationFactor_i: normalized active duration
- classWeight_i: planetary/aspect class importance
- stackFactor_i: local density bonus
- activationFactor_i: natal/house/domain activation

Formula:

pressure_i = classWeight_i * exactnessFactor_i * durationFactor_i * stackFactor_i * activationFactor_i

Global pressure before personalization:

rawPressure = sum(pressure_i)

### 5.2 Recommended Initial Weights

- Outer planet major transit: 1.00
- Saturn major transit: 0.90
- Uranus major transit: 0.85
- Pluto major transit: 1.00
- Exact aspect bonus (orb <= 1.0): +0.25
- House activation strong match: +0.20
- Progressed Moon trigger: +0.15
- Lunar phase contribution: +0.05 to +0.10
- Mercury retrograde baseline: +0.03
- Mercury retrograde if personally activated: +0.12

Implementation detail:
- Use normalized 0-100 output at the final stage with min/max clamps.

### 5.3 Personalization

personalizedPressure = rawPressure * personalityModifier * calibrationModifier

Where:
- personalityModifier uses MBTI dimensions and optional trait extensions.
- calibrationModifier comes from user feedback correlations.

Clamp guidance:
- personalityModifier: 0.80 to 1.20
- calibrationModifier: 0.85 to 1.25

### 5.4 Domain Scoring

Each domain has activation coefficients per transit class.

Example domain matrix row (conceptual):
- relationships: Venus, Moon, 7th house, Saturn-Pluto stress aspects weighted higher

domainPressure_d = normalized(sum(pressure_i * domainAffinity_i_d))

## 6. Explainability Requirements

Every user-visible score must include:
- Top 3 drivers
- Why now (window logic)
- Why you (personalization modifier summary)
- Confidence rationale

Confidence score factors:
- Signal density quality
- Data completeness
- Historical calibration availability

Confidence must never imply certainty.

## 7. API Design

Add/extend endpoints:

1. POST /api/pressure-window
- Input: birth data, optional MBTI/profile, date range
- Output: ExplainabilityPacket

2. POST /api/domain-forecast
- Input: birth data, profile, date range
- Output: domainScores by time window

3. POST /api/checkin
- Input: UserCheckIn
- Output: persisted check-in confirmation

4. GET /api/checkin/history
- Input: date range
- Output: check-ins and summary trends

5. POST /api/calibration/recompute
- Input: user id
- Output: updated CalibrationProfile

Response contract:
- Always return `{ success, data, error }`

## 8. Storage and Analytics

Suggested persistence entities:
- checkins
- pressure_windows
- calibration_profiles
- model_versions

Minimum analytics events:
- forecast_viewed
- why_this_score_opened
- grounding_prompt_shown
- grounding_prompt_used
- checkin_submitted
- reflection_completed

## 9. UI and UX Requirements

Core UI blocks:
- Pressure Timeline (time windows with intensity and confidence)
- Domain Radar or Domain Bars
- Top Drivers panel
- Archetype card
- Grounding and agency prompt card
- Reflection check-in panel

Critical UI language constraints:
- No deterministic phrasing
- No catastrophe framing
- No hidden-enemy implication

## 10. Safety Layer Rules

High-pressure windows (e.g., >= 75) must include:
- one grounding action
- one uncertainty reminder
- one defer-major-conclusion recommendation

Example policy text:
- "This period may increase pattern sensitivity. Delay major conclusions until you have external confirmation."

## 11. Rollout Strategy

1. Shadow mode: compute new model alongside old outputs
2. Internal eval: compare stability and interpretability
3. Limited beta: 10-20 percent users
4. Full rollout with feature flag fallback

## 12. Acceptance Criteria

Engineering acceptance:
- New pressure endpoint returns explainability packet in under 500ms p95 for standard windows.
- Domain scores available for all required domains.
- Safety block appears on every high-pressure response.

Product acceptance:
- At least 80 percent of beta users report output clarity as "clear" or better.
- At least 60 percent interact with explainability panel.

Trust acceptance:
- Zero deterministic guarantee phrases in QA scans.

## 13. Open Decisions

1. MBTI-only vs expanded trait model
2. Check-in frequency (daily vs 3x weekly)
3. Calibration cadence (weekly vs biweekly)
4. Whether to expose raw formulas in UI
