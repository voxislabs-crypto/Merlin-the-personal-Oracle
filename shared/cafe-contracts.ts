import type { MBTIType } from '@/shared/schema';

export type CafePhase =
  | 'clear'
  | 'golden_hour'
  | 'fog'
  | 'variable'
  | 'stormy'
  | 'recovery';

export type TimeHorizonHours = 4 | 24 | 72 | 168;

export type LlmExecutionMode = 'local' | 'remote';

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface MerlinContextRequest {
  userId: string;
  atIso?: string;
  location?: GeoPoint;
  includeTransits?: boolean;
  includeNatalSnapshot?: boolean;
}

export interface MerlinContextResponse {
  version: 'merlin-context-v1';
  generatedAt: string;
  moonPhase: string;
  moonSign?: string;
  sunSign?: string;
  transitHighlights: string[];
  symbolicSignals: Array<{
    key: string;
    label: string;
    intensity: number;
    rationale: string;
  }>;
}

export interface CafeBehavioralSignals {
  energy: number;
  focus: number;
  emotionalLoad: number;
}

export interface CafeIntakePayload {
  mbtiType?: MBTIType;
  journalText?: string;
  intention?: string;
  behavioral: CafeBehavioralSignals;
}

export interface CafeEnvironmentSnapshot {
  weatherPressureIndex?: number;
  airQualityIndex?: number;
  geomagneticIndex?: number;
  collectiveSentiment?: number;
  sourceTimestamps?: Record<string, string>;
}

export interface LlmRoutingPolicy {
  preferredMode: LlmExecutionMode;
  allowRemoteFallback: boolean;
  localModel: string;
  remoteModel?: string;
  maxLatencyMs?: number;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface CafeForecastRequest {
  version: 'cafe-forecast-v1';
  requestId: string;
  userId: string;
  horizonHours: TimeHorizonHours;
  timezone: string;
  locale?: string;
  location?: GeoPoint;
  intake: CafeIntakePayload;
  merlinContext?: MerlinContextResponse;
  environment?: CafeEnvironmentSnapshot;
  routingPolicy?: LlmRoutingPolicy;
}

export interface CafeDimensionScores {
  cognitiveClarity: number;
  emotionalPressure: number;
  socialFriction: number;
  recoveryCapacity: number;
  opportunityWindow: number;
}

export interface CafeForecastPayload {
  cafeIndex: number;
  phase: CafePhase;
  confidence: number;
  dimensions: CafeDimensionScores;
  guidance: string[];
  cautionNote?: string;
  opportunitySignal?: string;
  recoveryWindow?: string;
  symbolicNote?: string;
}

export interface ForecastGenerationMeta {
  provider: string;
  model: string;
  executionMode: LlmExecutionMode;
  latencyMs: number;
  usedFallback: boolean;
  promptVersion: string;
}

export interface CafeForecastResponse {
  success: true;
  version: 'cafe-forecast-v1';
  requestId: string;
  generatedAt: string;
  data: CafeForecastPayload;
  meta: ForecastGenerationMeta;
}

export interface ApiError {
  success: false;
  requestId?: string;
  code:
    | 'VALIDATION_ERROR'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'RATE_LIMITED'
    | 'UPSTREAM_TIMEOUT'
    | 'UPSTREAM_ERROR'
    | 'INTERNAL_ERROR';
  message: string;
  details?: Record<string, unknown>;
}

export interface LlmRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmRouterRequest {
  traceId: string;
  task: 'cafe_forecast';
  policy: LlmRoutingPolicy;
  messages: LlmRouterMessage[];
  responseSchema: {
    name: 'cafe_forecast_payload';
    schema: Record<string, unknown>;
  };
}

export interface LlmRouterResult {
  provider: string;
  model: string;
  executionMode: LlmExecutionMode;
  usedFallback: boolean;
  latencyMs: number;
  output: CafeForecastPayload;
}

export const CAFE_FORECAST_PAYLOAD_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['cafeIndex', 'phase', 'confidence', 'dimensions', 'guidance'],
  properties: {
    cafeIndex: { type: 'number', minimum: 0, maximum: 100 },
    phase: {
      type: 'string',
      enum: ['clear', 'golden_hour', 'fog', 'variable', 'stormy', 'recovery'],
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    dimensions: {
      type: 'object',
      additionalProperties: false,
      required: [
        'cognitiveClarity',
        'emotionalPressure',
        'socialFriction',
        'recoveryCapacity',
        'opportunityWindow',
      ],
      properties: {
        cognitiveClarity: { type: 'number', minimum: 0, maximum: 100 },
        emotionalPressure: { type: 'number', minimum: 0, maximum: 100 },
        socialFriction: { type: 'number', minimum: 0, maximum: 100 },
        recoveryCapacity: { type: 'number', minimum: 0, maximum: 100 },
        opportunityWindow: { type: 'number', minimum: 0, maximum: 100 },
      },
    },
    guidance: {
      type: 'array',
      minItems: 1,
      maxItems: 7,
      items: { type: 'string', minLength: 6, maxLength: 220 },
    },
    cautionNote: { type: 'string', minLength: 6, maxLength: 220 },
    opportunitySignal: { type: 'string', minLength: 6, maxLength: 220 },
    recoveryWindow: { type: 'string', minLength: 6, maxLength: 120 },
    symbolicNote: { type: 'string', minLength: 6, maxLength: 220 },
  },
} as const;

export const CAFE_API_ENDPOINTS = {
  forecast: '/api/forecast',
  merlinContext: '/api/internal/merlin/context',
  forecastHistory: '/api/internal/forecast-history',
} as const;