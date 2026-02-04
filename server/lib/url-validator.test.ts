import { describe, it, expect } from 'vitest';
import { isValidPublicUrl } from './url-validator';

describe('isValidPublicUrl', () => {
  describe('valid public URLs', () => {
    it('should accept https URLs', () => {
      expect(isValidPublicUrl('https://example.com')).toBe(true);
      expect(isValidPublicUrl('https://www.google.com')).toBe(true);
      expect(isValidPublicUrl('https://subdomain.example.org/path')).toBe(true);
    });

    it('should accept http URLs', () => {
      expect(isValidPublicUrl('http://example.com')).toBe(true);
      expect(isValidPublicUrl('http://www.google.com/page')).toBe(true);
    });

    it('should accept URLs with ports', () => {
      expect(isValidPublicUrl('https://example.com:8080')).toBe(true);
      expect(isValidPublicUrl('http://example.com:3000/api')).toBe(true);
    });

    it('should accept URLs with query strings and fragments', () => {
      expect(isValidPublicUrl('https://example.com?query=value')).toBe(true);
      expect(isValidPublicUrl('https://example.com#section')).toBe(true);
      expect(isValidPublicUrl('https://example.com/path?foo=bar#anchor')).toBe(true);
    });
  });

  describe('invalid protocols', () => {
    it('should reject ftp protocol', () => {
      expect(isValidPublicUrl('ftp://example.com')).toBe(false);
    });

    it('should reject file protocol', () => {
      expect(isValidPublicUrl('file:///etc/passwd')).toBe(false);
      expect(isValidPublicUrl('file://localhost/etc/passwd')).toBe(false);
    });

    it('should reject javascript protocol', () => {
      expect(isValidPublicUrl('javascript:alert(1)')).toBe(false);
    });

    it('should reject data protocol', () => {
      expect(isValidPublicUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('should reject other protocols', () => {
      expect(isValidPublicUrl('mailto:test@example.com')).toBe(false);
      expect(isValidPublicUrl('tel:+1234567890')).toBe(false);
    });
  });

  describe('localhost variations', () => {
    it('should reject localhost', () => {
      expect(isValidPublicUrl('http://localhost')).toBe(false);
      expect(isValidPublicUrl('https://localhost')).toBe(false);
      expect(isValidPublicUrl('http://localhost:3000')).toBe(false);
      expect(isValidPublicUrl('https://localhost/path')).toBe(false);
    });

    it('should reject localhost with uppercase', () => {
      expect(isValidPublicUrl('http://LOCALHOST')).toBe(false);
      expect(isValidPublicUrl('http://LocalHost')).toBe(false);
    });

    it('should reject 127.0.0.1', () => {
      expect(isValidPublicUrl('http://127.0.0.1')).toBe(false);
      expect(isValidPublicUrl('https://127.0.0.1')).toBe(false);
      expect(isValidPublicUrl('http://127.0.0.1:8080')).toBe(false);
    });

    it('should reject 0.0.0.0', () => {
      expect(isValidPublicUrl('http://0.0.0.0')).toBe(false);
      expect(isValidPublicUrl('https://0.0.0.0')).toBe(false);
      expect(isValidPublicUrl('http://0.0.0.0:5000')).toBe(false);
    });
  });

  describe('private IP ranges', () => {
    describe('10.x.x.x range', () => {
      it('should reject 10.0.0.0/8 range', () => {
        expect(isValidPublicUrl('http://10.0.0.1')).toBe(false);
        expect(isValidPublicUrl('http://10.0.0.0')).toBe(false);
        expect(isValidPublicUrl('http://10.255.255.255')).toBe(false);
        expect(isValidPublicUrl('http://10.1.2.3')).toBe(false);
      });
    });

    describe('172.16.x.x - 172.31.x.x range', () => {
      it('should reject 172.16.0.0/12 range', () => {
        expect(isValidPublicUrl('http://172.16.0.1')).toBe(false);
        expect(isValidPublicUrl('http://172.20.0.1')).toBe(false);
        expect(isValidPublicUrl('http://172.31.255.255')).toBe(false);
      });

      it('should accept 172.15.x.x (not in private range)', () => {
        expect(isValidPublicUrl('http://172.15.0.1')).toBe(true);
        expect(isValidPublicUrl('http://172.15.255.255')).toBe(true);
      });

      it('should accept 172.32.x.x (not in private range)', () => {
        expect(isValidPublicUrl('http://172.32.0.1')).toBe(true);
        expect(isValidPublicUrl('http://172.32.255.255')).toBe(true);
      });
    });

    describe('192.168.x.x range', () => {
      it('should reject 192.168.0.0/16 range', () => {
        expect(isValidPublicUrl('http://192.168.0.1')).toBe(false);
        expect(isValidPublicUrl('http://192.168.1.1')).toBe(false);
        expect(isValidPublicUrl('http://192.168.255.255')).toBe(false);
      });

      it('should accept other 192.x.x.x addresses', () => {
        expect(isValidPublicUrl('http://192.169.0.1')).toBe(true);
        expect(isValidPublicUrl('http://192.167.0.1')).toBe(true);
      });
    });

    describe('169.254.x.x range (link-local)', () => {
      it('should reject 169.254.0.0/16 range', () => {
        expect(isValidPublicUrl('http://169.254.0.1')).toBe(false);
        expect(isValidPublicUrl('http://169.254.169.254')).toBe(false);
        expect(isValidPublicUrl('http://169.254.255.255')).toBe(false);
      });

      it('should accept other 169.x.x.x addresses', () => {
        expect(isValidPublicUrl('http://169.253.0.1')).toBe(true);
        expect(isValidPublicUrl('http://169.255.0.1')).toBe(true);
      });
    });

    describe('127.x.x.x range (loopback)', () => {
      it('should reject 127.0.0.0/8 range', () => {
        expect(isValidPublicUrl('http://127.0.0.2')).toBe(false);
        expect(isValidPublicUrl('http://127.1.1.1')).toBe(false);
        expect(isValidPublicUrl('http://127.255.255.255')).toBe(false);
      });
    });
  });

  describe('invalid URLs', () => {
    it('should reject malformed URLs', () => {
      expect(isValidPublicUrl('not-a-url')).toBe(false);
      expect(isValidPublicUrl('http://')).toBe(false);
      expect(isValidPublicUrl('://example.com')).toBe(false);
      expect(isValidPublicUrl('htp://example.com')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidPublicUrl('')).toBe(false);
    });

    it('should reject URLs with only whitespace', () => {
      expect(isValidPublicUrl('   ')).toBe(false);
      expect(isValidPublicUrl('\t\n')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should accept public IP addresses', () => {
      expect(isValidPublicUrl('http://8.8.8.8')).toBe(true);
      expect(isValidPublicUrl('http://1.1.1.1')).toBe(true);
      expect(isValidPublicUrl('http://203.0.113.1')).toBe(true);
    });

    it('should handle URLs with authentication', () => {
      expect(isValidPublicUrl('https://user:pass@example.com')).toBe(true);
    });

    it('should handle internationalized domain names', () => {
      expect(isValidPublicUrl('https://xn--n3h.com')).toBe(true);
    });
  });
});
