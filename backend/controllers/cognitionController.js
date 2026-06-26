import { getCognitionLoopConfig, setCognitionLoopConfig } from "../models/settingsModel.js";
import {
  getCognitionLoopStatus,
  refreshCognitionLoopSchedule,
  runCognitionLoopOnce,
} from "../services/cognitionLoopService.js";

export function getCognitionLoopConfigHandler(_req, res) {
  return res.json(getCognitionLoopConfig());
}

export function saveCognitionLoopConfigHandler(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const updated = setCognitionLoopConfig(body);
  const status = refreshCognitionLoopSchedule();
  return res.json({
    config: updated,
    status,
  });
}

export function getCognitionLoopStatusHandler(_req, res) {
  return res.json(getCognitionLoopStatus());
}

export async function runCognitionLoopNowHandler(_req, res, next) {
  try {
    const summary = await runCognitionLoopOnce({ reason: "manual" });
    return res.json(summary);
  } catch (error) {
    return next(error);
  }
}
