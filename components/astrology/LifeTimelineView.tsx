/* Life Timeline - Redesigned for readability with filters and compact view */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineStrike, LifeTimeline } from '@/lib/astrology/life-timeline-engine';
import * as HoverCard from '@radix-ui/react-hover-card';

interface LifeTimelineViewProps {
  timeline: LifeTimeline | null;
  loading?: boolean;
  userName?: string;
}

type TimeFilter = 'all' | 'past' | 'current' | 'future';
type IntensityFilter = 'all' | 'strike' | 'burn' | 'shift';
type PlanetFilter = 'all' | 'saturn' | 'uranus' | 'neptune' | 'pluto' | 'chiron' | 'jupiter';

export function LifeTimelineView({ timeline, loading = false, userName }: LifeTimelineViewProps) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<Record<string, { text: string; interpreter: string }>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [printMode, setPrintMode] = useState<'full' | 'selected'>('full');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [intensityFilter, setIntensityFilter] = useState<IntensityFilter>('all');
  const [planetFilter, setPlanetFilter] = useState<PlanetFilter>('all');
  const [collapsedDecades, setCollapsedDecades] = useState<Set<string>>(new Set());

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentYear = new Date().getFullYear();

  // Filter and group events
  const { filteredEvents, groupedByDecade, stats, planetCounts } = useMemo(() => {
    if (!timeline) return { 
      filteredEvents: [], 
      groupedByDecade: new Map(), 
      stats: { past: 0, current: 0, future: 0, strike: 0, burn: 0, shift: 0 },
      planetCounts: { saturn: 0, uranus: 0, neptune: 0, pluto: 0, chiron: 0, jupiter: 0 }
    };

    let events = [...timeline.events];
    const stats = { past: 0, current: 0, future: 0, strike: 0, burn: 0, shift: 0 };
    const planetCounts = { saturn: 0, uranus: 0, neptune: 0, pluto: 0, chiron: 0, jupiter: 0 };

    // Calculate stats
    events.forEach(e => {
      if (e.year < currentYear) stats.past++;
      else if (e.year === currentYear) stats.current++;
      else stats.future++;
      stats[e.intensity]++;
      
      // Count by planet
      const planet = e.transitingPlanet.toLowerCase();
      if (planet in planetCounts) {
        planetCounts[planet as keyof typeof planetCounts]++;
      }
    });

    // Apply filters
    if (timeFilter !== 'all') {
      events = events.filter((e: TimelineStrike) => {
        if (timeFilter === 'past') return e.year < currentYear;
        if (timeFilter === 'current') return e.year === currentYear;
        if (timeFilter === 'future') return e.year > currentYear;
        return true;
      });
    }

    if (intensityFilter !== 'all') {
      events = events.filter((e: TimelineStrike) => e.intensity === intensityFilter);
    }

    if (planetFilter !== 'all') {
      events = events.filter((e: TimelineStrike) => e.transitingPlanet.toLowerCase() === planetFilter);
    }

    // Group by decade
    const grouped = new Map<string, TimelineStrike[]>();
    events.forEach(event => {
      const decade = Math.floor(event.year / 10) * 10;
      const key = `${decade}s`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(event);
    });

    return { filteredEvents: events, groupedByDecade: grouped, stats, planetCounts };
  }, [timeline, timeFilter, intensityFilter, planetFilter, currentYear]);

  const toggleDecade = (decade: string) => {
    setCollapsedDecades(prev => {
      const next = new Set(prev);
      if (next.has(decade)) next.delete(decade);
      else next.add(decade);
      return next;
    });
  };

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

  const FilterButton = ({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
        active 
          ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50' 
          : 'bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:border-slate-600'
      }`}
    >
      {children}
      {count !== undefined && <span className="ml-1.5 opacity-70">({count})</span>}
    </button>
  );

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
          <div className="mb-6 flex justify-between items-start gap-4 flex-wrap">
            <div>
              <h2 className="text-3xl font-bold text-amber-200 mb-2">
                {userName ? `${userName}'s Life Timeline` : 'Your Life Timeline'}
              </h2>
              <p className="text-slate-400 text-sm">
                {timeline.events.length} major events 
                · Born {timeline.birthYear} 
                · Age {timeline.currentAge}
              </p>
              <div className="flex gap-3 mt-3 flex-wrap">
                <div className="text-xs px-2 py-1 bg-slate-800/50 rounded border border-slate-700/30">
                  <span className="text-slate-500">Past:</span> <span className="text-slate-300 font-semibold">{stats.past}</span>
                </div>
                <div className="text-xs px-2 py-1 bg-amber-500/10 rounded border border-amber-500/30">
                  <span className="text-amber-400">Now:</span> <span className="text-amber-200 font-semibold">{stats.current}</span>
                </div>
                <div className="text-xs px-2 py-1 bg-blue-500/10 rounded border border-blue-500/30">
                  <span className="text-blue-400">Future:</span> <span className="text-blue-200 font-semibold">{stats.future}</span>
                </div>
              </div>
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

          {/* Filters */}
          <div className="mb-6 no-print">
            <div className="flex flex-col gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
              <div>
                <label className="text-xs text-slate-500 font-medium mb-2 block">TIME PERIOD</label>
                <div className="flex gap-2 flex-wrap">
                  <FilterButton active={timeFilter === 'all'} onClick={() => setTimeFilter('all')} count={timeline.events.length}>
                    All
                  </FilterButton>
                  <FilterButton active={timeFilter === 'past'} onClick={() => setTimeFilter('past')} count={stats.past}>
                    Past
                  </FilterButton>
                  <FilterButton active={timeFilter === 'current'} onClick={() => setTimeFilter('current')} count={stats.current}>
                    Current
                  </FilterButton>
                  <FilterButton active={timeFilter === 'future'} onClick={() => setTimeFilter('future')} count={stats.future}>
                    Future
                  </FilterButton>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-2 block">PLANET</label>
                <div className="flex gap-2 flex-wrap">
                  <FilterButton active={planetFilter === 'all'} onClick={() => setPlanetFilter('all')} count={timeline.events.length}>
                    All
                  </FilterButton>
                  <FilterButton active={planetFilter === 'saturn'} onClick={() => setPlanetFilter('saturn')} count={planetCounts.saturn}>
                    ♄ Saturn
                  </FilterButton>
                  <FilterButton active={planetFilter === 'uranus'} onClick={() => setPlanetFilter('uranus')} count={planetCounts.uranus}>
                    ♅ Uranus
                  </FilterButton>
                  <FilterButton active={planetFilter === 'neptune'} onClick={() => setPlanetFilter('neptune')} count={planetCounts.neptune}>
                    ♆ Neptune
                  </FilterButton>
                  <FilterButton active={planetFilter === 'pluto'} onClick={() => setPlanetFilter('pluto')} count={planetCounts.pluto}>
                    ♇ Pluto
                  </FilterButton>
                  <FilterButton active={planetFilter === 'chiron'} onClick={() => setPlanetFilter('chiron')} count={planetCounts.chiron}>
                    ⚷ Chiron
                  </FilterButton>
                  <FilterButton active={planetFilter === 'jupiter'} onClick={() => setPlanetFilter('jupiter')} count={planetCounts.jupiter}>
                    ♃ Jupiter
                  </FilterButton>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-2 block">INTENSITY</label>
                <div className="flex gap-2 flex-wrap">
                  <FilterButton active={intensityFilter === 'all'} onClick={() => setIntensityFilter('all')} count={timeline.events.length}>
                    All
                  </FilterButton>
                  <FilterButton active={intensityFilter === 'strike'} onClick={() => setIntensityFilter('strike')} count={stats.strike}>
                    ⚡ Strike
                  </FilterButton>
                  <FilterButton active={intensityFilter === 'burn'} onClick={() => setIntensityFilter('burn')} count={stats.burn}>
                    🔥 Burn
                  </FilterButton>
                  <FilterButton active={intensityFilter === 'shift'} onClick={() => setIntensityFilter('shift')} count={stats.shift}>
                    🌊 Shift
                  </FilterButton>
                </div>
              </div>
              {filteredEvents.length < timeline.events.length && (
                <div className="text-xs text-amber-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Showing {filteredEvents.length} of {timeline.events.length} events
                </div>
              )}
            </div>
          </div>

          {/* Timeline - Grouped by Decade */}
          <div className="space-y-4">
            {Array.from(groupedByDecade.entries()).map(([decade, events]) => {
              const isCollapsed = collapsedDecades.has(decade);
              const decadeStartYear = parseInt(decade);
              const decadeIsPast = decadeStartYear < Math.floor(currentYear / 10) * 10;
              const decadeIsCurrent = decadeStartYear === Math.floor(currentYear / 10) * 10;

              return (
                <div key={decade} className="border border-slate-700/30 rounded-lg overflow-hidden bg-slate-900/30">
                  {/* Decade Header */}
                  <button
                    onClick={() => toggleDecade(decade)}
                    className="w-full px-6 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <h3 className={`text-lg font-bold ${decadeIsCurrent ? 'text-amber-300' : decadeIsPast ? 'text-slate-300' : 'text-blue-300'}`}>
                        {decade}
                      </h3>
                      <span className="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-800/50 rounded">
                        {events.length} event{events.length !== 1 ? 's' : ''}
                      </span>
                      {decadeIsCurrent && (
                        <span className="text-xs text-amber-400 font-semibold px-2 py-0.5 bg-amber-500/20 rounded">
                          CURRENT DECADE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {events.filter((e: TimelineStrike) => e.intensity === 'strike').length > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-300 rounded">
                            ⚡ {events.filter((e: TimelineStrike) => e.intensity === 'strike').length}
                          </span>
                        )}
                        {events.filter((e: TimelineStrike) => e.intensity === 'burn').length > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded">
                            🔥 {events.filter((e: TimelineStrike) => e.intensity === 'burn').length}
                          </span>
                        )}
                        {events.filter((e: TimelineStrike) => e.intensity === 'shift').length > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                            🌊 {events.filter((e: TimelineStrike) => e.intensity === 'shift').length}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Events in Decade */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="relative pl-8 pr-4 py-4 space-y-3">
                          {/* Vertical line */}
                          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700/50" />

                          {events.map((event, index) => {
                            const style = getIntensityStyle(event.intensity);
                            const isExpanded = expandedEventId === event.id;
                            const isPast = event.year <= currentYear;
                            const isCurrent = event.year === currentYear;
                            const eventIsStorm = isStorm(event);

                            return (
                              <EventCard
                                key={event.id}
                                event={event}
                                index={index}
                                style={style}
                                isExpanded={isExpanded}
                                isPast={isPast}
                                isCurrent={isCurrent}
                                eventIsStorm={eventIsStorm}
                                currentYear={currentYear}
                                isMobile={isMobile}
                                onEventClick={handleEventClick}
                                eventDetails={eventDetails}
                                loadingDetails={loadingDetails}
                                setExpandedEventId={setExpandedEventId}
                              />
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="p-8 bg-slate-900/50 rounded-lg border border-slate-700/20 text-center">
                <p className="text-slate-400">No events match your filters</p>
                <button
                  onClick={() => { setTimeFilter('all'); setIntensityFilter('all'); setPlanetFilter('all'); }}
                  className="mt-3 text-sm text-amber-400 hover:text-amber-300 underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>


          {/* Footer note */}
          <div className="mt-12 p-6 bg-slate-900/30 rounded-lg border border-slate-700/30">
            <p className="text-slate-400 text-sm italic">
              {filteredEvents.length === timeline.events.length 
                ? "This is your life as the stars saw it. Not a guide. Not a prediction. Just what was written in your chart—and what you did with it."
                : `Viewing ${filteredEvents.length} of ${timeline.events.length} events. Adjust filters to see more.`}
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

// EventCard component for cleaner code
interface EventCardProps {
  event: TimelineStrike;
  index: number;
  style: { border: string; bg: string; marker: string; text: string };
  isExpanded: boolean;
  isPast: boolean;
  isCurrent: boolean;
  eventIsStorm: boolean;
  currentYear: number;
  isMobile: boolean;
  onEventClick: (event: TimelineStrike) => void;
  eventDetails: Record<string, { text: string; interpreter: string }>;
  loadingDetails: Record<string, boolean>;
  setExpandedEventId: (id: string | null) => void;
}

function EventCard({
  event,
  index,
  style,
  isExpanded,
  isPast,
  isCurrent,
  eventIsStorm,
  currentYear,
  isMobile,
  onEventClick,
  eventDetails,
  loadingDetails,
  setExpandedEventId
}: EventCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className="relative"
    >
      {/* Marker on timeline */}
      <div className={`absolute left-[-26px] w-3 h-3 rounded-full ${style.marker} border-2 border-slate-900 z-10`} />

      {/* Event card - COMPACT VERSION */}
      <div
        className={`
          w-full p-3 rounded-md border ${style.border} ${style.bg}
          transition-all duration-200
          ${isExpanded ? 'ring-2 ring-amber-500/50' : ''}
        `}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-sm font-mono font-bold ${style.text}`}>
                {event.year}
              </span>
              <span className="text-xs text-slate-500">
                Age {event.age}
              </span>
              {isCurrent && (
                <span className="text-xs text-amber-400 font-semibold px-1.5 py-0.5 bg-amber-500/20 rounded">
                  NOW
                </span>
              )}
              {!isPast && !isCurrent && (
                <span className="text-xs text-slate-600 px-1.5 py-0.5 bg-slate-700/30 rounded">
                  Future
                </span>
              )}
              {eventIsStorm && (
                <HoverCard.Root openDelay={200}>
                  <HoverCard.Trigger asChild>
                    <span className="text-xs text-red-200 font-bold px-1.5 py-0.5 bg-red-500/30 border border-red-500/50 rounded hover:animate-pulse cursor-help">
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
            <p className="text-slate-200 text-sm font-medium leading-snug mb-1 truncate">
              {event.oneLiner}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {event.raw} · {event.orb.toFixed(2)}° orb
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              onClick={() => onEventClick(event)}
              className="px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded hover:bg-amber-500/20 hover:border-amber-500/50 transition-all whitespace-nowrap"
            >
              {isExpanded ? 'Close' : 'View'}
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
                  : 'mt-3'
              }`}
            >
              <div className={`p-4 ${
                eventDetails[event.id]?.interpreter === 'grok' 
                  ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-amber-500/30' 
                  : 'bg-slate-800/95'
                } backdrop-blur-lg rounded-lg border ${eventDetails[event.id]?.interpreter === 'grok' ? 'border-amber-500/30' : 'border-slate-700/50'} ${
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
                  <div className="flex flex-col items-center gap-3 text-slate-400 py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" />
                    <span className="text-sm font-medium text-amber-400">Merlin is reading the stars...</span>
                    <span className="text-xs text-slate-500">This might take a moment</span>
                  </div>
                ) : eventDetails[event.id] ? (
                  <motion.div 
                    className="space-y-4"
                    initial={eventDetails[event.id].interpreter === 'grok' ? { x: -5 } : {}}
                    animate={eventDetails[event.id].interpreter === 'grok' ? { x: 0 } : {}}
                    transition={{ duration: 0.15, type: 'spring', stiffness: 300 }}
                  >
                    <div className={`prose prose-invert ${
                      eventDetails[event.id].interpreter === 'grok' ? 'prose-base' : 'prose-sm'
                    } max-w-none`}>
                      <p className={`${
                        eventDetails[event.id].interpreter === 'grok' 
                          ? 'text-slate-100 text-base leading-relaxed font-medium' 
                          : 'text-slate-200 leading-relaxed'
                        } whitespace-pre-wrap`}>
                        {eventDetails[event.id].text}
                      </p>
                    </div>
                    {/* Interpreter badge */}
                    <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between">
                      {eventDetails[event.id].interpreter === 'grok' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                          <span className="text-xs font-semibold text-amber-400 tracking-wide uppercase">
                            Grok's Truth
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">
                          📖 Traditional engine — safe, but bland
                        </span>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <p className="text-slate-500 text-sm italic">
                    Click "View" to read the full story
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
