'use client';

import { PlanetPosition } from './BirthChartCalculator';

interface PlanetInfoProps {
  planet: PlanetPosition;
  className?: string;
}

export function PlanetInfo({ planet, className = '' }: PlanetInfoProps) {
  const signEmojis: Record<string, string> = {
    Aries: '♈',
    Taurus: '♉',
    Gemini: '♊',
    Cancer: '♋',
    Leo: '♌',
    Virgo: '♍',
    Libra: '♎',
    Scorpio: '♏',
    Sagittarius: '♐',
    Capricorn: '♑',
    Aquarius: '♒',
    Pisces: '♓',
  };

  const planetIcons: Record<string, string> = {
    Sun: '☉',
    Moon: '☽',
    Mercury: '☿',
    Venus: '♀',
    Mars: '♂',
    Jupiter: '♃',
    Saturn: '♄',
    Uranus: '♅',
    Neptune: '♆',
    Pluto: '♇',
    'North Node': '☊',
    'South Node': '☋',
    'True Node': '☊',
  };

  return (
    <div className={`bg-gray-800/50 p-4 rounded-lg border border-gray-700 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="text-2xl">
          {planetIcons[planet.name] || '•'}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{planet.name}</h3>
          <div className="text-sm text-gray-300">
            {planet.degree}°{planet.minute}' {planet.second}" {planet.sign} {signEmojis[planet.sign] || ''}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            House {planet.house} • {planet.longitude.toFixed(4)}°
          </div>
        </div>
      </div>
      
      {planet.dignity && planet.dignity.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <h4 className="text-xs font-semibold text-gray-400 mb-1">Dignities</h4>
          <div className="flex flex-wrap gap-1">
            {planet.dignity.map((d, i) => (
              <span 
                key={i}
                className="px-2 py-0.5 text-xs rounded-full bg-blue-900/50 text-blue-200"
              >
                {d.type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
