'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft } from 'lucide-react';

// Import the new frontend components with proper typing
const HeroSection = dynamic(
  () => import('@/components/astrology/HeroSection').then(mod => mod.HeroSection),
  { 
    ssr: false, 
    loading: () => <div className="flex items-center justify-center min-h-[400px]">Loading...</div> 
  }
);

const ChartPreviewSection = dynamic(
  () => import('@/components/astrology/ChartPreviewSection').then(mod => mod.ChartPreviewSection),
  { 
    ssr: false,
    loading: () => <div className="h-[400px] flex items-center justify-center">Loading chart preview...</div>
  }
);

const FeaturesSection = dynamic(
  () => import('@/components/astrology/FeaturesSection').then(mod => mod.FeaturesSection),
  { 
    ssr: false,
    loading: () => <div className="h-[400px] flex items-center justify-center">Loading features...</div>
  }
);

// Import the AstroDashboard component with proper typing
const AstroDashboard = dynamic(
  () => import('@/components/astrology/AstroDashboard').then(mod => ({
    default: function WrappedAstroDashboard(props: any) {
      // Ensure onCalculate returns void, not Promise<void>
      const handleCalculate = (data: any) => {
        if (props.onCalculate) {
          const result = props.onCalculate(data);
          return result instanceof Promise ? result : Promise.resolve(result);
        }
        return Promise.resolve();
      };
      return <mod.AstroDashboard {...props} onCalculate={handleCalculate} />;
    }
  })),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
);

// Import the BirthChartCalculator and its types
import { BirthChartCalculator } from '@/components/astrology/BirthChartCalculator';
import type { BirthChartData, BirthData } from '@/components/astrology/BirthChartCalculator';

export default function AstroDashboardPage() {
  const router = useRouter();
  const [chartData, setChartData] = useState<BirthChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [birthData, setBirthData] = useState<BirthData>({
    date: '1983-08-14',
    time: '12:21',
    latitude: 36.85,
    longitude: -76.29,
    houseSystem: 'Placidus',
    zodiac: 'Tropical'
  });

  // Load initial chart data
  useEffect(() => {
    const loadInitialChart = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/calculate-birth-chart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthDate: birthData.date,
            birthTime: birthData.time,
            lat: birthData.latitude,
            lon: birthData.longitude,
            houseSystem: birthData.houseSystem,
            zodiac: birthData.zodiac
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to calculate chart');
        }
        
        const data = await response.json();
        if (data.success) {
          setChartData(data.data);
        } else {
          setError(data.error || 'Unknown error occurred');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chart');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialChart();
  }, []);

  const handleCalculate = useCallback(async (chartData: BirthChartData): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Update the chart data with the provided data
      setChartData(chartData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array as we don't use any external variables

  if (showCalculator) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setShowCalculator(false)}
            className="mb-6 flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50">
            <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Birth Chart Calculator
            </h1>
            <BirthChartCalculator 
              birthData={birthData}
              onCalculate={handleCalculate}
              onError={(error) => setError(error.message)}
            >
              {({ chartData, loading: isLoading, error: chartError }) => (
                <div>
                  {isLoading && <div>Loading chart data...</div>}
                  {chartError && <div className="text-red-500">Error: {chartError.message}</div>}
                  {chartData && (
                    <div className="mt-4">
                      {/* Render chart data here if needed */}
                    </div>
                  )}
                </div>
              )}
            </BirthChartCalculator>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 to-gray-900/50 z-10 pointer-events-none" />
          <div className="relative z-20">
            <HeroSection 
              onCalculateClick={() => setShowCalculator(true)}
              hasChart={!!chartData}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 -mt-20">
        {/* Chart Preview Section */}
        {chartData && (
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Your Birth Chart
                </h2>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                  Explore the cosmic influences at the time of your birth
                </p>
              </div>
              
              <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
                <AstroDashboard
                  chartData={chartData}
                  loading={loading}
                  error={error}
                  onCalculate={handleCalculate}
                  onReset={() => setChartData(null)}
                  className="w-full"
                />
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <FeaturesSection />

        {/* Chart Preview Section */}
        <ChartPreviewSection />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900/80 backdrop-blur-sm border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to explore your cosmic blueprint?</h3>
            <button
              onClick={() => setShowCalculator(true)}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Calculate Your Birth Chart
            </button>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} Merlin Astrology. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
