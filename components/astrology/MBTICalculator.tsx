"use client";

import { motion } from 'framer-motion';
import { usePersonality } from '@/hooks/usePersonality';
import { BirthChartData } from '@/components/astrology/BirthChartCalculator';
import { Sparkles, Cpu, Radio } from 'lucide-react';

interface MBTICalculatorProps {
  chartData: BirthChartData | null;
}

export function MBTICalculator({ chartData }: MBTICalculatorProps) {
  const { mbtiType, loading } = usePersonality();

  if (loading) {
    return (
      <div className="p-6 bg-slate-900/50 rounded-xl border border-amber-500/20 backdrop-blur-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-700/50 rounded w-32"></div>
          <div className="h-4 bg-slate-700/50 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!chartData || !mbtiType) {
    return (
      <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-700/30 backdrop-blur-sm">
        <div className="text-center text-slate-400 space-y-2">
          <Sparkles className="w-8 h-8 mx-auto text-amber-400/50" />
          <p className="text-sm">Calculate your chart to reveal your cosmic type</p>
        </div>
      </div>
    );
  }

  // Hardware: What people see (Outer personality - Extraversion/Introversion + Dominant function)
  const hardware = getHardware(mbtiType);
  
  // Firmware: What truly drives you (Inner process - Auxiliary + Tertiary functions)
  const firmware = getFirmware(mbtiType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl border border-amber-500/30 backdrop-blur-sm space-y-4"
    >
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-amber-400" />
        <h3 className="text-xl font-bold text-amber-300">Your Cosmic Type</h3>
      </div>

      {/* MBTI Type Badge */}
      <div className="inline-block px-4 py-2 bg-amber-500/20 border-2 border-amber-400/40 rounded-lg">
        <span className="text-2xl font-bold text-amber-200 tracking-wider">{mbtiType}</span>
      </div>

      {/* Hardware */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wider">Hardware</h4>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed pl-6">{hardware}</p>
        <p className="text-xs text-purple-400/60 italic pl-6">What people see first</p>
      </div>

      {/* Firmware */}
      <div className="space-y-2 pt-3 border-t border-amber-500/20">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Firmware</h4>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed pl-6">{firmware}</p>
        <p className="text-xs text-amber-400/60 italic pl-6">What truly drives you beneath the surface</p>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-400 italic text-center">
          The stars said it first. Psychology just caught up.
        </p>
      </div>
    </motion.div>
  );
}

function getHardware(type: string): string {
  const hardware: Record<string, string> = {
    // Analysts (NT)
    INTJ: "Strategic architect — Cool precision, sees systems others miss",
    INTP: "Abstract theorist — Curious mind, questions everything relentlessly",
    ENTJ: "Natural commander — Confident leader, moves decisively through chaos",
    ENTP: "Inventive debater — Quick wit, challenges conventions fearlessly",

    // Diplomats (NF)
    INFJ: "Visionary counselor — Quiet intensity, reads people like books",
    INFP: "Idealistic dreamer — Gentle presence, carries deep convictions",
    ENFJ: "Charismatic teacher — Warm energy, inspires others to grow",
    ENFP: "Enthusiastic champion — Infectious spark, connects ideas and people",

    // Sentinels (SJ)
    ISTJ: "Reliable inspector — Steady competence, gets things done right",
    ISFJ: "Devoted protector — Caring attention, remembers every detail",
    ESTJ: "Efficient executive — Direct authority, organizes everything efficiently",
    ESFJ: "Supportive provider — Social harmony, brings people together naturally",

    // Explorers (SP)
    ISTP: "Practical mechanic — Calm mastery, solves problems with hands",
    ISFP: "Artistic adventurer — Gentle creativity, expresses through aesthetics",
    ESTP: "Bold entrepreneur — High energy, thrives in risky situations",
    ESFP: "Spontaneous entertainer — Magnetic presence, lives for the moment",
  };
  return hardware[type] || "Cosmic blueprint calculating...";
}

function getFirmware(type: string): string {
  const firmware: Record<string, string> = {
    // Analysts (NT)
    INTJ: "You plan wars in silence. Ambition runs deeper than words.",
    INTP: "Your mind is a universe. Understanding is your endless quest.",
    ENTJ: "Your vision moves mountains. Others follow; you lead.",
    ENTP: "You debate reality itself. Rules are mere suggestions.",

    // Diplomats (NF)
    INFJ: "You see souls before faces. Intuition is your prophecy.",
    INFP: "You feel the world's heartbeat. Authenticity is your religion.",
    ENFJ: "You gather people like constellations. Your warmth transforms lives.",
    ENFP: "You start fires with ideas. Your energy rewrites reality.",

    // Sentinels (SJ)
    ISTJ: "You are the bedrock. Duty flows through your veins.",
    ISFJ: "You are loyalty incarnate. Care is your language.",
    ESTJ: "You build empires methodically. Order flows from your will.",
    ESFJ: "You are the glue binding hearts. Harmony heals through you.",

    // Explorers (SP)
    ISTP: "You decode the machine. Action is your thinking.",
    ISFP: "Beauty lives in your touch. Your presence is art.",
    ESTP: "You thrive in chaos. Risk is your breath.",
    ESFP: "You are the moment alive. Life happens through you.",
  };
  return firmware[type] || "Deep processing...";
}
