/**
 * useParallelVoiceBuffer
 *
 * Runs a shadow SpeechRecognition listener in parallel to TTS playback.
 * While the AI is speaking (isActive=true) the mic stays open in the background
 * and every final utterance is classified into one of three buckets:
 *
 *   hard_interrupt  — "stop", "no", "wait", "never mind", etc.
 *                     → fires onHardInterrupt() immediately so the caller can
 *                       kill TTS and switch back to LISTENING.
 *
 *   filler          — "yeah", "mm", "uh huh", "okay", etc.
 *                     → buffered; does NOT trigger an interrupt.
 *
 *   substantive     — anything else with real content
 *                     → buffered; sent with the next user message so the LLM
 *                       has full context about what the user was thinking while
 *                       the AI was still speaking.
 *
 * Usage:
 *   const { getBuffer, clearBuffer } = useParallelVoiceBuffer({
 *     isActive: convPhase === "SPEAKING" || convPhase === "GENERATING_AUDIO",
 *     onHardInterrupt: interruptLiveCall,
 *   });
 *
 *   // When sending the next message:
 *   const buffer = getBuffer();
 *   clearBuffer();
 *   await onSend(transcript, { isLiveCall: true, voiceBuffer: buffer });
 */

import { useRef, useEffect, useCallback } from "react";

// ─── Classification dictionaries ───────────────────────────────────────────

const HARD_INTERRUPT_PHRASES = new Set([
  "stop", "no", "nope", "nah", "wait", "hold on", "hold up", "pause",
  "shut up", "be quiet", "quiet", "enough", "stop that", "stop it",
  "that's wrong", "thats wrong", "incorrect", "never mind", "nevermind",
  "wrong", "stop talking", "please stop", "not now",
]);

// Prefix-based hard interrupt detection (handles "stop please", "no wait", etc.)
const HARD_INTERRUPT_PREFIXES = [
  "stop ", "no ", "wait ", "hold ", "shut ", "never ",
];

const FILLER_EXACT = new Set([
  "yeah", "yep", "yes", "ok", "okay", "sure", "right", "alright",
  "mm", "mmm", "mhm", "mm-hm", "uh huh", "uh-huh", "ah", "hmm",
  "hm", "got it", "i see", "makes sense", "cool", "nice", "great",
  "interesting", "go on", "continue", "keep going", "go ahead",
  "totally", "absolutely", "of course", "indeed", "exactly",
]);

/**
 * Returns 'hard_interrupt' | 'filler' | 'substantive'
 */
function classifyUtterance(rawText) {
  const text = rawText.toLowerCase().trim().replace(/[.,!?…]+$/, "").trim();

  if (HARD_INTERRUPT_PHRASES.has(text)) return "hard_interrupt";
  if (HARD_INTERRUPT_PREFIXES.some((p) => text.startsWith(p))) return "hard_interrupt";
  if (FILLER_EXACT.has(text)) return "filler";

  // Short ≤ 3 words that aren't already classified → likely filler
  const wordCount = text.split(/\s+/).length;
  if (wordCount <= 2 && text.length < 20) return "filler";

  return "substantive";
}

// ─── Hook ──────────────────────────────────────────────────────────────────

/**
 * @param {Object}   options
 * @param {boolean}  options.isActive       - Activate while AI is speaking/generating
 * @param {Function} options.onHardInterrupt - Called synchronously when an interrupt word is detected
 */
export function useParallelVoiceBuffer({ isActive, onHardInterrupt }) {
  const bufferRef        = useRef([]);
  const recognitionRef   = useRef(null);
  const isActiveRef      = useRef(false);
  const onInterruptRef   = useRef(onHardInterrupt);
  const restartTimerRef  = useRef(null);

  // Keep callback ref current without re-triggering effect
  useEffect(() => { onInterruptRef.current = onHardInterrupt; }, [onHardInterrupt]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  // ── Start a fresh recognition session ─────────────────────────────────
  const startSession = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !isActiveRef.current) return;
    if (recognitionRef.current) return; // already running

    const rec = new SR();
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.lang            = "en-US";
    rec.maxAlternatives = 1;

    let lastFinalTs = 0;

    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal) continue;

        const text = (result[0]?.transcript ?? "").trim();
        if (!text) continue;

        // Deduplicate rapid repeats (speech API sometimes fires twice quickly)
        const now = Date.now();
        if (now - lastFinalTs < 600) continue;
        lastFinalTs = now;

        const classification = classifyUtterance(text);

        bufferRef.current.push({ text, classification, ts: now });

        if (classification === "hard_interrupt") {
          onInterruptRef.current?.();
        }
      }
    };

    rec.onerror = (event) => {
      // 'no-speech' and 'aborted' are normal — ignore
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        // Mic permission denied — stop trying permanently for this session
        recognitionRef.current = null;
        isActiveRef.current = false;
        return;
      }
      // For transient errors ('network', 'audio-capture') let onend restart it
    };

    rec.onend = () => {
      recognitionRef.current = null;

      // Auto-restart if still in active phase (session can end on silence)
      if (isActiveRef.current) {
        restartTimerRef.current = window.setTimeout(() => {
          restartTimerRef.current = null;
          startSession();
        }, 400);
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
    } catch {
      // SpeechRecognition.start() throws if already started — harmless
      recognitionRef.current = null;
    }
  }, []); // stable — reads only refs

  // ── Stop and clean up the current session ─────────────────────────────
  const stopSession = useCallback(() => {
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
  }, []);

  // ── Activate / deactivate based on isActive prop ──────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return; // Browser doesn't support it — silently skip

    if (isActive) {
      startSession();
    } else {
      stopSession();
    }

    return () => {
      if (!isActive) return; // cleanup only matters when we were active
      stopSession();
    };
  }, [isActive, startSession, stopSession]);

  // ── Public API ────────────────────────────────────────────────────────

  /** Returns a snapshot of the current buffer (does not clear it). */
  const getBuffer = useCallback(() => [...bufferRef.current], []);

  /** Clears the buffer — call after draining to attach to a message. */
  const clearBuffer = useCallback(() => { bufferRef.current = []; }, []);

  return { getBuffer, clearBuffer };
}
