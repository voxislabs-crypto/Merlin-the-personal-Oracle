'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceAvatarProps {
  isPlaying?: boolean;
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
  const [isListening, setIsListening] = useState(false);
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

  // Determine avatar state
  const getAvatarState = useCallback(() => {
    if (isPlaying && audioFrequency > 30) return 'speaking';
    if (isPlaying) return 'listening';
    return 'idle';
  }, [isPlaying, audioFrequency]);

  const state = getAvatarState();

  // Animation variants
  const eyeGlowVariants = {
    idle: { opacity: 0.3, filter: 'drop-shadow(0 0 2px rgba(100, 150, 255, 0.3))' },
    listening: { opacity: 0.5, filter: 'drop-shadow(0 0 4px rgba(100, 150, 255, 0.6))' },
    speaking: {
      opacity: 1,
      filter: 'drop-shadow(0 0 12px rgba(100, 200, 255, 1))',
      transition: { duration: 0.3 },
    },
  };

  const beardSwayVariants = {
    idle: {
      rotateZ: 0,
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
    listening: {
      rotateZ: [0, -1, 0, 1, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
    speaking: {
      rotateZ: [0, -2, 0, 2, 0],
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  const beardPuffVariants = {
    idle: { scaleY: 1, opacity: 1 },
    listening: { scaleY: 1, opacity: 1 },
    speaking: {
      scaleY: [1, 1.2, 1],
      opacity: [1, 0.9, 1],
      transition: {
        duration: 0.3,
        times: [0, 0.5, 1],
      },
    },
  };

  const headTiltVariants = {
    idle: {
      rotateY: 0,
      rotateZ: 0,
      transition: { duration: 0.6, ease: 'easeInOut' },
    },
    listening: {
      rotateY: 15,
      rotateZ: 2,
      transition: { duration: 0.8, ease: 'easeInOut' },
    },
    speaking: {
      rotateY: -10,
      rotateZ: -2,
      transition: { duration: 0.6, ease: 'easeInOut' },
    },
  };

  const hatTipVariants = {
    idle: {
      rotateZ: 0,
      transformOrigin: 'top center',
    },
    blink: {
      rotateZ: [0, -5, 5, 0],
      transition: { duration: 0.6, ease: 'easeInOut' },
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
          background: 'linear-gradient(135deg, #1a0033 0%, #330066 50%, #1a0033 100%)',
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

        {/* Merlin Portrait Container */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          variants={headTiltVariants}
          animate={state}
        >
          {/* Base Portrait Image */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900 via-slate-900 to-slate-950 flex items-center justify-center">
            {portraitImage ? (
              <img
                src={portraitImage}
                alt="Merlin Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              // Fallback: Stylized text-based avatar
              <div className="flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-2">🧙</div>
                <div className="text-xl font-semibold text-yellow-300">Merlin</div>
                <div className="text-xs text-purple-300 mt-2">The Oracle</div>
              </div>
            )}
          </div>

          {/* Eyes Glow Overlay */}
          <motion.div
            className="absolute top-24 left-0 right-0 flex justify-center gap-12"
            variants={eyeGlowVariants}
            animate={state}
            style={{
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {/* Left Eye Glow */}
            <div className="w-4 h-4 rounded-full bg-blue-400 opacity-70 shadow-lg" />
            {/* Right Eye Glow */}
            <div className="w-4 h-4 rounded-full bg-blue-400 opacity-70 shadow-lg" />
          </motion.div>

          {/* Beard Sway */}
          <motion.div
            className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-32 h-20 pointer-events-none"
            variants={beardSwayVariants}
            animate={state}
            style={{
              originX: 0.5,
              originY: 0,
              zIndex: 5,
            }}
          >
            <div className="w-full h-full bg-gradient-to-b from-slate-700 to-slate-900 rounded-full opacity-40 blur-md" />
          </motion.div>

          {/* Beard Puff Effect */}
          <motion.div
            className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-24 h-12 pointer-events-none"
            variants={beardPuffVariants}
            animate={state}
            style={{
              originX: 0.5,
              originY: 0.5,
              zIndex: 4,
            }}
          >
            <div className="w-full h-full bg-gradient-to-t from-slate-600 to-transparent rounded-full blur-lg opacity-50" />
          </motion.div>

          {/* Hat */}
          <motion.div
            className="absolute top-8 left-1/2 transform -translate-x-1/2 pointer-events-none"
            variants={hatTipVariants}
            animate={blinkTrigger % 2 === 0 ? 'idle' : 'blink'}
            key={blinkTrigger}
            style={{
              originX: 0.5,
              originY: 0,
              zIndex: 15,
            }}
          >
            <div className="text-5xl">🧢</div>
          </motion.div>
        </motion.div>

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
        {isPlaying && (
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/50"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-blue-400"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs font-medium text-blue-300">
              {state === 'speaking' ? 'Speaking' : 'Listening'}
            </span>
          </motion.div>
        )}
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
