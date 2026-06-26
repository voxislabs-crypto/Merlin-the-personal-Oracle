'use client';

import { useState, useEffect } from 'react';
import { OracleChat } from '@/components/astrology/OracleChat';
import type { BirthChartData } from '@/types/astrology';
import { Loader2 } from 'lucide-react';

export default function OracleChatPage() {
  const [birthChart, setBirthChart] = useState<BirthChartData | undefined>();
  const [progressedChart, setProgressedChart] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    // Generate or retrieve user ID
    const storedUserId = localStorage.getItem('merlin-user-id');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem('merlin-user-id', newUserId);
      setUserId(newUserId);
    }

    // Try to load birth chart from session/localStorage
    const loadChartData = async () => {
      try {
        // Check all possible localStorage keys where the dashboard might save chart data
        const CHART_KEYS = ['merlin_chart_data', 'merlin-birth-chart', 'merlin-chart'];
        
        for (const key of CHART_KEYS) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const chart = JSON.parse(raw);
              // Validate it has the planets array we need
              if (chart?.planets?.length > 0) {
                setBirthChart(chart);
                console.log(`[Oracle Chat Page] Loaded birth chart from "${key}" (${chart.planets.length} planets)`);
                break;
              }
            } catch (e) {
              // Invalid JSON, skip
            }
          }
        }
      } catch (error) {
        console.error('Failed to load chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={32} className="animate-spin text-purple-400 mx-auto" />
          <p className="text-purple-300">Summoning Merlin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Optional: Add header/nav here if needed */}
      <div className="h-screen">
        <OracleChat
          birthChart={birthChart}
          progressedChart={progressedChart}
          userId={userId}
        />
      </div>

      {/* Optional: Info modal/panel about what the Oracle can do */}
      <style>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(30, 27, 75, 0.3);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.4);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.6);
        }
      `}</style>
    </div>
  );
}
