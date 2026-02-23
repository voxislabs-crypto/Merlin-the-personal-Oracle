'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, ChevronDown, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceAvatar } from '@/components/astrology/VoiceAvatar';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll to latest message
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

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

    try {
      const response = await fetch('/api/oracle-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          birthChart,
          progressedChart,
          userId,
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
              } else if (parsed.type === 'error') {
                console.error('Oracle error:', parsed.error);
              }
            } catch (e) {
              // Skip parse errors
            }
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

      setMessages((prev: Message[]) => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Merlin encountered a disruption. Try again?',
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
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition"
          aria-label="Close chat"
        >
          <X size={20} />
        </button>
      </div>

      {/* Avatar Display Area */}
      {isSpeaking && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-purple-500/20 bg-gradient-to-b from-purple-900/20 to-transparent p-4 flex justify-center"
        >
          <VoiceAvatar
            isPlaying={isSpeaking}
            audioRef={audioRef}
            messageText={messages.find((m: Message) => m.id === playingMessageId)?.content || ''}
          />
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
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
