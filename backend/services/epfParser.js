/**
 * Emergent Performance Format (EPF) Parser
 *
 * Parses the structured output that P.Rick (and other performance-mode personalities)
 * generate. The format encodes a timed multimedia script in a single LLM response:
 *
 *   [[B1]]
 *   [20.0:]
 *   [:] Oh jeez, 'Wuzzup!'? Is this a time warp?
 *   [:] Look, I could tell you about the heat death...
 *
 * Followed by audio-direction blocks (after the last [:] line in each segment)
 * that describe genre, instrumentation, and atmosphere — mapped to mood-loop IDs
 * for real-time playback.
 *
 * EPF version: 0.2
 */

// Segment IDs follow the pattern: letter(s) + digit(s)
// A = Ambient/Intro, B = Verse/HighEnergy, C = Chorus, D = Breakdown, E = Outro
const SEGMENT_MOOD_MAP = {
  A: "ambient",
  B: "hype",
  C: "chorus",
  D: "breakdown",
  E: "outro",
};

const SEGMENT_TYPE_MAP = {
  A: "intro",
  B: "verse",
  C: "chorus",
  D: "bridge",
  E: "outro",
};

// Keyword-based audio direction classifier → mood loop ID
// Applied to the long music description text after the main dialogue.
const AUDIO_DIRECTION_KEYWORDS = [
  { keywords: ["breakdown", "piano", "cello", "vulnerable", "tragic", "mournful", "raw"], mood: "breakdown" },
  { keywords: ["outro", "decay", "disintegrat", "fade", "abrupt", "cheeky", "glitch"], mood: "outro" },
  { keywords: ["chorus", "anthemic", "heavy", "wonky", "bass", "triumph", "chaotic"], mood: "chorus" },
  { keywords: ["verse", "rapid-fire", "hyperpop", "sarcas", "confrontational"], mood: "hype" },
  { keywords: ["intro", "ambient", "erratic", "staccato", "laboratory", "menacing"], mood: "ambient" },
];

/**
 * Classify an audio description block into a mood-loop category.
 * Falls back to "ambient" if nothing matches.
 */
function classifyAudioDirection(text) {
  const lower = String(text || "").toLowerCase();
  for (const { keywords, mood } of AUDIO_DIRECTION_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return mood;
    }
  }
  return "ambient";
}

function stripInlineMetadataTokens(text) {
  const source = String(text || "");
  const metadataPattern = /\b(?:mosic|music|bpm|duration_secs|good_crop)\s*:\s*-?\d+(?:\.\d+)?/gi;
  const first = metadataPattern.exec(source);
  if (!first) {
    return source.trim();
  }
  return source.slice(0, first.index).trim();
}

function normalizeDialogueComparison(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeDialogueLine(text) {
  const stripped = stripInlineMetadataTokens(text);
  if (!stripped) {
    return "";
  }

  if (/^\([^()]+\)$/.test(stripped)) {
    return "";
  }

  const echoedSuffixMatch = stripped.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
  if (!echoedSuffixMatch) {
    return stripped;
  }

  const outside = String(echoedSuffixMatch[1] || "").trim();
  const inside = String(echoedSuffixMatch[2] || "").trim();
  if (!outside || !inside) {
    return stripped;
  }

  const outsideNormalized = normalizeDialogueComparison(outside);
  const insideNormalized = normalizeDialogueComparison(inside);
  if (!outsideNormalized || !insideNormalized) {
    return stripped;
  }

  if (
    outsideNormalized === insideNormalized ||
    outsideNormalized.endsWith(insideNormalized)
  ) {
    return outside;
  }

  return stripped;
}

/**
 * Resolve the mood loop for a segment.
 * Prefers the explicitly parsed audio direction; falls back to segment-letter heuristic.
 */
function resolveSegmentMood(segmentLetter, audioDirectionText) {
  if (audioDirectionText && audioDirectionText.trim()) {
    return classifyAudioDirection(audioDirectionText);
  }
  return SEGMENT_MOOD_MAP[String(segmentLetter || "A").toUpperCase()] || "ambient";
}

function looksLikeAudioDirection(text) {
  const line = String(text || "").trim();
  if (!line) {
    return false;
  }

  return line.length > 80 || /\b(?:segment|anchored|rhythm|vocal performance|instrument|instrumentation|atmosphere|melodic|tempo|bass|beat|genre|hip-hop|hyperpop|wonky|experimental|synth|piano|guitar|cello|breakbeat|timbre|staccato|anthemic|distorted|acoustic|electronic)\b/i.test(line);
}

function mergeDuplicateSegments(segments) {
  const merged = [];
  const segmentIndexById = new Map();

  for (const rawSegment of Array.isArray(segments) ? segments : []) {
    if (!rawSegment || !rawSegment.id) {
      continue;
    }

    const existingIndex = segmentIndexById.get(rawSegment.id);
    if (existingIndex === undefined) {
      const nextSegment = {
        ...rawSegment,
        dialogueLines: Array.isArray(rawSegment.dialogueLines) ? [...rawSegment.dialogueLines] : [],
      };
      nextSegment.moodLoop = resolveSegmentMood(nextSegment.segmentLetter, nextSegment.audioDirection);
      merged.push(nextSegment);
      segmentIndexById.set(rawSegment.id, merged.length - 1);
      continue;
    }

    const existing = merged[existingIndex];
    const nextDialogueLines = Array.isArray(rawSegment.dialogueLines) ? rawSegment.dialogueLines.filter(Boolean) : [];
    if (existing.dialogueLines.length === 0 && nextDialogueLines.length > 0) {
      existing.dialogueLines = [...nextDialogueLines];
    }

    const existingAudioDirection = String(existing.audioDirection || "").trim();
    const nextAudioDirection = String(rawSegment.audioDirection || "").trim();
    if (nextAudioDirection && nextAudioDirection.length > existingAudioDirection.length) {
      existing.audioDirection = nextAudioDirection;
    }

    if (!Number.isFinite(Number(existing.startTime)) || Number(existing.startTime) === 0) {
      existing.startTime = Number(rawSegment.startTime) || existing.startTime;
    }

    if (!existing.type && rawSegment.type) {
      existing.type = rawSegment.type;
    }

    existing.moodLoop = resolveSegmentMood(existing.segmentLetter, existing.audioDirection);

    const existingDuration = Number(existing._parsedTotalDuration);
    const nextDuration = Number(rawSegment._parsedTotalDuration);
    if (!Number.isFinite(existingDuration) && Number.isFinite(nextDuration)) {
      existing._parsedTotalDuration = nextDuration;
    }
  }

  return merged;
}

/**
 * parseEPF(rawOutput) → EPFScript
 *
 * Returns a structured script object suitable for performance playback.
 *
 * EPFScript shape:
 * {
 *   version: "0.2",
 *   totalDuration: number,        // seconds (from last segment + estimate)
 *   segments: [
 *     {
 *       id: "B1",
 *       segmentLetter: "B",
 *       segmentIndex: 1,
 *       type: "verse",            // intro | verse | chorus | bridge | outro
 *       startTime: 20,            // seconds
 *       dialogueLines: string[],
 *       audioDirection: string,   // raw music description text
 *       moodLoop: "hype",         // ambient | hype | chorus | breakdown | outro
 *     }
 *   ]
 * }
 */
export function parseEPF(rawOutput) {
  const raw = String(rawOutput || "");
  const lines = raw.split("\n");

  const segments = [];
  let current = null;
  let inAudioDirection = false;
  let audioDirectionBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // ── New segment marker: [[B1]], [[C2]] etc ─────────────────────────────
    const blockMatch = line.match(/^\[\[([A-Za-z]+)(\d+)\]\]/);
    if (blockMatch) {
      // Flush previous segment
      if (current) {
        current.audioDirection = audioDirectionBuffer.join(" ").trim();
        current.moodLoop = resolveSegmentMood(current.segmentLetter, current.audioDirection);
        segments.push(current);
      }

      inAudioDirection = false;
      audioDirectionBuffer = [];
      current = {
        id: blockMatch[1].toUpperCase() + blockMatch[2],
        segmentLetter: blockMatch[1].toUpperCase(),
        segmentIndex: parseInt(blockMatch[2], 10),
        type: SEGMENT_TYPE_MAP[blockMatch[1].toUpperCase()] || "verse",
        startTime: 0,
        dialogueLines: [],
        audioDirection: "",
        moodLoop: "ambient",
      };
      continue;
    }

    // ── Timestamp: [20.0:] or [0.0:] ──────────────────────────────────────
    // Format can be bare "[20.0:]" (timestamp only) or "[20.0:] Spoken text"
    // (timestamp + first dialogue line merged on one line by the LLM).
    const timeMatch = line.match(/^\[(\d+(?:\.\d+)?):\]\s*(.*)/);
    if (timeMatch && current) {
      current.startTime = parseFloat(timeMatch[1]);
      const trailingText = normalizeDialogueLine(timeMatch[2]);
      if (trailingText) {
        // Mirrored second-pass EPF can repeat the segment id and put the
        // music-description prose directly on the timestamp line.
        if (current.dialogueLines.length === 0 && looksLikeAudioDirection(trailingText)) {
          inAudioDirection = true;
          audioDirectionBuffer.push(trailingText);
        } else {
          current.dialogueLines.push(trailingText);
          inAudioDirection = false;
        }
      }
      continue;
    }

    // ── Dialogue line: [:] some spoken text ───────────────────────────────
    if (line.startsWith("[:]") && current) {
      const spokenText = normalizeDialogueLine(line.replace(/^\[:\]\s*/, ""));
      if (spokenText) {
        current.dialogueLines.push(spokenText);
        inAudioDirection = false; // reset; dialogue resets audio-direction mode
      }
      continue;
    }

    // ── Metadata footer: mosic / bpm / duration lines ─────────────────────
    // e.g. "mosic: 4.5 bpm: 120.0 duration_secs: 150.0 good_crop: 1.0"
    if (/\b(?:bpm|duration_secs|good_crop|mosic)\b/.test(line)) {
      // Parse duration if present — use as total duration hint
      const durationMatch = line.match(/duration_secs:\s*(\d+(?:\.\d+)?)/);
      if (durationMatch && current) {
        current._parsedTotalDuration = parseFloat(durationMatch[1]);
      }
      continue;
    }

    // ── Everything else after dialogue ends = audio direction ──────────────
    // Heuristic: long descriptive sentences after a block header
    if (current && !blockMatch) {
      // Only collect audio direction text if it looks like a description
      // (contains music-related keywords or is a long descriptive sentence)
      if (looksLikeAudioDirection(line)) {
        inAudioDirection = true;
        audioDirectionBuffer.push(line);
      }
    }
  }

  // Flush final segment
  if (current) {
    current.audioDirection = audioDirectionBuffer.join(" ").trim();
    current.moodLoop = resolveSegmentMood(current.segmentLetter, current.audioDirection);
    segments.push(current);
  }

  const normalizedSegments = mergeDuplicateSegments(segments);

  // Sort segments by startTime (they should already be in order, but be safe)
  normalizedSegments.sort((a, b) => a.startTime - b.startTime);

  // Estimate total duration
  const lastSegment = normalizedSegments[normalizedSegments.length - 1];
  const parsedDuration = lastSegment?._parsedTotalDuration;
  const estimatedDuration = lastSegment
    ? lastSegment.startTime + (lastSegment.dialogueLines.length * 4)
    : 0;
  const totalDuration = parsedDuration || estimatedDuration;

  // Clean up internal fields
  for (const seg of normalizedSegments) {
    delete seg._parsedTotalDuration;
  }

  return {
    version: "0.2",
    totalDuration,
    segments: normalizedSegments,
  };
}

/**
 * isPerformanceOutput(text) → boolean
 *
 * Lightweight heuristic to detect whether an LLM reply is EPF-formatted.
 * Used in the chat controller to decide whether to route to performance mode.
 */
export function isPerformanceOutput(text) {
  const raw = String(text || "");
  const hasSegmentMarker = /\[\[[A-Za-z]+\d+\]\]/.test(raw);
  const hasBracketDialogueLine = /^\[:\]/m.test(raw);
  const hasInlineTimestampDialogue = /^\[\d+(?:\.\d+)?:\]\s+[^\n]+/m.test(raw);
  // Accept either classic [:] dialogue lines or timestamp lines with inline spoken text.
  return hasSegmentMarker && (hasBracketDialogueLine || hasInlineTimestampDialogue);
}

/**
 * extractPlainText(epfScript) → string
 *
 * Collapses an EPF script back to readable plain text (no markers, no audio
 * directions). Used as fallback for non-performance rendering.
 */
export function extractPlainText(epfScript) {
  if (!epfScript || !Array.isArray(epfScript.segments)) return "";
  return epfScript.segments
    .flatMap((seg) => seg.dialogueLines)
    .join("\n");
}
