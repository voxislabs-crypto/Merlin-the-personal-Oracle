'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, Clock3, Loader2, MapPin, Radio, Sparkles } from 'lucide-react';
import { BirthChartData, BirthData, HouseCusp } from './BirthChartCalculator';
import { transformChartData } from '@/lib/astrology/chartDataTransformers';
import type { ChartData } from '@/lib/astrology/newWheelTypes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanetInfo } from './PlanetInfo';
import { GeocodingService, type GeocodingResult } from '@/lib/astrology/geocoding';
import { LifeWeatherStationLoader } from '@/components/dashboard/LifeWeatherStationLoader';
import { ArcanePane } from '@/components/dashboard/ArcanePane';
import { StatusPanel, LocationEmptyHint } from '@/components/ui/status-panel';
import { cn } from '@/lib/utils';

const fieldShellClass =
  'group relative rounded-xl border border-sky-400/20 bg-slate-950/55 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition focus-within:border-sky-300/50 focus-within:bg-sky-950/30 focus-within:shadow-[0_0_24px_rgba(56,189,248,0.12)]';

const fieldInputClass =
  'h-11 border-0 bg-transparent px-0 text-base text-slate-50 shadow-none placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 md:text-[15px]';

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
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  /** Weather-station narrative: visible while calc runs + brief complete beat */
  const [stationActive, setStationActive] = useState(false);
  const [stationComplete, setStationComplete] = useState(false);
  const pendingChartRef = useRef<BirthChartData | null>(null);
  const stationPanelRef = useRef<HTMLDivElement>(null);
  
  // Location search state
  const [locationQuery, setLocationQuery] = useState<string>('');
  const [locationResults, setLocationResults] = useState<GeocodingResult[]>([]);
  const [showLocationResults, setShowLocationResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [chartQuota, setChartQuota] = useState<{
    limit: number;
    used: number;
    remaining: number;
  } | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const isStationBusy = loading || stationActive;
  const chartQuotaExhausted = chartQuota != null && chartQuota.remaining <= 0;

  const handleStationFinished = useCallback(() => {
    const pending = pendingChartRef.current;
    pendingChartRef.current = null;
    setStationActive(false);
    setStationComplete(false);
    setLoading(false);
    if (pending) {
      setChartData(pending);
      onChartCalculated?.(pending);
    }
  }, [onChartCalculated]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/chart-quota', { cache: 'no-store', credentials: 'same-origin' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.success && data.quota) {
          setChartQuota({
            limit: data.quota.limit,
            used: data.quota.used,
            remaining: data.quota.remaining,
          });
        }
      } catch {
        // Quota badge is optional; API still enforces.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const calculateChart = async (data: BirthData) => {
    if (chartQuotaExhausted) {
      setError(
        chartQuota
          ? `This account has used all ${chartQuota.limit} chart builds.`
          : 'Chart calculation limit reached for this account.'
      );
      return null;
    }

    setLoading(true);
    setError(null);
    setStationActive(true);
    setStationComplete(false);
    pendingChartRef.current = null;

    // Keep the station loader in view — form is replaced, not stacked below.
    requestAnimationFrame(() => {
      stationPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const timezoneOffsetHours = -new Date().getTimezoneOffset() / 60;
    
    try {
      const response = await fetch('/api/calculate-birth-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: data.date,
          birthTime: data.time,
          lat: data.latitude,
          lon: data.longitude,
          timezoneOffset: timezoneOffsetHours,
          houseSystem: data.houseSystem || 'Placidus',
          zodiac: data.zodiac || 'Tropical',
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        if (result?.quota) {
          setChartQuota({
            limit: result.quota.limit,
            used: result.quota.used,
            remaining: result.quota.remaining,
          });
        }
        throw new Error(
          result?.error || `Error calculating chart: ${response.statusText || response.status}`
        );
      }

      if (result.quota) {
        setChartQuota({
          limit: result.quota.limit,
          used: result.quota.used,
          remaining: result.quota.remaining,
        });
      }

      const chartResult = result.data as BirthChartData;
      // Hold result until weather-station complete beat finishes (keeps narrative intentional)
      pendingChartRef.current = chartResult;
      setStationComplete(true);
      return chartResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error.message);
      console.error('Error calculating chart:', error);
      pendingChartRef.current = null;
      setStationActive(false);
      setStationComplete(false);
      setLoading(false);
      throw error;
    }
  };

  // Calculate chart when component mounts if initial data is provided
  useEffect(() => {
    if (initialDataProp.date && initialDataProp.time) {
      calculateChart(birthData);
    }
  }, []); // Only run on mount
  
  // Reverse geocode if lat/lon provided but no location name
  useEffect(() => {
    // Only run on client side after mount
    if (typeof window === 'undefined') return;
    
    if (birthData.latitude && birthData.longitude && !locationQuery) {
      GeocodingService.reverseGeocode(birthData.latitude, birthData.longitude)
        .then((result) => {
          if (result) {
            setSelectedLocation(result);
          }
        })
        .catch((err) => {
          // Silently fail - geocoding is nice-to-have, not critical
          console.log('Reverse geocoding unavailable:', err.message);
        });
    }
  }, [birthData.latitude, birthData.longitude]);

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

  // Location search handler
  const handleLocationSearch = async (query: string) => {
    setLocationQuery(query);
    
    if (query.length < 2) {
      setLocationResults([]);
      setShowLocationResults(false);
      return;
    }

    setSearchingLocation(true);
    try {
      const results = await GeocodingService.searchLocations(query);
      setLocationResults(results);
      setShowLocationResults(results.length > 0);
    } catch (error) {
      console.error('Location search error:', error);
      setLocationResults([]);
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleSelectLocation = (location: GeocodingResult) => {
    setSelectedLocation(location);
    setLocationQuery(location.displayName);
    setBirthData(prev => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
    setShowLocationResults(false);
  };

  // Hide location results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowLocationResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const locationPlaceholder =
    selectedLocation?.displayName || 'City, region, or country';
  const hasDate = Boolean(birthData.date);
  const hasTime = Boolean(birthData.time);
  const hasLocation = Boolean(selectedLocation || birthData.latitude);
  const canSubmit = hasDate && hasTime && hasLocation && !isStationBusy && !chartQuotaExhausted;
  const signalReadyCount = [hasDate, hasTime, hasLocation].filter(Boolean).length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Intake form OR station loader in the same slot — never stack both. */}
      {showControls && !isStationBusy ? (
        <ArcanePane
          tone="sky"
          shellClassName="border-sky-400/35 bg-gradient-to-br from-slate-950/90 via-indigo-950/35 to-sky-950/45 shadow-2xl shadow-sky-500/15"
          padding="p-5 md:p-7"
        >
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-sky-300/45 bg-sky-500/15 shadow-[0_0_24px_rgba(56,189,248,0.22)]">
                  <Radio className="h-5 w-5 text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.65)]" />
                  <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400/70" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-400" />
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-sky-300/90">
                    Life weather · station intake
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
                    Lock your birth signal
                  </h2>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-400">
                    Date, time, and place — three coordinates. Merlin builds your chart and life weather from
                    them.
                  </p>
                  <p className="mt-1.5 font-mono text-[11px] text-sky-200/45">
                    MERLIN · LW-01 · INTAKE
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:justify-end">
                {(
                  [
                    { ok: hasDate, label: 'Date' },
                    { ok: hasTime, label: 'Time' },
                    { ok: hasLocation, label: 'Place' },
                  ] as const
                ).map((chip) => (
                  <span
                    key={chip.label}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
                      chip.ok
                        ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                        : 'border-slate-600/50 bg-slate-900/60 text-slate-500'
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        chip.ok ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-slate-600'
                      )}
                    />
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className={fieldShellClass}>
                  <Label
                    htmlFor="date"
                    className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-300/75"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    Birth date
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={birthData.date}
                    onChange={handleInputChange}
                    required
                    className={cn(fieldInputClass, '[color-scheme:dark]')}
                  />
                </div>
                <div className={fieldShellClass}>
                  <Label
                    htmlFor="time"
                    className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-300/75"
                  >
                    <Clock3 className="h-3.5 w-3.5" />
                    Birth time · 24h
                  </Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={birthData.time}
                    onChange={handleInputChange}
                    required
                    className={cn(fieldInputClass, '[color-scheme:dark]')}
                  />
                </div>
              </div>

              <div className={cn(fieldShellClass, 'relative')} ref={locationInputRef}>
                <Label
                  htmlFor="location"
                  className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-300/75"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Birth location
                </Label>
                <div className="relative">
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    placeholder={locationPlaceholder}
                    value={locationQuery}
                    onChange={(e) => handleLocationSearch(e.target.value)}
                    onFocus={() => locationResults.length > 0 && setShowLocationResults(true)}
                    autoComplete="off"
                    required={!selectedLocation && !birthData.latitude}
                    className={cn(fieldInputClass, 'pr-9')}
                  />
                  {searchingLocation ? (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-sky-300/80" />
                    </div>
                  ) : null}
                </div>

                {showLocationResults && locationResults.length > 0 ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 max-h-60 overflow-y-auto rounded-xl border border-sky-400/30 bg-slate-950/95 shadow-2xl shadow-sky-950/40 backdrop-blur-xl">
                    {locationResults.map((result, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectLocation(result)}
                        className="w-full border-b border-white/5 px-4 py-3 text-left transition last:border-b-0 hover:bg-sky-500/10"
                      >
                        <div className="font-medium text-slate-100">{result.city}</div>
                        <div className="text-sm text-slate-400">
                          {result.state && `${result.state}, `}
                          {result.country}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-sky-300/50">
                          {result.latitude.toFixed(4)}° · {result.longitude.toFixed(4)}°
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}

                {!searchingLocation &&
                locationQuery.length >= 2 &&
                locationResults.length === 0 &&
                !selectedLocation ? (
                  <div className="mt-2">
                    <LocationEmptyHint query={locationQuery} />
                  </div>
                ) : null}

                {selectedLocation ? (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Coordinates locked
                    </span>
                    <span className="font-mono text-[11px] text-sky-200/55">
                      {selectedLocation.latitude.toFixed(4)}° · {selectedLocation.longitude.toFixed(4)}°
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Start typing a city — pick one result so the station can lock lat/lon.
                  </p>
                )}
              </div>

              {chartQuota ? (
                <div
                  className={cn(
                    'rounded-xl border px-3 py-2 text-xs',
                    chartQuotaExhausted
                      ? 'border-amber-400/40 bg-amber-500/10 text-amber-100'
                      : 'border-sky-400/25 bg-sky-950/40 text-sky-100/90'
                  )}
                >
                  {chartQuotaExhausted ? (
                    <span>
                      Chart rebuild limit reached ({chartQuota.limit} per account). This stops one
                      login from covering a whole household. Contact support for a legitimate
                      birth-data correction.
                    </span>
                  ) : (
                    <span>
                      <span className="font-mono font-semibold">
                        {chartQuota.remaining}/{chartQuota.limit}
                      </span>{' '}
                      chart builds left (first natal + rerolls). Free and paid share this cap.
                    </span>
                  )}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-mono text-[11px] text-slate-500">
                  SIGNAL {signalReadyCount}/3
                  {chartQuotaExhausted
                    ? ' · LIMIT REACHED'
                    : canSubmit
                      ? ' · READY'
                      : ' · AWAITING INPUT'}
                </p>
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className={cn(
                    'h-11 w-full gap-2 rounded-xl border border-sky-300/40 bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-500 px-6 text-sm font-semibold text-white shadow-[0_0_28px_rgba(56,189,248,0.25)] transition sm:w-auto',
                    'hover:from-sky-500 hover:via-cyan-500 hover:to-sky-400 hover:shadow-[0_0_36px_rgba(56,189,248,0.35)]',
                    'disabled:border-slate-700 disabled:from-slate-800 disabled:via-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none'
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  Build my life weather
                </Button>
              </div>
            </form>
          </div>
        </ArcanePane>
      ) : null}

      {isStationBusy ? (
        <div
          ref={stationPanelRef}
          className="scroll-mt-6 rounded-2xl border border-sky-400/30 bg-gradient-to-br from-slate-950/90 via-sky-950/40 to-slate-950/80 p-4 shadow-xl shadow-sky-950/30 backdrop-blur-md md:p-6"
        >
          <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-sky-300/80">
            Life weather · station online
          </p>
          <LifeWeatherStationLoader
            active={stationActive}
            complete={stationComplete}
            onFinished={handleStationFinished}
          />
        </div>
      ) : null}

      {error && !isStationBusy ? (
        <StatusPanel
          tone="error"
          compact
          title="Couldn’t build your life weather"
          message={error}
          hint="Check birth date, time, and city — then try again. If it keeps failing, the station may be busy."
          onRetry={() => {
            void calculateChart(birthData);
          }}
          retryLabel="Retry station"
        />
      ) : null}

      {chartData && !isStationBusy && (
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
                  {
                    (() => {
                      const wheelChartData: ChartData = {
                        planets: chartData.planets.map((p: any) => ({
                          name: p.name,
                          glyph: p.glyph || p.name?.[0] || '•',
                          angle: p.longitude ?? p.position ?? 0,
                          sign: p.sign || '',
                          degree: p.degree ?? 0,
                          element: p.element || 'Fire',
                          color: p.color || 'hsl(45, 88%, 68%)',
                          orbitalDistance: p.distance ?? 1,
                        })),
                        aspects: chartData.aspects.map((a: any) => ({
                          from: a.planet1?.name || a.planet1 || a.from || '',
                          to: a.planet2?.name || a.planet2 || a.to || '',
                          type: a.type || a.aspect || 'conjunction',
                          angle: a.orb || a.angle || 0,
                          color: a.color || 'hsl(45, 88%, 68%)',
                          label: a.aspect || a.type || 'Aspect',
                        })),
                        houses: chartData.houses.map((h: any) => h.longitude ?? h.position ?? 0),
                        ascendant: (chartData as any).ascendant?.longitude ?? (chartData as any).ascendant ?? 0,
                        midheaven: (chartData as any).mc?.longitude ?? (chartData as any).mc ?? (chartData as any).midheaven ?? 0,
                      };

                      return <WheelVisualization chartData={wheelChartData} />;
                    })()
                  }
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
                            {typeof aspect.planet1 === 'string' ? aspect.planet1 : aspect.planet1.name} {aspect.type} {typeof aspect.planet2 === 'string' ? aspect.planet2 : aspect.planet2.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {aspect.orb?.toFixed(2) || '0.00'}° orb
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
