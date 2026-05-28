# CAFE API Contracts (DigitalOcean + Custom LLMs)

This document defines provider-agnostic API contracts for the CAFE forecast layer using self-hosted or custom LLMs on your own DigitalOcean stack.

## Contract Versions

- `merlin-context-v1`
- `cafe-forecast-v1`

## Endpoint 1: Merlin Symbolic Context

`POST /api/internal/merlin/context`

Purpose: return symbolic context for forecast synthesis (moon phase, transit highlights, symbolic signals).

### Request

```json
{
  "userId": "user_123",
  "atIso": "2026-05-26T18:30:00.000Z",
  "location": {
    "lat": 25.7617,
    "lon": -80.1918
  },
  "includeTransits": true,
  "includeNatalSnapshot": false
}
```

### Success Response (200)

```json
{
  "version": "merlin-context-v1",
  "generatedAt": "2026-05-26T18:30:01.100Z",
  "moonPhase": "Waxing Crescent",
  "moonSign": "Leo",
  "sunSign": "Gemini",
  "transitHighlights": [
    "Mercury trine Moon supports clear emotional communication",
    "Mars square Saturn may increase friction under pressure"
  ],
  "symbolicSignals": [
    {
      "key": "voice_and_boundaries",
      "label": "Voice and Boundaries",
      "intensity": 72,
      "rationale": "Current transit stack emphasizes communication clarity and pacing"
    }
  ]
}
```

## Endpoint 2: CAFE Forecast Generation

`POST /api/cafe/forecast`

Purpose: generate a CAFE weather payload using intake + optional Merlin context + optional environmental signals.

Auth: `Authorization: Bearer ${MERLIN_GATEWAY_KEY}`

Compatibility note: `/api/forecast` still accepts `cafe-forecast-v1` for legacy Merlin callers, but external integrations should use `/api/cafe/forecast`.

### Example Request

```bash
curl -X POST "https://merlin.voxislabs.com/api/cafe/forecast" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MERLIN_GATEWAY_KEY" \
  -d '{
    "version": "cafe-forecast-v1",
    "requestId": "req_01HWX6R4Y7AV",
    "userId": "user_123",
    "horizonHours": 24,
    "timezone": "America/New_York",
    "intake": {
      "behavioral": {
        "energy": 48,
        "focus": 62,
        "emotionalLoad": 71
      }
    }
  }'
```

Legacy Merlin callers can continue to POST the same `cafe-forecast-v1` payload to `/api/forecast` until they are migrated.

### Request

```json
{
  "version": "cafe-forecast-v1",
  "requestId": "req_01HWX6R4Y7AV",
  "userId": "user_123",
  "horizonHours": 24,
  "timezone": "America/New_York",
  "locale": "en-US",
  "location": {
    "lat": 25.7617,
    "lon": -80.1918
  },
  "intake": {
    "mbtiType": "INFJ",
    "journalText": "I feel mentally loud and socially tired this week.",
    "intention": "Show up clearly without burning out.",
    "behavioral": {
      "energy": 48,
      "focus": 62,
      "emotionalLoad": 71
    }
  },
  "merlinContext": {
    "version": "merlin-context-v1",
    "generatedAt": "2026-05-26T18:30:01.100Z",
    "moonPhase": "Waxing Crescent",
    "moonSign": "Leo",
    "sunSign": "Gemini",
    "transitHighlights": [
      "Mercury trine Moon supports clear emotional communication"
    ],
    "symbolicSignals": [
      {
        "key": "voice_and_boundaries",
        "label": "Voice and Boundaries",
        "intensity": 72,
        "rationale": "Current transit stack emphasizes communication clarity and pacing"
      }
    ]
  },
  "environment": {
    "weatherPressureIndex": 41,
    "airQualityIndex": 37,
    "geomagneticIndex": 22,
    "collectiveSentiment": 55,
    "sourceTimestamps": {
      "openmeteo": "2026-05-26T18:00:00.000Z",
      "noaa": "2026-05-26T17:52:00.000Z",
      "gdelt": "2026-05-26T17:50:00.000Z"
    }
  },
  "routingPolicy": {
    "preferredMode": "local",
    "allowRemoteFallback": false,
    "localModel": "qwen2.5:14b-instruct-q4_K_M",
    "remoteModel": "grok-3-fast",
    "maxLatencyMs": 8000,
    "maxOutputTokens": 700,
    "temperature": 0.35
  }
}
```

### Success Response (200)

```json
{
  "success": true,
  "version": "cafe-forecast-v1",
  "requestId": "req_01HWX6R4Y7AV",
  "generatedAt": "2026-05-26T18:30:02.482Z",
  "data": {
    "cafeIndex": 64,
    "phase": "variable",
    "confidence": 0.82,
    "dimensions": {
      "cognitiveClarity": 67,
      "emotionalPressure": 58,
      "socialFriction": 44,
      "recoveryCapacity": 73,
      "opportunityWindow": 69
    },
    "guidance": [
      "Consider batching communication into two focused windows.",
      "Plan a short decompression block before high-stakes interactions.",
      "Prioritize one meaningful output over broad multitasking today."
    ],
    "cautionNote": "Avoid overcommitting during late afternoon cognitive dips.",
    "opportunitySignal": "High leverage for writing, planning, and strategic clarity before noon.",
    "recoveryWindow": "19:00-21:00 local",
    "symbolicNote": "Waxing Crescent supports momentum through small, steady actions."
  },
  "meta": {
    "provider": "ollama",
    "model": "qwen2.5:14b-instruct-q4_K_M",
    "executionMode": "local",
    "latencyMs": 1382,
    "usedFallback": false,
    "promptVersion": "cafe-forecast-v1.0"
  }
}
```

## Endpoint 3: Forecast History

`POST /api/internal/forecast-history`

Purpose: append and query history for memory-driven forecasting.

### Append Request

```json
{
  "userId": "user_123",
  "record": {
    "generatedAt": "2026-05-26T18:30:02.482Z",
    "horizonHours": 24,
    "phase": "variable",
    "cafeIndex": 64,
    "dimensions": {
      "cognitiveClarity": 67,
      "emotionalPressure": 58,
      "socialFriction": 44,
      "recoveryCapacity": 73,
      "opportunityWindow": 69
    },
    "journalEmbeddingRef": "emb_7f18"
  }
}
```

### Query Request

```json
{
  "userId": "user_123",
  "limit": 30,
  "fromIso": "2026-05-01T00:00:00.000Z",
  "toIso": "2026-05-26T23:59:59.999Z"
}
```

## Endpoint 4: CAFE Gateway Health

`GET /api/internal/cafe-gateway/health`

Purpose: verify gateway configuration visibility and optional endpoint reachability checks.

### Health Check

`GET /api/internal/cafe-gateway/health`

Returns configured target modes and redacted endpoint URLs.

### Connectivity Probe

`GET /api/internal/cafe-gateway/health?probe=1`

Runs lightweight reachability probes to configured endpoints (does not execute full model completion).

## Error Envelope (All Endpoints)

```json
{
  "success": false,
  "requestId": "req_01HWX6R4Y7AV",
  "code": "VALIDATION_ERROR",
  "message": "horizonHours must be one of 4, 24, 72, 168",
  "details": {
    "field": "horizonHours"
  }
}
```

### Standard Error Codes

- `VALIDATION_ERROR` -> HTTP 400
- `UNAUTHORIZED` -> HTTP 401
- `FORBIDDEN` -> HTTP 403
- `RATE_LIMITED` -> HTTP 429
- `UPSTREAM_TIMEOUT` -> HTTP 504
- `UPSTREAM_ERROR` -> HTTP 502
- `INTERNAL_ERROR` -> HTTP 500

## Router Contract (Provider-Agnostic)

Use one internal router interface for both local and remote execution.

### Router Input

```json
{
  "traceId": "req_01HWX6R4Y7AV",
  "task": "cafe_forecast",
  "policy": {
    "preferredMode": "local",
    "allowRemoteFallback": true,
    "localModel": "qwen2.5:14b-instruct-q4_K_M",
    "remoteModel": "grok-3-fast",
    "maxLatencyMs": 8000,
    "maxOutputTokens": 700,
    "temperature": 0.35
  },
  "messages": [
    {
      "role": "system",
      "content": "You are CAFE. Return JSON only."
    },
    {
      "role": "user",
      "content": "Generate a 24h forecast payload."
    }
  ],
  "responseSchema": {
    "name": "cafe_forecast_payload",
    "schema": "CAFE_FORECAST_PAYLOAD_JSON_SCHEMA"
  }
}
```

### Router Output

```json
{
  "provider": "ollama",
  "model": "qwen2.5:14b-instruct-q4_K_M",
  "executionMode": "local",
  "usedFallback": false,
  "latencyMs": 1382,
  "output": {
    "cafeIndex": 64,
    "phase": "variable",
    "confidence": 0.82,
    "dimensions": {
      "cognitiveClarity": 67,
      "emotionalPressure": 58,
      "socialFriction": 44,
      "recoveryCapacity": 73,
      "opportunityWindow": 69
    },
    "guidance": [
      "Consider batching communication into two focused windows."
    ]
  }
}
```

## Data Governance Rules

- Personal journal raw text should not be persisted by default on the server.
- Persist embeddings/reference IDs instead of raw entries where possible.
- Keep external API responses cached with TTL to reduce leakage and improve stability.
- Include explicit opt-in for any remote model fallback.

## Router Environment Configuration

Configure the CAFE router with OpenAI-compatible endpoints.

### Gateway Auth

- `MERLIN_GATEWAY_KEY` used by `/api/cafe/forecast`
- Expect a bearer token in the `Authorization` header
- Keep this secret server-side only

### Generic Single Endpoint

- `CAFE_LLM_API_URL` (example: `https://your-do-gateway/v1/chat/completions`)
- `CAFE_LLM_API_KEY`
- `CAFE_LLM_MODEL`
- `CAFE_LLM_PROVIDER`

### Explicit Local and Remote Split

- `CAFE_LOCAL_API_URL`
- `CAFE_LOCAL_API_KEY`
- `CAFE_LOCAL_MODEL`
- `CAFE_LOCAL_PROVIDER`
- `CAFE_REMOTE_API_URL`
- `CAFE_REMOTE_API_KEY`
- `CAFE_REMOTE_MODEL`
- `CAFE_REMOTE_PROVIDER`

If local and remote values are both configured, routing policy in `routingPolicy.preferredMode` and `routingPolicy.allowRemoteFallback` determines failover behavior.
