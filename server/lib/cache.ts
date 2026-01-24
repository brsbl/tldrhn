/**
 * Simple in-memory cache with TTL (Time To Live) support.
 * Used to cache expensive API responses like processed stories.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// Default TTL: 30 minutes
const DEFAULT_TTL_MS = 1800000;

class Cache {
  private store: Map<string, CacheEntry<unknown>> = new Map();

  /**
   * Get a value from the cache.
   * Returns null if the key doesn't exist or has expired.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      console.log(`[cache] MISS: "${key}" (not found)`);
      return null;
    }

    const now = Date.now();
    if (now >= entry.expiresAt) {
      // Entry has expired, remove it
      this.store.delete(key);
      console.log(`[cache] MISS: "${key}" (expired)`);
      return null;
    }

    const remainingMs = entry.expiresAt - now;
    const remainingMin = Math.round(remainingMs / 60000);
    console.log(`[cache] HIT: "${key}" (expires in ${remainingMin} min)`);
    return entry.data as T;
  }

  /**
   * Set a value in the cache with a TTL.
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlMs - Time to live in milliseconds (default: 30 minutes)
   */
  set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { data, expiresAt });
    const ttlMin = Math.round(ttlMs / 60000);
    console.log(`[cache] SET: "${key}" (TTL: ${ttlMin} min)`);
  }

  /**
   * Clear all entries from the cache.
   */
  clear(): void {
    const count = this.store.size;
    this.store.clear();
    console.log(`[cache] CLEAR: removed ${count} entries`);
  }

  /**
   * Get the number of entries in the cache.
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Check if a key exists and is not expired.
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }
}

// Export a singleton instance
export const cache = new Cache();

// Export the class for testing purposes
export { Cache };

// Export default TTL constant
export const CACHE_TTL_MS = DEFAULT_TTL_MS;
