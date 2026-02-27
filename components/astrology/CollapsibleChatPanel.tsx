'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, ChevronLeft, ChevronRight, X, Volume2, VolumeX, Trash2, Play, Pause, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceAvatar } from '@/components/astrology/VoiceAvatar';
import { getCachedAudio, cacheAudio, generateCacheKey, clearAllAudioCache } from '@/lib/audio-cache';
import { globalAudioManager } from '@/lib/global-audio-manager';
import type { BirthChartData } from '@/types/astrology';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tactics?: string[];
  forecast?: { timeframe: string; themes: string[] };
  level?: { current: string; challenge: string; reward: string };
}

interface CollapsibleChatPanelProps {
  birthChart?: BirthChartData;
  progressedChart?: any;
  userId?: string;
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
  mbtiType?: string; // MBTI archetype for Storm-Radar cross-reference
}

export function CollapsibleChatPanel({
  birthChart,
  progressedChart,
  userId = 'anonymous',
  isExpanded = true,
  onToggleExpand,
  mbtiType,
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
  const [plainEnglish, setPlainEnglish] = useState(true); // Clarity Mode - no astro jargon
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Create a ref to the global audio element for VoiceAvatar visualization
  const globalAudioRef = useRef<HTMLAudioElement | null>(
    typeof window !== 'undefined' && globalAudioManager ? globalAudioManager.getAudioElement() : null
  );

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
          playWithWebSpeechAPI(text, messageId);
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
            playWithWebSpeechAPI(text, messageId);
          }
        });

        try {
          await globalAudioManager.play(audioUrl, messageId);
          console.log('[TTS] Global audio manager playback started');
        } catch (playError) {
          console.error('[TTS] Global audio manager play failed:', playError);
          setTtsError('Playback failed. Falling back to Web Speech API.');
          setTtsFallback(true);
          playWithWebSpeechAPI(text, messageId);
        }
        return;
      }

      // Fallback to Web Speech API (if ElevenLabs failed or audio playback failed)
      playWithWebSpeechAPI(text, messageId);
    } catch (error) {
      console.error('[TTS] Fatal error:', error);
      setTtsError(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      setIsSpeaking(false);
      setIsPaused(false);
      setPlayingMessageId(null);
      setIsTTSLoading(false);
    }
  };

  const playWithWebSpeechAPI = async (text: string, messageId: string) => {
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

  // Load Clarity Mode setting from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('merlin_clarity_mode');
    if (saved !== null) setPlainEnglish(saved !== 'false');
  }, []);

  const toggleClarityMode = () => {
    const next = !plainEnglish;
    setPlainEnglish(next);
    localStorage.setItem('merlin_clarity_mode', String(next));
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

    try {
      const response = await fetch('/api/oracle-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          birthChart,
          progressedChart,
          userId,
          plainEnglish,
          mbtiType,
        }),
      });

      if (!response.ok) throw new Error('Stream failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let tactics: string[] = [];
      let forecast: any = null;
      let level: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines[lines.length - 1];

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          try {
            const parsed = JSON.parse(line);

            if (parsed.type === 'chunk') {
              fullContent += parsed.content;
              setStreamingContent(fullContent);
            } else if (parsed.type === 'tactics') {
              tactics = parsed.data || [];
            } else if (parsed.type === 'forecast') {
              forecast = parsed.data;
            } else if (parsed.type === 'level') {
              level = parsed.data;
            } else if (parsed.type === 'done') {
              // Message complete
            } else if (parsed.type === 'error') {
              console.error('Oracle error:', parsed.error);
              setStreamingContent((prev) => prev + `\n\n[Error: ${parsed.error}]`);
            }
          } catch (e) {
            // Skip parse errors
          }
        }
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fullContent,
        timestamp: new Date(),
        tactics: tactics.length > 0 ? tactics : undefined,
        forecast: forecast || undefined,
        level: level || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent('');
      
      // Auto-read the message aloud after a brief delay
      setTimeout(() => {
        if (fullContent.trim()) {
          readMessageAloud(assistantMessage.id, fullContent);
        }
      }, 500);
    } catch (error) {
      console.error('Chat error:', error);
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
          {ttsError && (
            <p className="text-xs text-orange-400 mt-1">⚠️ {ttsError}</p>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
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
          <button
            onClick={clearHistory}
            className="p-1.5 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded transition"
            title="Clear history"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={handleToggleExpand}
            className="p-1.5 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded transition"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-3 p-4"
      >
        {/* Avatar Display - Shows when speaking/TTS playing */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              key="voice-avatar"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center pb-4 border-b border-purple-500/20"
            >
              <div className="w-48 h-56">
                <VoiceAvatar
                  isPlaying={isSpeaking}
                  audioRef={globalAudioRef}
                  messageText={messages.find((m: Message) => m.id === playingMessageId)?.content}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.length === 0 && !streamingContent && (
          <div className="h-full flex items-center justify-center text-center">
            <div className="text-slate-500 text-sm">
              <p>Ask Merlin about your chart</p>
              <p className="text-xs text-slate-600 mt-2">or your cosmic path ahead</p>
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
              {msg.tactics && msg.tactics.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 pt-2 border-t border-purple-500/20"
                >
                  <p className="text-xs font-semibold text-purple-300 mb-1">⚡ Moves:</p>
                  <ul className="space-y-0.5 text-xs text-purple-200">
                    {msg.tactics.map((tactic: string, i: number) => (
                      <li key={i} className="flex gap-1">
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
