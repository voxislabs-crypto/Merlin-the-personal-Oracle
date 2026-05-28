import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OPS_EVENT_TYPES = [
  'ops_scorecard_v1',
  'ops_phase_gate_v1',
  'ops_trust_calibration_v1',
  'ops_rollback_event_v1',
];

const DEFAULT_SCENARIOS = [
  'healthy',
  'degraded',
  'hallucination-spike',
  'emotional-instability',
  'latency-crisis',
  'approval-deadlock',
  'silent-failure',
  'adversarial-user',
];

function readArg(name) {
  const inline = process.argv.find((item) => item.startsWith(`--${name}=`));
  if (inline) return inline.split('=')[1] || undefined;

  const idx = process.argv.findIndex((item) => item === `--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];

  return undefined;
}

function resolveScenarios() {
  const raw = readArg('scenarios');
  if (!raw) return DEFAULT_SCENARIOS;

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, idx, arr) => arr.indexOf(item) === idx);
}

function runNodeScript(scriptRelativePath, args = []) {
  const scriptPath = path.join(process.cwd(), scriptRelativePath);
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const stdout = result.stdout || '';
    const stderr = result.stderr || '';
    throw new Error(`Failed: node ${scriptRelativePath} ${args.join(' ')}\n${stdout}\n${stderr}`);
  }

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

async function getCurrentOpsEventSlice() {
  const rows = await prisma.userInteractionEvent.findMany({
    where: {
      type: {
        in: OPS_EVENT_TYPES,
      },
      userId: 'internal-ops-seed',
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      type: true,
      content: true,
      createdAt: true,
      metadataJson: true,
    },
  });

  const parsedRows = rows.map((row) => {
    let payload = null;
    try {
      payload = JSON.parse(row.metadataJson || 'null');
    } catch {
      payload = null;
    }

    return {
      id: row.id,
      type: row.type,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      payload,
    };
  });

  const latest = {
    scorecard: parsedRows.find((row) => row.type === 'ops_scorecard_v1')?.payload || null,
    phaseGate: parsedRows.find((row) => row.type === 'ops_phase_gate_v1')?.payload || null,
    trustCalibration: parsedRows.find((row) => row.type === 'ops_trust_calibration_v1')?.payload || null,
    rollbackEvent: parsedRows.find((row) => row.type === 'ops_rollback_event_v1')?.payload || null,
  };

  return {
    eventCount: parsedRows.length,
    latest,
    events: parsedRows,
  };
}

async function main() {
  const outDirArg = readArg('out-dir') || 'docs/ops/reports';
  const outDir = path.isAbsolute(outDirArg) ? outDirArg : path.join(process.cwd(), outDirArg);
  const scenarios = resolveScenarios();
  const finalScenario = readArg('final-scenario') || 'healthy';

  if (scenarios.length === 0) {
    throw new Error('No scenarios resolved. Provide --scenarios with at least one value.');
  }

  await mkdir(outDir, { recursive: true });

  const startedAt = new Date().toISOString();
  const summary = [];

  for (const scenario of scenarios) {
    runNodeScript('scripts/reset-ops-telemetry.mjs');
    runNodeScript('scripts/seed-ops-telemetry.mjs', ['--scenario', scenario]);

    const slice = await getCurrentOpsEventSlice();

    const report = {
      generatedAt: new Date().toISOString(),
      scenario,
      eventCount: slice.eventCount,
      latest: slice.latest,
      events: slice.events,
    };

    const filePath = path.join(outDir, `${scenario}.json`);
    await writeFile(filePath, JSON.stringify(report, null, 2));

    summary.push({
      scenario,
      eventCount: slice.eventCount,
      file: path.relative(process.cwd(), filePath),
      rollbackPresent: Boolean(slice.latest.rollbackEvent),
      trustScore: typeof slice.latest.phaseGate?.metrics?.trustScore === 'number' ? slice.latest.phaseGate.metrics.trustScore : null,
      driftScore: typeof slice.latest.phaseGate?.metrics?.driftScore === 'number' ? slice.latest.phaseGate.metrics.driftScore : null,
    });
  }

  if (finalScenario !== 'none') {
    runNodeScript('scripts/reset-ops-telemetry.mjs');
    runNodeScript('scripts/seed-ops-telemetry.mjs', ['--scenario', finalScenario]);
  }

  const indexReport = {
    generatedAt: new Date().toISOString(),
    startedAt,
    endedAt: new Date().toISOString(),
    scenarios,
    restoredScenario: finalScenario,
    reports: summary,
  };

  const indexPath = path.join(outDir, 'index.json');
  await writeFile(indexPath, JSON.stringify(indexReport, null, 2));

  console.log('Matrix run complete.');
  console.log(`Report index: ${path.relative(process.cwd(), indexPath)}`);
  console.table(summary);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
