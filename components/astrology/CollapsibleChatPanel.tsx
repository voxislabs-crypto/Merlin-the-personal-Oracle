'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import { Send, Loader2, ChevronLeft, ChevronRight, X, Volume2, Trash2, Play, Pause, Eye, Sparkles, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { VoiceAvatar } from '@/components/astrology/VoiceAvatar';
import { IdentityPatternCard } from '@/components/astrology/IdentityPatternCard';
import { ProgressPathCard } from '@/components/astrology/ProgressPathCard';
import { getCachedAudio, cacheAudio, clearAllAudioCache } from '@/lib/audio-cache';
import { globalAudioManager } from '@/lib/global-audio-manager';
import type { BirthChartData } from '@/types/astrology';
import { polishOracleOutput, type OracleTonePreset } from '@/lib/oracle-output';
import { useOracleChatStream } from '@/hooks/useOracleChatStream';
import type { OracleMode } from '@/lib/oracle-chat-client';
import type { AtmospherePacket } from '@/lib/atmosphere/types';
import { useOraclePreferences } from '@/hooks/useOraclePreferences';

const MERLIN_PORTRAIT_IMAGE = '/merlin-portrait-chatgpt.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tactics?: string[];
  forecast?: { timeframe: string; themes: string[] };
  level?: { current: string; challenge: string; reward: string };
  progression?: { arcPath: string; arcLevel: number; arcXp: number; interactionCount: number; xpGained?: number };
  mirrorInsight?: {
    message: string;
    label?: string;
    count?: number;
    trendStatus?: 'rising' | 'stable' | 'fading' | 'new';
    stanceMode?: 'direct' | 'soft';
  };
}

interface CollapsibleChatPanelProps {
  birthChart?: BirthChartData;
  progressedChart?: any;
  userId?: string;
  isExpanded?: boolean;
  onToggleExpand?: Dispatch<SetStateAction<boolean>>;
  // eslint-disable-next-line no-unused-vars
  onUserMessageSent?: (message: string) => void;
  mbtiType?: string; // MBTI archetype for Storm-Radar cross-reference
  clarityMode?: boolean; // Controlled from parent dashboard; falls back to localStorage
  onClarityChange?: () => void; // Propagate toggle back up to parent
  draftPrompt?: string;
  draftPromptKey?: number;
  draftLabel?: string;
  showExpandToggle?: boolean;
  /**
   * `minimal` = drawer mode: no double header, no identity cards, no avatar wall —
   * conversation text is the product.
   */
  chrome?: 'full' | 'minimal';
  atmospherePacket?: AtmospherePacket | null;
  dualPersonality?: {
    core?: string;
    mask?: string;
    final?: string;
  } | null;
}

export function CollapsibleChatPanel({
  birthChart,
  progressedChart,
  userId = 'anonymous',
  isExpanded = true,
  onToggleExpand,
  onUserMessageSent,
  mbtiType,
  clarityMode: clarityModeProp,
  onClarityChange,
  draftPrompt,
  draftPromptKey,
  draftLabel,
  showExpandToggle = true,
  chrome = 'full',
  atmospherePacket,
  dualPersonality,
}: CollapsibleChatPanelProps) {
  const minimal = chrome === 'minimal';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [expanded, setExpanded] = useState(isExpanded);
  const [ttsFallback, setTtsFallback] = useState(false); // Track if using Web Speech API
  const [ttsError, setTtsError] = useState<string | null>(null); // Track TTS errors
  const [autoScroll, setAutoScroll] = useState(true); // Track if user has scrolled up
  const [plainEnglishInternal, setPlainEnglishInternal] = useState(true); // Clarity Mode fallback
  const [tonePreset, setTonePreset] = useState<OracleTonePreset>('warm');
  const [oracleMode, setOracleMode] = useState<OracleMode>('auto');
  const [includeLikelihood, setIncludeLikelihood] = useState(true);
  const [ancientLayer, setAncientLayer] = useState(false);
  const [identityPack, setIdentityPack] = useState<{ archetypeName?: string; patternSignature?: string; coreContradiction?: string } | null>(null);
  const [progression, setProgression] = useState<{ arcPath?: string; arcLevel?: number; arcXp?: number; interactionCount?: number } | null>(null);
  const [activeDraftLabel, setActiveDraftLabel] = useState<string | null>(null);
  const preferencesSyncEnabled = Boolean(userId && userId !== 'anonymous');
  const { preferences, persistPreferences } = useOraclePreferences({ enabled: preferencesSyncEnabled });
  // Use parent-controlled value if provided, else internal state
  const plainEnglish = clarityModeProp !== undefined ? clarityModeProp : plainEnglishInternal;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { sendOracleMessage } = useOracleChatStream();
  
  // Create a ref to the global audio element for VoiceAvatar visualization
  const globalAudioRef = useRef<HTMLAudioElement | null>(
    typeof window !== 'undefined' && globalAudioManager ? globalAudioManager.getAudioElement() : null
  );

  useEffect(() => {
    if (!globalAudioManager) return;
    globalAudioRef.current = globalAudioManager.getAudioElement();
  }, [playingMessageId, isSpeaking, isTTSLoading]);

  const scrollToBottom = useCallback(() => {
    if (!autoScroll) return; // Don't force scroll if user has scrolled up
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [autoScroll]);

  // Check if user is at bottom of scroll
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setAutoScroll(isAtBottom);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    if (!draftPromptKey || !draftPrompt?.trim()) return;

    setInput(draftPrompt);
    setActiveDraftLabel(draftLabel || 'Selected context');
    setExpanded(true);
    onToggleExpand?.(true);

    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(draftPrompt.length, draftPrompt.length);
    }, 0);
  }, [draftPrompt, draftPromptKey, draftLabel, onToggleExpand]);

  const handleToggleExpand = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onToggleExpand?.(newExpanded);
  };

  const readMessageAloud = async (messageId: string, text: string) => {
    // If already playing this message
    if (playingMessageId === messageId) {
      if (ttsFallback && utteranceRef.current) {
        // Web Speech API fallback control
        if (isSpeaking) {
          window.speechSynthesis.pause();
          setIsPaused(true);
          setIsSpeaking(false);
        } else if (isPaused) {
          window.speechSynthesis.resume();
          setIsSpeaking(true);
          setIsPaused(false);
        }
      } else if (globalAudioManager) {
        // Global audio manager control
        if (globalAudioManager.isPlaying()) {
          globalAudioManager.pause();
          setIsPaused(true);
          setIsSpeaking(false);
        } else if (globalAudioManager.isPaused()) {
          globalAudioManager.resume();
          setIsSpeaking(true);
          setIsPaused(false);
        }
      }
      return;
    }

    // Stop any currently playing audio
    if (globalAudioManager) {
      globalAudioManager.stop();
    }
    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }

    try {
      setPlayingMessageId(messageId);
      setIsSpeaking(false);
      setIsPaused(false);
      setTtsError(null);
      setTtsFallback(false);

      // Check cache first
      const cachedAudio = getCachedAudio(text, 'oracle');
      let audioUrl = cachedAudio;

      // If not in cache, try ElevenLabs TTS
      if (!audioUrl) {
        setIsTTSLoading(true);
        try {
          const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              voice: 'oracle',
              provider: 'elevenlabs',
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.audio) {
              audioUrl = data.data.audio;
              // Cache the audio for future use
              if (audioUrl) {
                cacheAudio(text, 'oracle', audioUrl);
                console.log('[TTS] Generated and cached ElevenLabs audio');
              }
            } else {
              throw new Error(data.error || 'No audio data returned');
            }
          } else {
            const data = await response.json();
            throw new Error(data.error || `API error: ${response.status}`);
          }
        } catch (apiError) {
          console.warn('[TTS] ElevenLabs failed, falling back to Web Speech API:', apiError);
          setTtsError(`ElevenLabs unavailable: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
          setTtsFallback(true);
          setIsTTSLoading(false);
          playWithWebSpeechAPI(text);
          return;
        }
      }

      setIsTTSLoading(false);

      // Use global audio manager if available
      if (audioUrl && globalAudioManager && !ttsFallback) {
        // Set up callbacks for state management
        globalAudioManager.setCallbacks({
          onPlay: () => {
            setIsSpeaking(true);
            setIsPaused(false);
            setTtsError(null);
          },
          onPause: () => {
            setIsSpeaking(false);
          },
          onEnd: () => {
            setIsSpeaking(false);
            setIsPaused(false);
            setPlayingMessageId(null);
          },
          onError: (error) => {
            setTtsError(error);
            setTtsFallback(true);
            playWithWebSpeechAPI(text);
          }
        });

        try {
          await globalAudioManager.play(audioUrl, messageId);
          console.log('[TTS] Global audio manager playback started');
        } catch (playError) {
          console.error('[TTS] Global audio manager play failed:', playError);
          setTtsError('Playback failed. Falling back to Web Speech API.');
          setTtsFallback(true);
          playWithWebSpeechAPI(text);
        }
        return;
      }

      // Fallback to Web Speech API (if ElevenLabs failed or audio playback failed)
      playWithWebSpeechAPI(text);
    } catch (error) {
      console.error('[TTS] Fatal error:', error);
      setTtsError(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      setIsSpeaking(false);
      setIsPaused(false);
      setPlayingMessageId(null);
      setIsTTSLoading(false);
    }
  };

  const playWithWebSpeechAPI = async (text: string) => {
    if (!('speechSynthesis' in window)) {
      setTtsError('Text-to-speech not supported in this browser');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 0.95;
      utterance.volume = 1.0;

      // Try to use a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v =>
        (v.name.includes('Karen') || v.name.includes('Samantha') || v.name.includes('Zira')) &&
        v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onpause = () => {
        setIsSpeaking(false);
      };

      utterance.onresume = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setPlayingMessageId(null);
        utteranceRef.current = null;
        setTtsFallback(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setTtsError(`Speech error: ${event.error}`);
        setIsSpeaking(false);
        setIsPaused(false);
        setPlayingMessageId(null);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      setTtsFallback(true);
      console.log('[TTS] Using Web Speech API (browser voice)');
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('[TTS] Web Speech API error:', error);
      setTtsError(`Web Speech error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  const toggleCurrentSpeech = useCallback(() => {
    if (!playingMessageId) return;

    if (ttsFallback && utteranceRef.current) {
      if (isSpeaking) {
        window.speechSynthesis.pause();
        setIsPaused(true);
        setIsSpeaking(false);
      } else if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        setIsSpeaking(true);
      }
      return;
    }

    if (!globalAudioManager) return;

    if (globalAudioManager.isPlaying()) {
      globalAudioManager.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    } else if (globalAudioManager.isPaused()) {
      globalAudioManager.resume();
      setIsPaused(false);
      setIsSpeaking(true);
    }
  }, [playingMessageId, ttsFallback, isSpeaking, isPaused]);

  const stopCurrentSpeech = useCallback(() => {
    if (globalAudioManager) {
      globalAudioManager.stop();
      globalAudioManager.clearCallbacks();
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    utteranceRef.current = null;
    setPlayingMessageId(null);
    setIsSpeaking(false);
    setIsPaused(false);
    setIsTTSLoading(false);
    setTtsFallback(false);
  }, []);

  useEffect(() => {
    const handleGlobalStop = () => {
      stopCurrentSpeech();
    };

    window.addEventListener('merlin-stop-all-audio', handleGlobalStop);
    return () => {
      window.removeEventListener('merlin-stop-all-audio', handleGlobalStop);
    };
  }, [stopCurrentSpeech]);

  useEffect(() => {
    setTonePreset(preferences.oracleTonePreset);
    setOracleMode(preferences.oracleMode);
    setIncludeLikelihood(preferences.includeLikelihood);
    setAncientLayer(preferences.ancientLayer);
    if (clarityModeProp === undefined) {
      setPlainEnglishInternal(preferences.clarityMode);
    }
  }, [preferences, clarityModeProp]);

  useEffect(() => {
    const loadServerTone = async () => {
      if (!userId || userId === 'anonymous') return;
      try {
        const response = await fetch(`/api/user-context?userId=${encodeURIComponent(userId)}`);
        if (!response.ok) return;
        const result = await response.json();
        if (result?.data?.archetypeName || result?.data?.patternSignature || result?.data?.coreContradiction) {
          setIdentityPack({
            archetypeName: result.data.archetypeName,
            patternSignature: result.data.patternSignature,
            coreContradiction: result.data.coreContradiction,
          });
        }
        if (result?.data?.arcPath || result?.data?.arcLevel || result?.data?.arcXp) {
          setProgression({
            arcPath: result.data.arcPath,
            arcLevel: result.data.arcLevel,
            arcXp: result.data.arcXp,
            interactionCount: result.data.interactionCount,
          });
        }
      } catch {
        // Keep local fallback if server context is unavailable.
      }
    };

    loadServerTone();
  }, [userId]);

  const toggleClarityMode = () => {
    if (onClarityChange) {
      // Delegate to parent when controlled
      onClarityChange();
    } else {
      const next = !plainEnglishInternal;
      setPlainEnglishInternal(next);
      void persistPreferences({ clarityMode: next });
    }
  };

  // Save a tactic as a quest to localStorage
  const saveTacticAsQuest = (tactic: string) => {
    const QUEST_KEY = 'merlin_quests';
    try {
      const existing = JSON.parse(localStorage.getItem(QUEST_KEY) || '[]');
      const alreadyExists = existing.some((q: any) => q.title === tactic);
      if (alreadyExists) return;
      const newQuest = {
        id: `quest_chat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: tactic,
        description: 'Suggested by Merlin in your Oracle Chat session.',
        category: 'spirit',
        difficulty: 1,
        xp: 50,
        cosmicSource: 'Oracle Chat',
        completed: false,
      };
      localStorage.setItem(QUEST_KEY, JSON.stringify([...existing, newQuest]));
      // Fire a storage event so QuestLog can react without a page reload
      window.dispatchEvent(new StorageEvent('storage', { key: QUEST_KEY }));
    } catch {
      // ignore
    }
  };

  // Load chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/oracle-chat?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          const formattedMessages: Message[] = data.data.history.map(
            (msg: any, idx: number) => ({
              id: `${msg.role}-${idx}`,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
            })
          );
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    };

    fetchHistory();
  }, [userId]);

  // Cleanup audio on unmount to prevent cutoffs
  useEffect(() => {
    return () => {
      // Don't stop audio on cleanup - let it continue playing
      // Only stop if component is truly unmounting
      console.log('[TTS] Component cleanup - preserving audio playback');
    };
  }, []);

  // Prevent audio cutoff when messages change
  useEffect(() => {
    // Don't interfere with playing audio when new messages arrive
    if (globalAudioManager?.isPlaying() && isSpeaking) {
      console.log('[TTS] Messages updated but audio still playing - maintaining playback');
    }
  }, [messages, isSpeaking]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (playingMessageId || isSpeaking || isPaused || isTTSLoading) {
      stopCurrentSpeech();
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);
    onUserMessageSent?.(userMessage.content);
    setInput('');
    setActiveDraftLabel(null);
    setIsLoading(true);
    setStreamingContent('');

    try {
      const streamResult = await sendOracleMessage(
        {
          question: input,
          birthChart,
          progressedChart,
          userId,
          plainEnglish,
          mbtiType:
            dualPersonality?.final || dualPersonality?.core || mbtiType,
          tonePreset,
          oracleMode,
          includeLikelihood,
          ancientLayer,
          atmospherePacket: atmospherePacket || undefined,
          dualPersonality: dualPersonality || undefined,
        },
        (fullContent) => {
          setStreamingContent(fullContent);
        }
      );

      const polishedContent = polishOracleOutput(streamResult.content);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: polishedContent,
        timestamp: new Date(),
        tactics: streamResult.tactics,
        forecast: streamResult.forecast,
        level: streamResult.level,
        progression: streamResult.progression,
        mirrorInsight: streamResult.mirrorInsight,
      };

      if (streamResult.progression) {
        setProgression({
          arcPath: streamResult.progression.arcPath,
          arcLevel: streamResult.progression.arcLevel,
          arcXp: streamResult.progression.arcXp,
          interactionCount: streamResult.progression.interactionCount,
        });
      }

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent('');
      
      // Auto-TTS only in full chrome; drawer stays quiet so reading wins
      if (!minimal && polishedContent.trim()) {
        setTimeout(() => {
          readMessageAloud(assistantMessage.id, polishedContent);
        }, 500);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorText = error instanceof Error ? error.message : 'Unknown error';
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Merlin hit a disruption: ${errorText}. Check your API key and try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingContent('');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearHistory = async () => {
    if (!confirm('Clear all chat history and audio cache?')) return;
    try {
      await fetch(`/api/oracle-chat?userId=${userId}`, { method: 'DELETE' });
      clearAllAudioCache();
      
      // Stop any playing audio
      if (globalAudioManager) {
        globalAudioManager.stop();
        globalAudioManager.clearCallbacks();
      }
      
      setMessages([]);
      setPlayingMessageId(null);
      setIsSpeaking(false);
      setIsPaused(false);
      console.log('[Chat] Cleared history and audio cache');
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const coreType = dualPersonality?.core;
  const maskType = dualPersonality?.mask;
  const weatherTone = atmospherePacket?.tone?.label;
  const weatherIntensity = atmospherePacket?.intensity;
  const hasMessageExtras = (msg: Message) =>
    Boolean(
      msg.mirrorInsight ||
        (msg.tactics && msg.tactics.length > 0) ||
        msg.forecast ||
        msg.level
    );

  return (
    <div
      className={`flex h-full flex-col overflow-hidden bg-slate-950 ${
        minimal ? '' : 'rounded-r-lg border-l border-sky-500/25 shadow-2xl backdrop-blur-md'
      }`}
    >
      {/* Header — full chrome only; drawer owns its own slim bar */}
      {!minimal ? (
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-sky-500/20 bg-slate-950/70 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-sky-100">Oracle Chat</h3>
            <p className="text-xs text-sky-300/70">Reads your core + today&apos;s life weather</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {coreType ? (
                <span className="rounded-full border border-violet-400/35 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-100">
                  Core {coreType}
                </span>
              ) : mbtiType ? (
                <span className="rounded-full border border-violet-400/35 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-100">
                  Type {mbtiType}
                </span>
              ) : null}
              {maskType && maskType !== coreType ? (
                <span className="rounded-full border border-orange-400/35 bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-100">
                  Mask {maskType}
                </span>
              ) : null}
              {weatherTone ? (
                <span className="rounded-full border border-sky-400/35 bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-100">
                  {weatherTone}
                  {typeof weatherIntensity === 'number' ? ` · ${weatherIntensity}%` : ''}
                </span>
              ) : null}
            </div>
            {identityPack ? (
              <div className="mt-2 max-w-sm">
                <IdentityPatternCard
                  archetypeName={identityPack.archetypeName}
                  patternSignature={identityPack.patternSignature}
                  coreContradiction={identityPack.coreContradiction}
                  compact
                />
              </div>
            ) : null}
            {progression ? (
              <div className="mt-2 max-w-sm">
                <ProgressPathCard
                  arcPath={progression.arcPath}
                  arcLevel={progression.arcLevel}
                  arcXp={progression.arcXp}
                  interactionCount={progression.interactionCount}
                  compact
                />
              </div>
            ) : null}
            {ttsError ? <p className="mt-1 text-xs text-orange-400">⚠️ {ttsError}</p> : null}
          </div>
          <div className="flex shrink-0 gap-1">
            {playingMessageId ? (
              <div className="mr-1 flex items-center gap-1 rounded border border-purple-500/30 bg-purple-500/10 px-1.5 py-1">
                <button
                  type="button"
                  onClick={toggleCurrentSpeech}
                  className="rounded p-1 text-purple-300 transition hover:bg-purple-500/20 hover:text-purple-100"
                  title={isSpeaking ? 'Pause speech' : 'Resume speech'}
                >
                  {isSpeaking ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <button
                  type="button"
                  onClick={stopCurrentSpeech}
                  className="rounded p-1 text-rose-300 transition hover:bg-rose-500/20 hover:text-rose-100"
                  title="Stop speech"
                >
                  <Square size={12} />
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={toggleClarityMode}
              title={
                plainEnglish
                  ? 'Clarity Mode ON — plain English'
                  : 'Oracle Full Mode — click for plain English'
              }
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${
                plainEnglish
                  ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                  : 'border border-purple-500/30 bg-purple-500/20 text-purple-300'
              }`}
            >
              {plainEnglish ? <Eye size={11} /> : <Sparkles size={11} />}
              <span>{plainEnglish ? 'Clear' : 'Full'}</span>
            </button>
            <Link
              href="/profile"
              title={`Tone: ${tonePreset}`}
              className="flex items-center gap-1 rounded border border-cyan-500/30 bg-cyan-500/20 px-2 py-1 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/30"
            >
              <span className="uppercase">{tonePreset}</span>
            </Link>
            <button
              type="button"
              onClick={clearHistory}
              className="rounded p-1.5 text-slate-400 transition hover:bg-slate-700/50 hover:text-slate-300"
              title="Clear history"
            >
              <Trash2 size={14} />
            </button>
            {showExpandToggle ? (
              <button
                type="button"
                onClick={handleToggleExpand}
                className="rounded p-1.5 text-slate-400 transition hover:bg-slate-700/50 hover:text-slate-300"
                title={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        /* Minimal toolbar — one row, secondary to messages */
        <div className="flex shrink-0 items-center justify-end gap-1 border-b border-slate-800/80 px-2 py-1.5">
          {playingMessageId ? (
            <div className="mr-auto flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5">
              <button
                type="button"
                onClick={toggleCurrentSpeech}
                className="rounded p-1 text-sky-300 hover:bg-slate-800"
                title={isSpeaking ? 'Pause' : 'Resume'}
              >
                {isSpeaking ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <button
                type="button"
                onClick={stopCurrentSpeech}
                className="rounded p-1 text-rose-300 hover:bg-slate-800"
                title="Stop"
              >
                <Square size={12} />
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={toggleClarityMode}
            className={`rounded px-2 py-1 text-[11px] font-medium ${
              plainEnglish ? 'text-emerald-300/90' : 'text-violet-300/90'
            } hover:bg-slate-800`}
            title="Toggle plain English"
          >
            {plainEnglish ? 'Clear' : 'Full'}
          </button>
          <button
            type="button"
            onClick={clearHistory}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
            title="Clear history"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* Messages — primary surface */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={`min-h-0 flex-1 space-y-3 overflow-y-auto ${minimal ? 'px-3 py-3' : 'p-4'}`}
      >
        {!minimal ? (
          <motion.div
            key="voice-avatar"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="flex justify-center overflow-hidden border-b border-purple-500/20 pb-3"
          >
            <div className="w-full max-w-[220px]">
              <VoiceAvatar
                compact
                isPlaying={isSpeaking}
                isThinking={isLoading || !!streamingContent}
                audioRef={globalAudioRef}
                messageText={
                  streamingContent ||
                  messages.find((m: Message) => m.id === playingMessageId)?.content ||
                  (messages.length === 0 ? 'Merlin is ready for your question.' : '')
                }
                portraitImage={MERLIN_PORTRAIT_IMAGE}
              />
            </div>
          </motion.div>
        ) : null}

        {messages.length === 0 && !streamingContent ? (
          <div className="flex h-full min-h-[12rem] items-center justify-center text-center">
            <div className="max-w-[16rem] text-sm text-slate-400">
              <p className="font-medium text-slate-300">Ask Merlin anything</p>
              <p className="mt-1.5 text-xs text-slate-500">
                Risk windows, storms, chart questions — keep it practical.
              </p>
            </div>
          </div>
        ) : null}

        {messages.map((msg: Message) => {
          const extrasOpen = expandedMessageId === msg.id;
          const showExtras = hasMessageExtras(msg);
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed ${
                  minimal ? 'max-w-[96%]' : 'max-w-[92%] sm:max-w-sm'
                } ${
                  msg.role === 'user'
                    ? 'border border-violet-500/35 bg-violet-600/35 text-violet-50'
                    : 'border border-slate-700/80 bg-slate-900 text-slate-100 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-slate-100">
                    {msg.content}
                  </p>
                  {msg.role === 'assistant' ? (
                    <button
                      type="button"
                      onClick={() => readMessageAloud(msg.id, msg.content)}
                      disabled={isTTSLoading && playingMessageId === msg.id}
                      className={`mt-0.5 shrink-0 rounded p-1 transition hover:bg-slate-800 ${
                        playingMessageId === msg.id ? 'text-sky-300' : 'text-slate-500'
                      } disabled:opacity-50`}
                      title="Read aloud"
                    >
                      {isTTSLoading && playingMessageId === msg.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : playingMessageId === msg.id && isSpeaking ? (
                        <Pause size={14} />
                      ) : (
                        <Volume2 size={14} />
                      )}
                    </button>
                  ) : null}
                </div>

                {msg.role === 'assistant' && showExtras ? (
                  <div className="mt-2 border-t border-slate-700/60 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMessageId(extrasOpen ? null : msg.id)
                      }
                      className="text-[11px] font-medium text-slate-400 hover:text-slate-200"
                    >
                      {extrasOpen ? 'Hide extras' : 'Show extras (moves · timing)'}
                    </button>
                    {extrasOpen ? (
                      <div className="mt-2 space-y-2 text-xs text-slate-300">
                        {msg.mirrorInsight ? (
                          <div className="rounded-md border border-rose-400/20 bg-rose-950/30 px-2 py-1.5">
                            <p className="mb-0.5 text-[10px] uppercase tracking-wide text-rose-300/80">
                              Pattern note
                            </p>
                            <p className="leading-relaxed">{msg.mirrorInsight.message}</p>
                          </div>
                        ) : null}
                        {msg.tactics && msg.tactics.length > 0 ? (
                          <ul className="space-y-1">
                            {msg.tactics.map((tactic: string, i: number) => (
                              <li key={i} className="flex gap-1.5">
                                <span className="text-sky-400">→</span>
                                <span className="flex-1">{tactic}</span>
                                <button
                                  type="button"
                                  onClick={() => saveTacticAsQuest(tactic)}
                                  className="text-amber-400/80 hover:text-amber-300"
                                  title="Save to Quest Log"
                                >
                                  📜
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {msg.forecast ? (
                          <p>
                            <span className="text-slate-500">{msg.forecast.timeframe}: </span>
                            {msg.forecast.themes.join(' · ')}
                          </p>
                        ) : null}
                        {msg.level ? (
                          <p className="text-slate-400">
                            {msg.level.current}
                            {msg.level.challenge ? ` — ${msg.level.challenge}` : ''}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </motion.div>
          );
        })}

        {streamingContent ? (
          <div className="flex justify-start">
            <div
              className={`rounded-2xl border border-slate-700/80 bg-slate-900 px-3.5 py-2.5 text-[15px] text-slate-100 ${
                minimal ? 'max-w-[96%]' : 'max-w-[92%] sm:max-w-sm'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">
                {streamingContent}
                <span className="animate-pulse text-sky-300">▌</span>
              </p>
            </div>
          </div>
        ) : null}

        {isLoading && !streamingContent ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900 px-3 py-2 text-xs text-slate-400">
              <Loader2 size={14} className="animate-spin text-sky-400" />
              Merlin is reading…
            </div>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 space-y-2 border-t border-slate-800 bg-slate-950 px-3 py-3">
        {activeDraftLabel ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-sky-500/25 bg-sky-950/40 px-2.5 py-1.5 text-xs text-sky-100">
            <span className="truncate">Context: {activeDraftLabel}</span>
            <button
              type="button"
              onClick={() => setActiveDraftLabel(null)}
              className="text-sky-300/80 hover:text-sky-100"
              title="Dismiss"
            >
              <X size={12} />
            </button>
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder="Ask Merlin…"
            disabled={isLoading}
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="shrink-0 rounded-xl bg-sky-600 px-3 text-white hover:bg-sky-500"
            size="sm"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </form>
      </div>
    </div>
  );
}
