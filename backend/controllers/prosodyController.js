import { promises as fs } from "node:fs";

import {
  getPersonalityById,
  updatePersonalityProsodyTemplate,
  updatePersonalityVoiceSampleAnalysis,
} from "../models/personalityModel.js";
import {
  extractProsodyTemplateFromUrl,
  extractProsodyTemplateFromAudioUpload,
} from "../services/prosodyExtractionService.js";
import { analyzeAudioSegments } from "../services/voiceSegmentationService.js";

export async function extractProsodyTemplateHandler(req, res, next) {
  try {
    const personalityId = Number(req.params.id);
    const ownerId = req.voxisUser?.id ?? null;
    const url = String(req.body.url || "").trim();
    const audioBase64Raw = String(req.body.audioBase64 || "").trim();
    const fileName = String(req.body.fileName || "uploaded-audio").trim() || "uploaded-audio";

    if (!Number.isInteger(personalityId)) {
      return res.status(400).json({ error: "A valid personality id is required." });
    }

    if (!url && !audioBase64Raw) {
      return res.status(400).json({ error: "A source URL or uploaded audio file is required." });
    }

    const personality = getPersonalityById(personalityId, ownerId);

    if (!personality) {
      return res.status(404).json({ error: "Personality not found." });
    }

    const onAudioReady = async ({ audioPath }) => {
      const voiceSamples = await analyzeAudioSegments({
        personalityId,
        audioPath,
      }).catch(() => null);

      if (!voiceSamples) {
        return null;
      }

      return {
        ...voiceSamples,
        extractedAt: new Date().toISOString(),
        representatives: (voiceSamples.representatives || []).map((sample) => ({
          ...sample,
          audioUrl: sample.clipFile
            ? `/personality/${personalityId}/voice-samples/audio/${encodeURIComponent(sample.clipFile)}`
            : "",
        })),
      };
    };

    let extracted;
    if (audioBase64Raw) {
      const b64Payload = audioBase64Raw.includes(",")
        ? audioBase64Raw.split(",").slice(1).join(",")
        : audioBase64Raw;
      const audioBuffer = Buffer.from(String(b64Payload || ""), "base64");
      if (!audioBuffer.length) {
        return res.status(400).json({ error: "Uploaded audio payload is invalid or empty." });
      }
      if (audioBuffer.length > 20 * 1024 * 1024) {
        return res.status(413).json({ error: "Uploaded audio is too large. Max size is 20MB." });
      }

      extracted = await extractProsodyTemplateFromAudioUpload({
        personalityId,
        originalName: fileName,
        audioBuffer,
        sourceLabel: `uploaded:${fileName}`,
        deps: { onAudioReady },
      });
    } else {
      extracted = await extractProsodyTemplateFromUrl({
        personalityId,
        url,
        deps: { onAudioReady },
      });
    }

    let updated;

    try {
      updated = updatePersonalityProsodyTemplate(personalityId, {
        template: extracted.template,
        templatePath: extracted.templatePath,
        sourceUrl: extracted.sourceUrl,
        updatedAt: extracted.extractedAt,
      });

      if (extracted.audioDerived) {
        updated = updatePersonalityVoiceSampleAnalysis(personalityId, {
          analysis: extracted.audioDerived,
        });
      }
    } catch (error) {
      if (extracted.templatePath) {
        await fs.rm(extracted.templatePath, { force: true }).catch(() => {});
      }
      throw error;
    }

    return res.json({
      personality: updated,
      prosodyTemplate: updated.prosodyTemplate,
      prosodyTemplatePath: updated.prosodyTemplatePath,
      prosodySourceUrl: updated.prosodySourceUrl,
      prosodyUpdatedAt: updated.prosodyUpdatedAt,
      voiceSamples: updated.voiceSampleAnalysis,
    });
  } catch (error) {
    return next(error);
  }
}
