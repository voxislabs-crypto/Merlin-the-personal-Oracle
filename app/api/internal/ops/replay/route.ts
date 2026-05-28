import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

import { requireInternalOpsAccess } from '@/lib/internal/ops-auth';

interface ReplayEvent {
  type: string;
  content: string;
  createdAt: string;
  payload?: Record<string, unknown>;
}

function parseScenario(input: string | null): string {
  if (!input) return 'healthy';
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : 'healthy';
}

function buildTimeline(events: ReplayEvent[]) {
  return events.map((event) => {
    const level = event.type.includes('rollback')
      ? 'danger'
      : event.type.includes('phase_gate')
        ? 'warning'
        : 'info';

    return {
      ts: event.createdAt,
      level,
      text: `${event.type}: ${event.content}`,
    };
  });
}

export async function GET(request: NextRequest) {
  const denied = await requireInternalOpsAccess(request);
  if (denied) return denied;

  try {
    const scenario = parseScenario(request.nextUrl.searchParams.get('scenario'));
    const reportsDir = path.join(process.cwd(), 'docs/ops/reports');

    const reportFilePath = path.join(reportsDir, `${scenario}.json`);
    const indexFilePath = path.join(reportsDir, 'index.json');

    const [reportRaw, indexRaw] = await Promise.all([
      readFile(reportFilePath, 'utf8'),
      readFile(indexFilePath, 'utf8').catch(() => null),
    ]);

    const report = JSON.parse(reportRaw) as {
      generatedAt?: string;
      scenario?: string;
      latest?: Record<string, unknown>;
      events?: ReplayEvent[];
    };

    const index = indexRaw
      ? (JSON.parse(indexRaw) as { reports?: Array<{ scenario: string; file: string }> })
      : null;

    const events = Array.isArray(report.events) ? report.events : [];

    return NextResponse.json({
      success: true,
      data: {
        scenario,
        generatedAt: report.generatedAt || new Date().toISOString(),
        availableScenarios: Array.isArray(index?.reports)
          ? index.reports.map((item) => item.scenario)
          : [],
        latest: report.latest || null,
        timeline: buildTimeline(events),
        events,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load replay report',
      },
      { status: 500 }
    );
  }
}
