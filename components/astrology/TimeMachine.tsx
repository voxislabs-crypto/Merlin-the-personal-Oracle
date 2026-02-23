// components/astrology/TimeMachine.tsx - Timeline visualization for long-range forecasts

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, Zap, BookOpen } from 'lucide-react';
import { Timeline, TimelinePhase, TimelineEvent } from '@/lib/timeline-service';

interface TimeMachineProps {
  timeline: Timeline;
  onEventClick?: (event: TimelineEvent) => void;
}

export const TimeMachine: React.FC<TimeMachineProps> = ({ timeline, onEventClick }: TimeMachineProps) => {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-900/40 to-slate-900/40 border border-purple-500/30 rounded-lg p-6"
      >
        <h2 className="text-2xl font-bold text-purple-200 mb-2">Your Cosmic Timeline</h2>
        <p className="text-purple-300 text-sm mb-4">
          {timeline.lookAheadMonths}-month forecast from {new Date(timeline.startDate).toLocaleDateString()}
        </p>

        {/* Yearly Narrative */}
        <div className="bg-slate-800/50 border border-purple-500/20 rounded p-4">
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
            {timeline.yearlyNarrative}
          </p>
        </div>

        {/* Key Themes */}
        {timeline.keyThemes && timeline.keyThemes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-purple-400 font-semibold">Key Themes:</span>
            {timeline.keyThemes.map((theme: string, i: number) => (
              <span
                key={i}
                className="text-xs bg-purple-500/30 text-purple-200 px-2.5 py-1 rounded-full border border-purple-500/20"
              >
                {theme}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Major Turning Points */}
      {timeline.majorTurningPoints && timeline.majorTurningPoints.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/30 border border-purple-500/20 rounded-lg p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-yellow-400" />
            <h3 className="text-lg font-semibold text-purple-300">Major Turning Points</h3>
          </div>

          <div className="space-y-3">
            {timeline.majorTurningPoints.slice(0, 5).map((event: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`border-l-4 pl-4 py-2 ${
                  event.intensity === 'major'
                    ? 'border-yellow-400/60'
                    : event.intensity === 'moderate'
                      ? 'border-purple-400/60'
                      : 'border-slate-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-100">{event.title}</p>
                    <p className="text-xs text-purple-300 mt-1">{event.month}</p>
                    <p className="text-sm text-slate-300 mt-2">{event.description}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                      event.intensity === 'major'
                        ? 'bg-yellow-500/30 text-yellow-200'
                        : event.intensity === 'moderate'
                          ? 'bg-purple-500/30 text-purple-200'
                          : 'bg-slate-500/20 text-slate-300'
                    }`}
                  >
                    {event.intensity}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quarterly Phases */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
          <Calendar size={20} />
          Timeline by Phase
        </h3>

        <AnimatePresence mode="popLayout">
          {timeline.phases.map((phase: any, phaseIdx: number) => (
            <motion.div
              key={phaseIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: phaseIdx * 0.1 }}
              className="border border-purple-500/20 rounded-lg overflow-hidden bg-slate-800/30 hover:border-purple-500/40 transition"
            >
              {/* Phase Header */}
              <button
                onClick={() =>
                  setExpandedPhase(expandedPhase === phaseIdx ? null : phaseIdx)
                }
                className="w-full p-4 flex items-center justify-between hover:bg-purple-500/10 transition"
              >
                <div className="text-left">
                  <h4 className="font-bold text-purple-200">{phase.quarter}</h4>
                  <p className="text-sm text-slate-400">{phase.theme}</p>
                  <p className="text-xs text-purple-400 mt-1">{phase.lifeTheme}</p>
                </div>

                <ChevronDown
                  size={20}
                  className={`text-purple-400 transition-transform ${
                    expandedPhase === phaseIdx ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Phase Details */}
              <AnimatePresence>
                {expandedPhase === phaseIdx && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-purple-500/20 bg-slate-800/50 px-4 py-4 space-y-4"
                  >
                    {/* Phase Narrative */}
                    <div>
                      <p className="text-xs font-semibold text-purple-300 mb-2">Overview</p>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {phase.phaseNarrative}
                      </p>
                    </div>

                    {/* Phase Advice */}
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded p-3">
                      <div className="flex items-start gap-2">
                        <BookOpen size={16} className="text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-purple-300 mb-1">Guidance</p>
                          <p className="text-xs text-slate-200">{phase.adviceForPhase}</p>
                        </div>
                      </div>
                    </div>

                    {/* Phase Events */}
                    <div>
                      <p className="text-xs font-semibold text-purple-300 mb-3">Key Events</p>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {phase.majorEvents.map((event: any, eventIdx: number) => (
                          <motion.div
                            key={`${phaseIdx}-${eventIdx}`}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-slate-700/40 rounded p-3 cursor-pointer hover:bg-slate-700/60 transition border border-slate-600/30"
                            onClick={() => {
                              setExpandedEvent(
                                expandedEvent === `${phaseIdx}-${eventIdx}`
                                  ? null
                                  : `${phaseIdx}-${eventIdx}`
                              );
                              onEventClick?.(event);
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-slate-100 text-sm">
                                  {event.title}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">{event.month}</p>
                              </div>
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap ${
                                  event.intensity === 'major'
                                    ? 'bg-yellow-500/30 text-yellow-200'
                                    : event.intensity === 'moderate'
                                      ? 'bg-purple-500/30 text-purple-200'
                                      : 'bg-slate-600/30 text-slate-300'
                                }`}
                              >
                                {event.type}
                              </span>
                            </div>

                            {/* Event Details (Expanded) */}
                            <AnimatePresence>
                              {expandedEvent === `${phaseIdx}-${eventIdx}` && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-3 pt-3 border-t border-slate-600/30 space-y-2"
                                >
                                  <p className="text-xs text-slate-300">
                                    <span className="text-slate-400">Description:</span>{' '}
                                    {event.description}
                                  </p>
                                  <p className="text-xs text-slate-300">
                                    <span className="text-slate-400">Life Area:</span> {event.lifeArea}
                                  </p>
                                  <div className="bg-purple-500/10 rounded p-2">
                                    <p className="text-xs font-semibold text-purple-300 mb-1">
                                      Guidance
                                    </p>
                                    <p className="text-xs text-slate-200">{event.guidance}</p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
