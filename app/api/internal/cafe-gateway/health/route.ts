import { NextRequest, NextResponse } from 'next/server';

type TargetMode = 'generic' | 'local' | 'remote';

interface GatewayTarget {
  mode: TargetMode;
  provider: string;
  model: string;
  url: string;
  apiKeyPresent: boolean;
}

interface ProbeResult {
  mode: TargetMode;
  reachable: boolean;
  status?: number;
  statusText?: string;
  error?: string;
}

function redactUrl(input: string): string {
  try {
    const parsed = new URL(input);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return input;
  }
}

function readGatewayTargets(): GatewayTarget[] {
  const genericUrl = process.env.CAFE_LLM_API_URL || '';
  const genericProvider = process.env.CAFE_LLM_PROVIDER || 'cafe-gateway';
  const genericModel = process.env.CAFE_LLM_MODEL || 'unset';
  const genericKey = process.env.CAFE_LLM_API_KEY;

  const localUrl = process.env.CAFE_LOCAL_API_URL || genericUrl;
  const localProvider = process.env.CAFE_LOCAL_PROVIDER || genericProvider;
  const localModel = process.env.CAFE_LOCAL_MODEL || genericModel;
  const localKey = process.env.CAFE_LOCAL_API_KEY || genericKey;

  const remoteUrl = process.env.CAFE_REMOTE_API_URL || genericUrl;
  const remoteProvider = process.env.CAFE_REMOTE_PROVIDER || genericProvider;
  const remoteModel = process.env.CAFE_REMOTE_MODEL || genericModel;
  const remoteKey = process.env.CAFE_REMOTE_API_KEY || genericKey;

  const targets: GatewayTarget[] = [];

  if (genericUrl) {
    targets.push({
      mode: 'generic',
      provider: genericProvider,
      model: genericModel,
      url: redactUrl(genericUrl),
      apiKeyPresent: Boolean(genericKey),
    });
  }

  if (localUrl) {
    targets.push({
      mode: 'local',
      provider: localProvider,
      model: localModel,
      url: redactUrl(localUrl),
      apiKeyPresent: Boolean(localKey),
    });
  }

  if (remoteUrl) {
    targets.push({
      mode: 'remote',
      provider: remoteProvider,
      model: remoteModel,
      url: redactUrl(remoteUrl),
      apiKeyPresent: Boolean(remoteKey),
    });
  }

  const deduped = new Map<string, GatewayTarget>();
  targets.forEach((target) => {
    const key = `${target.mode}:${target.url}:${target.model}:${target.provider}`;
    deduped.set(key, target);
  });

  return Array.from(deduped.values());
}

async function probeTarget(target: GatewayTarget): Promise<ProbeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(target.url, {
      method: 'OPTIONS',
      signal: controller.signal,
    });

    return {
      mode: target.mode,
      reachable: true,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    return {
      mode: target.mode,
      reachable: false,
      error: error instanceof Error ? error.message : 'Unknown probe error',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const probeEnabled = request.nextUrl.searchParams.get('probe') === '1';
  const targets = readGatewayTargets();

  const probes = probeEnabled
    ? await Promise.all(targets.map((target) => probeTarget(target)))
    : [];

  return NextResponse.json({
    success: true,
    data: {
      configured: {
        generic: targets.some((target) => target.mode === 'generic'),
        local: targets.some((target) => target.mode === 'local'),
        remote: targets.some((target) => target.mode === 'remote'),
      },
      targets,
      probeEnabled,
      probes,
      notes: [
        'API keys are intentionally not returned by this endpoint.',
        'Probe mode checks endpoint reachability only and does not validate model output.',
      ],
    },
  });
}
