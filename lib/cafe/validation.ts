import type {
  CafeForecastPayload,
  CafeForecastRequest,
  TimeHorizonHours,
} from '@/shared/cafe-contracts';

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

const VALID_HORIZONS: TimeHorizonHours[] = [4, 24, 72, 168];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function inRange(value: unknown, min: number, max: number): value is number {
  return isFiniteNumber(value) && value >= min && value <= max;
}

export function validateCafeForecastRequest(input: unknown): ValidationResult<CafeForecastRequest> {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { ok: false, errors: ['Body must be a JSON object'] };
  }

  if (input.version !== 'cafe-forecast-v1') {
    errors.push('version must be cafe-forecast-v1');
  }

  if (typeof input.requestId !== 'string' || input.requestId.trim().length < 4) {
    errors.push('requestId must be a non-empty string');
  }

  if (typeof input.userId !== 'string' || input.userId.trim().length < 1) {
    errors.push('userId must be a non-empty string');
  }

  if (!VALID_HORIZONS.includes(input.horizonHours as TimeHorizonHours)) {
    errors.push('horizonHours must be one of 4, 24, 72, 168');
  }

  if (typeof input.timezone !== 'string' || input.timezone.trim().length < 3) {
    errors.push('timezone must be a valid IANA timezone string');
  }

  if (!isRecord(input.intake)) {
    errors.push('intake is required');
  } else if (!isRecord(input.intake.behavioral)) {
    errors.push('intake.behavioral is required');
  } else {
    const behavioral = input.intake.behavioral;
    if (!inRange(behavioral.energy, 0, 100)) {
      errors.push('intake.behavioral.energy must be 0..100');
    }
    if (!inRange(behavioral.focus, 0, 100)) {
      errors.push('intake.behavioral.focus must be 0..100');
    }
    if (!inRange(behavioral.emotionalLoad, 0, 100)) {
      errors.push('intake.behavioral.emotionalLoad must be 0..100');
    }
  }

  if (input.location !== undefined) {
    if (!isRecord(input.location)) {
      errors.push('location must be an object when provided');
    } else {
      if (!inRange(input.location.lat, -90, 90)) {
        errors.push('location.lat must be between -90 and 90');
      }
      if (!inRange(input.location.lon, -180, 180)) {
        errors.push('location.lon must be between -180 and 180');
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: input as unknown as CafeForecastRequest };
}

export function validateCafeForecastPayload(input: unknown): ValidationResult<CafeForecastPayload> {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { ok: false, errors: ['LLM output must be an object'] };
  }

  if (!inRange(input.cafeIndex, 0, 100)) {
    errors.push('cafeIndex must be 0..100');
  }

  const validPhases = ['clear', 'golden_hour', 'fog', 'variable', 'stormy', 'recovery'];
  if (typeof input.phase !== 'string' || !validPhases.includes(input.phase)) {
    errors.push('phase must be a valid CafePhase');
  }

  if (!inRange(input.confidence, 0, 1)) {
    errors.push('confidence must be 0..1');
  }

  if (!isRecord(input.dimensions)) {
    errors.push('dimensions is required');
  } else {
    const d = input.dimensions;
    if (!inRange(d.cognitiveClarity, 0, 100)) {
      errors.push('dimensions.cognitiveClarity must be 0..100');
    }
    if (!inRange(d.emotionalPressure, 0, 100)) {
      errors.push('dimensions.emotionalPressure must be 0..100');
    }
    if (!inRange(d.socialFriction, 0, 100)) {
      errors.push('dimensions.socialFriction must be 0..100');
    }
    if (!inRange(d.recoveryCapacity, 0, 100)) {
      errors.push('dimensions.recoveryCapacity must be 0..100');
    }
    if (!inRange(d.opportunityWindow, 0, 100)) {
      errors.push('dimensions.opportunityWindow must be 0..100');
    }
  }

  if (!Array.isArray(input.guidance) || input.guidance.length < 1) {
    errors.push('guidance must contain at least one item');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: input as unknown as CafeForecastPayload };
}
