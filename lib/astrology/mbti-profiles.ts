/**
 * MBTI Personality Profiles & Tone Adjustment for Astrological Transits
 * Translates generic transit language into personality-specific guidance
 */

import { MBTIType } from '../mbti-system';

export interface MBTIProfile {
  type: MBTIType;
  cosmicTendencies: string[];
  transitStyle: string;
  keywords: string[];
}

/**
 * Comprehensive MBTI profiles with astrological resonance patterns
 */
export const MBTI_PROFILES: Record<MBTIType, MBTIProfile> = {
  INFJ: {
    type: 'INFJ',
    cosmicTendencies: [
      'Highly sensitive to Moon phases',
      'Absorbs Pluto intensity deeply',
      'Dreams during Neptune transits',
      'Feels collective shifts before they manifest',
      'North Node transits feel like destiny calling'
    ],
    transitStyle: 'Experiences transits as inner spiritual events before outer manifestation',
    keywords: ['intuitive', 'purposeful', 'depth', 'vision', 'transformation', 'alignment']
  },
  
  INFP: {
    type: 'INFP',
    cosmicTendencies: [
      'Venus transits feel like soul recognition',
      'Neptune aspects heighten creativity',
      'Moon phases affect emotional landscape',
      'Chiron transits bring healing breakthroughs',
      'Values authenticity in all planetary energies'
    ],
    transitStyle: 'Processes transits through emotional and creative expression',
    keywords: ['authentic', 'idealistic', 'heart-centered', 'gentle', 'values', 'meaning']
  },
  
  INTJ: {
    type: 'INTJ',
    cosmicTendencies: [
      'Saturn transits activate strategic planning',
      'Uranus aspects spark system redesign',
      'Views transits as data points in larger pattern',
      'Pluto intensity drives transformation projects',
      'Mercury retrogrades = optimization opportunities'
    ],
    transitStyle: 'Analyzes transits as strategic timing indicators for long-term goals',
    keywords: ['strategic', 'analytical', 'systematic', 'visionary', 'independent', 'mastery']
  },
  
  INTP: {
    type: 'INTP',
    cosmicTendencies: [
      'Mercury transits ignite curiosity cascades',
      'Uranus aspects feel like intellectual liberation',
      'Studies transits to understand cosmic mechanics',
      'Neptune can dissolve logical frameworks (uncomfortable)',
      'Enjoys mapping transit patterns theoretically'
    ],
    transitStyle: 'Intellectualizes transits as puzzles to solve and systems to decode',
    keywords: ['curious', 'logical', 'theoretical', 'innovative', 'analytical', 'exploratory']
  },
  
  ENFJ: {
    type: 'ENFJ',
    cosmicTendencies: [
      'Jupiter transits expand leadership opportunities',
      'Venus aspects enhance relational harmony',
      'Feels collective transits as group missions',
      'Moon phases guide emotional availability',
      'Inspires others through difficult Saturn lessons'
    ],
    transitStyle: 'Channels transit energy into service and uplifting others',
    keywords: ['inspiring', 'compassionate', 'leader', 'visionary', 'growth', 'connection']
  },
  
  ENFP: {
    type: 'ENFP',
    cosmicTendencies: [
      'Jupiter transits = adventure activation',
      'Mars energy fuels enthusiastic action',
      'Multiple transits feel exciting (not overwhelming)',
      'Neptune aspects unlock creative flow states',
      'Moon phases don\'t constrain spontaneity'
    ],
    transitStyle: 'Greets transits as invitations to explore and create',
    keywords: ['enthusiastic', 'creative', 'spontaneous', 'authentic', 'possibility', 'freedom']
  },
  
  ENTJ: {
    type: 'ENTJ',
    cosmicTendencies: [
      'Saturn transits = structure implementation phase',
      'Mars aspects fuel decisive action',
      'Views transits as execution windows',
      'Pluto intensity drives ambitious goals',
      'Impatient with slow-moving outer planet aspects'
    ],
    transitStyle: 'Leverages transits as strategic timing for bold moves',
    keywords: ['decisive', 'strategic', 'commanding', 'efficient', 'ambitious', 'results']
  },
  
  ENTP: {
    type: 'ENTP',
    cosmicTendencies: [
      'Mercury transits spark debate and innovation',
      'Uranus aspects = breakthrough thinking',
      'Enjoys chaotic multi-planet transit periods',
      'Saturn can feel restrictive (learns to work with it)',
      'Tests transit predictions experimentally'
    ],
    transitStyle: 'Debates with transit energy and invents creative responses',
    keywords: ['innovative', 'clever', 'adaptable', 'curious', 'debate', 'possibilities']
  },
  
  ISFJ: {
    type: 'ISFJ',
    cosmicTendencies: [
      'Moon phases deeply affect routines',
      'Saturn transits feel like duty and protection',
      'Prefers predictable transit patterns',
      'Uranus disruptions require adjustment time',
      'Serves others through difficult transits'
    ],
    transitStyle: 'Maintains stability for others during transit turbulence',
    keywords: ['caring', 'reliable', 'protective', 'traditional', 'service', 'grounded']
  },
  
  ISFP: {
    type: 'ISFP',
    cosmicTendencies: [
      'Venus transits enhance artistic expression',
      'Lives in present moment regardless of transits',
      'Mars aspects motivate physical creativity',
      'Neptune aspects feel natural and flowing',
      'Expresses transits through art/music/movement'
    ],
    transitStyle: 'Embodies transit energy through sensory and creative experience',
    keywords: ['artistic', 'present', 'authentic', 'gentle', 'expressive', 'harmonious']
  },
  
  ISTJ: {
    type: 'ISTJ',
    cosmicTendencies: [
      'Saturn transits validate hard work',
      'Respects traditional astrological wisdom',
      'Builds systems to track transit patterns',
      'Neptune aspects require faith (challenging)',
      'Steady through all planetary weather'
    ],
    transitStyle: 'Applies discipline and method to navigate all transits',
    keywords: ['reliable', 'disciplined', 'practical', 'thorough', 'traditional', 'steady']
  },
  
  ISTP: {
    type: 'ISTP',
    cosmicTendencies: [
      'Mars transits activate hands-on problem solving',
      'Adapts to transits in real-time',
      'Analyzes transit mechanics practically',
      'Doesn\'t overthink planetary aspects',
      'Crisis transits = opportunity for action'
    ],
    transitStyle: 'Responds to transits with practical, efficient action',
    keywords: ['practical', 'adaptable', 'analytical', 'efficient', 'action', 'present']
  },
  
  ESFJ: {
    type: 'ESFJ',
    cosmicTendencies: [
      'Moon transits guide social interactions',
      'Venus aspects enhance hospitality',
      'Maintains group harmony through Saturn lessons',
      'Organizes community through Jupiter expansions',
      'Feels responsible for others during hard transits'
    ],
    transitStyle: 'Channels transit energy into caring for community',
    keywords: ['caring', 'organized', 'social', 'traditional', 'helpful', 'responsible']
  },
  
  ESFP: {
    type: 'ESFP',
    cosmicTendencies: [
      'Mars transits = immediate action and fun',
      'Lives fully in current transit moment',
      'Jupiter aspects multiply joy and adventure',
      'Brings lightness to heavy Pluto/Saturn periods',
      'Doesn\'t dwell on past or future transits'
    ],
    transitStyle: 'Celebrates transit energy through spontaneous experience',
    keywords: ['spontaneous', 'energetic', 'fun', 'present', 'enthusiastic', 'social']
  },
  
  ESTJ: {
    type: 'ESTJ',
    cosmicTendencies: [
      'Saturn transits = time to organize and execute',
      'Mars aspects fuel productivity',
      'Manages others through transit challenges',
      'Respects astrological tradition and proven methods',
      'Implements transit advice systematically'
    ],
    transitStyle: 'Organizes life according to transit timing and proven principles',
    keywords: ['organized', 'decisive', 'practical', 'leadership', 'efficient', 'traditional']
  },
  
  ESTP: {
    type: 'ESTP',
    cosmicTendencies: [
      'Mars transits = immediate bold action',
      'Thrives under intense multi-planet aspects',
      'Turns transit challenges into adventures',
      'Impatient with slow Neptune/Pluto transits',
      'Takes calculated risks during Jupiter aspects'
    ],
    transitStyle: 'Seizes transit momentum for bold, decisive moves',
    keywords: ['bold', 'action', 'direct', 'energetic', 'opportunistic', 'practical']
  }
};

/**
 * Effect types that can be detected in transits
 */
export type TransitEffect = 
  | 'exact' 
  | 'heavy' 
  | 'positive' 
  | 'transformative' 
  | 'mental' 
  | 'emotional' 
  | 'relationship' 
  | 'career' 
  | 'spiritual'
  | 'expansion'
  | 'restriction'
  | 'sudden'
  | 'dissolving'
  | 'healing';

/**
 * Generate personality-specific transit interpretation
 * This is the core tone adjustment function
 */
export function getDetailedMBTITranslation(
  mbtiType: MBTIType,
  effects: TransitEffect[],
  activeAspects: string[]
): string {
  const profile = MBTI_PROFILES[mbtiType];
  
  if (!profile) {
    return `Today's transits: ${activeAspects.join(', ')}`;
  }

  // Build personality-aware summary
  let summary = `As an ${mbtiType}`;
  
  // Add profile-specific opening based on effect types
  if (effects.includes('heavy') || effects.includes('transformative')) {
    if (['INFJ', 'INFP', 'ENFJ', 'ENFP'].includes(mbtiType)) {
      summary += ', today\'s deep transits speak directly to your soul. ';
    } else if (['INTJ', 'INTP', 'ENTJ', 'ENTP'].includes(mbtiType)) {
      summary += ', today\'s intense aspects present strategic opportunities for transformation. ';
    } else if (['ISFJ', 'ISTJ', 'ESFJ', 'ESTJ'].includes(mbtiType)) {
      summary += ', today\'s challenging transits call for your steady, reliable approach. ';
    } else {
      summary += ', today\'s dynamic transits invite immediate, authentic response. ';
    }
  } else if (effects.includes('positive') || effects.includes('expansion')) {
    if (['INFJ', 'INFP', 'ISFP', 'ISFJ'].includes(mbtiType)) {
      summary += ', today\'s harmonious energies create gentle invitations for growth. ';
    } else if (['INTJ', 'INTP', 'ISTJ', 'ISTP'].includes(mbtiType)) {
      summary += ', today\'s favorable aspects offer optimal conditions for systematic progress. ';
    } else if (['ENFJ', 'ENFP', 'ESFJ', 'ESFP'].includes(mbtiType)) {
      summary += ', today\'s expansive energies amplify your natural enthusiasm! ';
    } else {
      summary += ', today\'s supportive transits fuel bold action. ';
    }
  } else {
    summary += ', today invites you to apply your natural strengths. ';
  }

  // Add specific aspect guidance with personality flavor
  const aspectGuidance: string[] = [];
  
  activeAspects.forEach(aspectStr => {
    const lower = aspectStr.toLowerCase();
    
    // Jupiter aspects
    if (lower.includes('jupiter')) {
      if (lower.includes('trine') || lower.includes('sextile')) {
        if (['ENFP', 'ENTP', 'ESFP', 'ESTP'].includes(mbtiType)) {
          aspectGuidance.push(`${aspectStr} sparks adventure—trust your spontaneous instincts`);
        } else if (['INFJ', 'INTJ', 'INFP', 'INTP'].includes(mbtiType)) {
          aspectGuidance.push(`${aspectStr} expands your vision—integrate insights strategically`);
        } else {
          aspectGuidance.push(`${aspectStr} brings growth through reliable action`);
        }
      }
    }
    
    // Saturn aspects
    else if (lower.includes('saturn')) {
      if (lower.includes('square') || lower.includes('opposition')) {
        if (['INTJ', 'ISTJ', 'ESTJ', 'ENTJ'].includes(mbtiType)) {
          aspectGuidance.push(`${aspectStr} structures your mastery—embrace the discipline`);
        } else if (['INFP', 'ENFP', 'ISFP', 'ESFP'].includes(mbtiType)) {
          aspectGuidance.push(`${aspectStr} asks for boundaries—protect your authentic energy`);
        } else {
          aspectGuidance.push(`${aspectStr} builds character through patient effort`);
        }
      }
    }
    
    // Pluto aspects
    else if (lower.includes('pluto')) {
      if (['INFJ', 'INTJ', 'ENFJ', 'ENTJ'].includes(mbtiType)) {
        aspectGuidance.push(`${aspectStr} activates your transformational power—go deep`);
      } else if (['ISFJ', 'ISTJ', 'ESFJ', 'ESTJ'].includes(mbtiType)) {
        aspectGuidance.push(`${aspectStr} requires releasing control—trust the process`);
      } else {
        aspectGuidance.push(`${aspectStr} brings intense transformation—stay present`);
      }
    }
    
    // Uranus aspects
    else if (lower.includes('uranus')) {
      if (['INTP', 'ENTP', 'INTJ', 'ENTJ'].includes(mbtiType)) {
        aspectGuidance.push(`${aspectStr} catalyzes innovative breakthroughs—experiment boldly`);
      } else if (['ISFJ', 'ISTJ', 'ESFJ', 'ESTJ'].includes(mbtiType)) {
        aspectGuidance.push(`${aspectStr} disrupts routine—adapt with your steady wisdom`);
      } else {
        aspectGuidance.push(`${aspectStr} awakens new possibilities—embrace the shift`);
      }
    }
    
    // Neptune aspects
    else if (lower.includes('neptune')) {
      if (['INFJ', 'INFP', 'ENFJ', 'ENFP'].includes(mbtiType)) {
        aspectGuidance.push(`${aspectStr} opens spiritual channels—trust your intuition`);
      } else if (['INTJ', 'INTP', 'ISTJ', 'ISTP'].includes(mbtiType)) {
        aspectGuidance.push(`${aspectStr} dissolves logic—allow mystery to inform reason`);
      } else {
        aspectGuidance.push(`${aspectStr} invites creative flow—surrender to inspiration`);
      }
    }
    
    // Venus aspects
    else if (lower.includes('venus')) {
      if (['INFJ', 'INFP', 'ENFJ', 'ENFP'].includes(mbtiType)) {
        aspectGuidance.push(`${aspectStr} harmonizes relationships—lead with heart`);
      } else if (['ESFJ', 'ESFP', 'ISFJ', 'ISFP'].includes(mbtiType)) {
        aspectGuidance.push(`${aspectStr} enhances beauty and connection—celebrate it`);
      } else {
        aspectGuidance.push(`${aspectStr} brings relational ease—appreciate the flow`);
      }
    }
    
    // Mars aspects
    else if (lower.includes('mars')) {
      if (['ENTJ', 'ESTJ', 'ESTP', 'ENTP'].includes(mbtiType)) {
        aspectGuidance.push(`${aspectStr} fuels decisive action—channel your command`);
      } else if (['ISTJ', 'ISTP', 'INTJ', 'INTP'].includes(mbtiType)) {
        aspectGuidance.push(`${aspectStr} energizes strategic execution—act with precision`);
      } else {
        aspectGuidance.push(`${aspectStr} activates courage—trust your inner warrior`);
      }
    }
    
    // Mercury aspects
    else if (lower.includes('mercury')) {
      if (['INTP', 'ENTP', 'INTJ', 'ENTJ'].includes(mbtiType)) {
        aspectGuidance.push(`${aspectStr} sharpens analytical thinking—leverage your logic`);
      } else if (['ENFP', 'INFP', 'ENFJ', 'INFJ'].includes(mbtiType)) {
        aspectGuidance.push(`${aspectStr} connects ideas to meaning—express your truth`);
      } else {
        aspectGuidance.push(`${aspectStr} clarifies communication—speak with confidence`);
      }
    }
    
    // Moon aspects
    else if (lower.includes('moon')) {
      if (['INFJ', 'INFP', 'ISFJ', 'ISFP'].includes(mbtiType)) {
        aspectGuidance.push(`${aspectStr} deepens emotional awareness—honor your feelings`);
      } else if (['INTJ', 'INTP', 'ISTJ', 'ISTP'].includes(mbtiType)) {
        aspectGuidance.push(`${aspectStr} requires emotional integration—balance mind and heart`);
      } else {
        aspectGuidance.push(`${aspectStr} heightens emotional energy—stay centered`);
      }
    }
  });

  // Add closing guidance based on personality
  let closing = '';
  if (effects.includes('exact')) {
    if (['INFJ', 'INTJ', 'INFP', 'INTP'].includes(mbtiType)) {
      closing = `These exact transits mark a pivotal moment—trust your ${profile.keywords[0]} nature to guide you.`;
    } else if (['ENFJ', 'ENTJ', 'ENFP', 'ENTP'].includes(mbtiType)) {
      closing = `Exact aspects amplify your energy—lead with your ${profile.keywords[0]} strengths.`;
    } else {
      closing = `These precise alignments support your ${profile.keywords[0]} approach.`;
    }
  } else {
    closing = `Lean into ${profile.keywords.slice(0, 2).join(' and ')} action.`;
  }

  // Assemble final summary
  if (aspectGuidance.length > 0) {
    summary += aspectGuidance.join('. ') + '. ';
  }
  summary += closing;

  return summary;
}

/**
 * Get cosmic tendency strings for a personality type
 */
export function getCosmicTendencies(mbtiType: MBTIType): string[] {
  return MBTI_PROFILES[mbtiType]?.cosmicTendencies || [];
}

/**
 * Get transit style description for a personality type
 */
export function getTransitStyle(mbtiType: MBTIType): string {
  return MBTI_PROFILES[mbtiType]?.transitStyle || 'Experiences transits uniquely';
}

/**
 * Get personality keywords for a type
 */
export function getPersonalityKeywords(mbtiType: MBTIType): string[] {
  return MBTI_PROFILES[mbtiType]?.keywords || [];
}
