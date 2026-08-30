// lib/personality/fusion.ts

import { type MBTIType } from '@/shared/schema';
import { computeMBTI, computeMBTIDual, type MbtiFusionOptions } from '@/lib/astrology/mbtiFusion';
import { isMbtiDebugEnabled } from '@/lib/debug';

/**
 * Get MBTI type from birth chart using sophisticated astrological fusion
 * (Legacy single-layer function - returns firmware core)
 */
export function getMBTI(chart: any): MBTIType {
  try {
    // Use the sophisticated MBTI fusion engine (returns firmware)
    const result = computeMBTI(chart);
    if (isMbtiDebugEnabled()) {
      console.log('[getMBTI] MBTI result:', result.type, 'confidence:', result.confidence);
    }
    return result.type as MBTIType;
  } catch (error) {
    console.error('[getMBTI] Error computing MBTI:', error);
    throw error;
  }
}

/**
 * Get DUAL-LAYER MBTI from birth chart
 * Returns both Hardware (mask) and Firmware (inner core) with confidence scores
 * Preferred for modern implementations
 */
export function getMBTIDual(chart: any, options?: MbtiFusionOptions) {
  try {
    const result = computeMBTIDual(chart, options);
    if (isMbtiDebugEnabled()) {
      console.log('[getMBTIDual] Hardware:', result.hardware.type, `(${result.hardware.confidence}%)`);
      console.log('[getMBTIDual] Firmware:', result.firmware.type, `(${result.firmware.confidence}%)`);
      console.log('[getMBTIDual] Core type:', result.type, `(${result.confidence}%)`);
    }
    return result;
  } catch (error) {
    console.error('[getMBTIDual] Error computing dual MBTI:', error);
    throw error;
  }
}

export const PERSONALITY_LINES: Record<MBTIType, string[]> = {
  // Intuitive-Thinking (NT) - The Rationals
  INTJ: ["You plan wars in silence.", "People think you're cold. You're just three steps ahead.", "Your ambition runs deeper than words."],
  INTP: ["Your mind is a universe.", "You question everything—even yourself.", "Understanding is your quest."],
  ENTJ: ["You command rooms without speaking.", "Your vision moves mountains.", "Others follow. You lead."],
  ENTP: ["You debate reality itself.", "Adventure calls your name.", "Rules are suggestions to you."],

  // Intuitive-Feeling (NF) - The Idealists
  INFJ: ["You see souls before faces.", "Your intuition is prophecy.", "The world needs your wisdom."],
  INFP: ["You feel the world's heartbeat.", "Authenticity is your religion.", "Your truth is radical."],
  ENFJ: ["You gather people like constellations.", "Your warmth transforms lives.", "You inspire revolutions."],
  ENFP: ["You start fires with ideas.", "You love everyone until you don't.", "Your energy rewrites reality."],

  // Sensing-Thinking (ST) - The Guardians
  ISTJ: ["You are the bedrock.", "Duty flows through your veins.", "The world rests on your shoulders."],
  ISFJ: ["You are loyalty incarnate.", "Care is your language.", "You hold others' worlds together."],
  ESTJ: ["You build empires methodically.", "Respect is earned, not given.", "Order flows from your will."],
  ESFJ: ["You are the glue binding hearts.", "Community is your sanctuary.", "Your harmony heals."],

  // Sensing-Feeling (SF) - The Artisans
  ISTP: ["You decode the machine.", "Action is your thinking.", "Your hands speak truth."],
  ISFP: ["Beauty lives in your touch.", "You feel through aesthetics.", "Your presence is art."],
  ESTP: ["You thrive in chaos.", "Risk is your breath.", "Adventure owns you."],
  ESFP: ["You are the moment alive.", "Joy radiates from your core.", "Life happens through you."],
};