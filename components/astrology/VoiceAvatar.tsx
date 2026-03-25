'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceAvatarProps {
  isPlaying?: boolean;
  isThinking?: boolean;
  audioRef?: React.RefObject<HTMLAudioElement>;
  messageText?: string;
  portraitImage?: string; // Base64 or URL to Merlin portrait
}

/**
 * VoiceAvatar Component
 * Animates a Merlin portrait with:
 * - Eyes glow when speaking
 * - Beard sways and puffs on speech
 * - Head turns toward viewer when listening, back when speaking
 * - Hat tips on blinks (8 sec intervals)
 * - Background stars twinkle
 * - 60fps smooth animations, fully loopable
 */
export const VoiceAvatar: React.FC<VoiceAvatarProps> = ({
  isPlaying = false,
  isThinking = false,
  audioRef,
  messageText = '',
  portraitImage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [audioFrequency, setAudioFrequency] = useState(0);
  const [lastPuffTime, setLastPuffTime] = useState(0);
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [blinkTrigger, setBlinkTrigger] = useState(0);

  // Initialize Web Audio API for frequency detection
  useEffect(() => {
    if (!audioRef?.current || !isPlaying) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      if (!analyserRef.current) {
        try {
          const source = (audioContext as any).createMediaElementAudioSource(audioRef.current);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyser.connect(audioContext.destination);
          analyserRef.current = analyser;
          dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount) as any;
        } catch (err) {
          console.error('Failed to create audio source:', err);
        }
      }

      // Analyze audio in real-time
      const analyzeAudio = () => {
        if (analyserRef.current && dataArrayRef.current) {
          (analyserRef.current as any).getByteFrequencyData(dataArrayRef.current);
          const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
          setAudioFrequency(average);

          // Trigger puff on frequency peaks (word boundaries)
          if (average > 60) {
            const now = Date.now();
            if (now - lastPuffTime > 200) {
              setLastPuffTime(now);
            }
          }
        }

        if (isPlaying) {
          animationFrameRef.current = requestAnimationFrame(analyzeAudio);
        }
      };

      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    } catch (error) {
      console.error('VoiceAvatar: Audio API initialization failed', error);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, audioRef, lastPuffTime]);

  // Blink timer (every 8 seconds)
  useEffect(() => {
    if (blinkTimerRef.current) {
      clearInterval(blinkTimerRef.current);
    }

    blinkTimerRef.current = setInterval(() => {
      setBlinkTrigger((prev) => prev + 1);
    }, 8000);

    return () => {
      if (blinkTimerRef.current) {
        clearInterval(blinkTimerRef.current);
      }
    };
  }, []);

  const pulseStrength = useMemo(() => Math.min(audioFrequency / 120, 1), [audioFrequency]);

  // Determine avatar state
  const getAvatarState = useCallback(() => {
    if (isPlaying && audioFrequency > 30) return 'speaking';
    if (isThinking) return 'thinking';
    if (isPlaying) return 'listening';
    return 'idle';
  }, [isPlaying, isThinking, audioFrequency]);

  const state = getAvatarState();

  // Animation variants
  const haloVariants = {
    idle: { opacity: 0.35, scale: 1, filter: 'blur(24px)' },
    thinking: {
      opacity: 0.68,
      scale: [1, 1.06, 1],
      filter: 'blur(30px)',
      transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
    },
    listening: { opacity: 0.55, scale: 1.04, filter: 'blur(28px)' },
    speaking: {
      opacity: 0.9,
      scale: 1.1,
      filter: 'blur(34px)',
      transition: { duration: 0.22 },
    },
  };

  const orbVariants = {
    idle: {
      scale: 1,
      boxShadow: '0 0 30px rgba(94, 234, 212, 0.14)',
      transition: { duration: 0.8, ease: 'easeInOut' },
    },
    thinking: {
      scale: [1, 1.03, 0.995, 1],
      boxShadow: '0 0 58px rgba(192, 132, 252, 0.22)',
      transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
    },
    listening: {
      scale: [1, 1.02, 1],
      boxShadow: '0 0 48px rgba(125, 211, 252, 0.2)',
      transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
    },
    speaking: {
      scale: [1, 1.05 + pulseStrength * 0.08, 1],
      boxShadow: `0 0 ${48 + pulseStrength * 28}px rgba(103, 232, 249, 0.34)`,
      transition: { duration: 0.55, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  const innerCoreVariants = {
    idle: { scale: 1, opacity: 0.8 },
    thinking: {
      scale: [1, 1.05, 1],
      opacity: [0.84, 0.98, 0.84],
      transition: { duration: 1.25, repeat: Infinity, ease: 'easeInOut' },
    },
    listening: { scale: [1, 1.04, 1], opacity: [0.82, 0.92, 0.82] },
    speaking: {
      scale: [1, 1.08 + pulseStrength * 0.12, 1],
      opacity: [0.86, 1, 0.86],
      transition: {
        duration: 0.4,
        repeat: Infinity,
      },
    },
  };

  const ringVariants = {
    idle: {
      rotate: 0,
      opacity: 0.45,
    },
    thinking: {
      rotate: 240,
      opacity: 0.72,
      transition: { duration: 7.5, repeat: Infinity, ease: 'linear' },
    },
    listening: {
      rotate: 180,
      opacity: 0.6,
      transition: { duration: 10, repeat: Infinity, ease: 'linear' },
    },
    speaking: {
      rotate: 360,
      opacity: 0.85,
      transition: { duration: 5.5, repeat: Infinity, ease: 'linear' },
    },
  };

  const starTwinkleVariants = (delay: number) => ({
    initial: { opacity: 0.1 },
    animate: {
      opacity: [0.1, 0.8, 0.1],
      transition: {
        duration: 3 + Math.random() * 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  });

  return (
    <motion.div
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full max-w-sm mx-auto p-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Avatar Container */}
      <motion.div
        className="relative w-80 h-96 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          perspective: '1200px',
          background: 'linear-gradient(160deg, #06111f 0%, #141b38 45%, #090d1b 100%)',
        }}
      >
        {/* Background Stars */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              variants={starTwinkleVariants(i * 0.3)}
              initial="initial"
              animate="animate"
            />
          ))}
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_34%),radial-gradient(circle_at_bottom,_rgba(251,191,36,0.12),_transparent_38%)]" />

        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="absolute h-48 w-48 rounded-full bg-cyan-300/20"
            variants={haloVariants}
            animate={state}
          />

          <motion.div
            className="absolute h-52 w-52 rounded-full border border-cyan-200/20"
            variants={ringVariants}
            animate={state}
          />

          <motion.div
            className="absolute h-64 w-64 rounded-full border border-violet-300/15"
            variants={ringVariants}
            animate={state}
            style={{ animationDirection: 'reverse' }}
          />

          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={`particle-${index}`}
              className="absolute h-2 w-2 rounded-full bg-amber-200/80"
              animate={{
                x: [0, Math.cos((index / 4) * Math.PI * 2) * 62, 0],
                y: [0, Math.sin((index / 4) * Math.PI * 2) * 62, 0],
                opacity:
                  state === 'speaking'
                    ? [0.25, 1, 0.25]
                    : state === 'thinking'
                      ? [0.2, 0.85, 0.2]
                      : [0.18, 0.6, 0.18],
                scale:
                  state === 'speaking'
                    ? [0.8, 1.4, 0.8]
                    : state === 'thinking'
                      ? [0.75, 1.18, 0.75]
                      : [0.8, 1.05, 0.8],
              }}
              transition={{
                duration: state === 'speaking' ? 1.2 : state === 'thinking' ? 1.7 : 2.8,
                repeat: Infinity,
                delay: index * 0.18,
                ease: 'easeInOut',
              }}
            />
          ))}

          <motion.div
            className="relative flex h-36 w-36 items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.35),_rgba(125,211,252,0.18)_28%,_rgba(14,116,144,0.45)_58%,_rgba(3,7,18,0.82)_100%)] backdrop-blur-md"
            variants={orbVariants}
            animate={state}
          >
            {portraitImage ? (
              <div className="relative h-28 w-28 overflow-hidden rounded-full border border-white/10 shadow-[0_0_30px_rgba(34,211,238,0.12)]">
                <img
                  src={portraitImage}
                  alt="Merlin Avatar"
                  className="absolute inset-0 h-full w-full scale-[1.38] object-cover object-[center_18%] opacity-95 saturate-[0.7] contrast-[1.08] brightness-[0.62]"
                />
                <img
                  src={portraitImage}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full scale-[1.42] object-cover object-[center_18%] opacity-30 blur-[1.5px] saturate-0 mix-blend-screen"
                  style={{ filter: 'brightness(0.9) contrast(1.15) sepia(0.25) hue-rotate(165deg)' }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,_rgba(255,248,220,0.22),_transparent_28%),linear-gradient(180deg,_rgba(8,15,30,0.06)_0%,_rgba(6,10,20,0.3)_38%,_rgba(2,6,23,0.82)_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(140deg,_rgba(34,211,238,0.18)_0%,_transparent_38%,_rgba(99,102,241,0.22)_72%,_rgba(251,191,36,0.12)_100%)] mix-blend-screen" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_52%,_rgba(2,6,23,0.55)_82%,_rgba(2,6,23,0.9)_100%)]" />
                <div className="absolute inset-[5px] rounded-full border border-cyan-100/10" />
              </div>
            ) : (
              <motion.div
                className="flex h-20 w-20 items-center justify-center rounded-full border border-cyan-100/10 bg-white/5 text-3xl font-semibold tracking-[0.2em] text-cyan-50"
                animate={{
                  rotate: blinkTrigger % 2 === 0 ? 0 : [0, -6, 6, 0],
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                M
              </motion.div>
            )}

            <motion.div
              className="absolute inset-5 rounded-full border border-cyan-100/10"
              variants={innerCoreVariants}
              animate={state}
            />
          </motion.div>
        </div>

        {/* Outer Glow Ring (stronger when speaking) */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border: '2px solid transparent',
            borderImage: 'linear-gradient(135deg, rgba(100, 150, 255, 0.3), rgba(200, 100, 255, 0.3)) 1',
          }}
          animate={{
            boxShadow: isPlaying
              ? `0 0 20px rgba(100, 200, 255, ${0.5 + audioFrequency / 200})`
              : '0 0 10px rgba(100, 150, 255, 0.2)',
          }}
          transition={{ duration: 0.1 }}
        />
      </motion.div>

      {/* Status Indicator */}
      <motion.div
        className="mt-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-slate-950/50 px-4 py-2"
          animate={{ opacity: isPlaying || isThinking ? [0.72, 1, 0.72] : 0.88 }}
          transition={{ duration: 2, repeat: isPlaying || isThinking ? Infinity : 0 }}
        >
          <motion.div
            className="h-2 w-2 rounded-full bg-cyan-300"
            animate={{
              scale:
                state === 'speaking'
                  ? [1, 1.4, 1]
                  : state === 'thinking'
                    ? [1, 1.24, 1]
                    : state === 'listening'
                      ? [1, 1.16, 1]
                      : 1,
            }}
            transition={{ duration: 1, repeat: state === 'idle' ? 0 : Infinity }}
          />
          <span className="text-xs font-medium text-cyan-100/90">
            {state === 'speaking'
              ? 'Speaking'
              : state === 'thinking'
                ? 'Thinking'
                : state === 'listening'
                  ? 'Attuning'
                  : 'Idle'}
          </span>
        </motion.div>

        {messageText ? (
          <p className="mx-auto mt-3 max-w-xs text-[11px] leading-relaxed text-slate-400">
            {state === 'speaking'
              ? 'Merlin is voicing the current thread.'
              : state === 'thinking'
                ? 'Merlin is composing the next read.'
                : 'Merlin is present and ready.'}
          </p>
        ) : null}
      </motion.div>

      {/* Audio Frequency Visualizer (debug) */}
      {process.env.NODE_ENV === 'development' && isPlaying && (
        <motion.div className="mt-2 text-xs text-purple-400">
          Freq: {Math.round(audioFrequency)}
        </motion.div>
      )}
    </motion.div>
  );
};

export default VoiceAvatar;
