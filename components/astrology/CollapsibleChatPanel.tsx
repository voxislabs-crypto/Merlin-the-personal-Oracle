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
  atmospherePacket?: AtmospherePacket | null;
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
  atmospherePacket,
}: CollapsibleChatPanelProps) {
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
          mbtiType,
          tonePreset,
          oracleMode,
          includeLikelihood,
          ancientLayer,
          atmospherePacket: atmospherePacket || undefined,
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
      
      // Auto-read the message aloud after a brief delay
      setTimeout(() => {
        if (polishedContent.trim()) {
          readMessageAloud(assistantMessage.id, polishedContent);
        }
      }, 500);
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

  return (
    <div className="h-full flex flex-col bg-slate-900/80 border-l border-purple-500/20 rounded-r-lg overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-purple-500/20 bg-slate-900/50 flex-shrink-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-purple-200">🔮 Oracle Chat</h3>
          <p className="text-xs text-purple-400">Ask about your chart</p>
          {identityPack && (
            <div className="mt-2 max-w-sm">
              <IdentityPatternCard
                archetypeName={identityPack.archetypeName}
                patternSignature={identityPack.patternSignature}
                coreContradiction={identityPack.coreContradiction}
                compact
              />
            </div>
          )}
          {progression && (
            <div className="mt-2 max-w-sm">
              <ProgressPathCard
                arcPath={progression.arcPath}
                arcLevel={progression.arcLevel}
                arcXp={progression.arcXp}
                interactionCount={progression.interactionCount}
                compact
              />
            </div>
          )}
          {ttsError && (
            <p className="text-xs text-orange-400 mt-1">⚠️ {ttsError}</p>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {playingMessageId && (
            <div className="flex items-center gap-1 mr-1 px-1.5 py-1 rounded border border-purple-500/30 bg-purple-500/10">
              <button
                onClick={toggleCurrentSpeech}
                className="p-1 text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 rounded transition"
                title={isSpeaking ? 'Pause speech' : 'Resume speech'}
              >
                {isSpeaking ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <button
                onClick={stopCurrentSpeech}
                className="p-1 text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 rounded transition"
                title="Stop speech"
              >
                <Square size={12} />
              </button>
            </div>
          )}
          {/* Clarity Mode toggle */}
          <button
            onClick={toggleClarityMode}
            title={plainEnglish ? 'Clarity Mode ON — plain English (click for Oracle Full)' : 'Oracle Full Mode — click for plain English'}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${
              plainEnglish
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
            }`}
          >
            {plainEnglish ? <Eye size={11} /> : <Sparkles size={11} />}
            <span>{plainEnglish ? 'Clear' : 'Full'}</span>
          </button>
          <Link
            href="/profile"
            title={`Oracle tone is managed in Preferences. Current tone: ${tonePreset}`}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 hover:bg-cyan-500/30"
          >
            <span>Tone</span>
            <span className="uppercase">{tonePreset}</span>
          </Link>
          <button
            onClick={clearHistory}
            className="p-1.5 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded transition"
            title="Clear history"
          >
            <Trash2 size={14} />
          </button>
          {showExpandToggle ? (
            <button
              onClick={handleToggleExpand}
              className="p-1.5 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded transition"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          ) : null}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-3 p-4"
      >
        <motion.div
          key="voice-avatar"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="flex justify-center pb-3 border-b border-purple-500/20 overflow-hidden"
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

        {messages.length === 0 && !streamingContent && (
          <div className="h-full flex items-center justify-center text-center">
            <div className="text-slate-500 text-sm">
              <p>Ask Merlin about your chart</p>
              <p className="text-xs text-slate-600 mt-2">or click a pattern, placement, or signal to prefill the prompt</p>
            </div>
          </div>
        )}

        {messages.map((msg: Message) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-purple-600/40 text-purple-100 border border-purple-500/30'
                  : 'bg-slate-800/50 text-slate-100 border border-purple-500/20'
              }`}
            >
              {/* Main message */}
              <div className="flex gap-2 items-start justify-between">
                <p className="leading-relaxed flex-1 break-words">{msg.content}</p>

                {/* TTS Button - only for assistant messages */}
                {msg.role === 'assistant' && (
                  <div className="flex flex-col gap-1 flex-shrink-0 ml-1">
                    <button
                      onClick={() => readMessageAloud(msg.id, msg.content)}
                      disabled={isTTSLoading && playingMessageId === msg.id}
                      className={`p-1 rounded hover:bg-purple-500/20 transition ${
                        playingMessageId === msg.id
                          ? 'text-purple-400'
                          : 'text-slate-400 hover:text-purple-300'
                      } disabled:opacity-50`}
                      title={
                        playingMessageId === msg.id
                          ? isSpeaking
                            ? 'Pause'
                            : isPaused
                            ? 'Resume'
                            : 'Playing'
                          : 'Read aloud'
                      }
                    >
                      {isTTSLoading && playingMessageId === msg.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : playingMessageId === msg.id ? (
                        isSpeaking ? (
                          <Pause size={12} className="animate-pulse" />
                        ) : (
                          <Play size={12} />
                        )
                      ) : (
                        <Volume2 size={12} />
                      )}
                    </button>
                    {/* Cache indicator */}
                    {getCachedAudio(msg.content, 'oracle') && (
                      <div className="text-xs text-green-400 px-1" title="Audio cached - no API credit used">
                        💾
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tactics */}
              {msg.mirrorInsight && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 pt-2 border-t border-rose-400/20"
                >
                  <div className="rounded-md border border-rose-400/25 bg-rose-950/20 px-2 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-rose-300/85 mb-1">
                      Why Merlin pushed {msg.mirrorInsight.stanceMode === 'direct' ? '(direct)' : '(soft)'}
                    </p>
                    <p className="text-xs text-rose-100/90 leading-relaxed">{msg.mirrorInsight.message}</p>
                  </div>
                </motion.div>
              )}

              {/* Tactics */}
              {msg.tactics && msg.tactics.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 pt-2 border-t border-purple-500/20"
                >
                  <p className="text-xs font-semibold text-purple-300 mb-1">⚡ Moves:</p>
                  <ul className="space-y-1 text-xs text-purple-200">
                    {msg.tactics.map((tactic: string, i: number) => (
                      <li key={i} className="flex items-start gap-1 group">
                        <span className="text-purple-400 mt-0.5">→</span>
                        <span className="flex-1">{tactic}</span>
                        <button
                          onClick={() => saveTacticAsQuest(tactic)}
                          title="Save to Quest Log"
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-yellow-500 hover:text-yellow-300 transition-opacity text-xs px-1 py-0.5 rounded hover:bg-yellow-500/10"
                        >
                          📜
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Forecast */}
              {msg.forecast && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 pt-2 border-t border-purple-500/20"
                >
                  <p className="text-xs font-semibold text-purple-300 mb-1">📅 {msg.forecast.timeframe}:</p>
                  <div className="flex gap-1 flex-wrap">
                    {msg.forecast.themes.map((theme: string, i: number) => (
                      <span key={i} className="text-xs bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded">
                        {theme}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Level Info */}
              {msg.level && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 pt-2 border-t border-purple-500/20 cursor-pointer"
                  onClick={() =>
                    setExpandedMessageId(expandedMessageId === msg.id ? null : msg.id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-purple-300">🎮 {msg.level.current}</p>
                  </div>
                  {expandedMessageId === msg.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-purple-300 mt-1 space-y-0.5"
                    >
                      <p>
                        <span className="text-purple-400">Challenge:</span> {msg.level.challenge}
                      </p>
                      <p>
                        <span className="text-green-400">Reward:</span> {msg.level.reward}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Timestamp */}
              <p className="text-xs text-slate-500 mt-1 opacity-50">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Streaming content */}
        {streamingContent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-xs rounded-lg px-3 py-2 bg-slate-800/50 text-slate-100 border border-purple-500/20">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {streamingContent}
                <span className="animate-pulse">▌</span>
              </p>
            </div>
          </motion.div>
        )}

        {/* Loading state */}
        {isLoading && !streamingContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-slate-800/50 px-3 py-2 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2 text-purple-300">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Merlin contemplates...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-purple-500/20 bg-slate-900/50 backdrop-blur p-3 space-y-2 flex-shrink-0">
        {activeDraftLabel && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
            <span className="truncate">Context: {activeDraftLabel}</span>
            <button
              type="button"
              onClick={() => setActiveDraftLabel(null)}
              className="text-cyan-200/80 hover:text-cyan-100 transition"
              title="Dismiss selected context"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder="Ask..."
            disabled={isLoading}
            className="flex-1 bg-slate-800/50 border border-purple-500/30 rounded px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/60 disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </Button>
        </form>
      </div>
    </div>
  );
}
