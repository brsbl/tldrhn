import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Cache, CACHE_TTL_MS } from './cache.js';

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('get', () => {
    it('returns null for missing key', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('returns null for expired entry', () => {
      cache.set('key', 'value', 1000);
      vi.advanceTimersByTime(1000);
      expect(cache.get('key')).toBeNull();
    });
  });

  describe('set and get roundtrip', () => {
    it('works for string values', () => {
      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');
    });

    it('works for object values', () => {
      const obj = { foo: 'bar', num: 42 };
      cache.set('key', obj);
      expect(cache.get('key')).toEqual(obj);
    });

    it('works for array values', () => {
      const arr = [1, 2, 3];
      cache.set('key', arr);
      expect(cache.get('key')).toEqual(arr);
    });
  });

  describe('TTL', () => {
    it('defaults to 30 minutes', () => {
      expect(CACHE_TTL_MS).toBe(30 * 60 * 1000);
      cache.set('key', 'value');

      // Advance time to just before expiration
      vi.advanceTimersByTime(CACHE_TTL_MS - 1);
      expect(cache.get('key')).toBe('value');

      // Advance time to expiration
      vi.advanceTimersByTime(1);
      expect(cache.get('key')).toBeNull();
    });

    it('respects custom TTL', () => {
      const customTTL = 5000;
      cache.set('key', 'value', customTTL);

      // Value should exist before TTL
      vi.advanceTimersByTime(customTTL - 1);
      expect(cache.get('key')).toBe('value');

      // Value should be gone after TTL
      vi.advanceTimersByTime(1);
      expect(cache.get('key')).toBeNull();
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.size()).toBe(3);
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });
  });

  describe('size', () => {
    it('returns 0 for empty cache', () => {
      expect(cache.size()).toBe(0);
    });

    it('returns correct count after adding entries', () => {
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });

    it('does not decrease when entry expires (until accessed past stale grace)', () => {
      cache.set('key', 'value', 1000);
      vi.advanceTimersByTime(1000);
      // Size still shows 1 because expired entries are kept for stale-while-revalidate
      expect(cache.size()).toBe(1);
      // Access it - still in stale grace period, entry kept
      cache.get('key');
      expect(cache.size()).toBe(1);
      // Advance past the stale grace period (1 hour)
      vi.advanceTimersByTime(3600000);
      // Now access it, which triggers removal
      cache.get('key');
      expect(cache.size()).toBe(0);
    });
  });

  describe('has', () => {
    it('returns true for valid entry', () => {
      cache.set('key', 'value');
      expect(cache.has('key')).toBe(true);
    });

    it('returns false for missing entry', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('returns false for expired entry and removes it', () => {
      cache.set('key', 'value', 1000);
      vi.advanceTimersByTime(1000);

      expect(cache.has('key')).toBe(false);
      // Verify the entry was removed
      expect(cache.size()).toBe(0);
    });
  });
});
