'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCachedAudio, cacheAudio } from '@/lib/audio-cache';

// ── ElevenLabs has a ~5000 char hard limit. We stay well under it. ──
const CHUNK_MAX = 3500;

/**
 * Split text into chunks at natural paragraph / sentence boundaries,
 * never exceeding CHUNK_MAX characters per chunk.
 */
function splitIntoChunks(text: string, max = CHUNK_MAX): string[] {
  if (text.length <= max) return [text];

  const chunks: string[] = [];
  // First split on paragraph breaks
  const paragraphs = text.split(/\n\n+/);
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length <= max) {
      current = current ? current + '\n\n' + para : para;
    } else {
      // Para itself is too long — split on sentences
      if (para.length > max) {
        const sentences = para.match(/[^.!?]+[.!?]+["']?(\s|$)/g) || [para];
        for (const sent of sentences) {
          if ((current + ' ' + sent).length <= max) {
            current = current ? current + ' ' + sent : sent;
          } else {
            if (current) chunks.push(current.trim());
            // Single sentence > max: hard split
            if (sent.length > max) {
              for (let i = 0; i < sent.length; i += max) {
                chunks.push(sent.slice(i, i + max).trim());
              }
              current = '';
            } else {
              current = sent;
            }
          }
        }
      } else {
        if (current) chunks.push(current.trim());
        current = para;
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
}

interface MerlinAudioPlayerProps {
  /** Text to synthesize. When this changes the player resets. */
  text: string;
  /** Optional label shown on the trigger button */
  label?: string;
  className?: string;
}

type PlayerState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error';

/**
 * MerlinAudioPlayer — chunked ElevenLabs audio player.
 * Splits long readings into ≤3500-char sections, fetches each with caching,
 * then plays them sequentially so nothing gets cut off.
 * Falls back to Web Speech API when ElevenLabs is unavailable.
 */
export function MerlinAudioPlayer({ text, label = '🔮 Hear Merlin', className = '' }: MerlinAudioPlayerProps) {
  const [state, setState] = useState<PlayerState>('idle');
  const [progress, setProgress] = useState(0); // 0–1 within current chunk
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  // Chunked playback state
  const [chunks, setChunks] = useState<string[]>([]);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [loadingChunk, setLoadingChunk] = useState(0); // which chunk we're fetching
  const chunkAudioRef = useRef<string[]>([]); // cached base64 per chunk
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textRef = useRef(text);
  const abortRef = useRef(false); // set true when user stops to cancel in-flight fetches

  const VOICE = 'mystic';

  // Reset when text changes
  useEffect(() => {
    if (textRef.current !== text) {
      textRef.current = text;
      doStop();
    }
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const doStop = useCallback(() => {
    abortRef.current = true;
    const el = audioRef.current;
    if (el) { el.pause(); el.currentTime = 0; }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    audioRef.current = null;
    chunkAudioRef.current = [];
    setState('idle');
    setProgress(0);
    setCurrent(0);
    setDuration(0);
    setChunks([]);
    setChunkIndex(0);
    setLoadingChunk(0);
  }, []);

  // Fetch (or hit cache for) a single chunk — returns base64 string
  const fetchChunk = useCallback(async (chunkText: string): Promise<string | null> => {
    const cached = getCachedAudio(chunkText, VOICE);
    if (cached) return cached;

    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: chunkText, voice: VOICE, provider: 'elevenlabs' }),
    });
    if (!res.ok) return null;
    const result = await res.json();
    if (result.success && result.data?.audio) {
      cacheAudio(chunkText, VOICE, result.data.audio);
      return result.data.audio;
    }
    return null;
  }, []);

  // Wire up an Audio element for the given base64 and play it
  const playAudioData = useCallback((audioData: string, onEnd: () => void) => {
    const audio = new Audio(audioData);
    audioRef.current = audio;
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => {
      setCurrent(audio.currentTime);
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    };
    audio.onended = onEnd;
    audio.onerror = () => { setState('error'); setErrorMsg('Playback error'); };
    audio.play();
    setState('playing');
  }, []);

  // Recursive: play chunk at index, then advance
  const playChunkAt = useCallback((index: number, allChunks: string[], allAudio: string[]) => {
    if (abortRef.current) return;
    if (index >= allChunks.length) {
      // All chunks done
      setState('idle');
      setProgress(0);
      setCurrent(0);
      setChunkIndex(0);
      return;
    }
    setChunkIndex(index);
    setProgress(0);
    setCurrent(0);
    playAudioData(allAudio[index], () => playChunkAt(index + 1, allChunks, allAudio));
  }, [playAudioData]);

  const loadAndPlay = useCallback(async () => {
    if (!text) return;
    abortRef.current = false;
    setState('loading');
    setErrorMsg('');
    setProgress(0);
    setCurrent(0);

    const textChunks = splitIntoChunks(text);
    setChunks(textChunks);
    chunkAudioRef.current = [];

    // Fetch all chunks sequentially (cache hits are instant)
    const audioData: string[] = [];
    for (let i = 0; i < textChunks.length; i++) {
      if (abortRef.current) return;
      setLoadingChunk(i + 1);
      const data = await fetchChunk(textChunks[i]);
      if (!data) {
        // ElevenLabs failed — fall back to Web Speech for whole text
        console.warn('[MerlinAudioPlayer] ElevenLabs unavailable, using Web Speech API');
        fallbackSpeech();
        return;
      }
      audioData.push(data);
    }
    if (abortRef.current) return;

    chunkAudioRef.current = audioData;
    setState('ready');
    playChunkAt(0, textChunks, audioData);
  }, [text, fetchChunk, playChunkAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const fallbackSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setState('error');
      setErrorMsg('Audio unavailable');
      return;
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.9;
    utt.pitch = 0.95;
    utt.onstart = () => setState('playing');
    utt.onend   = () => { setState('idle'); setProgress(0); };
    utt.onerror  = () => setState('error');
    window.speechSynthesis.speak(utt);
    setState('playing');
    setChunks([text]);
    setChunkIndex(0);
  }, [text]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (state === 'playing') {
      el.pause();
      setState('paused');
    } else if (state === 'paused') {
      el.play();
      setState('playing');
    }
  }, [state]);

  const rewind = useCallback(() => {
    const el = audioRef.current;
    if (el) el.currentTime = Math.max(0, el.currentTime - 10);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    const val = parseFloat(e.target.value);
    if (el && duration) el.currentTime = val * duration;
    setProgress(val);
  }, [duration]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const isActive = state === 'playing' || state === 'paused';
  const isLoading = state === 'loading';
  const totalChunks = chunks.length;
  const isMultiPart = totalChunks > 1;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Trigger / Main Button */}
      <AnimatePresence mode="wait">
        {!isActive ? (
          <motion.button
            key="trigger"
            onClick={isLoading ? undefined : loadAndPlay}
            disabled={isLoading || !text}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {isLoading ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-amber-400/50 border-t-amber-400 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                />
                <span className="text-sm">
                  {totalChunks > 1
                    ? `Preparing part ${loadingChunk} of ${totalChunks}…`
                    : 'Generating voice…'}
                </span>
              </>
            ) : (
              <>
                <span className="text-lg">🔊</span>
                <span className="text-sm">{label}</span>
              </>
            )}
          </motion.button>
        ) : (
          <motion.div
            key="player"
            className="flex flex-col gap-2 p-3 rounded-xl border border-amber-500/40 bg-slate-900/70 backdrop-blur-sm min-w-[260px]"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            {/* Part indicator — only shown when reading spans multiple sections */}
            {isMultiPart && (
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-amber-400/80 font-semibold tracking-wide">
                  Part {chunkIndex + 1} <span className="text-slate-500">/ {totalChunks}</span>
                </span>
                {/* Mini section pips */}
                <div className="flex gap-1">
                  {chunks.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i < chunkIndex
                          ? 'w-4 bg-amber-500/60'
                          : i === chunkIndex
                            ? 'w-4 bg-amber-400'
                            : 'w-2 bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Wave animation bar */}
            <div className="flex items-center gap-1.5 justify-center h-6">
              {state === 'playing' ? (
                [0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-amber-400"
                    animate={{ scaleY: [0.4, 1.2, 0.4], backgroundColor: ['#fbbf24', '#f59e0b', '#fbbf24'] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }}
                    style={{ height: 20 }}
                  />
                ))
              ) : (
                <span className="text-amber-500/60 text-xs">⏸ Paused</span>
              )}
            </div>

            {/* Seek bar — current section */}
            {duration > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-8 text-right">{formatTime(current)}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.001}
                  value={progress}
                  onChange={handleSeek}
                  className="flex-1 h-1 accent-amber-400 cursor-pointer"
                />
                <span className="text-xs text-slate-400 w-8">{formatTime(duration)}</span>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={rewind}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all"
                title="Rewind 10s"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                  <text x="8.5" y="15" fontSize="6" fill="currentColor" fontFamily="sans-serif">10</text>
                </svg>
              </button>

              <button
                onClick={togglePlay}
                className="p-2.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 transition-all"
              >
                {state === 'playing' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              <button
                onClick={doStop}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                title="Stop"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {state === 'error' && (
        <p className="text-xs text-red-400">{errorMsg || 'Audio unavailable'}</p>
      )}
    </div>
  );
}
