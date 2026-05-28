# Ops Telemetry Simulation Runbook

Purpose: provide a complete operational guide for seeding, resetting, validating, and interpreting internal ops telemetry simulations.

## Scope

This runbook covers:
- telemetry reset and seed commands
- healthy and incident simulation scenarios
- data persistence model used by simulations
- expected dashboard behavior
- validation and troubleshooting
- recommended team workflow

Primary implementation files:
- scripts/seed-ops-telemetry.mjs
- scripts/reset-ops-telemetry.mjs
- scripts/run-ops-scenario-matrix.mjs
- scripts/generate-ops-trend-rollup.mjs
- app/api/internal/ops/snapshot/route.ts
- app/api/internal/ops/replay/route.ts
- components/internal/OpsControlCenterClient.tsx

## Quick Start

1. Ensure database schema is applied.

```bash
npm run prisma:push
```

2. Reset telemetry to avoid ghost data.

```bash
npm run ops:seed:reset
```

3. Seed a scenario.

```bash
npm run ops:seed:healthy
```

or

```bash
npm run ops:seed:degraded
```

4. Open internal ops dashboard.

```text
/internal/ops
```

## NPM Commands

```json
{
  "ops:seed": "node scripts/seed-ops-telemetry.mjs",
  "ops:seed:healthy": "node scripts/seed-ops-telemetry.mjs --profile healthy",
  "ops:seed:degraded": "node scripts/seed-ops-telemetry.mjs --profile degraded",
  "ops:seed:scenario": "node scripts/seed-ops-telemetry.mjs",
  "ops:seed:hallucination-spike": "node scripts/seed-ops-telemetry.mjs --scenario hallucination-spike",
  "ops:seed:emotional-instability": "node scripts/seed-ops-telemetry.mjs --scenario emotional-instability",
  "ops:seed:latency-crisis": "node scripts/seed-ops-telemetry.mjs --scenario latency-crisis",
  "ops:seed:approval-deadlock": "node scripts/seed-ops-telemetry.mjs --scenario approval-deadlock",
  "ops:seed:silent-failure": "node scripts/seed-ops-telemetry.mjs --scenario silent-failure",
  "ops:seed:adversarial-user": "node scripts/seed-ops-telemetry.mjs --scenario adversarial-user",
  "ops:seed:reset": "node scripts/reset-ops-telemetry.mjs",
  "ops:seed:matrix": "node scripts/run-ops-scenario-matrix.mjs",
  "ops:rollup:trends": "node scripts/generate-ops-trend-rollup.mjs",
  "ops:validate-schemas": "node scripts/validate-ops-schemas.mjs"
}
```

Dynamic scenario invocation:

```bash
npm run ops:seed:scenario -- --scenario latency-crisis
```

Matrix run across all scenarios:

```bash
npm run ops:seed:matrix
```

Matrix run for selected scenarios:

```bash
npm run ops:seed:matrix -- --scenarios healthy,degraded,hallucination-spike
```

Matrix run without restoring final dashboard scenario:

```bash
npm run ops:seed:matrix -- --final-scenario none
```

Run schema contract gate locally:

```bash
npm run ops:validate-schemas
```

Generate trend rollup report:

```bash
npm run ops:rollup:trends
```

## Simulation Scenarios

Supported scenario values:
- healthy
- degraded
- hallucination-spike
- emotional-instability
- latency-crisis
- approval-deadlock
- silent-failure
- adversarial-user

Scenario intent:

| Scenario | Primary Purpose | Typical Outcome |
|---|---|---|
| healthy | baseline trusted operation | trusted status, no rollback |
| degraded | general trust and drift collapse | auto-freeze and rollback |
| hallucination-spike | factual instability incident | emergency rollback |
| emotional-instability | personality consistency degradation | promotion blocked |
| latency-crisis | performance and SLO failure | rollback or hold |
| approval-deadlock | human sign-off conflict | hold without rollback |
| silent-failure | hidden corruption despite healthy surface metrics | hold pending investigation |
| adversarial-user | prompt attack resilience testing | hold for hardening |

## Persistence Model

Telemetry events are written into Prisma model UserInteractionEvent using these event types:
- ops_scorecard_v1
- ops_phase_gate_v1
- ops_trust_calibration_v1
- ops_rollback_event_v1

Seed identity:
- userId is internal-ops-seed

Reset behavior:
- deletes all rows matching the four ops event types

## Data Contracts

Seeded payloads are aligned with repository schemas:
- schemas/scorecard.schema.json
- schemas/phase-gate.schema.json
- schemas/trust-calibration.schema.json
- schemas/rollback-event.schema.json

Each scenario emits:
- one scorecard payload
- one phase-gate payload
- one trust-calibration payload
- optional rollback payload for rollback scenarios

Schema gate implementation:
- local command: npm run ops:validate-schemas
- CI workflow: .github/workflows/ops-schema-gate.yml

## Matrix Reports

When running matrix simulation, JSON reports are exported to:
- docs/ops/reports/index.json
- docs/ops/reports/<scenario>.json

Report contents:
- scenario metadata
- event count and raw event timeline
- latest scorecard payload
- latest phase-gate payload
- latest trust-calibration payload
- latest rollback payload when present

Use cases:
- after action review artifacts
- incident comparison across scenarios
- baseline snapshots for regression testing
- governance history and audit support

Trend rollup report:
- docs/ops/reports/trend-rollup.json

## Replay API

Internal replay endpoint:
- app/api/internal/ops/replay/route.ts

Usage example:

```text
/api/internal/ops/replay?scenario=degraded
```

Replay response includes:
- available scenarios from report index
- raw events for selected scenario
- normalized timeline view for incident playback UI

## Dashboard Behavior

Internal dashboard route:
- app/internal/ops/page.tsx

Snapshot API route used by UI:
- app/api/internal/ops/snapshot/route.ts

Status banner states:
- TRUSTED
- DEGRADED
- AUTO-FROZEN
- ROLLED BACK

Status heuristics:
- AUTO-FROZEN when rollbackTriggered is true
- DEGRADED when driftScore or hallucinationRate exceeds alert thresholds
- TRUSTED when phase is trusted or above and no rollback condition
- ROLLED BACK fallback state

## Verification Commands

Verify seeded events:

```bash
node - <<'NODE'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.userInteractionEvent.findMany({
    where: {
      type: {
        in: ['ops_scorecard_v1', 'ops_phase_gate_v1', 'ops_trust_calibration_v1', 'ops_rollback_event_v1']
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { type: true, content: true, createdAt: true, userId: true }
  });
  console.log(rows);
  await prisma.$disconnect();
})();
NODE
```

Recommended workflow for each simulation run:

```bash
npm run ops:seed:reset
npm run ops:seed:scenario -- --scenario hallucination-spike
```

Verify exported matrix report index:

```bash
cat docs/ops/reports/index.json
```

## Troubleshooting

Problem: table UserInteractionEvent does not exist.
- run npm run prisma:push

Problem: dashboard appears stale.
- refresh internal page
- confirm latest events were written
- ensure reset was run before reseeding

Problem: scenario argument ignored.
- use exact format: npm run ops:seed:scenario -- --scenario scenario-name
- supported names are listed in this runbook

Problem: unauthorized internal API responses.
- confirm admin role or allow-list configuration
- confirm INTERNAL_OPS_API_TOKEN if token-based access is used

## Operational Guidance

For deterministic drills, always do reset first.

Examples:

```bash
npm run ops:seed:reset && npm run ops:seed:healthy
```

```bash
npm run ops:seed:reset && npm run ops:seed:degraded
```

```bash
npm run ops:seed:reset && npm run ops:seed:adversarial-user
```

Run full matrix and restore healthy state:

```bash
npm run ops:seed:matrix -- --final-scenario healthy
```

## Roadmap Extensions

Recommended future additions:
- time-travel replay endpoint for incident playback
- scenario metadata tags for AAR reporting
- CI check to validate seeded payloads against schemas
- incident export bundle for compliance and postmortem archives
