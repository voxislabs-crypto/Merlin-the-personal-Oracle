import { sanitizeCopyText } from '@/lib/safety/copy-safety';
import type {
  AtmosphereDriver,
  AtmosphereDriverSource,
  ComputeAtmosphereInput,
} from '@/lib/atmosphere/types';

interface DriverCandidate {
  label: string;
  source: AtmosphereDriverSource;
  rationaleSeed?: string;
  priority: number;
}

export function resolveDominantDriver(input: ComputeAtmosphereInput, intensity: number): AtmosphereDriver {
  const candidates: DriverCandidate[] = [];

  const topDriver = input.explainability?.topDrivers?.[0];
  if (topDriver?.label) {
    candidates.push({
      label: topDriver.label,
      source: 'pressure',
      rationaleSeed: topDriver.reason,
      priority: 100,
    });
  }

  const topEvent = input.predictive?.events?.[0];
  if (topEvent?.transit?.transitingPlanet && topEvent.transit.natalPlanet) {
    candidates.push({
      label: `${topEvent.transit.transitingPlanet} ${topEvent.transit.aspect || 'aspect'} ${topEvent.transit.natalPlanet}`,
      source: 'transit',
      rationaleSeed: topEvent.narrative?.whisper,
      priority: 90,
    });
  }

  const topStorm = input.storms?.storms?.[0];
  if (topStorm) {
    const stormLabel =
      topStorm.title ||
      `${topStorm.transitingPlanet || 'Planet'} ${topStorm.aspect || 'aspect'} ${topStorm.natalPlanet || 'point'}`;
    candidates.push({
      label: stormLabel,
      source: 'storm',
      rationaleSeed: topStorm.description,
      priority: 85,
    });
  }

  if (input.forecast?.planetaryHighlights?.[0]) {
    candidates.push({
      label: input.forecast.planetaryHighlights[0],
      source: 'forecast',
      rationaleSeed: input.forecast.summary,
      priority: 70,
    });
  }

  if (input.storms?.weekSummary) {
    candidates.push({
      label: input.storms.weekSummary,
      source: 'storm',
      rationaleSeed: input.storms.weekSummary,
      priority: 60,
    });
  }

  const chosen = candidates.sort((left, right) => right.priority - left.priority)[0];

  if (!chosen) {
    return {
      label: 'Even pressure',
      source: 'fallback',
      rationale: sanitizeCopyText(
        'Life weather is balanced today — support and friction are roughly even. Pace yourself and move deliberately.'
      ),
    };
  }

  return {
    label: chosen.label,
    source: chosen.source,
    rationale: buildRationale(chosen, intensity),
  };
}

function buildRationale(candidate: DriverCandidate, intensity: number): string {
  if (candidate.rationaleSeed?.trim()) {
    return sanitizeCopyText(candidate.rationaleSeed.trim());
  }

  const pressurePhrase =
    intensity >= 75
      ? 'Pressure is elevated'
      : intensity >= 55
        ? 'Mixed life-weather signals are active'
        : 'Supportive life weather is present';

  switch (candidate.source) {
    case 'pressure':
      return sanitizeCopyText(
        `${pressurePhrase} around ${candidate.label}. Pause before major conclusions.`
      );
    case 'storm':
      return sanitizeCopyText(
        `${pressurePhrase} as ${candidate.label} moves through your chart. Simplify your plate and protect energy.`
      );
    case 'transit':
      return sanitizeCopyText(
        `${candidate.label} is coloring your timing today. Stay flexible — prefer reversible steps.`
      );
    case 'forecast':
      return sanitizeCopyText(
        `${pressurePhrase}: ${candidate.label}. Watch how it lands before forcing a big move.`
      );
    default:
      return sanitizeCopyText(
        'Life weather is steady. Clarity rises if you move at an intentional pace.'
      );
  }
}