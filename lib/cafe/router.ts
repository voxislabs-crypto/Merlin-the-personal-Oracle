import type {
  CafeForecastPayload,
  CafeForecastRequest,
  LlmRouterResult,
} from '@/shared/cafe-contracts';
import { validateCafeForecastPayload } from '@/lib/cafe/validation';

interface GatewayConfig {
  provider: string;
  executionMode: 'local' | 'remote';
  apiUrl: string;
  apiKey?: string;
  model: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const round = (value: number): number => Math.round(value);

function getPhase(index: number): CafeForecastPayload['phase'] {
  if (index >= 80) return 'clear';
  if (index >= 68) return 'golden_hour';
  if (index >= 52) return 'variable';
  if (index >= 38) return 'fog';
  if (index >= 24) return 'recovery';
  return 'stormy';
}

function synthesizePayload(request: CafeForecastRequest): CafeForecastPayload {
  const energy = request.intake.behavioral.energy;
  const focus = request.intake.behavioral.focus;
  const emotionalLoad = request.intake.behavioral.emotionalLoad;
  const envPressure = request.environment?.weatherPressureIndex ?? 50;
  const collectiveSentiment = request.environment?.collectiveSentiment ?? 50;

  const cognitiveClarity = clamp(round(focus * 0.66 + energy * 0.24 + (100 - emotionalLoad) * 0.1), 0, 100);
  const emotionalPressure = clamp(round(emotionalLoad * 0.7 + envPressure * 0.2 + (100 - energy) * 0.1), 0, 100);
  const socialFriction = clamp(round((100 - collectiveSentiment) * 0.45 + emotionalLoad * 0.4 + (100 - focus) * 0.15), 0, 100);
  const recoveryCapacity = clamp(round((100 - emotionalPressure) * 0.2 + energy * 0.55 + (request.horizonHours <= 24 ? 15 : 7)), 0, 100);

  const symbolicBoost = request.merlinContext?.symbolicSignals?.[0]?.intensity
    ? clamp(request.merlinContext.symbolicSignals[0].intensity * 0.15, 0, 12)
    : 0;

  const opportunityWindow = clamp(round(cognitiveClarity * 0.46 + recoveryCapacity * 0.34 + symbolicBoost + (100 - socialFriction) * 0.2), 0, 100);

  const cafeIndex = clamp(
    round(
      cognitiveClarity * 0.32 +
        recoveryCapacity * 0.28 +
        opportunityWindow * 0.24 +
        (100 - emotionalPressure) * 0.1 +
        (100 - socialFriction) * 0.06
    ),
    0,
    100
  );

  const phase = getPhase(cafeIndex);
  const confidence = clamp(
    Number((0.62 + (request.environment ? 0.1 : 0) + (request.merlinContext ? 0.12 : 0)).toFixed(2)),
    0,
    1
  );

  const guidance: string[] = [
    'Consider single-threading your most meaningful task during your highest-focus window.',
    'It may be worth reducing social context switching when emotional pressure rises.',
    'A short recovery block could improve clarity before your next important decision.',
  ];

  if (phase === 'stormy' || phase === 'fog') {
    guidance[0] = 'Consider postponing non-essential commitments until pressure eases.';
  }

  return {
    cafeIndex,
    phase,
    confidence,
    dimensions: {
      cognitiveClarity,
      emotionalPressure,
      socialFriction,
      recoveryCapacity,
      opportunityWindow,
    },
    guidance,
    cautionNote:
      phase === 'stormy' || phase === 'fog'
        ? 'Avoid binary thinking under elevated pressure; favor reversible steps.'
        : 'Watch for overcommitment if momentum stays high for multiple blocks.',
    opportunitySignal:
      opportunityWindow >= 65
        ? 'High leverage window for strategic planning and focused communication.'
        : 'Opportunity improves with pacing and sharper prioritization.',
    recoveryWindow: request.horizonHours <= 24 ? '18:00-21:00 local' : 'Daily evening decompression window',
    symbolicNote: request.merlinContext
      ? `${request.merlinContext.moonPhase}${request.merlinContext.moonSign ? ` in ${request.merlinContext.moonSign}` : ''} suggests steady, non-deterministic progress.`
      : 'Symbolic context unavailable; treating this as behavior-plus-environment synthesis.',
  };
}

function getGatewayConfig(request: CafeForecastRequest): {
  preferred?: GatewayConfig;
  fallback?: GatewayConfig;
} {
  const preferredMode = request.routingPolicy?.preferredMode ?? 'local';

  const genericUrl = process.env.CAFE_LLM_API_URL;
  const genericKey = process.env.CAFE_LLM_API_KEY;
  const genericModel = process.env.CAFE_LLM_MODEL;
  const genericProvider = process.env.CAFE_LLM_PROVIDER || 'cafe-gateway';

  const localConfig: GatewayConfig | undefined =
    process.env.CAFE_LOCAL_API_URL || genericUrl
      ? {
          provider: process.env.CAFE_LOCAL_PROVIDER || genericProvider,
          executionMode: 'local',
          apiUrl: process.env.CAFE_LOCAL_API_URL || genericUrl || '',
          apiKey: process.env.CAFE_LOCAL_API_KEY || genericKey,
          model:
            request.routingPolicy?.localModel ||
            process.env.CAFE_LOCAL_MODEL ||
            genericModel ||
            'custom-local-model',
        }
      : undefined;

  const remoteConfig: GatewayConfig | undefined =
    process.env.CAFE_REMOTE_API_URL || genericUrl
      ? {
          provider: process.env.CAFE_REMOTE_PROVIDER || genericProvider,
          executionMode: 'remote',
          apiUrl: process.env.CAFE_REMOTE_API_URL || genericUrl || '',
          apiKey: process.env.CAFE_REMOTE_API_KEY || genericKey,
          model:
            request.routingPolicy?.remoteModel ||
            process.env.CAFE_REMOTE_MODEL ||
            genericModel ||
            'custom-remote-model',
        }
      : undefined;

  if (preferredMode === 'remote') {
    return {
      preferred: remoteConfig,
      fallback: request.routingPolicy?.allowRemoteFallback ? localConfig : undefined,
    };
  }

  return {
    preferred: localConfig,
    fallback: request.routingPolicy?.allowRemoteFallback ? remoteConfig : undefined,
  };
}

function buildPrompt(request: CafeForecastRequest): { system: string; user: string } {
  const system = [
    'You are CAFE, a cognitive climate forecaster.',
    'Return valid JSON only with no markdown and no prose outside JSON.',
    'Use probabilistic, agency-forward language and avoid deterministic claims.',
    'Use concise guidance with practical actions.',
    'Follow the requested output schema exactly.',
  ].join(' ');

  const userPayload = {
    task: 'Generate cafe_forecast_payload for the provided intake and context.',
    schema: 'cafe_forecast_payload',
    horizonHours: request.horizonHours,
    timezone: request.timezone,
    intake: request.intake,
    merlinContext: request.merlinContext,
    environment: request.environment,
  };

  return {
    system,
    user: JSON.stringify(userPayload),
  };
}

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch && fencedMatch[1]) {
    return fencedMatch[1].trim();
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

async function callOpenAiCompatibleGateway(
  config: GatewayConfig,
  request: CafeForecastRequest
): Promise<CafeForecastPayload> {
  const { system, user } = buildPrompt(request);
  const controller = new AbortController();
  const timeoutMs = request.routingPolicy?.maxLatencyMs || 10_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const completionBody = {
      model: config.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: request.routingPolicy?.temperature ?? 0.35,
      max_tokens: request.routingPolicy?.maxOutputTokens ?? 700,
      response_format: { type: 'json_object' },
    };

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify(completionBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gateway ${response.status}: ${text.slice(0, 300)}`);
    }

    const completion = (await response.json()) as ChatCompletionResponse;
    const content = completion.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Gateway returned empty completion content');
    }

    const parsed = JSON.parse(extractJsonText(content)) as CafeForecastPayload;
    const validation = validateCafeForecastPayload(parsed);
    if (!validation.ok) {
      throw new Error(`Gateway payload validation failed: ${validation.errors.join('; ')}`);
    }

    return validation.value;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateCafeForecastViaRouter(
  request: CafeForecastRequest
): Promise<LlmRouterResult> {
  const started = Date.now();

  const configs = getGatewayConfig(request);
  const attemptedGateway = Boolean(configs.preferred);

  if (configs.preferred) {
    try {
      const output = await callOpenAiCompatibleGateway(configs.preferred, request);
      return {
        provider: configs.preferred.provider,
        model: configs.preferred.model,
        executionMode: configs.preferred.executionMode,
        usedFallback: false,
        latencyMs: Date.now() - started,
        output,
      };
    } catch (error) {
      console.warn('[CAFE Router] Preferred gateway failed:', error instanceof Error ? error.message : error);
    }
  }

  if (configs.fallback) {
    try {
      const output = await callOpenAiCompatibleGateway(configs.fallback, request);
      return {
        provider: configs.fallback.provider,
        model: configs.fallback.model,
        executionMode: configs.fallback.executionMode,
        usedFallback: true,
        latencyMs: Date.now() - started,
        output,
      };
    } catch (error) {
      console.warn('[CAFE Router] Fallback gateway failed:', error instanceof Error ? error.message : error);
    }
  }

  const payload = synthesizePayload(request);
  const validation = validateCafeForecastPayload(payload);
  if (!validation.ok) {
    throw new Error(`Router deterministic fallback validation failed: ${validation.errors.join('; ')}`);
  }

  const fallbackMode = request.routingPolicy?.preferredMode ?? 'local';
  const fallbackModel =
    fallbackMode === 'local'
      ? request.routingPolicy?.localModel || process.env.CAFE_LOCAL_MODEL || 'deterministic-local-fallback'
      : request.routingPolicy?.remoteModel || process.env.CAFE_REMOTE_MODEL || 'deterministic-remote-fallback';

  return {
    provider: 'deterministic-fallback',
    model: fallbackModel,
    executionMode: fallbackMode,
    usedFallback: attemptedGateway,
    latencyMs: Date.now() - started,
    output: validation.value,
  };
}
