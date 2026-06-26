import { promises as fs } from "node:fs";
import { execSync } from "node:child_process";

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

export async function searchYouTubeHandler(req, res, next) {
  try {
    const query = String(req.query.q || "").trim();
    if (!query) {
      return res.status(400).json({ error: "A search query is required." });
    }

    try {
      const whichCmd = process.platform === "win32" ? "where" : "which";
      let ytDlpPath = "yt-dlp";
      try {
        ytDlpPath = execSync(`${whichCmd} yt-dlp`, { encoding: "utf-8" })
          .toString()
          .split("\n")[0]
          .trim();
      } catch (pathError) {
        // Fall back to just "yt-dlp" if where/which fails
        console.log("Could not find yt-dlp path with where/which, using 'yt-dlp' directly");
      }

      const searchResults = execSync(
        `"${ytDlpPath}" "ytsearch5:${query}" --dump-json --flat-playlist`,
        { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
      ).toString();

      const videos = searchResults
        .trim()
        .split("\n")
        .filter(line => line.trim())
        .map(line => {
          try {
            const video = JSON.parse(line);
            return {
              id: video.id,
              title: video.title,
              thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
              url: video.webpage_url,
            };
          } catch (parseError) {
            console.error("Failed to parse yt-dlp JSON line:", line, parseError);
            return null;
          }
        })
        .filter(Boolean);

      return res.json({ results: videos });
    } catch (error) {
      console.error("YouTube search error:", error);
      const wrapped = new Error(
        "YouTube search failed. Make sure yt-dlp is installed and accessible."
      );
      wrapped.statusCode = 500;
      throw wrapped;
    }
  } catch (error) {
    return next(error);
  }
}

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
