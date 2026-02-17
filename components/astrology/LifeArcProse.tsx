'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LifeBeat } from '@/lib/astrology/life-arc';
import { BirthChartData } from '@/types/astrology';

interface LifeArcProseProps {
  beats: LifeBeat[];
  chartData: BirthChartData;
  loading?: boolean;
}

/**
 * Life Arc Prose - Not bullets. Not timeline. Prose.
 * One scroll. One breath. The whole story.
 */
export function LifeArcProse({ beats, chartData, loading = false }: LifeArcProseProps) {
  if (loading) {
    return (
      <div className="p-8 bg-slate-900/50 rounded-lg border border-amber-500/20">
        <div className="animate-pulse space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-4 bg-slate-700/50 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  const sunSign = chartData.positions?.find(p => p.name === 'Sun')?.sign || 'Unknown';
  const moonSign = chartData.positions?.find(p => p.name === 'Moon')?.sign || 'Unknown';
  const risingSign = chartData.ascendant?.sign || 'Unknown';

  // Generate prose narrative from beats
  const generateNarrative = (): string[] => {
    const paragraphs: string[] = [];

    // Opening
    paragraphs.push(
      `You were born under ${sunSign} Sun, ${moonSign} Moon.`
    );

    // Interpret the duality
    const sunElement = getElement(sunSign);
    const moonElement = getElement(moonSign);
    
    if (sunElement === 'Fire') {
      paragraphs.push('The fire wanted to shine.');
    } else if (sunElement === 'Water') {
      paragraphs.push('The water wanted to feel everything.');
    } else if (sunElement === 'Air') {
      paragraphs.push('The air wanted to think, to understand.');
    } else {
      paragraphs.push('The earth wanted to build, to hold.');
    }

    if (moonElement === 'Water') {
      paragraphs.push('The water wanted to drown.');
    } else if (moonElement === 'Fire') {
      paragraphs.push('The moon wanted to burn too.');
    } else if (moonElement === 'Earth') {
      paragraphs.push('The moon wanted to bury it all.');
    } else {
      paragraphs.push('The moon scattered the thoughts like leaves.');
    }

    // Process major beats
    const saturnReturn = beats.find(b => b.age >= 28 && b.age <= 30 && b.intensity === 'break');
    const uranusSquare = beats.find(b => b.age >= 40 && b.age <= 43 && b.intensity === 'break');
    const chiron = beats.find(b => b.age >= 48 && b.age <= 52);

    if (saturnReturn) {
      paragraphs.push(
        `For the first ${saturnReturn.age} years, the fire won.`,
        'Then Saturn came.',
        'The floor gave out.',
        'You built it back—',
        'Harder.'
      );
    } else {
      paragraphs.push(
        'The early years were fire against water.',
        'Neither side won clean.'
      );
    }

    if (uranusSquare) {
      paragraphs.push(
        `At ${uranusSquare.age}, the rebellion.`,
        'Uranus shook the cage.',
        'You broke out.',
        'Not clean.',
        'Not quiet.',
        'But free.'
      );
    }

    if (chiron) {
      paragraphs.push(
        `Now you're ${chiron.age}.`,
        'The wound teaches.',
        'The scar speaks.'
      );
    } else {
      const currentAge = new Date().getFullYear() - (parseInt(chartData.birthData?.birthDate?.split('-')[0] || '1990'));
      paragraphs.push(
        `Now you're ${currentAge}.`,
        'The lessons stack.',
        'The path clears.'
      );
    }

    // Closing
    paragraphs.push(
      'And the stars—',
      'They just watch.',
      'Quiet.',
      'Like they knew.'
    );

    return paragraphs;
  };

  const narrative = generateNarrative();

  return (
    <motion.div
      className="relative p-10 rounded-lg bg-gradient-to-br from-slate-900/90 to-purple-900/20 border border-purple-500/30 backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />

      {/* Prose content */}
      <motion.div
        className="relative prose prose-invert prose-lg max-w-none"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.15,
              delayChildren: 0.2
            }
          }
        }}
      >
        {narrative.map((paragraph, index) => (
          <motion.p
            key={index}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6 }
              }
            }}
            className={`text-white leading-relaxed ${
              paragraph.length < 20 ? 'text-xl' : 'text-lg'
            } ${
              index === 0 ? 'font-bold text-purple-200 text-2xl' : ''
            } ${
              index === narrative.length - 1 ? 'italic text-purple-300/80' : ''
            }`}
          >
            {paragraph}
          </motion.p>
        ))}
      </motion.div>
    </motion.div>
  );
}

// Helper to get element from sign
function getElement(sign: string): 'Fire' | 'Earth' | 'Air' | 'Water' {
  const fireSigns = ['Aries', 'Leo', 'Sagittarius'];
  const earthSigns = ['Taurus', 'Virgo', 'Capricorn'];
  const airSigns = ['Gemini', 'Libra', 'Aquarius'];
  const waterSigns = ['Cancer', 'Scorpio', 'Pisces'];

  if (fireSigns.includes(sign)) return 'Fire';
  if (earthSigns.includes(sign)) return 'Earth';
  if (airSigns.includes(sign)) return 'Air';
  return 'Water';
}
