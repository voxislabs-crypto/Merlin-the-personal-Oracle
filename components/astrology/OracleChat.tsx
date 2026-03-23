'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, ChevronDown, X, Volume2, VolumeX, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceAvatar } from '@/components/astrology/VoiceAvatar';
import { IdentityPatternCard } from '@/components/astrology/IdentityPatternCard';
import { ProgressPathCard } from '@/components/astrology/ProgressPathCard';
import type { BirthChartData } from '@/types/astrology';
import { polishOracleOutput, type OracleTonePreset } from '@/lib/oracle-output';

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

interface OracleChatProps {
  birthChart?: BirthChartData;
  progressedChart?: any;
  userId?: string;
  onClose?: () => void;
}

export function OracleChat({
  birthChart,
  progressedChart,
  userId = 'anonymous',
  onClose,
}: OracleChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [plainEnglish, setPlainEnglish] = useState(true); // Clarity Mode
  const [tonePreset, setTonePreset] = useState<OracleTonePreset>('warm');
  const [oracleMode, setOracleMode] = useState<'auto' | 'casual' | 'detailed'>('auto'); // Adaptive mode
  const [includeLikelihood, setIncludeLikelihood] = useState(true); // Show percentages
  const [identityPack, setIdentityPack] = useState<{ archetypeName?: string; patternSignature?: string; coreContradiction?: string } | null>(null);
  const [progression, setProgression] = useState<{ arcPath?: string; arcLevel?: number; arcXp?: number; interactionCount?: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check if user is near the bottom of the chat
  const checkIfNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    
    const threshold = 150; // pixels from bottom
    const position = container.scrollHeight - container.scrollTop - container.clientHeight;
    return position < threshold;
  }, []);

  // Handle scroll events to detect user position
  const handleScroll = useCallback(() => {
    const nearBottom = checkIfNearBottom();
    setIsNearBottom(nearBottom);
    setShowScrollButton(!nearBottom);
  }, [checkIfNearBottom]);

  // Auto-scroll to latest message only if user is near bottom
  const scrollToBottom = useCallback((force = false) => {
    if (force || isNearBottom) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isNearBottom]);

  // Read message aloud using ElevenLabs TTS
  const readMessageAloud = useCallback(async (messageId: string, text: string) => {
    if (isSpeaking || playingMessageId) {
      // Stop playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
      setPlayingMessageId(null);
      return;
    }

    setPlayingMessageId(messageId);
    setIsSpeaking(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: 'sage', // Use oracle's voice archetype
          provider: 'elevenlabs',
        }),
      });

      if (!response.ok) throw new Error('TTS request failed');

      const result = await response.json();

      if (result.success && result.data.audio) {
        const audio = new Audio(result.data.audio);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          setPlayingMessageId(null);
        };

        audio.onerror = () => {
          console.error('Audio playback error');
          setIsSpeaking(false);
          setPlayingMessageId(null);
        };

        await audio.play();
      } else {
        throw new Error('No audio data returned');
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      setPlayingMessageId(null);
    }
  }, [isSpeaking, playingMessageId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Attach scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Fetch conversation history on mount
  useEffect(() => {
    const saved = localStorage.getItem('merlin_clarity_mode');
    if (saved !== null) setPlainEnglish(saved !== 'false');
    const savedTone = localStorage.getItem('merlin_oracle_tone') as OracleTonePreset | null;
    if (savedTone && ['warm', 'direct', 'mystic', 'strategic'].includes(savedTone)) {
      setTonePreset(savedTone);
    }
    // Load adaptive mode settings
    const savedMode = localStorage.getItem('merlin_oracle_mode') as 'auto' | 'casual' | 'detailed' | null;
    if (savedMode && ['auto', 'casual', 'detailed'].includes(savedMode)) {
      setOracleMode(savedMode);
    }
    const savedLikelihood = localStorage.getItem('merlin_include_likelihood');
    if (savedLikelihood !== null) setIncludeLikelihood(savedLikelihood !== 'false');
  }, []);

  useEffect(() => {
    const loadServerTone = async () => {
      if (!userId || userId === 'anonymous') return;
      try {
        const response = await fetch(`/api/user-context?userId=${encodeURIComponent(userId)}`);
        if (!response.ok) return;
        const result = await response.json();
        const tone = result?.data?.oracleTonePreset as OracleTonePreset | undefined;
        if (tone && ['warm', 'direct', 'mystic', 'strategic'].includes(tone)) {
          setTonePreset(tone);
          localStorage.setItem('merlin_oracle_tone', tone);
        }
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
    const next = !plainEnglish;
    setPlainEnglish(next);
    localStorage.setItem('merlin_clarity_mode', String(next));
  };

  const cycleTonePreset = () => {
    const order: OracleTonePreset[] = ['warm', 'direct', 'strategic', 'mystic'];
    const currentIdx = order.indexOf(tonePreset);
    const nextTone = order[(currentIdx + 1) % order.length];
    setTonePreset(nextTone);
    localStorage.setItem('merlin_oracle_tone', nextTone);

    if (userId && userId !== 'anonymous') {
      fetch('/api/user-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, oracleTonePreset: nextTone }),
      }).catch(() => {
        // Best-effort persistence only; UI should remain responsive.
      });
    }
  };

  // Fetch conversation history on mount
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    setIsNearBottom(true); // Force scroll on new user message
    scrollToBottom(true);

    try {
      const inferredMbtiType =
        (birthChart as any)?.personalitySnapshot?.finalType ||
        (birthChart as any)?.mbti?.type ||
        undefined;

      const response = await fetch('/api/oracle-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          birthChart,
          progressedChart,
          userId,
          plainEnglish,
          mbtiType: inferredMbtiType,
          tonePreset,
          oracleMode,
          includeLikelihood,
        }),
      });

      if (!response.ok) throw new Error('Stream failed');

      // Check if this is casual mode (non-streaming) response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        // Non-streaming JSON response (casual mode)
        const data = await response.json();
        
        if (data.success && data.mode === 'casual') {
          const polishedContent = data.data.response;
          
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: polishedContent,
            timestamp: new Date(),
          };

          setMessages((prev: Message[]) => [...prev, assistantMessage]);
          setStreamingContent('');
          setIsLoading(false);
          inputRef.current?.focus();
          return;
        }
      }

      // Streaming response (structured/astro mode)
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let tactics: string[] = [];
      let forecast: any = null;
      let level: any = null;
      let progressionData: any = null;
      let mirrorInsightData: any = null;
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(line);

              if (parsed.type === 'chunk' && parsed.content) {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              } else if (parsed.type === 'tactics' && parsed.data) {
                tactics = parsed.data;
              } else if (parsed.type === 'forecast' && parsed.data) {
                forecast = parsed.data;
              } else if (parsed.type === 'level' && parsed.data) {
                level = parsed.data;
              } else if (parsed.type === 'progression' && parsed.data) {
                progressionData = parsed.data;
              } else if (parsed.type === 'mirrorInsight' && parsed.data) {
                mirrorInsightData = parsed.data;
              } else if (parsed.type === 'error') {
                console.error('Oracle error:', parsed.error);
                streamError = parsed.error || 'Oracle stream failed';
              }
            } catch (e) {
              // Skip parse errors
            }
          }
        }
      }

      const finalLine = buffer.trim();
      if (finalLine.startsWith('{')) {
        try {
          const parsed = JSON.parse(finalLine);
          if (parsed.type === 'chunk' && parsed.content) {
            fullContent += parsed.content;
          } else if (parsed.type === 'tactics' && parsed.data) {
            tactics = parsed.data;
          } else if (parsed.type === 'forecast' && parsed.data) {
            forecast = parsed.data;
          } else if (parsed.type === 'level' && parsed.data) {
            level = parsed.data;
          } else if (parsed.type === 'progression' && parsed.data) {
            progressionData = parsed.data;
          } else if (parsed.type === 'mirrorInsight' && parsed.data) {
            mirrorInsightData = parsed.data;
          } else if (parsed.type === 'error') {
            streamError = parsed.error || 'Oracle stream failed';
          }
        } catch {
          // Ignore trailing parse errors
        }
      }

      if (!fullContent.trim() && streamError) {
        throw new Error(streamError);
      }

      if (!fullContent.trim()) {
        throw new Error('Empty response from Oracle');
      }

      const polishedContent = polishOracleOutput(fullContent);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: polishedContent,
        timestamp: new Date(),
        tactics: tactics.length > 0 ? tactics : undefined,
        forecast: forecast || undefined,
        level: level || undefined,
        progression: progressionData || undefined,
        mirrorInsight: mirrorInsightData || undefined,
      };

      if (progressionData) {
        setProgression({
          arcPath: progressionData.arcPath,
          arcLevel: progressionData.arcLevel,
          arcXp: progressionData.arcXp,
          interactionCount: progressionData.interactionCount,
        });
      }

      setMessages((prev: Message[]) => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (error) {
      console.error('Chat error:', error);
      const errorText = error instanceof Error ? error.message : 'Unknown error';
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Merlin hit a disruption: ${errorText}. Check your API key and try again.`,
        timestamp: new Date(),
      };
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearHistory = async () => {
    if (!confirm('Clear all messages? This cannot be undone.')) return;

    try {
      await fetch(`/api/oracle-chat?userId=${userId}`, { method: 'DELETE' });
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-900">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-purple-200">🔮 Oracle Chat</h2>
          <p className="text-xs text-purple-400">Ask Merlin anything about your chart</p>
          {identityPack && (
            <div className="mt-2 max-w-md">
              <IdentityPatternCard
                archetypeName={identityPack.archetypeName}
                patternSignature={identityPack.patternSignature}
                coreContradiction={identityPack.coreContradiction}
                compact
              />
            </div>
          )}
          {progression && (
            <div className="mt-2 max-w-md">
              <ProgressPathCard
                arcPath={progression.arcPath}
                arcLevel={progression.arcLevel}
                arcXp={progression.arcXp}
                interactionCount={progression.interactionCount}
                compact
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Clarity Mode toggle */}
          <button
            onClick={toggleClarityMode}
            title={plainEnglish ? 'Clarity Mode ON — plain English (click for Oracle Full)' : 'Oracle Full Mode ON — click for plain English'}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${
              plainEnglish
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
            }`}
          >
            {plainEnglish ? <Eye size={12} /> : <Sparkles size={12} />}
            <span>{plainEnglish ? 'Clarity' : 'Oracle Full'}</span>
          </button>

          {/* Oracle Mode toggle */}
          <button
            onClick={() => {
              const modes: ('auto' | 'casual' | 'detailed')[] = ['auto', 'casual', 'detailed'];
              const currentIdx = modes.indexOf(oracleMode);
              const nextMode = modes[(currentIdx + 1) % modes.length];
              setOracleMode(nextMode);
              localStorage.setItem('merlin_oracle_mode', nextMode);
            }}
            title={`Oracle Mode: ${oracleMode === 'auto' ? 'Auto-detect' : oracleMode === 'casual' ? 'Casual — raspy & raw' : 'Detailed — structured'}`}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${
              oracleMode === 'casual'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                : oracleMode === 'detailed'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
            }`}
          >
            <span>{oracleMode === 'auto' ? '⚙️ Auto' : oracleMode === 'casual' ? '💬 Casual' : '📊 Detailed'}</span>
          </button>

          {/* Likelihood toggle */}
          {oracleMode !== 'casual' && (
            <button
              onClick={() => {
                const next = !includeLikelihood;
                setIncludeLikelihood(next);
                localStorage.setItem('merlin_include_likelihood', String(next));
              }}
              title={includeLikelihood ? 'Including percentages' : 'Percentages hidden'}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${
                includeLikelihood
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30'
                  : 'bg-slate-600/20 text-slate-300 border border-slate-600/30 hover:bg-slate-600/30'
              }`}
            >
              <span>{includeLikelihood ? '%' : '○'}</span>
            </button>
          )}

          <button
            onClick={cycleTonePreset}
            title={`Tone preset: ${tonePreset}`}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 hover:bg-cyan-500/30"
          >
            <span>Tone</span>
            <span className="uppercase">{tonePreset}</span>
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Avatar Display Area - Always visible */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: 1, 
          height: 'auto',
        }}
        className="border-b border-purple-500/20 bg-gradient-to-b from-purple-900/20 to-transparent p-4 flex justify-center"
      >
        <VoiceAvatar
          isPlaying={isSpeaking || isLoading || !!streamingContent}
          audioRef={audioRef}
          messageText={
            streamingContent || 
            messages.find((m: Message) => m.id === playingMessageId)?.content || 
            (isLoading ? 'Contemplating your question...' : '')
          }
        />
      </motion.div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-4 p-4 relative">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <p className="text-purple-300 text-sm">
                Ask me anything about your birth chart, transits, or path forward.
              </p>
              <p className="text-purple-500 text-xs mt-2">
                I remember our conversation, so context matters.
              </p>
            </motion.div>
          )}

          {messages.map((msg: Message, idx: number) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-purple-600/40 text-purple-100 border border-purple-500/30'
                    : 'bg-slate-800/50 text-slate-100 border border-purple-500/20'
                }`}
              >
                {/* Main message with TTS button */}
                <div className="flex gap-3 items-start justify-between">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap flex-1">{msg.content}</p>
                  
                  {/* TTS Button - only for assistant messages */}
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => readMessageAloud(msg.id, msg.content)}
                      disabled={isSpeaking && playingMessageId !== msg.id}
                      className={`flex-shrink-0 mt-1 p-1.5 rounded hover:bg-purple-500/20 transition ${
                        playingMessageId === msg.id && isSpeaking
                          ? 'text-purple-400'
                          : 'text-slate-400 hover:text-purple-300'
                      }`}
                      title={playingMessageId === msg.id ? 'Stop' : 'Read aloud'}
                    >
                      {playingMessageId === msg.id && isSpeaking ? (
                        <VolumeX size={16} className="animate-pulse" />
                      ) : (
                        <Volume2 size={16} />
                      )}
                    </button>
                  )}
                </div>

                {/* Tactics */}
                {msg.mirrorInsight && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-rose-400/20"
                  >
                    <div className="rounded-md border border-rose-400/25 bg-rose-950/20 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-rose-300/85 mb-1">
                        Why Merlin pushed {msg.mirrorInsight.stanceMode === 'direct' ? '(direct mode)' : '(soft mode)'}
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
                    className="mt-3 pt-3 border-t border-purple-500/20"
                  >
                    <p className="text-xs font-semibold text-purple-300 mb-2">⚡ Tactical Moves:</p>
                    <ul className="space-y-1 text-xs text-purple-200">
                      {msg.tactics.map((tactic: string, i: number) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-purple-400">→</span>
                          <span>{tactic}</span>
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
                    className="mt-3 pt-3 border-t border-purple-500/20"
                  >
                    <p className="text-xs font-semibold text-purple-300 mb-2">
                      📅 {msg.forecast.timeframe}:
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {msg.forecast.themes.map((theme: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs bg-purple-500/30 text-purple-200 px-2 py-1 rounded"
                        >
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
                    className="mt-3 pt-3 border-t border-purple-500/20 cursor-pointer"
                    onClick={() =>
                      setExpandedMessageId(
                        expandedMessageId === msg.id ? null : msg.id
                      )
                    }
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-purple-300">
                        🎮 {msg.level.current}
                      </p>
                      <ChevronDown
                        size={14}
                        className={`transition ${
                          expandedMessageId === msg.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>

                    <AnimatePresence>
                      {expandedMessageId === msg.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-purple-300 mt-2 space-y-1"
                        >
                          <p>
                            <span className="text-purple-400">Challenge:</span>{' '}
                            {msg.level.challenge}
                          </p>
                          <p>
                            <span className="text-green-400">Reward:</span>{' '}
                            {msg.level.reward}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Timestamp */}
                <p className="text-xs text-slate-500 mt-2 opacity-50">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
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
              <div className="max-w-2xl rounded-lg px-4 py-3 bg-slate-800/50 text-slate-100 border border-purple-500/20">
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
              <div className="bg-slate-800/50 px-4 py-3 rounded-lg border border-purple-500/20">
                <div className="flex items-center gap-2 text-purple-300">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Merlin is contemplating...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => scrollToBottom(true)}
            className="fixed bottom-24 right-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition z-10"
            title="Scroll to bottom"
          >
            <ChevronDown size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t border-purple-500/20 bg-slate-900/50 backdrop-blur p-4 space-y-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder="Ask your question..."
            disabled={isLoading}
            className="flex-1 bg-slate-800/50 border border-purple-500/30 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/60 disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </form>

        <Button
          onClick={clearHistory}
          variant="ghost"
          size="sm"
          className="text-xs text-slate-500 hover:text-slate-400 w-full"
        >
          Clear history
        </Button>
      </div>
    </div>
  );
}
