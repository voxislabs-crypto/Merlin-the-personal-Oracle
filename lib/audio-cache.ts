/**
 * Audio cache utility - stores TTS audio in localStorage to prevent API credit waste
 * Uses a hash of text + voice as cache key
 */

interface CachedAudio {
  audioData: string; // Base64 or URL
  timestamp: number;
  voiceArchetype: string;
}

const CACHE_PREFIX = 'merlin_audio_cache_';
const CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB max localStorage usage

/**
 * Generate a cache key from text and voice
 */
export function generateCacheKey(text: string, voice: string): string {
  // Simple hash function - good enough for caching
  let hash = 0;
  const input = `${text}:${voice}`;
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `${CACHE_PREFIX}${Math.abs(hash).toString(36)}`;
}

/**
 * Get cached audio from localStorage
 */
export function getCachedAudio(text: string, voice: string): string | null {
  try {
    const key = generateCacheKey(text, voice);
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    const data: CachedAudio = JSON.parse(cached);
    
    // Check if cache has expired
    if (Date.now() - data.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }
    
    console.log(`[Audio Cache] Cache hit for voice: ${voice}`);
    return data.audioData;
  } catch (error) {
    console.error('[Audio Cache] Error reading cache:', error);
    return null;
  }
}

/**
 * Store audio in localStorage cache
 */
export function cacheAudio(text: string, voice: string, audioData: string): void {
  try {
    const key = generateCacheKey(text, voice);
    const cacheEntry: CachedAudio = {
      audioData,
      timestamp: Date.now(),
      voiceArchetype: voice,
    };
    
    const entrySize = JSON.stringify(cacheEntry).length;
    
    // Simple size check - don't cache very large audio
    if (entrySize > 5 * 1024 * 1024) {
      console.warn('[Audio Cache] Audio too large to cache', { size: entrySize });
      return;
    }
    
    localStorage.setItem(key, JSON.stringify(cacheEntry));
    console.log(`[Audio Cache] Cached audio for voice: ${voice} (size: ${entrySize} bytes)`);
  } catch (error) {
    // Fail silently if localStorage is full
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('[Audio Cache] localStorage quota exceeded, clearing old caches...');
      clearOldCaches();
    } else {
      console.error('[Audio Cache] Error caching audio:', error);
    }
  }
}

/**
 * Clear oldest cached audio entries
 */
function clearOldCaches(): void {
  try {
    const keys: Array<{ key: string; timestamp: number }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(CACHE_PREFIX)) continue;
      
      try {
        const data: CachedAudio = JSON.parse(localStorage.getItem(key) || '{}');
        keys.push({ key, timestamp: data.timestamp });
      } catch (e) {
        // Invalid cache entry, remove it
        localStorage.removeItem(key);
      }
    }
    
    // Sort by timestamp and remove oldest 25%
    keys.sort((a, b) => a.timestamp - b.timestamp);
    const removeCount = Math.ceil(keys.length * 0.25);
    
    for (let i = 0; i < removeCount; i++) {
      localStorage.removeItem(keys[i].key);
    }
    
    console.log(`[Audio Cache] Cleared ${removeCount} old cache entries`);
  } catch (error) {
    console.error('[Audio Cache] Error clearing old caches:', error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { entries: number; estimatedSize: string } {
  try {
    let count = 0;
    let size = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(CACHE_PREFIX)) continue;
      
      count++;
      size += localStorage.getItem(key)?.length || 0;
    }
    
    return {
      entries: count,
      estimatedSize: formatBytes(size),
    };
  } catch (error) {
    console.error('[Audio Cache] Error getting stats:', error);
    return { entries: 0, estimatedSize: '0 B' };
  }
}

/**
 * Clear all audio cache
 */
export function clearAllAudioCache(): void {
  try {
    const keys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keys.push(key);
      }
    }
    
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`[Audio Cache] Cleared all ${keys.length} cached audio entries`);
  } catch (error) {
    console.error('[Audio Cache] Error clearing all caches:', error);
  }
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
