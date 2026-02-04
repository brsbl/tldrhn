import { describe, it, expect } from 'vitest';
import { generateExcerpt } from './excerpt.js';

describe('generateExcerpt', () => {
  describe('empty/invalid input', () => {
    it('returns empty string for empty string input', () => {
      expect(generateExcerpt('')).toBe('');
    });

    it('returns empty string for whitespace-only input', () => {
      expect(generateExcerpt('   ')).toBe('');
      expect(generateExcerpt('\t\n')).toBe('');
    });
  });

  describe('short text (under 200 chars)', () => {
    it('returns text as-is when under 200 chars', () => {
      const shortText = 'This is a short article about technology.';
      expect(generateExcerpt(shortText)).toBe(shortText);
    });

    it('trims whitespace from short text', () => {
      const shortText = '  Short text with padding  ';
      expect(generateExcerpt(shortText)).toBe('Short text with padding');
    });
  });

  describe('exactly 200 chars', () => {
    it('returns text as-is when exactly 200 chars', () => {
      const exactly200 = 'a'.repeat(200);
      expect(generateExcerpt(exactly200)).toBe(exactly200);
      expect(generateExcerpt(exactly200).length).toBe(200);
    });
  });

  describe('text over 200 chars', () => {
    it('truncates at last space when space is after position 150', () => {
      // Create text with a space at position 180
      const before = 'a'.repeat(180);
      const after = 'b'.repeat(50);
      const text = before + ' ' + after;

      const result = generateExcerpt(text);
      expect(result).toBe(before + '...');
      expect(result.length).toBe(183); // 180 + 3 for "..."
    });

    it('truncates at 200 chars when last space is before position 150', () => {
      // Create text with space only at position 100, then no spaces until well past 200
      const beforeSpace = 'a'.repeat(100);
      const afterSpace = 'b'.repeat(150);
      const text = beforeSpace + ' ' + afterSpace;

      const result = generateExcerpt(text);
      // Last space in first 200 chars is at position 100, which is <= 150
      // So it should truncate at 200 and add "..."
      expect(result).toBe(text.substring(0, 200) + '...');
      expect(result.length).toBe(203);
    });

    it('truncates at 200 chars when no spaces in text', () => {
      const noSpaces = 'a'.repeat(250);
      const result = generateExcerpt(noSpaces);

      expect(result).toBe('a'.repeat(200) + '...');
      expect(result.length).toBe(203);
    });

    it('handles text with multiple spaces, using last space within range', () => {
      // Words that total more than 200 chars, with last space around position 190
      const text = 'word '.repeat(50); // 250 chars total (50 * 5)
      const result = generateExcerpt(text);

      // Should break at a word boundary and add "..."
      expect(result.endsWith('...')).toBe(true);
      expect(result.length).toBeLessThanOrEqual(203);
      // Should not cut in the middle of "word"
      expect(result.replace('...', '').endsWith(' ') || result.replace('...', '').endsWith('word')).toBe(true);
    });
  });
});
