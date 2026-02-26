'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayWhisper } from '@/hooks/useWeeklyForecast';

interface WeeklyCalendarProps {
  week: DayWhisper[];
  loading?: boolean;
}

/**
 * Horizontal scrolling 7-day calendar
 * Today always centered, user can select any day
 */
export function WeeklyCalendar({ week, loading = false }: WeeklyCalendarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedDay, setSelectedDay] = useState<string>('');

  // Find today's date index
  const todayDateString = new Date().toISOString().split('T')[0];
  const todayIndex = week.findIndex(day => day.date === todayDateString);

  // Initialize selected day to today
  useEffect(() => {
    if (week.length > 0 && !selectedDay) {
      const today = week.find(day => day.date === todayDateString);
      if (today) {
        setSelectedDay(today.date);
      } else {
        setSelectedDay(week[0]?.date || '');
      }
    }
  }, [week, todayDateString, selectedDay]);

  // Auto-scroll to center today's date
  useEffect(() => {
    if (scrollContainerRef.current && todayIndex >= 0) {
      const container = scrollContainerRef.current;
      const dayCards = container.querySelectorAll('.day-card');
      const todayCard = dayCards[todayIndex] as HTMLElement;
      
      if (todayCard) {
        const containerWidth = container.offsetWidth;
        const cardLeft = todayCard.offsetLeft;
        const cardWidth = todayCard.offsetWidth;
        const scrollTo = cardLeft - (containerWidth / 2) + (cardWidth / 2);
        
        container.scrollTo({
          left: scrollTo,
          behavior: 'smooth'
        });
      }
    }
  }, [todayIndex, week]);

  const selectedDayData = week.find(d => d.date === selectedDay);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse flex gap-4 overflow-hidden">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-24 h-28 bg-slate-700/50 rounded-lg" />
          ))}
        </div>
        <div className="h-32 bg-slate-700/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (week.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>No weekly forecast available</p>
      </div>
    );
  }

  // Format date to show day number with suffix (1st, 2nd, 3rd, etc.)
  const formatDayNumber = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const suffix = getDaySuffix(day);
    return `${day}${suffix}`;
  };

  const getDaySuffix = (day: number) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const formatWeekday = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* Horizontal scrolling day picker */}
      <div className="relative">
        {/* Gradient fade on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />
        
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto pb-2 px-4 scroll-smooth scrollbar-thin scrollbar-thumb-purple-500/40 scrollbar-track-transparent"
        >
          {week.map((day, index) => {
            const isToday = day.date === todayDateString;
            const isSelected = day.date === selectedDay;
            
            return (
              <motion.button
                key={day.date}
                className={`day-card flex-shrink-0 w-24 p-4 rounded-xl border-2 transition-all relative ${
                  isSelected
                    ? 'border-amber-400 bg-gradient-to-br from-amber-900/40 to-purple-900/40 shadow-lg shadow-amber-500/30'
                    : isToday
                    ? 'border-purple-400/50 bg-slate-800/60 hover:border-purple-400'
                    : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                }`}
                onClick={() => setSelectedDay(day.date)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Today indicator */}
                {isToday && (
                  <motion.div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-purple-500/90 text-[10px] font-bold text-white border border-purple-400"
                    animate={{
                      boxShadow: [
                        '0 0 0px rgba(168, 85, 247, 0)',
                        '0 0 10px rgba(168, 85, 247, 0.8)',
                        '0 0 0px rgba(168, 85, 247, 0)'
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    TODAY
                  </motion.div>
                )}
                
                <div className="flex flex-col items-center gap-2">
                  {/* Day number */}
                  <div className={`text-2xl font-bold ${
                    isSelected ? 'text-amber-300' : isToday ? 'text-purple-300' : 'text-slate-300'
                  }`}>
                    {formatDayNumber(day.date)}
                  </div>
                  
                  {/* Weekday name */}
                  <div className={`text-xs uppercase tracking-wider ${
                    isSelected ? 'text-amber-200' : isToday ? 'text-purple-200' : 'text-slate-400'
                  }`}>
                    {formatWeekday(day.date)}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected day detailed message */}
      <AnimatePresence mode="wait">
        {selectedDayData && (
          <motion.div
            key={selectedDayData.date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-slate-900/90 to-purple-900/30 backdrop-blur-sm p-6"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-purple-500/10 to-transparent pointer-events-none" />
            
            {/* Content */}
            <div className="relative">
              {/* Date header */}
              <div className="flex items-baseline gap-3 mb-4">
                <h4 className="text-xl font-bold text-amber-300">
                  {selectedDayData.day}'s Whisper
                </h4>
                <span className="text-sm text-slate-400">
                  {new Date(selectedDayData.date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              {/* The whisper */}
              <p className="text-lg leading-relaxed text-white/90">
                {selectedDayData.whisper}
              </p>
              
              {/* Decorative element */}
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-purple-500/10 rounded-full blur-2xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
