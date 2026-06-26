'use client';

import type { PlanetPosition } from '@/types/astrology';
import type { ZodiacSignName } from '@/lib/astrology/zodiac';
import { PlanetDetailCard } from '@/components/dashboard/PlanetDetailCard';
import { SignDetailCard } from '@/components/dashboard/SignDetailCard';

interface WheelSelectionPanelProps {
  selectedPlanet: string | null;
  selectedSign: ZodiacSignName | null;
  planets: PlanetPosition[];
  planetInterpretations?: Array<{ planet: string; interpretation: string }>;
  onClear: () => void;
  onPlanetSelect?: (name: string | null) => void;
  onAskContext?: (label: string, prompt: string) => void;
}

export function WheelSelectionPanel({
  selectedPlanet,
  selectedSign,
  planets,
  planetInterpretations = [],
  onClear,
  onPlanetSelect,
  onAskContext,
}: WheelSelectionPanelProps) {
  if (!selectedPlanet && !selectedSign) {
    return (
      <p className="text-sm text-slate-400 text-center py-2">
        Click any planet or zodiac sign on the wheel above to explore your chart.
      </p>
    );
  }

  if (selectedPlanet) {
    const planet = planets.find((p) => p.name === selectedPlanet);
    if (!planet) {
      return (
        <p className="text-sm text-slate-400 text-center py-2">
          {selectedPlanet} placement not found in chart data.
        </p>
      );
    }

    const apiReading = planetInterpretations.find(
      (item) => item.planet.toLowerCase() === selectedPlanet.toLowerCase()
    )?.interpretation;

    return (
      <PlanetDetailCard
        planet={planet}
        interpretation={apiReading}
        onClear={onClear}
        onAskContext={onAskContext}
      />
    );
  }

  return (
    <SignDetailCard
      signName={selectedSign!}
      planets={planets}
      onClear={onClear}
      onPlanetSelect={(name) => {
        onPlanetSelect?.(name);
      }}
      onAskContext={onAskContext}
    />
  );
}