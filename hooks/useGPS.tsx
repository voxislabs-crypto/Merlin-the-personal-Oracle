'use client';

import { useState, useCallback, useRef } from 'react';

export interface GPSCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

const GPS_STORAGE_KEY = 'merlin_last_gps';

function loadStoredCoords(): GPSCoords | null {
  try {
    const raw = localStorage.getItem(GPS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GPSCoords) : null;
  } catch {
    return null;
  }
}

function storeCoords(coords: GPSCoords) {
  try {
    localStorage.setItem(GPS_STORAGE_KEY, JSON.stringify(coords));
  } catch {}
}

export function useGPS() {
  const [coords, setCoords] = useState<GPSCoords | null>(() => {
    if (typeof window === 'undefined') return null;
    return loadStoredCoords();
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const applyPosition = useCallback((position: GeolocationPosition) => {
    const c: GPSCoords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: Date.now(),
    };
    setCoords(c);
    storeCoords(c);
    return c;
  }, []);

  const requestLocation = useCallback(async (): Promise<GPSCoords | null> => {
    setLoading(true);
    setError(null);

    // Try Capacitor Geolocation first (better on Android), then browser API
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });
      const c: GPSCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      };
      setCoords(c);
      storeCoords(c);
      setLoading(false);
      return c;
    } catch {
      // Capacitor not available (web) — fall through to browser API
    }

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      return new Promise<GPSCoords | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const c = applyPosition(pos);
            setLoading(false);
            resolve(c);
          },
          (err) => {
            const msg = err.message || 'Location unavailable';
            setError(msg);
            setLoading(false);
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 300_000 }
        );
      });
    }

    setError('Geolocation not supported on this device');
    setLoading(false);
    return null;
  }, [applyPosition]);

  /** Start continuous GPS tracking (live mode) */
  const startWatching = useCallback(() => {
    if (!('geolocation' in navigator)) return;
    if (watchIdRef.current !== null) return; // already watching

    watchIdRef.current = navigator.geolocation.watchPosition(
      applyPosition,
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 60_000 }
    );
  }, [applyPosition]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  return {
    coords,
    loading,
    error,
    requestLocation,
    startWatching,
    stopWatching,
  };
}
