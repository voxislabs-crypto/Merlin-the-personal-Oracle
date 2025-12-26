'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { BirthChartData, BirthData, HouseCusp } from './BirthChartCalculator';
import { transformChartData } from '@/lib/astrology/chartDataTransformers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanetInfo } from './PlanetInfo';

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

// Sort planets in traditional order
const PLANET_ORDER = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
  'North Node', 'South Node', 'True Node'
];

function sortPlanets(planets: any[]) {
  return [...planets].sort((a, b) => {
    return PLANET_ORDER.indexOf(a.name) - PLANET_ORDER.indexOf(b.name);
  });
}

export interface BirthChartProps {
  initialData?: Partial<BirthData>;
  onChartCalculated?: (data: BirthChartData) => void;
  showControls?: boolean;
  className?: string;
}

export function BirthChart({
  initialData: initialDataProp = {},
  onChartCalculated,
  showControls = true,
  className = '',
}: BirthChartProps) {
  // Default birth data
  const defaultBirthData: BirthData = {
    date: '1990-01-01',
    time: '12:00',
    latitude: 40.7128,
    longitude: -74.0060,
    houseSystem: 'Placidus',
    zodiac: 'Tropical',
  };

  // Merge default data with any provided initial data
  const [birthData, setBirthData] = useState<BirthData>({
    ...defaultBirthData,
    ...initialDataProp,
  });

  const [chartData, setChartData] = useState<BirthChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const calculateChart = async (data: BirthData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/calculate-birth-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: data.date,
          birthTime: data.time,
          lat: data.latitude,
          lon: data.longitude,
          houseSystem: data.houseSystem || 'Placidus',
          zodiac: data.zodiac || 'Tropical',
        }),
      });

      if (!response.ok) {
        throw new Error(`Error calculating chart: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to calculate birth chart');
      }

      const chartResult = result.data as BirthChartData;
      setChartData(chartResult);
      onChartCalculated?.(chartResult);
      return chartResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error.message);
      console.error('Error calculating chart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Calculate chart when component mounts if initial data is provided
  useEffect(() => {
    if (initialDataProp.date && initialDataProp.time) {
      calculateChart(birthData);
    }
  }, []); // Only run on mount

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateChart(birthData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBirthData(prev => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  // Group planets by element for better organization
  const planetsByElement = useMemo(() => {
    if (!chartData) return {};
    
    const elements: Record<string, any[]> = {
      'Personal': ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Ascendant'],
      'Social': ['Jupiter', 'Saturn'],
      'Generational': ['Uranus', 'Neptune', 'Pluto'],
      'Lunar Nodes': ['North Node', 'South Node', 'True Node']
    };
    
    const grouped: Record<string, any[]> = {};
    
    Object.entries(elements).forEach(([group, planets]) => {
      grouped[group] = chartData.planets.filter(p => planets.includes(p.name));
    });
    
    return grouped;
  }, [chartData]);

  return (
    <div className={`space-y-6 ${className}`}>
      {showControls && (
        <Card>
          <CardHeader>
            <CardTitle>Birth Chart Calculator</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter birth details to generate your astrological chart
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Birth Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={birthData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Birth Time (24h)</Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={birthData.time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="0.0001"
                    value={birthData.latitude}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="0.0001"
                    value={birthData.longitude}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    'Calculate Chart'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-800 text-red-200 rounded-lg">
          <h3 className="font-semibold mb-1">Error</h3>
          <p>{error}</p>
        </div>
      )}

      {loading && !chartData && (
        <div className="h-[600px] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="text-lg">Calculating your birth chart...</span>
          <p className="text-sm text-muted-foreground">This may take a moment</p>
        </div>
      )}

      {chartData && (
        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="planets">Planets</TabsTrigger>
            <TabsTrigger value="aspects">Aspects</TabsTrigger>
            <TabsTrigger value="houses">Houses</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Birth Chart</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[600px] relative">
                  <WheelVisualization
                    planets={chartData.planets}
                    houses={chartData.houses.map(house => ({
                      ...house,
                      longitude: house.longitude ?? house.position ?? 0,
                      position: house.longitude ?? house.position ?? 0,
                    }))}
                    aspects={chartData.aspects}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="planets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Planetary Positions</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Detailed view of planetary positions and dignities
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortPlanets(chartData.planets).map((planet) => (
                    <PlanetInfo key={planet.name} planet={planet} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aspects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Aspects</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Planetary aspects in your chart
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {chartData.aspects.length > 0 ? (
                    chartData.aspects.map((aspect, i) => (
                      <div 
                        key={i} 
                        className="p-3 border rounded-lg bg-gray-900/50 border-gray-800"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {aspect.planet1} {aspect.type} {aspect.planet2}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {aspect.orb.toFixed(2)}° orb
                          </div>
                        </div>
                        <div className="text-sm mt-1 text-muted-foreground">
                          {aspect.influence === 'positive' ? 'Harmonious' : 'Challenging'} aspect
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No aspects found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="houses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>House Cusps</CardTitle>
                <p className="text-sm text-muted-foreground">
                  House positions in your chart
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chartData.houses.map((house) => (
                    <div 
                      key={house.house}
                      className="p-3 border rounded-lg bg-gray-900/50 border-gray-800"
                    >
                      <div className="font-medium">
                        House {house.house}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {house.sign} {house.degree}°{house.minute}'
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
