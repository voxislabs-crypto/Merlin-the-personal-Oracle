/* Life Timeline - Raw transit events as clickable one-liners */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineStrike, LifeTimeline } from '@/lib/astrology/life-timeline-engine';
import * as HoverCard from '@radix-ui/react-hover-card';

interface LifeTimelineViewProps {
  timeline: LifeTimeline | null;
  loading?: boolean;
  userName?: string;
}

export function LifeTimelineView({ timeline, loading = false, userName }: LifeTimelineViewProps) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<Record<string, { text: string; interpreter: string }>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [printMode, setPrintMode] = useState<'full' | 'selected'>('full');

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-slate-900/50 rounded-lg border border-amber-500/20">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-700/50 rounded w-48" />
          <div className="h-4 bg-slate-700/50 rounded w-full" />
          <div className="h-4 bg-slate-700/50 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!timeline || timeline.events.length === 0) {
    return (
      <div className="p-8 bg-slate-900/50 rounded-lg border border-slate-700/20 text-center">
        <p className="text-slate-400">No timeline data available</p>
      </div>
    );
  }

  const handleEventClick = async (event: TimelineStrike) => {
    // Toggle if clicking same event
    if (expandedEventId === event.id) {
      setExpandedEventId(null);
      return;
    }

    setExpandedEventId(event.id);

    // If we already have details, no need to fetch
    if (eventDetails[event.id]) return;

    // Fetch detailed interpretation
    setLoadingDetails(prev => ({ ...prev, [event.id]: true }));

    try {
      const response = await fetch('/api/life-event-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          mode: 'grok',
          userName,
          allEvents: timeline?.events || [] // Pass all events for context
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEventDetails(prev => ({
            ...prev,
            [event.id]: {
              text: result.data.detailed,
              interpreter: result.data.interpreter || 'traditional'
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error loading event detail:', error);
      setEventDetails(prev => ({
        ...prev,
        [event.id]: {
          text: 'Could not load detailed interpretation.',
          interpreter: 'error'
        }
      }));
    } finally {
      setLoadingDetails(prev => ({ ...prev, [event.id]: false }));
    }
  };

  const getIntensityStyle = (intensity: TimelineStrike['intensity']) => {
    switch (intensity) {
      case 'strike':
        return {
          border: 'border-red-500/40',
          bg: 'bg-red-900/10 hover:bg-red-900/20',
          marker: 'bg-red-500',
          text: 'text-red-200'
        };
      case 'burn':
        return {
          border: 'border-orange-500/40',
          bg: 'bg-orange-900/10 hover:bg-orange-900/20',
          marker: 'bg-orange-500',
          text: 'text-orange-200'
        };
      case 'shift':
        return {
          border: 'border-blue-500/40',
          bg: 'bg-blue-900/10 hover:bg-blue-900/20',
          marker: 'bg-blue-500',
          text: 'text-blue-200'
        };
    }
  };

  // Detect if event is a "Storm" (extreme intensity)
  const isStorm = (event: TimelineStrike): boolean => {
    const heavyPlanets = ['saturn', 'pluto', 'uranus', 'chiron'];
    const hardAspects = ['conjunction', 'opposition', 'square'];
    
    return event.orb < 1 && 
           heavyPlanets.includes(event.transitingPlanet.toLowerCase()) &&
           hardAspects.includes(event.aspect.toLowerCase());
  };

  const handlePrint = () => {
    setPrintMode('full');
    setTimeout(() => window.print(), 100);
  };

  const handlePrintSelected = () => {
    if (!expandedEventId) return;
    setPrintMode('selected');
    setTimeout(() => window.print(), 100);
  };

  const currentYear = new Date().getFullYear();

  return (
    <>
      <div className="relative">
        {/* Print styles */}
        <style jsx global>{`
          @media print {
            body * { visibility: hidden; }
            .timeline-print-area,
            .timeline-print-area * { visibility: visible; }
            .timeline-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print { display: none !important; }
            .print-show { display: block !important; }
            .print-footer {
              display: block !important;
              position: fixed;
              bottom: 20px;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 10px;
              color: #64748b;
            }
          }
        `}</style>

        <div className="timeline-print-area">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start gap-4 flex-wrap">
            <div>
              <h2 className="text-3xl font-bold text-amber-200 mb-2">
                {userName ? `${userName}'s Life Timeline` : 'Your Life Timeline'}
              </h2>
              <p className="text-slate-400 text-sm">
                {timeline.events.length} major events 
                · Born {timeline.birthYear} 
                · Age {timeline.currentAge}
              </p>
              <p className="text-slate-500 text-xs mt-2 italic">
                No phases. No steps. Just what the sky said and when.
              </p>
            </div>
            <div className="no-print relative">
              <button
                onClick={() => setShowPrintMenu(!showPrintMenu)}
                className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-amber-300 text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showPrintMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50">
                  <button
                    onClick={() => { handlePrint(); setShowPrintMenu(false); }}
                    className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800 rounded-t-lg transition-colors border-b border-slate-700"
                  >
                    <div className="font-medium">Print Full Timeline</div>
                    <div className="text-xs text-slate-400 mt-0.5">All {timeline.events.length} events</div>
                  </button>
                  <button
                    onClick={() => { handlePrintSelected(); setShowPrintMenu(false); }}
                    disabled={!expandedEventId}
                    className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800 rounded-b-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium">Print Selected Event</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {expandedEventId ? 'Current expanded event' : 'Open an event first'}
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="relative pl-8 space-y-4">
            {/* Vertical line */}
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-700/50" />

            {timeline.events.map((event, index) => {
              const style = getIntensityStyle(event.intensity);
              const isExpanded = expandedEventId === event.id;
              const isPast = event.year <= currentYear;
              const isCurrent = event.year === currentYear;
              const eventIsStorm = isStorm(event);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.5) }}
                  className="relative"
                >
                  {/* Marker on timeline */}
                  <div className={`absolute left-[-30px] w-4 h-4 rounded-full ${style.marker} border-2 border-slate-900 z-10`} />

                  {/* Event card */}
                  <div
                    className={`
                      w-full p-4 rounded-lg border ${style.border} ${style.bg}
                      transition-all duration-200
                      ${isExpanded ? 'ring-2 ring-amber-500/50' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-sm font-mono font-bold ${style.text}`}>
                            {event.year}
                          </span>
                          <span className="text-xs text-slate-500">
                            Age {event.age}
                          </span>
                          {isCurrent && (
                            <span className="text-xs text-amber-400 font-semibold px-2 py-0.5 bg-amber-500/20 rounded">
                              NOW
                            </span>
                          )}
                          {!isPast && !isCurrent && (
                            <span className="text-xs text-slate-600 px-2 py-0.5 bg-slate-700/30 rounded">
                              Future
                            </span>
                          )}
                          {eventIsStorm && (
                            <HoverCard.Root openDelay={200}>
                              <HoverCard.Trigger asChild>
                                <span className="text-xs text-red-200 font-bold px-2 py-0.5 bg-red-500/30 border border-red-500/50 rounded hover:animate-pulse cursor-help">
                                  STORM
                                </span>
                              </HoverCard.Trigger>
                              <HoverCard.Portal>
                                <HoverCard.Content
                                  side="top"
                                  align="center"
                                  className="z-50 w-64 rounded-md bg-slate-900 p-3 text-xs text-slate-200 shadow-xl border border-red-500/30"
                                >
                                  <p className="font-semibold text-red-300 mb-1">Extreme Transit — Life-Altering Intensity</p>
                                  <p className="text-slate-400">
                                    Orb &lt;1° with heavy planets (Saturn, Pluto, Uranus, Chiron) in hard aspect. These are the moments that reshape everything.
                                  </p>
                                  <HoverCard.Arrow className="fill-slate-900" />
                                </HoverCard.Content>
                              </HoverCard.Portal>
                            </HoverCard.Root>
                          )}
                        </div>
                        <p className="text-slate-200 font-medium leading-snug mb-1.5">
                          {event.oneLiner}
                        </p>
                        <p className="text-xs text-slate-500">
                          {event.raw} · {event.orb.toFixed(2)}° orb
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          onClick={() => handleEventClick(event)}
                          className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded hover:bg-amber-500/20 hover:border-amber-500/50 transition-all"
                        >
                          {isExpanded ? 'Close' : 'Examine'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={isMobile ? { y: '100%', opacity: 0 } : { height: 0, opacity: 0 }}
                          animate={isMobile ? { y: 0, opacity: 1 } : { height: 'auto', opacity: 1 }}
                          exit={isMobile ? { y: '100%', opacity: 0 } : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className={`overflow-hidden ${
                            isMobile 
                              ? 'fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto' 
                              : 'mt-4'
                          }`}
                        >
                          <div className={`p-6 bg-slate-800/95 backdrop-blur-lg rounded-lg border border-slate-700/50 ${
                            isMobile ? 'rounded-b-none shadow-2xl' : ''
                          }`}>
                            {isMobile && (
                              <div className="mb-4 pb-4 border-b border-slate-700/50 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-amber-200">
                                  {event.year} — Age {event.age}
                                </h3>
                                <button
                                  onClick={() => setExpandedEventId(null)}
                                  className="text-slate-400 hover:text-slate-200 text-xl"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            {loadingDetails[event.id] ? (
                              <div className="flex items-center gap-3 text-slate-400">
                                <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full" />
                                <span className="text-sm">Reading the story...</span>
                              </div>
                            ) : eventDetails[event.id] ? (
                              <div className="space-y-4">
                                <div className="prose prose-invert prose-sm max-w-none">
                                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                                    {eventDetails[event.id].text}
                                  </p>
                                </div>
                                {/* Subtle interpreter note */}
                                <div className="pt-3 border-t border-slate-700/50">
                                  <p className="text-xs text-slate-500 italic">
                                    {eventDetails[event.id].interpreter === 'grok' 
                                      ? '✨ Deep dive powered by Grok AI' 
                                      : '📖 Deep dive powered by traditional engine'}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-500 text-sm italic">
                                Click "Examine" to read the full story
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="mt-12 p-6 bg-slate-900/30 rounded-lg border border-slate-700/30">
            <p className="text-slate-400 text-sm italic">
              This is your life as the stars saw it.
              Not a guide. Not a prediction.
              Just what was written in your chart—
              and what you did with it.
            </p>
          </div>

          {/* Print-only footer */}
          <div className="print-footer hidden">
            Generated by Merlin — Your cosmic mirror. x.ai
          </div>
        </div>
      </div>

      {/* Mobile overlay backdrop */}
      {isMobile && expandedEventId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setExpandedEventId(null)}
        />
      )}
    </>
  );
}
