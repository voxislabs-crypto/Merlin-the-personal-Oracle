'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Minimal SpeechRecognition typings (Chromium / Safari webkit). */
interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  onerror: ((ev: Event & { error?: string }) => void) | null;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export type SpeechRecognitionStatus =
  | 'idle'
  | 'listening'
  | 'unsupported'
  | 'error'
  | 'denied';

export type UseSpeechRecognitionOptions = {
  lang?: string;
  /** Called with the latest full interim/final phrase for this listening session. */
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
};

/**
 * Browser speech-to-text (Web Speech API).
 * Click start → speak → transcripts stream via onTranscript.
 * Best support: Chrome, Edge, Safari. Firefox: unsupported.
 */
export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { lang = 'en-US', onTranscript, onError } = options;
  const [status, setStatus] = useState<SpeechRecognitionStatus>(() =>
    typeof window === 'undefined'
      ? 'idle'
      : isSpeechRecognitionSupported()
        ? 'idle'
        : 'unsupported'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldListenRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      setStatus('unsupported');
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setStatus('unsupported');
      return;
    }

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus('listening');
      setErrorMessage(null);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      // Rebuild full session transcript so continuous mode stays coherent
      let fullFinal = '';
      let fullInterim = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) fullFinal += (fullFinal ? ' ' : '') + text.trim();
        else fullInterim += text;
      }
      const combined = [fullFinal, fullInterim].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      const isFinal = fullFinal.length > 0 && fullInterim.length === 0;
      onTranscriptRef.current?.(combined, isFinal);
    };

    recognition.onerror = (event) => {
      const code = event.error || 'unknown';
      if (code === 'aborted' || code === 'no-speech') {
        // Benign — user stopped or paused; don't surface as hard error
        return;
      }
      let message = 'Could not hear you. Try again.';
      let next: SpeechRecognitionStatus = 'error';
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        message = 'Mic permission blocked. Allow microphone access for this site.';
        next = 'denied';
      } else if (code === 'network') {
        message = 'Speech service network error. Check connection and try again.';
      } else if (code === 'audio-capture') {
        message = 'No microphone found.';
      }
      shouldListenRef.current = false;
      setStatus(next);
      setErrorMessage(message);
      onErrorRef.current?.(message);
    };

    recognition.onend = () => {
      // Chrome ends sessions periodically in continuous mode — restart if still wanted
      if (shouldListenRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          return;
        } catch {
          // fall through to idle
        }
      }
      shouldListenRef.current = false;
      setStatus((prev) =>
        prev === 'unsupported' || prev === 'denied' || prev === 'error' ? prev : 'idle'
      );
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      try {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
      } catch {
        // ignore cleanup races
      }
      recognitionRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    if (!recognitionRef.current) {
      setStatus('unsupported');
      setErrorMessage('Speech recognition is not supported in this browser.');
      return;
    }
    if (shouldListenRef.current) return;
    shouldListenRef.current = true;
    setErrorMessage(null);
    try {
      recognitionRef.current.start();
      setStatus('listening');
    } catch (err) {
      // Already started
      const message = err instanceof Error ? err.message : 'Could not start microphone.';
      if (!/already started/i.test(message)) {
        shouldListenRef.current = false;
        setStatus('error');
        setErrorMessage(message);
        onErrorRef.current?.(message);
      }
    }
  }, []);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setStatus((prev) =>
      prev === 'unsupported' || prev === 'denied' ? prev : 'idle'
    );
  }, []);

  const toggle = useCallback(() => {
    if (shouldListenRef.current || status === 'listening') {
      stop();
    } else {
      start();
    }
  }, [start, stop, status]);

  return {
    status,
    isListening: status === 'listening',
    isSupported: status !== 'unsupported',
    errorMessage,
    start,
    stop,
    toggle,
  };
}
