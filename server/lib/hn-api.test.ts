import { describe, it, expect } from 'vitest';
import { getHNUrl } from './hn-api.js';

describe('getHNUrl', () => {
  it('returns correct URL format', () => {
    const url = getHNUrl(12345);
    expect(url).toBe('https://news.ycombinator.com/item?id=12345');
  });

  it('works with various ID numbers', () => {
    expect(getHNUrl(1)).toBe('https://news.ycombinator.com/item?id=1');
    expect(getHNUrl(100)).toBe('https://news.ycombinator.com/item?id=100');
    expect(getHNUrl(999999)).toBe('https://news.ycombinator.com/item?id=999999');
  });

  it('works with large IDs', () => {
    const largeId = 39876543;
    const url = getHNUrl(largeId);
    expect(url).toBe(`https://news.ycombinator.com/item?id=${largeId}`);
  });
});
