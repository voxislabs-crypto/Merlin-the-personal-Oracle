'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReadAloudButtonProps {
  text: string;
  label?: string;
  className?: string;
  priority?: boolean; // If true, prefer this text for reading
}

/**
 * Text-to-Speech functionality for chart interpretations
 * Prioritizes Grok-generated Soul Insights and Life Themes
 */
export function ReadAloudButton({
  text,
  label = 'Read Aloud',
  className = '',
  priority = false
}: ReadAloudButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if browser supports speech synthesis
    setIsSupported('speechSynthesis' in window);

    return () => {
      // Cleanup: stop any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = useCallback(() => {
    if (!isSupported || !text) return;

    if (isPlaying) {
      // Stop current playback
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Create new utterance
    const newUtterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings for a wise, mystical tone
    newUtterance.rate = 0.9; // Slightly slower - more contemplative
    newUtterance.pitch = 0.95; // Slightly lower - more authority
    newUtterance.volume = 1.0;

    // Try to select a good voice (prefer female, en-US/en-GB)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      v => 
        (v.name.includes('Samantha') || // macOS
         v.name.includes('Karen') || // macOS
         v.name.includes('Google UK English Female') || // Chrome
         v.name.includes('Microsoft Zira')) && // Windows
        v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      newUtterance.voice = preferredVoice;
    }

    // Event handlers
    newUtterance.onstart = () => setIsPlaying(true);
    newUtterance.onend = () => setIsPlaying(false);
    newUtterance.onerror = () => {
      setIsPlaying(false);
      console.error('[ReadAloud] Speech synthesis error');
    };

    setUtterance(newUtterance);
    window.speechSynthesis.speak(newUtterance);
  }, [text, isSupported, isPlaying]);

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  return (
    <motion.button
      onClick={handleSpeak}
      className={`group flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
        isPlaying
          ? 'bg-purple-600 border-purple-400 text-white'
          : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:border-purple-400/50 hover:bg-slate-700/50'
      } ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <AnimatePresence mode="wait">
        {isPlaying ? (
          <motion.div
            key="playing"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-1"
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1 h-4 bg-white rounded-full"
                animate={{
                  scaleY: [1, 1.5, 1],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </motion.div>
        ) : (
          <motion.svg
            key="paused"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.121-10.607L12 9.172l2.879-2.879m0 10.607L12 13.828 9.121 16.707"
            />
          </motion.svg>
        )}
      </AnimatePresence>
      
      <span className="text-sm font-medium">
        {isPlaying ? 'Stop' : label}
      </span>

      {priority && !isPlaying && (
        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
          ✨ Enhanced
        </span>
      )}
    </motion.button>
  );
}

/**
 * Read all Grok-generated content in sequence
 */
export function ReadGrokInsightsButton({
  soulInsights,
  lifeThemes,
  className = ''
}: {
  soulInsights?: string;
  lifeThemes?: string[];
  className?: string;
}) {
  const combinedText = [
    soulInsights && `Soul Insights: ${soulInsights}`,
    lifeThemes && lifeThemes.length > 0 && `Your life themes are: ${lifeThemes.join(', ')}`
  ]
    .filter(Boolean)
    .join('. ');

  if (!combinedText) return null;

  return (
    <ReadAloudButton
      text={combinedText}
      label="🎙️ Read Soul Insights"
      priority={true}
      className={className}
    />
  );
}

/**
 * Hook to manage read-aloud state across components
 */
export function useReadAloud() {
  const [isPlaying, setIsPlaying] = useState(false);

  const speak = useCallback((text: string, options?: {
    rate?: number;
    pitch?: number;
    voice?: SpeechSynthesisVoice;
  }) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 0.9;
    utterance.pitch = options?.pitch || 0.95;
    utterance.volume = 1.0;

    if (options?.voice) {
      utterance.voice = options.voice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, []);

  const toggle = useCallback((text: string) => {
    if (isPlaying) {
      stop();
    } else {
      speak(text);
    }
  }, [isPlaying, speak, stop]);

  return { isPlaying, speak, stop, toggle };
}
