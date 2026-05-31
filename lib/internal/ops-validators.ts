import Ajv2020, { ErrorObject, ValidateFunction } from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

import scorecardSchema from '@/schemas/scorecard.schema.json';
import phaseGateSchema from '@/schemas/phase-gate.schema.json';
import rollbackEventSchema from '@/schemas/rollback-event.schema.json';
import trustCalibrationSchema from '@/schemas/trust-calibration.schema.json';

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const scorecardValidator = ajv.compile(scorecardSchema);
const phaseGateValidator = ajv.compile(phaseGateSchema);
const rollbackEventValidator = ajv.compile(rollbackEventSchema);
const trustCalibrationValidator = ajv.compile(trustCalibrationSchema);

function toErrorMessages(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors || errors.length === 0) return [];
  return errors.map((error) => `${error.instancePath || '/'} ${error.message || 'is invalid'}`.trim());
}

function runValidation(validator: ValidateFunction, payload: unknown): { valid: boolean; errors: string[] } {
  const valid = validator(payload);
  return {
    valid: Boolean(valid),
    errors: toErrorMessages(validator.errors),
  };
}

export function validateScorecard(payload: unknown) {
  return runValidation(scorecardValidator, payload);
}

export function validatePhaseGate(payload: unknown) {
  return runValidation(phaseGateValidator, payload);
}

export function validateRollbackEvent(payload: unknown) {
  return runValidation(rollbackEventValidator, payload);
}

export function validateTrustCalibration(payload: unknown) {
  return runValidation(trustCalibrationValidator, payload);
}
