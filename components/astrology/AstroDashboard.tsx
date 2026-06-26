'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, useMemo } from 'react';
import type { PlanetPosition, HousePosition, Aspect } from '@/types/astrology';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChartData } from '@/lib/astrology/newWheelTypes';
import { Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BirthChartData } from './BirthChartCalculator';
import { PlanetInfo } from './PlanetInfo';
import { 
  transformChartData, 
  type TransformedChartData,
  type TransformedPlanet,
  type TransformedHouse,
  type TransformedAspect
} from '@/lib/astrology/chartDataTransformers';

// Dynamically import the WheelVisualization component with SSR disabled
const WheelVisualization = dynamic(
  () => import('@/components/astrology/WheelVisualization').then(
    (mod) => mod.WheelVisualization
  ),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
);

interface BirthData {
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  houseSystem: string;
  zodiac: string;
}

interface AstroDashboardProps {
  chartData: any;
  loading: boolean;
  error: string | null;
  onCalculate: (data: BirthData) => Promise<void>;
  onReset: () => void;
  className?: string;
}

export function AstroDashboard({ 
  chartData, 
  loading, 
  error, 
  onCalculate,
  className = '' 
}: AstroDashboardProps) {
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('chart');
  const [birthData, setBirthData] = useState<BirthData>({
    date: '',
    time: '',
    latitude: 0,
    longitude: 0,
    houseSystem: 'Placidus',
    zodiac: 'Tropical'
  });

  // Sort planets in traditional order
  const sortedPlanets = useMemo(() => {
    if (!chartData || !chartData.planets || !Array.isArray(chartData.planets)) return [];
    
    const PLANET_ORDER = [
      'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 
      'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
      'North Node', 'South Node', 'True Node'
    ];
    
    return [...chartData.planets].sort((a, b) => {
      const indexA = PLANET_ORDER.indexOf(a.name);
      const indexB = PLANET_ORDER.indexOf(b.name);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [chartData]);



  // Transform the chart data to ensure proper typing
  const transformedData = useMemo(() => {
    if (!chartData) return null;
    try {
      const data = transformChartData(chartData);
      // Ensure all required fields are present and arrays exist
      return {
        planets: Array.isArray(data.planets) ? data.planets.map(p => ({
          ...p,
          speed: p.speed ?? 0,
          second: p.second ?? 0,
          latitude: p.latitude ?? 0,
          distance: p.distance ?? 1,
          house: p.house ?? 0,
          degree: p.degree ?? 0,
          minute: p.minute ?? 0,
        })) : [],
        houses: Array.isArray(data.houses) ? data.houses.map(h => ({
          ...h,
          house: h.house ?? 0,
          longitude: h.longitude ?? h.position ?? 0,
          position: h.longitude ?? h.position ?? 0, // Keep for backward compatibility
          degree: h.degree ?? 0,
          minute: h.minute ?? 0,
          second: h.second ?? 0,
          sign: h.sign ?? '',
        })) : [],
        aspects: Array.isArray(data.aspects) ? data.aspects.map(a => ({
          ...a,
          type: a.type ?? '',
          planet1: a.planet1 ?? '',
          planet2: a.planet2 ?? '',
          orb: a.orb ?? 0,
          exact: a.exact ?? false,
          influence: a.influence ?? 'neutral',
        })) : [],
        metadata: {
          houseSystem: data.metadata?.houseSystem ?? 'Placidus',
          zodiac: data.metadata?.zodiac ?? 'Tropical',
        },
      };
    } catch (error) {
      console.error('Error transforming chart data:', error);
      return null;
    }
  }, [chartData]);

  const planetsByElement = useMemo(() => {
    if (!transformedData?.planets?.length) return {};
    
    const elements: Record<string, string[]> = {
      'Personal': ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Ascendant'],
      'Social': ['Jupiter', 'Saturn'],
      'Generational': ['Uranus', 'Neptune', 'Pluto'],
      'Lunar Nodes': ['North Node', 'South Node', 'True Node']
    };

    const result: Record<string, TransformedPlanet[]> = {};
    
    for (const [category, planetNames] of Object.entries(elements)) {
      result[category] = transformedData.planets.filter((p): p is TransformedPlanet & { name: string } => {
        return p?.name != null && planetNames.includes(p.name);
      });
    }
    
    return result;
  }, [transformedData]);

  // Build a ChartData-shaped object for the WheelVisualization component
  const wheelChartData = useMemo<ChartData | null>(() => {
    if (!transformedData) return null;
    return {
      planets: transformedData.planets.map((p) => ({
        name: p.name,
        glyph: (p as any).glyph || p.name?.[0] || "•",
        angle: (p as any).longitude ?? p.degree ?? 0,
        sign: p.sign || "",
        degree: p.degree || 0,
        element: (p as any).element || "Fire",
        color: (p as any).color || "hsl(45, 88%, 68%)",
        orbitalDistance: p.distance ?? 1,
      })),
      aspects: transformedData.aspects.map((a) => ({
        from: (a as any).planet1 || (a as any).from || "",
        to: (a as any).planet2 || (a as any).to || "",
        type: (a as any).type || "conjunction",
        angle: (a as any).angle || 0,
        color: (a as any).color || "hsl(45, 88%, 68%)",
        label: (a as any).label || (a as any).type || "Aspect",
      })),
      houses: transformedData.houses.map((h) => (h as any).longitude ?? (h as any).position ?? 0),
      ascendant:
        (chartData as any)?.ascendant?.longitude ?? (chartData as any)?.ascendant ?? 0,
      midheaven:
        (chartData as any)?.mc?.longitude ?? (chartData as any)?.mc ?? (chartData as any)?.midheaven ?? 0,
    };
  }, [transformedData, chartData]);

  const getPlanetsByGroup = useCallback((planets: TransformedPlanet[], group: string): TransformedPlanet[] => {
    if (!planets?.length || !group) return [];
    const groupPlanets = planetsByElement[group];
    if (!groupPlanets) return [];
    
    const planetNames = new Set(groupPlanets.map(p => p.name));
    return planets.filter(planet => planetNames.has(planet.name));
  }, [planetsByElement]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBirthData(prev => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCalculate(birthData);
  };

  if (loading && !chartData) {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="text-lg">Calculating your birth chart...</span>
        <p className="text-sm text-muted-foreground">This may take a moment</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chart">
            <Sparkles className="w-4 h-4 mr-2" />
            Chart
          </TabsTrigger>
          <TabsTrigger value="planets">Planets</TabsTrigger>
          <TabsTrigger value="aspects">Aspects</TabsTrigger>
          <TabsTrigger value="houses">Houses</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-4">
          <Card className="border-0 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Your Cosmic Blueprint
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[600px] relative">
                {chartData ? (
                  <div>
                    {wheelChartData ? (
                      <WheelVisualization
                        chartData={wheelChartData}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-64 text-gray-400">
                        {loading ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <span>Calculating your chart...</span>
                          </div>
                        ) : error ? (
                          <div className="text-red-500">Error: {error}</div>
                        ) : (
                          <span>No chart data available. Please enter your birth details.</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No chart data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planets" className="space-y-4">
          <Card className="border-0 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Planetary Positions
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Detailed view of planetary positions and dignities
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {transformedData ? (
                  Object.entries(planetsByElement).map(([group, planets]) => (
                    <div key={group} className="space-y-3">
                      <h3 className="font-semibold text-lg text-cyan-300">{group}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getPlanetsByGroup(transformedData.planets, group)
                          .sort((a: TransformedPlanet, b: TransformedPlanet) => a.name.localeCompare(b.name))
                          .map((planet: TransformedPlanet) => (
                            <PlanetInfo key={planet.name} planet={planet} />
                          ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No planetary data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aspects" className="space-y-4">
          <Card className="border-0 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Planetary Aspects
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Key relationships between planets in your chart
              </p>
            </CardHeader>
            <CardContent>
              {!transformedData ? (
                <p className="text-muted-foreground">No chart data available</p>
              ) : transformedData.aspects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {transformedData.aspects.map((aspect, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-4 rounded-lg border ${
                        aspect.influence === 'positive'
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : 'border-rose-500/20 bg-rose-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {aspect.planet1} {aspect.type} {aspect.planet2}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {aspect.orb.toFixed(1)}° orb
                        </div>
                      </div>
                      <div className={`text-sm mt-1 ${
                        aspect.influence === 'positive' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {aspect.influence === 'positive' ? 'Harmonious' : 'Challenging'} aspect
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No aspects found in this chart.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="houses" className="space-y-4">
          <Card className="border-0 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                House Cusps
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                The twelve houses of your birth chart
              </p>
            </CardHeader>
            <CardContent>
              {!transformedData ? (
                <p className="text-muted-foreground">No house data available</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {transformedData.houses.map((house) => {
                    const houseNumber = house.house;
                    const houseThemes = {
                      1: 'Self, personality, appearance',
                      2: 'Values, possessions, self-worth',
                      3: 'Communication, siblings, short trips',
                      4: 'Home, family, roots',
                      5: 'Creativity, romance, children',
                      6: 'Health, work, daily routine',
                      7: 'Partnerships, marriage, others',
                      8: 'Transformation, shared resources',
                      9: 'Philosophy, travel, higher learning',
                      10: 'Career, public image, reputation',
                      11: 'Friends, groups, aspirations',
                      12: 'Subconscious, spirituality, solitude'
                    };

                    return (
                      <motion.div
                        key={houseNumber}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (houseNumber - 1) * 0.05 }}
                        className="p-4 rounded-lg border border-purple-500/20 bg-purple-500/5"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-purple-300">
                            {houseNumber === 1 ? 'Asc' : `House ${houseNumber}`}
                          </h3>
                          <div className="text-sm text-purple-400">
                            {house.sign} {house.degree}°{house.minute}'
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {houseThemes[houseNumber as keyof typeof houseThemes]}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-900/50 border border-red-800 text-red-200"
        >
          <h3 className="font-semibold mb-1">Error Calculating Chart</h3>
          <p className="text-sm">{error}</p>
        </motion.div>
      )}
    </div>
  );
}
