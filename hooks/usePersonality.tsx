import { useState, useCallback } from 'react';
import { BirthData } from '@/components/astrology/BirthChartCalculator';
import type { BirthChartData } from '@/types/astrology';
import { MBTIType } from '@/lib/mbti-overlay';
import { readJsonResponse, resolveApiUrl } from '@/lib/api-client';
import { isStandaloneMobileClient } from '@/lib/runtime-mode';
import { computeMBTIDual } from '@/lib/astrology/mbtiFusion';

export interface DualOverlay {
  hardware: {
    label: string;
    sublabel: string;
    mbtiType: string;
    confidence: number;
    archetype: string;
    description: string;
  };
  firmware: {
    label: string;
    sublabel: string;
    mbtiType: string;
    confidence: number;
    archetype: string;
    description: string;
  };
  finalType: string;
  finalConfidence: number;
}

export interface PersonalityProfile {
  mbtiType: MBTIType;
  dualOverlay?: DualOverlay;
  source?: 'swiss-real' | 'mock-fallback';
}

export function usePersonality() {
  const [mbtiType, setMbtiType] = useState<MBTIType | null>(null);
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculatePersonality = useCallback(
    async (birthData: BirthData, chartData?: BirthChartData): Promise<MBTIType | null> => {
      setLoading(true);
      setError(null);

      // In standalone mode: compute MBTI client-side directly from chart data
      if (isStandaloneMobileClient) {
        try {
          // Check cached MBTI in localStorage first
          const cached = localStorage.getItem('merlin_mbti_type');
          if (cached && !chartData) {
            const nextMbti = cached as MBTIType;
            setMbtiType(nextMbti);
            return nextMbti;
          }

          if (chartData) {
            const dual = computeMBTIDual(chartData);
            const nextMbti = (dual.type || dual.firmware?.type || 'INFJ') as MBTIType;
            setMbtiType(nextMbti);
            setProfile({
              mbtiType: nextMbti,
              dualOverlay: {
                hardware: {
                  label: dual.hardware?.type || nextMbti,
                  sublabel: 'Outer expression',
                  mbtiType: dual.hardware?.type || nextMbti,
                  confidence: dual.hardware?.confidence || 70,
                  archetype: dual.hardware?.type || nextMbti,
                  description: 'Astrological hardware layer',
                },
                firmware: {
                  label: dual.firmware?.type || nextMbti,
                  sublabel: 'Inner core',
                  mbtiType: dual.firmware?.type || nextMbti,
                  confidence: dual.firmware?.confidence || 70,
                  archetype: dual.firmware?.type || nextMbti,
                  description: 'Astrological firmware layer',
                },
                finalType: nextMbti,
                finalConfidence: dual.confidence || 70,
              },
              source: 'swiss-real',
            });
            localStorage.setItem('merlin_mbti_type', nextMbti);
            return nextMbti;
          }

          return null;
        } catch (err) {
          console.error('[usePersonality] Client-side MBTI error:', err);
          return null;
        } finally {
          setLoading(false);
        }
      }

      try {
        const response = await fetch(resolveApiUrl('/api/personality'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthDate: birthData.date,
            birthTime: birthData.time,
            lat: birthData.latitude,
            lon: birthData.longitude
          })
        });

        if (!response.ok) {
          // Silently handle personality calculation failures
          console.log('Personality calculation unavailable:', response.statusText);
          return null;
        }

        const result = await readJsonResponse<{
          success: boolean;
          error?: string;
          source?: 'swiss-real' | 'mock-fallback';
          data: {
            finalType?: MBTIType;
            mbtiType?: MBTIType;
            dualOverlay?: DualOverlay;
          };
        }>(response, 'personality');
        if (!result.success) {
          throw new Error(result.error || 'Failed to derive personality');
        }

        // API returns { hardware, firmware, finalType, dualOverlay } - use finalType as the canonical MBTI type
        const nextMbti = (result.data.finalType || result.data.mbtiType) as MBTIType;
        setMbtiType(nextMbti);
        setProfile({
          mbtiType: nextMbti,
          dualOverlay: result.data.dualOverlay,
          source: result.source
        });
        return nextMbti;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('Personality error:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setMbtiType(null);
    setProfile(null);
    setError(null);
  }, []);

  return { mbtiType, profile, dualOverlay: profile?.dualOverlay || null, loading, error, calculatePersonality, reset };
}
