import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OPS_TYPES = {
  trustCalibration: 'ops_trust_calibration_v1',
  rollbackEvent: 'ops_rollback_event_v1',
};

function readArg(name) {
  const inline = process.argv.find((item) => item.startsWith(`--${name}=`));
  if (inline) return inline.split('=')[1] || undefined;
  const idx = process.argv.findIndex((item) => item === `--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return undefined;
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function main() {
  const outArg = readArg('out') || 'docs/ops/reports/trend-rollup.json';
  const days = Math.max(1, Math.min(90, toNumber(readArg('days'), 14)));
  const outPath = path.isAbsolute(outArg) ? outArg : path.join(process.cwd(), outArg);
  const outDir = path.dirname(outPath);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [trustRows, rollbackRows] = await Promise.all([
    prisma.userInteractionEvent.findMany({
      where: {
        type: OPS_TYPES.trustCalibration,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, metadataJson: true },
    }),
    prisma.userInteractionEvent.findMany({
      where: {
        type: OPS_TYPES.rollbackEvent,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, metadataJson: true, content: true },
    }),
  ]);

  const trustSeries = trustRows
    .map((row) => {
      try {
        const payload = JSON.parse(row.metadataJson || '{}');
        return {
          ts: row.createdAt.toISOString(),
          window: String(payload.window || '').trim() || row.createdAt.toISOString().slice(0, 10),
          trustScore: toNumber(payload.overallTrustScore, 0),
          calibrationError: toNumber(payload.overallCalibrationError, 1),
          cohorts: Array.isArray(payload.cohorts) ? payload.cohorts.length : 0,
        };
      } catch {
        return null;
      }
    })
    .filter((item) => item !== null);

  const rollbacks = rollbackRows
    .map((row) => {
      try {
        const payload = JSON.parse(row.metadataJson || '{}');
        return {
          ts: row.createdAt.toISOString(),
          trigger: String(payload.trigger || 'unknown'),
          fromPhase: String(payload.fromPhase || 'unknown'),
          toPhase: String(payload.toPhase || 'unknown'),
          severity: String(payload.severity || 'unknown'),
          content: row.content,
        };
      } catch {
        return null;
      }
    })
    .filter((item) => item !== null);

  const latestTrust = trustSeries[trustSeries.length - 1] || null;
  const previousTrust = trustSeries.length > 1 ? trustSeries[trustSeries.length - 2] : null;

  const report = {
    generatedAt: new Date().toISOString(),
    windowDays: days,
    summary: {
      trustSamples: trustSeries.length,
      rollbackCount: rollbacks.length,
      latestTrustScore: latestTrust ? latestTrust.trustScore : null,
      trustDelta:
        latestTrust && previousTrust
          ? Number((latestTrust.trustScore - previousTrust.trustScore).toFixed(4))
          : null,
    },
    trustSeries,
    rollbacks,
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, JSON.stringify(report, null, 2));

  console.log(`Trend rollup generated: ${path.relative(process.cwd(), outPath)}`);
  console.log(`Samples: trust=${trustSeries.length}, rollbacks=${rollbacks.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
