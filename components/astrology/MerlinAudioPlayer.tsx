'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCachedAudio, cacheAudio } from '@/lib/audio-cache';

interface MerlinAudioPlayerProps {
  /** Text to synthesize. When this changes the player resets. */
  text: string;
  /** Optional label shown on the trigger button */
  label?: string;
  className?: string;
}

type PlayerState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error';

/**
 * MerlinAudioPlayer — a built-in ElevenLabs audio player with play/pause/rewind.
 * Falls back to the browser's Web Speech API when ElevenLabs is unavailable.
 */
export function MerlinAudioPlayer({ text, label = '🔮 Hear Merlin', className = '' }: MerlinAudioPlayerProps) {
  const [state, setState] = useState<PlayerState>('idle');
  const [progress, setProgress] = useState(0); // 0–1
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textRef = useRef(text);

  // Reset when text changes
  useEffect(() => {
    if (textRef.current !== text) {
      textRef.current = text;
      stop();
      setState('idle');
    }
  }, [text]);

  const stop = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    // Also cancel Web Speech API if active
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setState('idle');
    setProgress(0);
    setCurrent(0);
  }, []);

  const VOICE = 'mystic';

  const loadAndPlay = useCallback(async () => {
    if (!text) return;
    setState('loading');
    setErrorMsg('');

    try {
      // ── Cache check: skip ElevenLabs call if we already have this audio ──
      const cached = getCachedAudio(text, VOICE);
      if (cached) {
        console.log('[MerlinAudioPlayer] Cache hit — skipping ElevenLabs');
        const audio = new Audio(cached);
        audioRef.current = audio;
        audio.onloadedmetadata = () => setDuration(audio.duration);
        audio.ontimeupdate = () => {
          setCurrent(audio.currentTime);
          setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
        };
        audio.onended = () => { setState('idle'); setProgress(0); setCurrent(0); };
        audio.onerror = () => { setState('error'); setErrorMsg('Playback error'); };
        setState('ready');
        audio.play();
        setState('playing');
        return;
      }

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: VOICE, provider: 'elevenlabs' }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.audio) {
          // ── Cache write ──
          cacheAudio(text, VOICE, result.data.audio);
          const audio = new Audio(result.data.audio);
          audioRef.current = audio;

          audio.onloadedmetadata = () => setDuration(audio.duration);
          audio.ontimeupdate = () => {
            setCurrent(audio.currentTime);
            setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
          };
          audio.onended = () => { setState('idle'); setProgress(0); setCurrent(0); };
          audio.onerror = () => {
            setState('error');
            setErrorMsg('Playback error');
          };

          setState('ready');
          audio.play();
          setState('playing');
          return;
        }
      }
      // ElevenLabs unavailable — use Web Speech API fallback
      console.warn('[MerlinAudioPlayer] ElevenLabs unavailable, using Web Speech API');
      fallbackSpeech();
    } catch (err) {
      console.error('[MerlinAudioPlayer] Error:', err);
      fallbackSpeech();
    }
  }, [text]);

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
    if (el) {
      el.currentTime = Math.max(0, el.currentTime - 10);
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    const val = parseFloat(e.target.value);
    if (el && duration) {
      el.currentTime = val * duration;
    }
    setProgress(val);
  }, [duration]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const isActive = state === 'playing' || state === 'paused';
  const isLoading = state === 'loading';

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
                <span className="text-sm">Generating voice…</span>
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

            {/* Seek bar */}
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
                onClick={stop}
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
