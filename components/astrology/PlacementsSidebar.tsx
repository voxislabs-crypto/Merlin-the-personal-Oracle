'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PlanetPosition } from '@/types/astrology';
import { getPlacementWhisper, ordinalHouse } from '@/lib/astrology/planet-placement';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface PlacementsSidebarProps {
  planets: PlanetPosition[];
  className?: string;
  onAskContext?: (label: string, prompt: string) => void;
  selectedContextLabel?: string;
  selectedPlanet?: string | null;
  onPlanetSelect?: (name: string | null) => void;
}

/**
 * Placements Sidebar - Left of the wheel
 * Thin column. Small text. One paragraph below.
 * That's how you survive. That's how you shine.
 */
const PLANET_DISPLAY_ORDER = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
];

export function PlacementsSidebar({
  planets,
  className = '',
  onAskContext,
  selectedContextLabel,
  selectedPlanet,
  onPlanetSelect,
}: PlacementsSidebarProps) {
  const orderedPlanets = PLANET_DISPLAY_ORDER
    .map((name) => planets.find((p) => p.name === name))
    .filter((p): p is PlanetPosition => Boolean(p));

  const personalPlanets = orderedPlanets.filter((p) =>
    ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'].includes(p.name)
  );

  // Generate the interpretive paragraph
  const generateParagraph = (): string => {
    const sun = personalPlanets.find(p => p.name === 'Sun');
    const moon = personalPlanets.find(p => p.name === 'Moon');
    const mercury = personalPlanets.find(p => p.name === 'Mercury');
    const venus = personalPlanets.find(p => p.name === 'Venus');
    const mars = personalPlanets.find(p => p.name === 'Mars');

    // Craft a narrative from the placements
    const lines: string[] = [];

    if (sun) {
      const verb = getSignVerb(sun.sign, 'sun');
      lines.push(`The Sun in ${sun.sign} wants to ${verb}.`);
    }

    if (moon) {
      const verb = getSignVerb(moon.sign, 'moon');
      lines.push(`The Moon in ${moon.sign} ${verb}.`);
    }

    if (mercury) {
      const verb = getSignVerb(mercury.sign, 'mercury');
      lines.push(`Mercury in ${mercury.sign} ${verb}.`);
    }

    if (venus) {
      const verb = getSignVerb(venus.sign, 'venus');
      lines.push(`Venus in ${venus.sign} ${verb}.`);
    }

    if (mars) {
      const verb = getSignVerb(mars.sign, 'mars');
      lines.push(`Mars in ${mars.sign} ${verb}.`);
    }

    lines.push("That's how you survive.");
    lines.push("That's how you shine.");

    return lines.join(' ');
  };

  return (
    <motion.div
      className={`flex flex-col space-y-6 ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Placements list */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-wider text-amber-400/60 font-bold mb-3">
          Placements
        </h3>
        {orderedPlanets.map((planet, index) => (
          <HoverCard key={planet.name} openDelay={200}>
            <HoverCardTrigger asChild>
              {(() => {
                const contextLabel = `${planet.name} in ${planet.sign}`;
                const isWheelSelected = selectedPlanet === planet.name;
                const isSelected = isWheelSelected || selectedContextLabel === contextLabel;
                return (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className={`group flex items-baseline gap-2 rounded-md px-2 py-1 text-sm cursor-pointer transition-colors ${
                  isSelected
                    ? isWheelSelected
                      ? 'bg-amber-400/15 text-amber-50 ring-1 ring-amber-400/45'
                      : 'bg-cyan-400/12 text-cyan-100 ring-1 ring-cyan-300/40'
                    : 'hover:text-amber-200'
                }`}
                onClick={() => onPlanetSelect?.(planet.name)}
              >
                <span className="text-amber-300 font-semibold min-w-[70px]">
                  {planet.name}:
                </span>
                <span className="text-slate-200">
                  {planet.sign}
                  {planet.house ? ` · ${ordinalHouse(planet.house)}` : ''}
                </span>
                {onAskContext ? <span className={`ml-auto text-[10px] uppercase tracking-wide transition ${isSelected ? 'text-cyan-200/90' : 'text-cyan-200/0 group-hover:text-cyan-200/70'}`}>{isSelected ? 'Selected' : 'Ask'}</span> : null}
              </motion.div>
                );
              })()}
            </HoverCardTrigger>
            <HoverCardContent 
              className="w-80 p-4 bg-gradient-to-br from-slate-950 to-slate-900 border-amber-500/30 shadow-xl shadow-amber-500/10"
              side="right"
              sideOffset={10}
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h4 className="text-lg font-bold text-amber-300 mb-2 flex items-center gap-2">
                  {planet.name} in {planet.sign}
                </h4>
                <p className="text-white leading-relaxed italic">
                  {getPlacementWhisper(planet.name, planet.sign)}
                </p>
              </motion.div>
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>

      {/* Interpretive paragraph */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="pt-4 border-t border-amber-500/20"
      >
        <p className="text-sm text-slate-300 leading-relaxed italic">
          {generateParagraph()}
        </p>
      </motion.div>
    </motion.div>
  );
}

/**
 * Get action verb for sign/planet combination
 */
function getSignVerb(sign: string, planet: 'sun' | 'moon' | 'mercury' | 'venus' | 'mars'): string {
  const verbs: Record<string, Record<string, string>> = {
    'Aries': {
      sun: 'burn fast',
      moon: 'reacts before thinking',
      mercury: 'speaks fire',
      venus: 'loves boldly',
      mars: 'strikes first'
    },
    'Taurus': {
      sun: 'build slow',
      moon: 'holds onto everything',
      mercury: 'thinks in circles',
      venus: 'loves deep',
      mars: 'moves when ready'
    },
    'Gemini': {
      sun: 'scatter light',
      moon: 'feels in fragments',
      mercury: 'rewrites the story',
      venus: 'loves with words',
      mars: 'darts and weaves'
    },
    'Cancer': {
      sun: 'protect the soft parts',
      moon: 'remembers everything',
      mercury: 'speaks in memories',
      venus: 'loves like home',
      mars: 'defends the nest'
    },
    'Leo': {
      sun: 'burn',
      moon: 'hides the ashes',
      mercury: 'performs the truth',
      venus: 'loves loudly',
      mars: 'lights it again'
    },
    'Virgo': {
      sun: 'fix what breaks',
      moon: 'counts them',
      mercury: 'edits the chaos',
      venus: 'polishes what\'s left',
      mars: 'sharpens the blade'
    },
    'Libra': {
      sun: 'balance the scales',
      moon: 'weighs every feeling',
      mercury: 'mediates the war',
      venus: 'loves in harmony',
      mars: 'fights fair'
    },
    'Scorpio': {
      sun: 'dive deep',
      moon: 'hides the ashes',
      mercury: 'speaks in riddles',
      venus: 'loves til it bleeds',
      mars: 'strikes from the dark'
    },
    'Sagittarius': {
      sun: 'aim higher',
      moon: 'escapes the cage',
      mercury: 'preaches truth',
      venus: 'loves freedom',
      mars: 'hunts the horizon'
    },
    'Capricorn': {
      sun: 'climb the mountain',
      moon: 'carries the weight',
      mercury: 'builds the argument',
      venus: 'earns love',
      mars: 'conquers slowly'
    },
    'Aquarius': {
      sun: 'break the pattern',
      moon: 'detaches to survive',
      mercury: 'thinks sideways',
      venus: 'loves the weird  ',
      mars: 'rebels quietly'
    },
    'Pisces': {
      sun: 'dissolve',
      moon: 'drowns willingly',
      mercury: 'speaks in symbols',
      venus: 'loves everyone',
      mars: 'drifts through war'
    }
  };

  return verbs[sign]?.[planet] || 'exists';
}


