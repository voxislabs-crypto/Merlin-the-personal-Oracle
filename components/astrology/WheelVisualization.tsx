'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { calculateBirthChart } from '@/lib/engine-fallback';

interface WheelProps {
  chartData: any;
  hoveredPlanet?: string | null;
  setHoveredPlanet?: (name: string | null) => void;
}

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '⛢',
  Neptune: '♆',
  Pluto: '♇'
};

const PLANET_TOOLTIPS: Record<string, string> = {
  Sun: 'Your core essence, vitality, and life force. The center of your being.',
  Moon: 'Your emotional nature, instincts, and inner world. The subconscious mind.',
  Mercury: 'Communication, intellect, and mental processes. How you think and express.',
  Venus: 'Love, beauty, values, and relationships. What you find pleasurable.',
  Mars: 'Action, energy, drive, and assertiveness. Your warrior spirit.',
  Jupiter: 'Expansion, wisdom, optimism, and growth. Your philosophical nature.',
  Saturn: 'Structure, discipline, responsibility, and life lessons. The taskmaster.',
  Uranus: 'Innovation, rebellion, freedom, and sudden change. The awakener.',
  Neptune: 'Spirituality, dreams, intuition, and imagination. The mystic.',
  Pluto: 'Transformation, power, death, and rebirth. The phoenix.'
};

function getTransitInfluence(planet: string): string {
  const influences: Record<string, string> = {
    Sun: 'vitality and self-expression',
    Moon: 'emotional sensitivity and intuition',
    Mercury: 'communication and mental activity',
    Venus: 'harmony and relationship dynamics',
    Mars: 'energy and assertive action',
    Jupiter: 'expansion and opportunity',
    Saturn: 'structure and responsibility',
    Uranus: 'innovation and unexpected changes',
    Neptune: 'spirituality and imagination',
    Pluto: 'deep transformation and power'
  };
  return influences[planet] || 'mysterious energies';
}

function getDetailedReading(planet: string): string {
  const readings: Record<string, string> = {
    Sun: 'The Sun represents your core identity, ego, and life force. Its placement shows where you naturally shine and seek recognition. When well-aspected, it brings confidence and vitality. Challenges here may indicate areas where you need to develop self-worth and authentic self-expression.',
    Moon: 'The Moon governs your emotional nature, instincts, and subconscious patterns. It reveals your inner world, how you nurture yourself and others, and your emotional responses to life\'s changes. A harmonious Moon brings emotional stability, while tension may indicate areas of emotional healing needed.',
    Mercury: 'Mercury rules communication, intellect, and mental processes. Its placement shows how you think, learn, and express yourself. Strong Mercury placements bring clarity of thought and effective communication. Challenges may manifest as mental restlessness or difficulties in self-expression.',
    Venus: 'Venus represents love, beauty, values, and relationships. It shows what you find pleasurable and how you give and receive love. Harmonious Venus brings harmony and artistic appreciation. Difficult aspects may indicate challenges in relationships or self-worth through others\' eyes.',
    Mars: 'Mars is your warrior energy, drive, and assertiveness. It shows how you take action, assert yourself, and pursue your desires. Strong Mars brings courage and initiative. Challenging aspects may indicate areas where anger or frustration needs constructive channeling.',
    Jupiter: 'Jupiter brings expansion, wisdom, and optimism. It shows where you find meaning and where life brings abundance. Well-placed Jupiter brings good fortune and philosophical understanding. Its challenges teach the value of moderation and wise judgment.',
    Saturn: 'Saturn represents structure, discipline, and life lessons. It shows where you must develop maturity and responsibility. Saturn\'s gifts include wisdom, perseverance, and the ability to build lasting foundations. Its tests build character and inner strength.',
    Uranus: 'Uranus brings innovation, rebellion, and sudden change. It shows where you break free from tradition and embrace the future. Uranus energy brings genius and revolutionary ideas. Its challenges may manifest as sudden disruptions that ultimately lead to liberation.',
    Neptune: 'Neptune represents spirituality, dreams, and imagination. It shows your connection to the divine and your capacity for compassion. Neptune brings artistic inspiration and mystical experiences. Its challenges may involve boundaries between reality and illusion.',
    Pluto: 'Pluto brings transformation, power, and rebirth. It shows where you experience profound change and confront your deepest fears. Pluto\'s power brings healing through crisis and the ability to regenerate. Its intensity demands surrender to the transformative process.'
  };
  return readings[planet] || 'The mysteries of this planetary influence unfold through personal experience and contemplation.';
}

interface WheelProps {
  chartData: any;
  hoveredPlanet?: string | null;
  setHoveredPlanet?: (name: string | null) => void;
}

export function WheelVisualization({ chartData, hoveredPlanet, setHoveredPlanet }: WheelProps) {
  const [showTransits, setShowTransits] = useState(false);
  const [transitData, setTransitData] = useState<any>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [hoveredAspect, setHoveredAspect] = useState<any>(null);

  // Calculate transit data when toggled
  useEffect(() => {
    if (showTransits && chartData) {
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      try {
        const transitChart = calculateBirthChart(dateString, '12:00:00', 0, 0);
        setTransitData({
          planets: transitChart.positions.map(p => ({
            name: p.name,
            angle: p.longitude,
            sign: p.sign,
            glyph: PLANET_GLYPHS[p.name] || '●'
          }))
        });
      } catch (error) {
        console.error('Error calculating transits:', error);
      }
    }
  }, [showTransits, chartData]);
  const width = 800;
  const height = 800;
  const radius = 360;
  const centerX = width / 2;
  const centerY = height / 2;

  const getXY = (deg: number, r = radius) => ({
    x: centerX + r * Math.sin((deg * Math.PI) / 180),
    y: centerY - r * Math.cos((deg * Math.PI) / 180),
  });

  if (!chartData) return null;

  const planets = chartData.planets || [];
  const houses = chartData.houses || [];
  const aspects = chartData.aspects || [];

  return (
    <div className="flex justify-center my-16 bg-black relative">
      {/* Transit Toggle Button */}
      <button
        onClick={() => setShowTransits(!showTransits)}
        className="absolute top-4 right-4 z-10 bg-amber-600 hover:bg-amber-500 text-black px-4 py-2 rounded-lg font-semibold transition-colors"
      >
        {showTransits ? 'Hide Transits' : 'Show Transits'}
      </button>

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="drop-shadow-2xl">
        {/* Book cover background */}
        <defs>
          <radialGradient id="bookBg" cx="50%" cy="50%" r="80%">
            <stop offset="0%" stopColor="#0a1428" />
            <stop offset="50%" stopColor="#0f1e3a" />
            <stop offset="100%" stopColor="#020817" />
          </radialGradient>

          {/* Subtle star field */}
          <pattern id="stars" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="50" r="1" fill="#e2e8f0" opacity="0.4" />
            <circle cx="100" cy="150" r="1.5" fill="#e2e8f0" opacity="0.6" />
            <circle cx="170" cy="80" r="1" fill="#e2e8f0" opacity="0.3" />
            <circle cx="60" cy="170" r="2" fill="#e2e8f0" opacity="0.5" />
            <circle cx="140" cy="30" r="1.2" fill="#e2e8f0" opacity="0.4" />
            <circle cx="80" cy="110" r="1" fill="#e2e8f0" opacity="0.3" />
          </pattern>

          {/* Golden glow filter */}
          <filter id="goldenGlow">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feFlood floodColor="#fcd34d" floodOpacity="0.8"/>
            <feComposite in2="blur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <rect width={width} height={height} fill="url(#bookBg)" />
        <rect width={width} height={height} fill="url(#stars)" opacity="0.25" />

        {/* 6 golden orbital rings */}
        {[1, 0.92, 0.84, 0.76, 0.68, 0.6].map((scale, i) => (
          <circle
            key={i}
            cx={centerX}
            cy={centerY}
            r={radius * scale}
            fill="none"
            stroke="#fcd34d"
            strokeWidth={i === 0 ? 3 : 1}
            opacity={i === 0 ? 1 : 0.5}
          />
        ))}

        {/* Central radiant sunburst */}
        <g>
          <circle cx={centerX} cy={centerY} r="60" fill="#fcd34d" opacity="0.9">
            <animate attributeName="r" values="60;65;60" dur="8s" repeatCount="indefinite" />
          </circle>
          <circle cx={centerX} cy={centerY} r="45" fill="#fbbf24" opacity="0.8" />
          <circle cx={centerX} cy={centerY} r="30" fill="#f59e0b" opacity="0.9" />
          <circle cx={centerX} cy={centerY} r="15" fill="#d97706" opacity="1" />
        </g>

        {/* Houses */}
        {houses.map((angle: number, i: number) => {
          const { x, y } = getXY(angle, radius * 1.02);
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="#fcd34d"
              strokeWidth="1"
              opacity="0.6"
            />
          );
        })}

        {/* Zodiac glyphs */}
        {['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map((glyph, i) => {
          const angle = i * 30 + 15;
          const { x, y } = getXY(angle, radius * 1.08);
          return (
            <text
              key={i}
              x={x}
              y={y}
              fill="#fcd34d"
              fontSize="42"
              textAnchor="middle"
              dominantBaseline="middle"
              opacity="0.9"
            >
              {glyph}
            </text>
          );
        })}

        {/* Planets */}
        {planets.map((p: any) => {
          const orbitScale = 0.5 + Math.random() * 0.3;
          const orbitRadius = radius * orbitScale;
          const { x, y } = getXY(p.angle || p.longitude || 0, orbitRadius);
          const isHovered = hoveredPlanet === p.name;
          const glyph = PLANET_GLYPHS[p.name] || '●';

          return (
            <g key={p.name} onMouseEnter={() => setHoveredPlanet?.(p.name)} onMouseLeave={() => setHoveredPlanet?.(null)} onClick={() => setSelectedPlanet(p.name)} className="cursor-pointer">
              <circle
                cx={centerX}
                cy={centerY}
                r={orbitRadius}
                fill="none"
                stroke="#fcd34d"
                strokeWidth="0.5"
                opacity="0.3"
                strokeDasharray="4 6"
              />

              {isHovered && (
                <motion.circle
                  cx={x}
                  cy={y}
                  r="40"
                  fill="#fcd34d"
                  opacity="0.4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                />
              )}

              <motion.text
                x={x}
                y={y}
                fill="#fcd34d"
                fontSize="40"
                textAnchor="middle"
                dominantBaseline="middle"
                filter={isHovered ? "url(#goldenGlow)" : ""}
                opacity={isHovered ? 1 : 0.8}
              >
                {glyph}
              </motion.text>

              {isHovered && (
                <foreignObject x={x - 150} y={y - 160} width="300" height="140">
                  <div className="bg-slate-900/95 backdrop-blur-xl border border-amber-500/50 rounded-xl p-6 shadow-2xl text-white">
                    <div className="font-bold text-amber-400 text-xl mb-2">
                      {p.name} in {p.sign} {Math.floor(p.angle % 30)}°
                    </div>
                    <div className="text-sm leading-relaxed">
                      {PLANET_TOOLTIPS[p.name as keyof typeof PLANET_TOOLTIPS] || 'Mystery unfolds.'}
                    </div>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}

        {/* Transit Planets Overlay */}
        {showTransits && transitData && transitData.planets.map((p: any) => {
          const orbitScale = 0.5 + Math.random() * 0.3;
          const orbitRadius = radius * orbitScale;
          const { x, y } = getXY(p.angle || p.longitude || 0, orbitRadius);
          const glyph = PLANET_GLYPHS[p.name] || '●';

          return (
            <g key={`transit-${p.name}`}>
              <motion.text
                x={x}
                y={y}
                fill="#fcd34d"
                fontSize="32"
                textAnchor="middle"
                dominantBaseline="middle"
                opacity="0.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                {glyph}
              </motion.text>
            </g>
          );
        })}

        {/* Aspects */}
        {aspects.map((a: any, i: number) => {
          const p1 = planets.find((p: any) => p.name === a.from);
          const p2 = planets.find((p: any) => p.name === a.to);
          if (!p1 || !p2) return null;
          const p1Pos = getXY(p1.angle, radius * 0.75);
          const p2Pos = getXY(p2.angle, radius * 0.75);
          const involved = hoveredPlanet && (a.from === hoveredPlanet || a.to === hoveredPlanet);
          const isHovered = hoveredAspect?.index === i;

          return (
            <g key={i}>
              <motion.line
                x1={p1Pos.x}
                y1={p1Pos.y}
                x2={p2Pos.x}
                y2={p2Pos.y}
                stroke="#fcd34d"
                strokeWidth={involved || isHovered ? 4 : 1}
                opacity={involved || isHovered ? 1 : 0.2}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                onMouseEnter={() => setHoveredAspect({ ...a, index: i })}
                onMouseLeave={() => setHoveredAspect(null)}
                className="cursor-pointer"
              />

              {isHovered && (
                <text
                  x={(p1Pos.x + p2Pos.x) / 2}
                  y={(p1Pos.y + p2Pos.y) / 2}
                  fill="#fcd34d"
                  fontSize="14"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none"
                >
                  {a.type} {a.angle ? `${a.angle.toFixed(1)}°` : ''}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Moon Phase Icon */}
      <div className="absolute bottom-4 left-4 text-4xl">
        {(() => {
          const today = new Date();
          const dateString = today.toISOString().split('T')[0];
          try {
            const transitChart = calculateBirthChart(dateString, '12:00:00', 0, 0);
            const illumination = transitChart.moonPhase?.illumination || 0;
            const phase = transitChart.moonPhase?.type || 'New Moon';

            // Choose moon glyph based on illumination
            let moonGlyph = '🌑'; // New moon
            if (illumination < 0.125) moonGlyph = '🌑';
            else if (illumination < 0.375) moonGlyph = '🌒';
            else if (illumination < 0.625) moonGlyph = '🌓';
            else if (illumination < 0.875) moonGlyph = '🌔';
            else moonGlyph = '🌕';

            return (
              <div className="text-amber-400 cursor-pointer" title={`${phase} (${(illumination * 100).toFixed(0)}% illuminated)`}>
                {moonGlyph}
              </div>
            );
          } catch {
            return <div className="text-amber-400">🌑</div>;
          }
        })()}
      </div>

      {/* Planet Reading Modal */}
      {selectedPlanet && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedPlanet(null)}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-slate-900/95 backdrop-blur-xl border border-amber-500/50 rounded-xl p-8 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold text-amber-400">
                {selectedPlanet} Reading
              </h2>
              <button
                onClick={() => setSelectedPlanet(null)}
                className="text-amber-400 hover:text-amber-300 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Natal Position */}
              <div>
                <h3 className="text-xl font-semibold text-amber-300 mb-2">Your Natal Position</h3>
                <p className="text-gray-300 leading-relaxed">
                  {PLANET_TOOLTIPS[selectedPlanet as keyof typeof PLANET_TOOLTIPS] || 'Mystery unfolds.'}
                </p>
              </div>

              {/* Current Transit */}
              {transitData && (
                <div>
                  <h3 className="text-xl font-semibold text-amber-300 mb-2">Current Transit</h3>
                  <p className="text-gray-300">
                    Today, {selectedPlanet} is transiting through{' '}
                    {transitData.planets.find((p: any) => p.name === selectedPlanet)?.sign || 'unknown'}.
                    This transit brings {getTransitInfluence(selectedPlanet)}.
                  </p>
                </div>
              )}

              {/* Detailed Interpretation */}
              <div>
                <h3 className="text-xl font-semibold text-amber-300 mb-2">Deeper Wisdom</h3>
                <p className="text-gray-300 leading-relaxed">
                  {getDetailedReading(selectedPlanet)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}