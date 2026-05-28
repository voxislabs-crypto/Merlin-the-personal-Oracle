import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OPS_EVENT_TYPES = {
  scorecard: 'ops_scorecard_v1',
  phaseGate: 'ops_phase_gate_v1',
  trustCalibration: 'ops_trust_calibration_v1',
  rollbackEvent: 'ops_rollback_event_v1',
};

const SCENARIOS = [
  'healthy',
  'degraded',
  'hallucination-spike',
  'emotional-instability',
  'latency-crisis',
  'approval-deadlock',
  'silent-failure',
  'adversarial-user',
];

function nowIso() {
  return new Date().toISOString();
}

function hoursAgoDate(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function readArg(name) {
  const inline = process.argv.find((item) => item.startsWith(`--${name}=`));
  if (inline) return inline.split('=')[1] || undefined;

  const idx = process.argv.findIndex((item) => item === `--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];

  return undefined;
}

function resolveScenario() {
  const scenarioArg = readArg('scenario');
  const profileArg = readArg('profile');
  const candidate = (scenarioArg || profileArg || 'healthy').trim();
  return SCENARIOS.includes(candidate) ? candidate : 'healthy';
}

async function upsertByType(type, payload, content, createdAt, userId = 'internal-ops-seed') {
  const existing = await prisma.userInteractionEvent.findFirst({
    where: {
      type,
      userId,
      content,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    await prisma.userInteractionEvent.update({
      where: { id: existing.id },
      data: {
        metadataJson: JSON.stringify(payload),
        createdAt,
      },
    });
    return { mode: 'updated', id: existing.id };
  }

  const created = await prisma.userInteractionEvent.create({
    data: {
      userId,
      type,
      content,
      metadataJson: JSON.stringify(payload),
    },
  });

  await prisma.userInteractionEvent.update({
    where: { id: created.id },
    data: { createdAt },
  });

  return { mode: 'created', id: created.id };
}

function gateCheck(pass, evidence, failedReasons = []) {
  const base = {
    pass,
    evidence,
  };
  if (failedReasons.length > 0) {
    return { ...base, failedReasons };
  }
  return base;
}

function getScenarioData(scenario, evaluationWindow) {
  const base = {
    modelId: 'voxis-luna-v0.4',
    evaluationWindow,
    approvedBy: ['ops', 'safety', 'personality-team'],
  };

  switch (scenario) {
    case 'degraded':
      return {
        scorecard: {
          evaluationWindow,
          modelId: base.modelId,
          status: 'red',
          objective: 'Contain drift spike and restore trust calibration in affected cohorts.',
          quality: {
            calibrationScore: 0.72,
            coherenceScore: 0.74,
            hallucinationRate: 0.14,
            driftScore: 0.63,
          },
          trust: {
            trustScore: 0.69,
            sourceTransparencyRate: 0.91,
            uncertaintyInclusionRate: 0.84,
            emotionalConsistency: 0.66,
          },
          dataHealth: {
            optInReports: 1318,
            missingnessRate: 0.11,
            freshnessHours: 13,
          },
          risks: [
            {
              id: 'risk-drift-severity-high',
              severity: 'critical',
              description: 'Drift exceeded threshold and caused trust degradation.',
              mitigationOwner: 'safety',
              status: 'mitigating',
            },
          ],
          decisions: {
            kept: ['fallback transparency copy'],
            changed: ['reduced adaptive traffic to 0%'],
            deferred: ['new personality style rollout'],
            rolledBack: ['adaptive response blending'],
          },
          updatedAt: nowIso(),
        },
        phaseGate: {
          ...base,
          currentPhase: 'adaptive',
          targetPhase: 'trusted',
          metrics: {
            trustScore: 0.69,
            hallucinationRate: 0.14,
            emotionalConsistency: 0.66,
            responseCoherence: 0.74,
            driftScore: 0.63,
          },
          gateChecks: {
            dataReadiness: gateCheck(false, ['missingness exceeded threshold'], ['coverage instability in key cohorts']),
            offlineUplift: gateCheck(false, ['uplift reversed on holdout'], ['hallucination rate regression']),
            shadowSafety: gateCheck(false, ['latency and error burst observed in shadow replay'], ['p95 latency over SLO']),
            transparency: gateCheck(false, ['uncertainty labels dropped below policy target'], ['explanation fallback not applied consistently']),
            rollbackReadiness: gateCheck(true, ['auto-freeze trigger path verified']),
          },
          rollbackTriggered: true,
          decision: 'hold',
          notes: 'Auto-freeze engaged. Reverting adaptive outputs until trust and drift recover.',
          decidedAt: nowIso(),
        },
        trustCalibration: {
          modelId: base.modelId,
          window: evaluationWindow,
          overallTrustScore: 0.69,
          overallCalibrationError: 0.22,
          cohorts: [
            {
              cohortId: 'global-primary',
              sampleSize: 799,
              trustScore: 0.73,
              calibrationError: 0.19,
              hallucinationRate: 0.12,
              emotionalConsistency: 0.71,
              responseCoherence: 0.77,
            },
            {
              cohortId: 'evening-shift',
              sampleSize: 184,
              trustScore: 0.58,
              calibrationError: 0.31,
              hallucinationRate: 0.2,
              emotionalConsistency: 0.55,
              responseCoherence: 0.62,
            },
          ],
          alerts: [
            {
              type: 'drift',
              message: 'Drift exceeded freeze threshold for 3 consecutive windows.',
            },
            {
              type: 'trust_drop',
              message: 'Trust score dropped more than 0.15 from prior week.',
            },
          ],
          generatedAt: nowIso(),
        },
        rollbackEvent: {
          eventId: `rollback-${Date.now()}`,
          modelId: base.modelId,
          fromPhase: 'adaptive',
          toPhase: 'trusted',
          trigger: 'drift_threshold_exceeded',
          severity: 'critical',
          initiatedBy: 'auto-freeze',
          metricsSnapshot: {
            trustScore: 0.69,
            hallucinationRate: 0.14,
            responseCoherence: 0.74,
            driftScore: 0.63,
          },
          summary: 'Automatic rollback due to drift and trust regression.',
          actionItems: ['Freeze adaptive phase', 'Run cohort-level calibration audit'],
          occurredAt: nowIso(),
        },
      };

    case 'hallucination-spike':
      return {
        scorecard: {
          evaluationWindow,
          modelId: base.modelId,
          status: 'red',
          objective: 'Stabilize factual reliability after sudden hallucination spike.',
          quality: {
            calibrationScore: 0.65,
            coherenceScore: 0.7,
            hallucinationRate: 0.27,
            driftScore: 0.51,
          },
          trust: {
            trustScore: 0.58,
            sourceTransparencyRate: 0.93,
            uncertaintyInclusionRate: 0.89,
            emotionalConsistency: 0.72,
          },
          dataHealth: {
            optInReports: 1490,
            missingnessRate: 0.05,
            freshnessHours: 4,
          },
          risks: [
            {
              id: 'risk-factual-instability',
              severity: 'critical',
              description: 'Fact grounding reliability dropped in 6-hour window.',
              mitigationOwner: 'engineering',
              status: 'mitigating',
            },
          ],
          decisions: {
            kept: ['uncertainty-first tone'],
            changed: ['forced citation mode for high-risk prompts'],
            deferred: ['aggressive model promotion'],
            rolledBack: ['adaptive retrieval weighting'],
          },
          updatedAt: nowIso(),
        },
        phaseGate: {
          ...base,
          currentPhase: 'adaptive',
          targetPhase: 'trusted',
          metrics: {
            trustScore: 0.58,
            hallucinationRate: 0.27,
            emotionalConsistency: 0.72,
            responseCoherence: 0.7,
            driftScore: 0.51,
          },
          gateChecks: {
            dataReadiness: gateCheck(true, ['input data stable']),
            offlineUplift: gateCheck(false, ['factual QA failed'], ['hallucination threshold exceeded']),
            shadowSafety: gateCheck(false, ['spike reproduced in shadow'], ['response safety downgrade']),
            transparency: gateCheck(true, ['source labels still present']),
            rollbackReadiness: gateCheck(true, ['manual and auto rollback verified']),
          },
          rollbackTriggered: true,
          decision: 'hold',
          notes: 'Model frozen due to hallucination spike.',
          decidedAt: nowIso(),
        },
        trustCalibration: {
          modelId: base.modelId,
          window: evaluationWindow,
          overallTrustScore: 0.58,
          overallCalibrationError: 0.3,
          cohorts: [
            {
              cohortId: 'global-primary',
              sampleSize: 888,
              trustScore: 0.63,
              calibrationError: 0.26,
              hallucinationRate: 0.24,
              emotionalConsistency: 0.74,
              responseCoherence: 0.73,
            },
            {
              cohortId: 'knowledge-heavy-prompts',
              sampleSize: 240,
              trustScore: 0.42,
              calibrationError: 0.39,
              hallucinationRate: 0.33,
              emotionalConsistency: 0.68,
              responseCoherence: 0.61,
            },
          ],
          alerts: [
            { type: 'trust_drop', message: 'Trust score dropped below 0.60.' },
            { type: 'drift', message: 'Factual drift exceeded threshold.' },
          ],
          generatedAt: nowIso(),
        },
        rollbackEvent: {
          eventId: `rollback-${Date.now()}`,
          modelId: base.modelId,
          fromPhase: 'adaptive',
          toPhase: 'trusted',
          trigger: 'hallucination_spike',
          severity: 'critical',
          initiatedBy: 'auto-freeze',
          metricsSnapshot: {
            trustScore: 0.58,
            hallucinationRate: 0.27,
            responseCoherence: 0.7,
            driftScore: 0.51,
          },
          summary: 'Emergency rollback due to hallucination spike.',
          actionItems: ['Disable adaptive retrieval', 'Run hallucination postmortem'],
          occurredAt: nowIso(),
        },
      };

    case 'emotional-instability':
      return {
        scorecard: {
          evaluationWindow,
          modelId: base.modelId,
          status: 'yellow',
          objective: 'Restore personality and emotional consistency across sessions.',
          quality: {
            calibrationScore: 0.79,
            coherenceScore: 0.73,
            hallucinationRate: 0.06,
            driftScore: 0.37,
          },
          trust: {
            trustScore: 0.74,
            sourceTransparencyRate: 0.97,
            uncertaintyInclusionRate: 0.96,
            emotionalConsistency: 0.54,
          },
          dataHealth: {
            optInReports: 1404,
            missingnessRate: 0.06,
            freshnessHours: 6,
          },
          risks: [
            {
              id: 'risk-personality-instability',
              severity: 'high',
              description: 'Tone and emotional stance vary unpredictably across similar prompts.',
              mitigationOwner: 'personality-team',
              status: 'mitigating',
            },
          ],
          decisions: {
            kept: ['core empathy template'],
            changed: ['strict tone anchoring'],
            deferred: ['new persona expansion'],
            rolledBack: ['dynamic mood blending'],
          },
          updatedAt: nowIso(),
        },
        phaseGate: {
          ...base,
          currentPhase: 'trusted',
          targetPhase: 'adaptive',
          metrics: {
            trustScore: 0.74,
            hallucinationRate: 0.06,
            emotionalConsistency: 0.54,
            responseCoherence: 0.73,
            driftScore: 0.37,
          },
          gateChecks: {
            dataReadiness: gateCheck(true, ['feedback density sufficient']),
            offlineUplift: gateCheck(false, ['emotional consistency failed target'], ['variance above tolerance']),
            shadowSafety: gateCheck(true, ['no hard safety regressions']),
            transparency: gateCheck(true, ['explanation quality stable']),
            rollbackReadiness: gateCheck(true, ['rollback runbook validated']),
          },
          rollbackTriggered: false,
          decision: 'hold',
          notes: 'Promotion blocked by emotional consistency regression.',
          decidedAt: nowIso(),
        },
        trustCalibration: {
          modelId: base.modelId,
          window: evaluationWindow,
          overallTrustScore: 0.74,
          overallCalibrationError: 0.17,
          cohorts: [
            {
              cohortId: 'global-primary',
              sampleSize: 830,
              trustScore: 0.78,
              calibrationError: 0.14,
              hallucinationRate: 0.05,
              emotionalConsistency: 0.58,
              responseCoherence: 0.76,
            },
            {
              cohortId: 'emotionally-loaded-prompts',
              sampleSize: 267,
              trustScore: 0.66,
              calibrationError: 0.23,
              hallucinationRate: 0.08,
              emotionalConsistency: 0.47,
              responseCoherence: 0.68,
            },
          ],
          alerts: [
            { type: 'cohort_regression', message: 'Emotional consistency under target in sensitive prompts.' },
          ],
          generatedAt: nowIso(),
        },
      };

    case 'latency-crisis':
      return {
        scorecard: {
          evaluationWindow,
          modelId: base.modelId,
          status: 'red',
          objective: 'Recover response latency and error budget while preserving trust.',
          quality: {
            calibrationScore: 0.87,
            coherenceScore: 0.82,
            hallucinationRate: 0.05,
            driftScore: 0.31,
          },
          trust: {
            trustScore: 0.81,
            sourceTransparencyRate: 0.98,
            uncertaintyInclusionRate: 0.97,
            emotionalConsistency: 0.79,
          },
          dataHealth: {
            optInReports: 1380,
            missingnessRate: 0.05,
            freshnessHours: 5,
          },
          risks: [
            {
              id: 'risk-latency-crisis',
              severity: 'critical',
              description: 'P95 response time exceeded operational threshold.',
              mitigationOwner: 'engineering',
              status: 'mitigating',
            },
          ],
          decisions: {
            kept: ['trusted fallback model'],
            changed: ['reduced heavy context enrichment'],
            deferred: ['new expensive ranking pass'],
            rolledBack: ['adaptive long-context mode'],
          },
          updatedAt: nowIso(),
        },
        phaseGate: {
          ...base,
          currentPhase: 'adaptive',
          targetPhase: 'trusted',
          metrics: {
            trustScore: 0.81,
            hallucinationRate: 0.05,
            emotionalConsistency: 0.79,
            responseCoherence: 0.82,
            driftScore: 0.31,
          },
          gateChecks: {
            dataReadiness: gateCheck(true, ['data ingestion healthy']),
            offlineUplift: gateCheck(true, ['quality metrics acceptable']),
            shadowSafety: gateCheck(false, ['latency SLO violated'], ['p95 exceeded 1500ms']),
            transparency: gateCheck(true, ['explanations stable']),
            rollbackReadiness: gateCheck(true, ['rollback path exercised']),
          },
          rollbackTriggered: true,
          decision: 'hold',
          notes: 'Auto-freeze by latency monitor.',
          decidedAt: nowIso(),
        },
        trustCalibration: {
          modelId: base.modelId,
          window: evaluationWindow,
          overallTrustScore: 0.81,
          overallCalibrationError: 0.12,
          cohorts: [
            {
              cohortId: 'global-primary',
              sampleSize: 910,
              trustScore: 0.84,
              calibrationError: 0.1,
              hallucinationRate: 0.05,
              emotionalConsistency: 0.81,
              responseCoherence: 0.83,
            },
          ],
          alerts: [
            { type: 'data_quality', message: 'Latency degradation reducing user completion rate.' },
          ],
          generatedAt: nowIso(),
        },
        rollbackEvent: {
          eventId: `rollback-${Date.now()}`,
          modelId: base.modelId,
          fromPhase: 'adaptive',
          toPhase: 'trusted',
          trigger: 'manual_override',
          severity: 'high',
          initiatedBy: 'ops',
          metricsSnapshot: {
            trustScore: 0.81,
            hallucinationRate: 0.05,
            responseCoherence: 0.82,
            driftScore: 0.31,
          },
          summary: 'Rollback triggered to restore latency SLOs.',
          actionItems: ['Throttle adaptive features', 'Scale serving tier'],
          occurredAt: nowIso(),
        },
      };

    case 'approval-deadlock':
      return {
        scorecard: {
          evaluationWindow,
          modelId: base.modelId,
          status: 'yellow',
          objective: 'Resolve cross-team gate approval conflict.',
          quality: {
            calibrationScore: 0.89,
            coherenceScore: 0.88,
            hallucinationRate: 0.04,
            driftScore: 0.19,
          },
          trust: {
            trustScore: 0.9,
            sourceTransparencyRate: 0.99,
            uncertaintyInclusionRate: 0.98,
            emotionalConsistency: 0.86,
          },
          dataHealth: {
            optInReports: 1502,
            missingnessRate: 0.03,
            freshnessHours: 3,
          },
          risks: [
            {
              id: 'risk-approval-deadlock',
              severity: 'medium',
              description: 'Promotion blocked due to unresolved safety versus product sign-off.',
              mitigationOwner: 'ops',
              status: 'open',
            },
          ],
          decisions: {
            kept: ['current trusted model'],
            changed: ['escalation process'],
            deferred: ['promotion to adaptive'],
            rolledBack: [],
          },
          updatedAt: nowIso(),
        },
        phaseGate: {
          ...base,
          currentPhase: 'trusted',
          targetPhase: 'adaptive',
          metrics: {
            trustScore: 0.9,
            hallucinationRate: 0.04,
            emotionalConsistency: 0.86,
            responseCoherence: 0.88,
            driftScore: 0.19,
          },
          gateChecks: {
            dataReadiness: gateCheck(true, ['all data gates passed']),
            offlineUplift: gateCheck(true, ['uplift validated']),
            shadowSafety: gateCheck(true, ['safety checks passed']),
            transparency: gateCheck(true, ['transparency rates acceptable']),
            rollbackReadiness: gateCheck(true, ['rollback simulation done']),
          },
          approvedBy: ['ops'],
          rollbackTriggered: false,
          decision: 'hold',
          notes: 'Awaiting cross-functional consensus.',
          decidedAt: nowIso(),
        },
        trustCalibration: {
          modelId: base.modelId,
          window: evaluationWindow,
          overallTrustScore: 0.9,
          overallCalibrationError: 0.09,
          cohorts: [
            {
              cohortId: 'global-primary',
              sampleSize: 1001,
              trustScore: 0.91,
              calibrationError: 0.08,
              hallucinationRate: 0.04,
              emotionalConsistency: 0.87,
              responseCoherence: 0.89,
            },
          ],
          alerts: [],
          generatedAt: nowIso(),
        },
      };

    case 'silent-failure':
      return {
        scorecard: {
          evaluationWindow,
          modelId: base.modelId,
          status: 'green',
          objective: 'Observe hidden corruption under apparently healthy metrics.',
          quality: {
            calibrationScore: 0.9,
            coherenceScore: 0.9,
            hallucinationRate: 0.04,
            driftScore: 0.12,
          },
          trust: {
            trustScore: 0.91,
            sourceTransparencyRate: 0.99,
            uncertaintyInclusionRate: 0.99,
            emotionalConsistency: 0.89,
          },
          dataHealth: {
            optInReports: 1550,
            missingnessRate: 0.02,
            freshnessHours: 2,
          },
          risks: [
            {
              id: 'risk-hidden-corruption',
              severity: 'high',
              description: 'Outward metrics healthy but anomaly detector flagged hidden corruption.',
              mitigationOwner: 'safety',
              status: 'open',
            },
          ],
          decisions: {
            kept: ['normal user-facing outputs'],
            changed: ['enabled deeper anomaly probes'],
            deferred: ['promotion decisions'],
            rolledBack: [],
          },
          updatedAt: nowIso(),
        },
        phaseGate: {
          ...base,
          currentPhase: 'trusted',
          targetPhase: 'adaptive',
          metrics: {
            trustScore: 0.91,
            hallucinationRate: 0.04,
            emotionalConsistency: 0.89,
            responseCoherence: 0.9,
            driftScore: 0.12,
          },
          gateChecks: {
            dataReadiness: gateCheck(false, ['anomaly detector alert'], ['possible hidden data corruption']),
            offlineUplift: gateCheck(true, ['uplift appears healthy']),
            shadowSafety: gateCheck(true, ['no direct safety failures']),
            transparency: gateCheck(true, ['transparency stable']),
            rollbackReadiness: gateCheck(true, ['rollback ready']),
          },
          rollbackTriggered: false,
          decision: 'hold',
          notes: 'Promotion blocked pending hidden corruption investigation.',
          decidedAt: nowIso(),
        },
        trustCalibration: {
          modelId: base.modelId,
          window: evaluationWindow,
          overallTrustScore: 0.91,
          overallCalibrationError: 0.09,
          cohorts: [
            {
              cohortId: 'global-primary',
              sampleSize: 1012,
              trustScore: 0.92,
              calibrationError: 0.08,
              hallucinationRate: 0.04,
              emotionalConsistency: 0.9,
              responseCoherence: 0.9,
            },
          ],
          alerts: [
            { type: 'data_quality', message: 'Silent-failure probe indicates suspicious metric consistency.' },
          ],
          generatedAt: nowIso(),
        },
      };

    case 'adversarial-user':
      return {
        scorecard: {
          evaluationWindow,
          modelId: base.modelId,
          status: 'yellow',
          objective: 'Evaluate resilience against emotional manipulation and prompt poisoning.',
          quality: {
            calibrationScore: 0.84,
            coherenceScore: 0.8,
            hallucinationRate: 0.09,
            driftScore: 0.34,
          },
          trust: {
            trustScore: 0.77,
            sourceTransparencyRate: 0.98,
            uncertaintyInclusionRate: 0.95,
            emotionalConsistency: 0.7,
          },
          dataHealth: {
            optInReports: 1260,
            missingnessRate: 0.07,
            freshnessHours: 7,
          },
          risks: [
            {
              id: 'risk-prompt-poisoning',
              severity: 'high',
              description: 'Adversarial prompt attempts altered tone and confidence behavior.',
              mitigationOwner: 'safety',
              status: 'mitigating',
            },
          ],
          decisions: {
            kept: ['defensive content policy layer'],
            changed: ['increased adversarial detection sensitivity'],
            deferred: ['adaptive confidence expansion'],
            rolledBack: ['high-personalization under attack patterns'],
          },
          updatedAt: nowIso(),
        },
        phaseGate: {
          ...base,
          currentPhase: 'trusted',
          targetPhase: 'adaptive',
          metrics: {
            trustScore: 0.77,
            hallucinationRate: 0.09,
            emotionalConsistency: 0.7,
            responseCoherence: 0.8,
            driftScore: 0.34,
          },
          gateChecks: {
            dataReadiness: gateCheck(true, ['attack telemetry collected']),
            offlineUplift: gateCheck(false, ['stress tests failed'], ['adversarial resilience below threshold']),
            shadowSafety: gateCheck(false, ['prompt-poisoning tests found leakage'], ['inconsistent refusal behavior']),
            transparency: gateCheck(true, ['source transparency remains stable']),
            rollbackReadiness: gateCheck(true, ['rapid lockdown tested']),
          },
          rollbackTriggered: false,
          decision: 'hold',
          notes: 'Promotion blocked until adversarial hardening completes.',
          decidedAt: nowIso(),
        },
        trustCalibration: {
          modelId: base.modelId,
          window: evaluationWindow,
          overallTrustScore: 0.77,
          overallCalibrationError: 0.16,
          cohorts: [
            {
              cohortId: 'global-primary',
              sampleSize: 780,
              trustScore: 0.8,
              calibrationError: 0.13,
              hallucinationRate: 0.08,
              emotionalConsistency: 0.73,
              responseCoherence: 0.82,
            },
            {
              cohortId: 'adversarial-prompts',
              sampleSize: 201,
              trustScore: 0.61,
              calibrationError: 0.27,
              hallucinationRate: 0.15,
              emotionalConsistency: 0.52,
              responseCoherence: 0.65,
            },
          ],
          alerts: [
            { type: 'cohort_regression', message: 'Adversarial cohort trust below operational threshold.' },
          ],
          generatedAt: nowIso(),
        },
      };

    case 'healthy':
    default:
      return {
        scorecard: {
          evaluationWindow,
          modelId: base.modelId,
          status: 'green',
          objective: 'Improve trust calibration and keep hallucination drift below threshold.',
          quality: {
            calibrationScore: 0.91,
            coherenceScore: 0.9,
            hallucinationRate: 0.03,
            driftScore: 0.16,
          },
          trust: {
            trustScore: 0.92,
            sourceTransparencyRate: 0.99,
            uncertaintyInclusionRate: 0.98,
            emotionalConsistency: 0.88,
          },
          dataHealth: {
            optInReports: 1462,
            missingnessRate: 0.04,
            freshnessHours: 5,
          },
          risks: [
            {
              id: 'risk-cohort-evening-shift',
              severity: 'medium',
              description: 'Evening-shift cohort has lower calibration reliability.',
              mitigationOwner: 'ops',
              status: 'mitigating',
            },
          ],
          decisions: {
            kept: ['post-meal mood smoothing'],
            changed: ['confidence-band wording'],
            deferred: ['multilingual explanation layer'],
            rolledBack: [],
          },
          updatedAt: nowIso(),
        },
        phaseGate: {
          ...base,
          currentPhase: 'trusted',
          targetPhase: 'adaptive',
          metrics: {
            trustScore: 0.92,
            hallucinationRate: 0.03,
            emotionalConsistency: 0.88,
            responseCoherence: 0.9,
            driftScore: 0.16,
          },
          gateChecks: {
            dataReadiness: gateCheck(true, ['opt-in coverage above threshold', 'missingness under 5%']),
            offlineUplift: gateCheck(true, ['calibration uplift +6.3% vs baseline']),
            shadowSafety: gateCheck(true, ['no SLO violation in 72h shadow run']),
            transparency: gateCheck(true, ['99% outputs include source transparency and uncertainty']),
            rollbackReadiness: gateCheck(true, ['rollback simulation completed in under 3 minutes']),
          },
          rollbackTriggered: false,
          decision: 'approve',
          notes: 'Advance to adaptive under 10% traffic flag for 48 hours.',
          decidedAt: nowIso(),
        },
        trustCalibration: {
          modelId: base.modelId,
          window: evaluationWindow,
          overallTrustScore: 0.92,
          overallCalibrationError: 0.08,
          cohorts: [
            {
              cohortId: 'global-primary',
              sampleSize: 862,
              trustScore: 0.93,
              calibrationError: 0.07,
              hallucinationRate: 0.03,
              emotionalConsistency: 0.89,
              responseCoherence: 0.91,
            },
            {
              cohortId: 'evening-shift',
              sampleSize: 211,
              trustScore: 0.86,
              calibrationError: 0.13,
              hallucinationRate: 0.05,
              emotionalConsistency: 0.81,
              responseCoherence: 0.84,
            },
          ],
          alerts: [
            {
              type: 'cohort_regression',
              message: 'Evening-shift cohort underperforms baseline trust target by 0.04.',
            },
          ],
          generatedAt: nowIso(),
        },
      };
  }
}

function summaryFromScenario(scenario) {
  const map = {
    healthy: {
      phaseLabel: 'trusted -> adaptive',
      rollback: false,
    },
    degraded: {
      phaseLabel: 'adaptive -> trusted (degraded)',
      rollback: true,
    },
    'hallucination-spike': {
      phaseLabel: 'adaptive -> trusted (hallucination)',
      rollback: true,
    },
    'emotional-instability': {
      phaseLabel: 'trusted -> adaptive (blocked)',
      rollback: false,
    },
    'latency-crisis': {
      phaseLabel: 'adaptive -> trusted (latency)',
      rollback: true,
    },
    'approval-deadlock': {
      phaseLabel: 'trusted -> adaptive (deadlock)',
      rollback: false,
    },
    'silent-failure': {
      phaseLabel: 'trusted -> adaptive (blocked)',
      rollback: false,
    },
    'adversarial-user': {
      phaseLabel: 'trusted -> adaptive (harden)',
      rollback: false,
    },
  };
  return map[scenario] || map.healthy;
}

async function main() {
  const scenario = resolveScenario();
  const evaluationWindow = '2026-W22';
  const payloads = getScenarioData(scenario, evaluationWindow);
  const labels = summaryFromScenario(scenario);

  const results = [];
  results.push(
    await upsertByType(
      OPS_EVENT_TYPES.scorecard,
      payloads.scorecard,
      `Scorecard ${evaluationWindow} (${scenario})`,
      hoursAgoDate(3)
    )
  );
  results.push(
    await upsertByType(
      OPS_EVENT_TYPES.phaseGate,
      payloads.phaseGate,
      `Phase gate ${labels.phaseLabel}`,
      hoursAgoDate(2)
    )
  );
  results.push(
    await upsertByType(
      OPS_EVENT_TYPES.trustCalibration,
      payloads.trustCalibration,
      `Trust calibration ${evaluationWindow} (${scenario})`,
      hoursAgoDate(1)
    )
  );

  if (labels.rollback && payloads.rollbackEvent) {
    results.push(
      await upsertByType(
        OPS_EVENT_TYPES.rollbackEvent,
        payloads.rollbackEvent,
        `Rollback event (${scenario})`,
        hoursAgoDate(0.5)
      )
    );
  }

  console.log(`Seed complete (${scenario}):`, results);
  console.log(`Available scenarios: ${SCENARIOS.join(', ')}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
