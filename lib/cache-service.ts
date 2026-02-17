// lib/cache-service.ts - Intelligent caching for chart interpretations
import { createHash } from 'crypto';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hash: string;
}

/**
 * Generate a unique hash for birth chart data
 * Same birth data = same hash = cache hit
 */
export function generateChartHash(
  birthDate: string,
  birthTime: string,
  lat: number,
  lon: number,
  options?: { useGrok?: boolean; houseSystem?: string }
): string {
  const normalized = `${birthDate}|${birthTime}|${lat.toFixed(4)}|${lon.toFixed(4)}|${options?.useGrok ? 'grok' : 'trad'}|${options?.houseSystem || 'placidus'}`;
  return createHash('sha256').update(normalized).digest('hex').substring(0, 16);
}

/**
 * Server-side cache (in-memory for now, can be upgraded to Redis)
 */
class ServerCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize = 100; // Maximum cached interpretations
  private ttl = 7 * 24 * 60 * 60 * 1000; // 7 days

  set<T>(key: string, data: T): void {
    // Evict oldest if at max size
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0]?.[0];
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hash: key
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check expiration
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      oldestEntry: Math.min(
        ...Array.from(this.cache.values()).map(e => e.timestamp)
      )
    };
  }
}

export const serverCache = new ServerCache();

/**
 * Client-side localStorage cache with versioning
 */
export class ClientCache {
  private static CACHE_PREFIX = 'merlin_interp_';
  private static VERSION_KEY = 'merlin_cache_version';
  private static CURRENT_VERSION = '3'; // Bump to invalidate old caches
  private static TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  static init(): void {
    if (typeof window === 'undefined') return;

    const version = localStorage.getItem(this.VERSION_KEY);
    if (version !== this.CURRENT_VERSION) {
      console.log('[ClientCache] Version mismatch, clearing cache');
      this.clear();
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
    }
  }

  static set<T>(hash: string, data: T): void {
    if (typeof window === 'undefined') return;

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        hash
      };
      localStorage.setItem(
        `${this.CACHE_PREFIX}${hash}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      console.warn('[ClientCache] Failed to cache:', error);
    }
  }

  static get<T>(hash: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const raw = localStorage.getItem(`${this.CACHE_PREFIX}${hash}`);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      
      // Check expiration
      if (Date.now() - entry.timestamp > this.TTL) {
        localStorage.removeItem(`${this.CACHE_PREFIX}${hash}`);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('[ClientCache] Failed to retrieve cache:', error);
      return null;
    }
  }

  static has(hash: string): boolean {
    return this.get(hash) !== null;
  }

  static clear(): void {
    if (typeof window === 'undefined') return;

    Object.keys(localStorage)
      .filter(key => key.startsWith(this.CACHE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  }

  static getStats() {
    if (typeof window === 'undefined') return { count: 0, totalSize: 0 };

    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.CACHE_PREFIX));
    const totalSize = keys.reduce((sum, key) => {
      return sum + (localStorage.getItem(key)?.length || 0);
    }, 0);

    return {
      count: keys.length,
      totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2)
    };
  }
}
