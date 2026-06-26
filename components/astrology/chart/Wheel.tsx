'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { PlanetPosition, HouseCusp, Aspect } from '../BirthChartCalculator';

interface WheelProps {
  width: number;
  height: number;
  planets: PlanetPosition[];
  houses: HouseCusp[];
  aspects: Aspect[];
}

export function Wheel({ width, height, planets, houses, aspects }: WheelProps) {
  const svgRef = useRef<SVGGElement>(null);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.45;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous content

    // Draw the outer circle
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', '#4B5563')
      .attr('stroke-width', 1);

    // Draw house cusps
    houses.forEach((house, i) => {
      // Use longitude if available, fall back to position for backward compatibility
      const longitude = house.longitude ?? house.position ?? 0;
      const angle = (longitude - 90) * (Math.PI / 180);
      const x1 = centerX;
      const y1 = centerY;
      const x2 = centerX + Math.cos(angle) * radius;
      const y2 = centerY + Math.sin(angle) * radius;

      // House cusp line
      svg.append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', '#6B7280')
        .attr('stroke-width', 0.5);

      // House number
      const labelRadius = radius * 0.9;
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;
      
      svg.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#9CA3AF')
        .attr('font-size', '10px')
        .text(house.house);
    });

    // Draw zodiac signs (simplified)
    const zodiacSigns = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];

    zodiacSigns.forEach((sign, i) => {
      const angle = (i * 30 - 60) * (Math.PI / 180); // -60 to start at Aries
      const signRadius = radius * 0.8;
      const x = centerX + Math.cos(angle) * signRadius;
      const y = centerY + Math.sin(angle) * signRadius;
      
      svg.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#E5E7EB')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(sign[0]); // Just show first letter for now
    });

    // Draw planets
    planets.forEach(planet => {
      const angle = (planet.longitude - 90) * (Math.PI / 180);
      const planetRadius = radius * 0.7;
      const x = centerX + Math.cos(angle) * planetRadius;
      const y = centerY + Math.sin(angle) * planetRadius;
      
      // Planet symbol
      svg.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 6)
        .attr('fill', '#3B82F6')
        .attr('stroke', '#1D4ED8')
        .attr('stroke-width', 1);
      
      // Planet name
      svg.append('text')
        .attr('x', x + 10)
        .attr('y', y + 4)
        .attr('fill', '#E5E7EB')
        .attr('font-size', '10px')
        .text(planet.name);
    });

    // Draw aspects (simplified)
    aspects.forEach(aspect => {
      const planet1 = planets.find(p => p.name === aspect.planet1);
      const planet2 = planets.find(p => p.name === aspect.planet2);
      
      if (!planet1 || !planet2) return;
      
      const angle1 = (planet1.longitude - 90) * (Math.PI / 180);
      const angle2 = (planet2.longitude - 90) * (Math.PI / 180);
      const planetRadius = radius * 0.7;
      
      const x1 = centerX + Math.cos(angle1) * planetRadius;
      const y1 = centerY + Math.sin(angle1) * planetRadius;
      const x2 = centerX + Math.cos(angle2) * planetRadius;
      const y2 = centerY + Math.sin(angle2) * planetRadius;
      
      // Only draw major aspects to reduce clutter
      if (['Conjunction', 'Opposition', 'Square', 'Trine', 'Sextile'].includes(aspect.type)) {
        const color = aspect.influence === 'positive' ? '#10B981' : 
                     aspect.influence === 'negative' ? '#EF4444' : '#6B7280';
        
        svg.append('line')
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2)
          .attr('stroke', color)
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', aspect.type === 'Sextile' ? '5,5' : 'none')
          .attr('opacity', 0.6);
      }
    });

  }, [width, height, planets, houses, aspects]);

  return <g ref={svgRef} />;
}
