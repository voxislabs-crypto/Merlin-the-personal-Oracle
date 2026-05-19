# GitHub Issue Creation Script (gh CLI)

Run from repo root to create epics and core tickets from the rework plan.

## Prerequisites

- gh installed and authenticated
- Repository remote points to voxislabs-crypto/Merlin-the-personal-Oracle

## Commands

```bash
# Epic: Foundation

gh issue create \
  --title "Rework Epic: Probabilistic Pressure Intelligence Foundation" \
  --label rework --label pressure-engine --label api \
  --body "Source: docs/rework/04-implementation-tickets.md\n\nScope:\n- Ticket 1.1 pressure engine skeleton\n- Ticket 1.2 weighted transit scoring\n- Ticket 1.3 domain scoring\n\nDefinition of done:\n- Engine modules compile\n- Weighted scoring reproducible\n- Domain scores generated with confidence"

# Epic: Explainability + Safety

gh issue create \
  --title "Rework Epic: Explainability and Safety Enforcement" \
  --label rework --label explainability --label safety \
  --body "Source: docs/rework/04-implementation-tickets.md\n\nScope:\n- Ticket 2.1 explainability packet\n- Ticket 2.2 high-intensity safety inserts\n- Ticket 2.3 copy safety lint\n\nDefinition of done:\n- Why-this-score present\n- High-intensity safety guaranteed\n- CI blocks deterministic/fear phrases"

# Epic: API + UI Integration

gh issue create \
  --title "Rework Epic: API Contracts and UI Integration" \
  --label rework --label api --label frontend \
  --body "Source: docs/rework/04-implementation-tickets.md\n\nScope:\n- Ticket 3.1 pressure-window endpoint\n- Ticket 3.2 domain-forecast endpoint\n- Ticket 3.3 usePressureWindow hook\n- Ticket 3.4 explainability UI panel\n\nDefinition of done:\n- Endpoints stable\n- Hook integrated\n- Explainability visible on key cards"

# Epic: Feedback + Calibration

gh issue create \
  --title "Rework Epic: Longitudinal Feedback and Calibration" \
  --label rework --label data --label calibration \
  --body "Source: docs/rework/04-implementation-tickets.md\n\nScope:\n- Ticket 4.1 check-in persistence\n- Ticket 4.2 check-in UI\n- Ticket 4.3 calibration recompute\n\nDefinition of done:\n- Check-ins persisted and queryable\n- Calibration bounded and auditable"

# Epic: Rollout + Metrics

gh issue create \
  --title "Rework Epic: Shadow Rollout, Metrics, and Beta" \
  --label rework --label rollout --label analytics --label safety \
  --body "Source: docs/rework/04-implementation-tickets.md\n\nScope:\n- Ticket 5.1 shadow mode\n- Ticket 5.2 trust/explainability instrumentation\n- Ticket 5.3 beta runbook\n\nDefinition of done:\n- Shadow metrics available\n- Trust KPIs tracked\n- Beta rollback path validated"
```

## Next Step

After creating epics, copy ticket text from docs/rework/04-implementation-tickets.md into child issues and link them under each epic.
