import { describe, it, expect } from 'vitest';
import { parseAllowedOrigins, isOriginAllowed, validateApiKey } from './config.js';

describe('parseAllowedOrigins', () => {
  it('returns empty array for undefined', () => {
    expect(parseAllowedOrigins(undefined)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseAllowedOrigins('')).toEqual([]);
  });

  it('parses single origin', () => {
    expect(parseAllowedOrigins('https://example.com')).toEqual(['https://example.com']);
  });

  it('parses multiple origins', () => {
    expect(parseAllowedOrigins('https://a.com,https://b.com')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });

  it('trims whitespace', () => {
    expect(parseAllowedOrigins('  https://a.com , https://b.com  ')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });

  it('filters empty entries', () => {
    expect(parseAllowedOrigins('https://a.com,,https://b.com')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });
});

describe('isOriginAllowed', () => {
  const allowedOrigins = ['https://allowed.com', 'https://another.com'];

  describe('no origin (curl, same-origin)', () => {
    it('allows undefined origin in production', () => {
      expect(isOriginAllowed(undefined, allowedOrigins, true)).toBe(true);
    });

    it('allows undefined origin in development', () => {
      expect(isOriginAllowed(undefined, allowedOrigins, false)).toBe(true);
    });
  });

  describe('localhost in development', () => {
    it('allows localhost:5173', () => {
      expect(isOriginAllowed('http://localhost:5173', [], false)).toBe(true);
    });

    it('allows localhost:3000', () => {
      expect(isOriginAllowed('http://localhost:3000', [], false)).toBe(true);
    });

    it('allows any localhost port', () => {
      expect(isOriginAllowed('http://localhost:8080', [], false)).toBe(true);
    });
  });

  describe('localhost in production', () => {
    it('rejects localhost when not in allowed list', () => {
      expect(isOriginAllowed('http://localhost:5173', [], true)).toBe(false);
    });

    it('allows localhost if explicitly in allowed list', () => {
      expect(isOriginAllowed('http://localhost:5173', ['http://localhost:5173'], true)).toBe(true);
    });
  });

  describe('allowed origins list', () => {
    it('allows origin in list', () => {
      expect(isOriginAllowed('https://allowed.com', allowedOrigins, true)).toBe(true);
    });

    it('rejects origin not in list', () => {
      expect(isOriginAllowed('https://evil.com', allowedOrigins, true)).toBe(false);
    });

    it('rejects similar but different origin', () => {
      expect(isOriginAllowed('https://allowed.com.evil.com', allowedOrigins, true)).toBe(false);
    });
  });
});

describe('validateApiKey', () => {
  describe('no key required', () => {
    it('allows access when no key is configured', () => {
      expect(validateApiKey(undefined, undefined)).toBe(true);
    });

    it('allows access with key when none required', () => {
      expect(validateApiKey('somekey', undefined)).toBe(true);
    });
  });

  describe('key required', () => {
    const requiredKey = 'secret-key-123';

    it('rejects when no key provided', () => {
      expect(validateApiKey(undefined, requiredKey)).toBe(false);
    });

    it('rejects when wrong key provided', () => {
      expect(validateApiKey('wrong-key', requiredKey)).toBe(false);
    });

    it('allows when correct key provided', () => {
      expect(validateApiKey('secret-key-123', requiredKey)).toBe(true);
    });

    it('rejects empty string key', () => {
      expect(validateApiKey('', requiredKey)).toBe(false);
    });
  });
});
