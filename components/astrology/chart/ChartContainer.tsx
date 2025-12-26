'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { PlanetPosition, HouseCusp, Aspect } from '../BirthChartCalculator';
import { WheelVisualization as Wheel } from '../WheelVisualization';
import { transformChartData, TransformedChartData } from '@/lib/astrology/chartDataTransformers';

export interface ChartContainerProps {
  width: number;
  height: number;
  planets: PlanetPosition[];
  houses: HouseCusp[];
  aspects: Aspect[];
  className?: string;
}

export function ChartContainer({
  width,
  height,
  planets,
  houses,
  aspects,
  className = '',
}: ChartContainerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });

  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current && svgRef.current.parentElement) {
        const { width: containerWidth } = svgRef.current.parentElement.getBoundingClientRect();
        const size = Math.min(containerWidth, 800); // Max size 800px
        setDimensions({ width: size, height: size });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate chart data using proper transformation
  const chartData: TransformedChartData = useMemo(() => {
    return transformChartData({
      planets: planets.map(p => ({
        name: p.name,
        longitude: p.longitude,
        latitude: p.latitude || 0,
        distance: p.distance || 1,
        sign: p.sign,
        house: p.house,
        speed: p.speed || 0,
        degree: p.degree || 0,
        minute: p.minute || 0,
        second: p.second || 0,
      })),
      houses: houses.map(h => ({
        house: h.house,
        position: h.position,
        sign: h.sign,
        degree: h.degree || 0,
        minute: h.minute || 0,
        second: h.second || 0,
      })),
      aspects: aspects.map(a => ({
        planet1: a.planet1,
        planet2: a.planet2,
        type: a.type,
        orb: a.orb,
        exact: a.exact || false,
        influence: a.influence || 'neutral',
      })),
    });
  }, [planets, houses, aspects]);

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="w-full h-auto"
      >
        <Wheel
          planets={chartData.planets}
          houses={chartData.houses}
          aspects={chartData.aspects}
          width={dimensions.width}
          height={dimensions.height}
        />
      </svg>
    </div>
  );
}
