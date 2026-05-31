import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import scorecardSchema from '../schemas/scorecard.schema.json' with { type: 'json' };
import phaseGateSchema from '../schemas/phase-gate.schema.json' with { type: 'json' };
import rollbackEventSchema from '../schemas/rollback-event.schema.json' with { type: 'json' };
import trustCalibrationSchema from '../schemas/trust-calibration.schema.json' with { type: 'json' };

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const validateScorecard = ajv.compile(scorecardSchema);
const validatePhaseGate = ajv.compile(phaseGateSchema);
const validateRollback = ajv.compile(rollbackEventSchema);
const validateTrustCalibration = ajv.compile(trustCalibrationSchema);

function reportErrors(label, errors) {
  const lines = (errors || []).map((error) => `${error.instancePath || '/'} ${error.message || 'is invalid'}`);
  return `${label} failed schema validation:\n${lines.map((line) => `- ${line}`).join('\n')}`;
}

function assertValid(label, validateFn, payload) {
  const valid = validateFn(payload);
  if (!valid) {
    throw new Error(reportErrors(label, validateFn.errors));
  }
}

function baseFixtures() {
  const date = new Date().toISOString();

  const scorecard = {
    evaluationWindow: '2026-W22',
    modelId: 'voxis-luna-v0.4',
    status: 'green',
    objective: 'Schema gate baseline fixture',
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
      optInReports: 100,
      missingnessRate: 0.04,
      freshnessHours: 5,
    },
    risks: [
      {
        id: 'risk-1',
        severity: 'medium',
        description: 'Fixture risk',
        mitigationOwner: 'ops',
        status: 'open',
      },
    ],
    decisions: {
      kept: ['baseline'],
      changed: [],
      deferred: [],
      rolledBack: [],
    },
    updatedAt: date,
  };

  const phaseGate = {
    modelId: 'voxis-luna-v0.4',
    evaluationWindow: '2026-W22',
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
      dataReadiness: { pass: true, evidence: ['ok'] },
      offlineUplift: { pass: true, evidence: ['ok'] },
      shadowSafety: { pass: true, evidence: ['ok'] },
      transparency: { pass: true, evidence: ['ok'] },
      rollbackReadiness: { pass: true, evidence: ['ok'] },
    },
    approvedBy: ['ops', 'safety', 'personality-team'],
    rollbackTriggered: false,
    decision: 'approve',
    notes: 'Fixture payload',
    decidedAt: date,
  };

  const rollbackEvent = {
    eventId: 'rollback-fixture-001',
    modelId: 'voxis-luna-v0.4',
    fromPhase: 'adaptive',
    toPhase: 'trusted',
    trigger: 'manual_override',
    severity: 'high',
    initiatedBy: 'ops',
    metricsSnapshot: {
      trustScore: 0.7,
      hallucinationRate: 0.12,
      responseCoherence: 0.76,
      driftScore: 0.48,
    },
    summary: 'Fixture rollback event',
    actionItems: ['Investigate'],
    occurredAt: date,
  };

  const trustCalibration = {
    modelId: 'voxis-luna-v0.4',
    window: '2026-W22',
    overallTrustScore: 0.92,
    overallCalibrationError: 0.08,
    cohorts: [
      {
        cohortId: 'global',
        sampleSize: 100,
        trustScore: 0.92,
        calibrationError: 0.08,
        hallucinationRate: 0.03,
        emotionalConsistency: 0.88,
        responseCoherence: 0.9,
      },
    ],
    alerts: [],
    generatedAt: date,
  };

  return { scorecard, phaseGate, rollbackEvent, trustCalibration };
}

function validateReportArtifacts() {
  const reportsDir = path.join(process.cwd(), 'docs/ops/reports');
  if (!existsSync(reportsDir)) {
    console.log('No docs/ops/reports directory found; skipping report artifact validation.');
    return;
  }

  const files = readdirSync(reportsDir).filter((name) => name.endsWith('.json') && name !== 'index.json');
  for (const fileName of files) {
    const filePath = path.join(reportsDir, fileName);
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    if (!parsed || typeof parsed !== 'object') {
      throw new Error(`Report ${fileName} is not a valid object`);
    }

    if (parsed.latest?.scorecard) {
      assertValid(`${fileName}:latest.scorecard`, validateScorecard, parsed.latest.scorecard);
    }
    if (parsed.latest?.phaseGate) {
      assertValid(`${fileName}:latest.phaseGate`, validatePhaseGate, parsed.latest.phaseGate);
    }
    if (parsed.latest?.trustCalibration) {
      assertValid(`${fileName}:latest.trustCalibration`, validateTrustCalibration, parsed.latest.trustCalibration);
    }
    if (parsed.latest?.rollbackEvent) {
      assertValid(`${fileName}:latest.rollbackEvent`, validateRollback, parsed.latest.rollbackEvent);
    }
  }

  console.log(`Validated ${files.length} report artifact file(s).`);
}

function main() {
  const fixtures = baseFixtures();

  assertValid('fixture.scorecard', validateScorecard, fixtures.scorecard);
  assertValid('fixture.phaseGate', validatePhaseGate, fixtures.phaseGate);
  assertValid('fixture.rollbackEvent', validateRollback, fixtures.rollbackEvent);
  assertValid('fixture.trustCalibration', validateTrustCalibration, fixtures.trustCalibration);

  validateReportArtifacts();
  console.log('Ops schema validation passed.');
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
