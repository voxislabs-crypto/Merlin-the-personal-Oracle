# Merlin V1 Build Order and Dependency Board

This execution order minimizes integration risk by reusing existing architecture in lib, api, hooks, and astrology UI components.

## Dependency Flow

1. Pressure engine types and module skeleton
2. Weighted pressure calculations
3. Domain scoring
4. Explainability packet
5. Safety insertion rules
6. New APIs
7. New hooks
8. UI wiring
9. Check-in persistence
10. Calibration job
11. Shadow mode and metrics
12. Beta rollout

## Build Wave 1: Engine Foundation

Goal:
Get deterministic internal computation primitives stable before API and UI changes.

Target files:
- [lib/astrology/predictive-transits.ts](lib/astrology/predictive-transits.ts)
- [lib/astrology/resonance-weights.ts](lib/astrology/resonance-weights.ts)
- [lib/astrology/confluence-detector.ts](lib/astrology/confluence-detector.ts)
- [lib/astrology/pressure-engine](lib/astrology/pressure-engine)
- [types/astrology.ts](types/astrology.ts)

Gate to exit wave:
- Unit tests pass for weighted scores and clamps
- Domain score contract finalized

## Build Wave 2: API Contract Layer

Goal:
Expose new model through safe, versioned routes while preserving existing contracts.

Target files:
- [app/api/transits/route.ts](app/api/transits/route.ts)
- [app/api/forecast/route.ts](app/api/forecast/route.ts)
- [app/api/pressure-window/route.ts](app/api/pressure-window/route.ts)
- [app/api/domain-forecast/route.ts](app/api/domain-forecast/route.ts)

Gate to exit wave:
- All new endpoints use success/data/error shape
- p95 latency in target band for standard windows

## Build Wave 3: Frontend Hook Integration

Goal:
Create stable frontend data boundary before UI refactor.

Target files:
- [hooks/useTransits.tsx](hooks/useTransits.tsx)
- [hooks/useForecast.tsx](hooks/useForecast.tsx)
- [hooks/usePressureWindow.tsx](hooks/usePressureWindow.tsx)

Gate to exit wave:
- Hooks manage loading and non-200 errors consistently
- Explainability and safety payloads are typed end-to-end

## Build Wave 4: Explainability and Safety UX

Goal:
Expose why-this-score and grounding cues in primary user surfaces.

Target files:
- [components/astrology/ActiveTransits.tsx](components/astrology/ActiveTransits.tsx)
- [components/astrology/DailyForecast.tsx](components/astrology/DailyForecast.tsx)
- [components/astrology/ChartInterpretation.tsx](components/astrology/ChartInterpretation.tsx)
- [app/dashboard](app/dashboard)

Gate to exit wave:
- Every major score card links to top drivers and confidence context
- High-intensity windows always render safety card content

## Build Wave 5: Feedback and Calibration

Goal:
Enable longitudinal learning loop.

Target files:
- [app/api/checkin/route.ts](app/api/checkin/route.ts)
- [app/api/checkin/history/route.ts](app/api/checkin/history/route.ts)
- [app/api/calibration/recompute/route.ts](app/api/calibration/recompute/route.ts)
- [components/astrology/FeedbackCollector.tsx](components/astrology/FeedbackCollector.tsx)
- [components/astrology/FeedbackPrompt.tsx](components/astrology/FeedbackPrompt.tsx)
- [lib/astrology/feedback](lib/astrology/feedback)
- [prisma](prisma)

Gate to exit wave:
- Check-in flow live and persisted
- Calibration modifiers bounded and auditable

## Build Wave 6: Shadow, Metrics, and Beta

Goal:
Validate trust and model quality before full rollout.

Target files:
- [app/api/dashboard-events/route.ts](app/api/dashboard-events/route.ts)
- [app/api/transits/route.ts](app/api/transits/route.ts)
- [app/api/forecast/route.ts](app/api/forecast/route.ts)
- [docs/rework/03-safe-copy-guidelines.md](docs/rework/03-safe-copy-guidelines.md)

Gate to exit wave:
- Shadow mode run complete with drift analysis
- Explainability engagement and trust metrics available
- Beta rollback path validated

## Risk Register with Kill Switches

Risk: Model complexity hurts interpretability
Kill switch: Hide secondary factors and show only top 3 drivers

Risk: Safety copy regresses under new narratives
Kill switch: Force static safety templates for high-intensity responses

Risk: Calibration overfits small user histories
Kill switch: Disable user-specific calibration below minimum sample threshold

Risk: API latency spikes
Kill switch: Reduce window resolution and defer heavy explainability fields

## One-Week Starter Sequence

Day 1:
- Create pressure-engine module and shared types

Day 2:
- Implement weighted scoring and tests

Day 3:
- Implement domain scoring and tests

Day 4:
- Wire explainability packet in transits route

Day 5:
- Add high-intensity safety insertion plus copy checks

## Definition of Done for V1

- Pressure windows are probabilistic and explainable
- Domain scores available and visible
- Safety inserts enforced at high intensity
- Check-in and calibration loop running
- Trust and explainability metrics instrumented
