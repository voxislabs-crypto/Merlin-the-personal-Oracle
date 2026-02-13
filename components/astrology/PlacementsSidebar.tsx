'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PlanetPosition } from '@/types/astrology';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface PlacementsSidebarProps {
  planets: PlanetPosition[];
  className?: string;
}

/**
 * Placements Sidebar - Left of the wheel
 * Thin column. Small text. One paragraph below.
 * That's how you survive. That's how you shine.
 */
export function PlacementsSidebar({ planets, className = '' }: PlacementsSidebarProps) {
  // Filter to personal planets (Sun through Mars)
  const personalPlanets = planets.filter(p => 
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
        {personalPlanets.map((planet, index) => (
          <HoverCard key={planet.name} openDelay={200}>
            <HoverCardTrigger asChild>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="flex items-baseline gap-2 text-sm cursor-pointer hover:text-amber-200 transition-colors"
              >
                <span className="text-amber-300 font-semibold min-w-[70px]">
                  {planet.name}:
                </span>
                <span className="text-slate-200">
                  {planet.sign}
                </span>
              </motion.div>
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

/**
 * Get deep whisper for each planet-sign combination
 * Not textbook. Heart.
 */
function getPlacementWhisper(planet: string, sign: string): string {
  const whispers: Record<string, Record<string, string>> = {
    'Sun': {
      'Aries': "You burn to be first. Not best. First. There's a difference.",
      'Taurus': "You slow everything down until it becomes solid. That's power.",
      'Gemini': 'You scatter yourself across a thousand interests. Collect the pieces later.',
      'Cancer': "You protect what's soft. Even if it means hiding what shines.",
      'Leo': 'You burn to be seen. Not admired. Understood.',
      'Virgo': "You fix what's broken. Including yourself. Especially yourself.",
      'Libra': "You want peace. But you'll go to war for it if you must.",
      'Scorpio': 'You dig until you hit bone. Then you keep digging.',
      'Sagittarius': 'You need the horizon. Walls make you sick.',
      'Capricorn': "You climb because falling isn't an option. Never was.",
      'Aquarius': "You see the future. It's lonely there. You go anyway.",
      'Pisces': "You dissolve boundaries. Yours first. Then everyone else's."
    },
    'Moon': {
      'Aries': 'Your heart is a fist. Quick to swing, quick to heal.',
      'Taurus': 'You hold on. To everything. Even what hurts.',
      'Gemini': 'Your feelings are moths. Fluttering, never landing.',
      'Cancer': 'You remember everything. Every slight. Every kindness.',
      'Leo': "You need applause for your feelings. That's not weakness. That's honesty.",
      'Virgo': 'You count your feelings like pills. Measure. Manage. Rarely express.',
      'Libra': "You feel in relation to others. Alone, you don't know what you feel.",
      'Scorpio': 'Your emotions are a flood. You either drown or learn to breathe underwater.',
      'Sagittarius': 'You escape your feelings by running toward the next thing.',
      'Capricorn': "You bury feelings like treasure. Dig them up when it's safe. Never is.",
      'Aquarius': 'You detach to survive. Then wonder why you feel nothing.',
      'Pisces': "You absorb everyone's pain. Call it empathy. Call it drowning."
    },
    'Mercury': {
      'Aries': 'You speak fire. Regret it later. Speak fire again.',
      'Taurus': 'Your words are slow. Heavy. Built to last.',
      'Gemini': "You rewrite the story every time you tell it. That's not lying. That's editing.",
      'Cancer': 'You speak in memories. Past tense is your native tongue.',
      'Leo': "Every word is a performance. You're not fake. You're just always on stage.",
      'Virgo': 'You edit as you speak. Three sentences become one. One becomes silence.',
      'Libra': 'You say what keeps the peace. Truth comes second.',
      'Scorpio': 'You speak in codes. Only the worthy decipher.',
      'Sagittarius': "You preach. Can't help it. The truth chose you, not the other way around.",
      'Capricorn': 'Your words are scaffolding. Built to hold weight, not beauty.',
      'Aquarius': 'You think sideways. The rest of us play catch-up.',
      'Pisces': 'You speak in metaphors. Reality is too sharp for your tongue.'
    },
    'Venus': {
      'Aries': 'You love like a match. Fast. Hot. Over.',
      'Taurus': "You love slow and deep. Once you're in, you're in.",
      'Gemini': 'You love with words. The body is secondary. The mind is everything.',
      'Cancer': 'You love like home. Safe. Soft. Hard to leave.',
      'Leo': "You love loudly. If it's quiet, it's not love.",
      'Virgo': 'You love by fixing. Acts of service are your love language. All of them.',
      'Libra': 'You love the idea of love. The person second.',
      'Scorpio': "You love 'til it bleeds. Yours. Theirs. Doesn't matter.",
      'Sagittarius': 'You love freedom more than the person. They need to understand that.',
      'Capricorn': 'You earn love. Give love. But asking for love? Terrifying.',
      'Aquarius': 'You love humanity. The individual? That\'s harder.',
      'Pisces': "You love everyone. Including the ones who don't deserve it. Especially them."
    },
    'Mars': {
      'Aries': 'You strike first. Ask questions later. Or never.',
      'Taurus': "You move when you're ready. Not before. Pushing you makes it worse.",
      'Gemini': 'You dart and weave. Fighting you is like fighting smoke.',
      'Cancer': 'You fight for others. For yourself? That\'s harder.',
      'Leo': "Every fight is theater. You're here to win and look good doing it.",
      'Virgo': 'You sharpen the blade before you swing. Preparation is your weapon.',
      'Libra': "You fight fair. Even when they don't. Especially when they don't.",
      'Scorpio': "You strike from the shadows. By the time they see you, it's over.",
      'Sagittarius': 'You fight for principles. People are secondary.',
      'Capricorn': 'You conquer. Slowly. Methodically. Inevitably.',
      'Aquarius': 'You rebel quietly. Then loudly. Then you disappear.',
      'Pisces': "You avoid conflict. Until you can't. Then you dissolve."
    }
  };

  return whispers[planet]?.[sign] || `${planet} in ${sign}. Rare. Intense. You.`;
}
