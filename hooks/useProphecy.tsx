import { useCallback, useState } from 'react';
import type { BirthChartData } from '@/components/astrology/BirthChartCalculator';

export type ProphecyStyle = 'omen' | 'sonnet';

export interface ProphecyData {
  style: ProphecyStyle;
  title: string;
  prophecy: string;
  signals: {
    blessingPlanet: string;
    blessingSign: string;
    challengePlanet: string;
    challengeSign: string;
  };
}

export function useProphecy() {
  const [prophecy, setProphecy] = useState<ProphecyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateProphecy = useCallback(async (params: {
    birthChart: BirthChartData;
    style?: ProphecyStyle;
    ancientLayer?: boolean;
  }): Promise<ProphecyData | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/prophecy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to generate prophecy');
      }

      setProphecy(result.data as ProphecyData);
      return result.data as ProphecyData;
    } catch (err) {
      const parsed = err instanceof Error ? err : new Error('Unknown error');
      setError(parsed);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProphecy(null);
    setError(null);
  }, []);

  return { prophecy, loading, error, generateProphecy, reset };
}
