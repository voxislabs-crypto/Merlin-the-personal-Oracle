import { transcribeAudioBase64 } from "../services/sttService.js";

export async function transcribeAudioHandler(req, res, next) {
  try {
    const audioBase64 = String(req.body?.audioBase64 || "").trim();
    const mimeType = String(req.body?.mimeType || "audio/webm").trim();
    const language = String(req.body?.language || "auto").trim();

    if (!audioBase64) {
      return res.status(400).json({ error: "audioBase64 is required." });
    }

    const transcript = await transcribeAudioBase64({
      audioBase64,
      mimeType,
      language,
    });

    return res.json(transcript);
  } catch (error) {
    return next(error);
  }
}
