import crypto from 'crypto';

/**
 * Parse allowed CORS origins from environment variable.
 * Returns empty array if not set.
 */
export function parseAllowedOrigins(envValue: string | undefined): string[] {
  if (!envValue) {
    return [];
  }
  return envValue.split(',').map(o => o.trim()).filter(o => o.length > 0);
}

/**
 * Check if an origin is allowed based on environment and allowed origins list.
 */
export function isOriginAllowed(
  origin: string | undefined,
  allowedOrigins: string[],
  isProduction: boolean
): boolean {
  // Allow requests with no origin (e.g., curl, same-origin)
  if (!origin) {
    return true;
  }

  // In development, allow localhost on any port
  if (!isProduction && origin.startsWith('http://localhost:')) {
    return true;
  }

  // Check against allowed origins list
  return allowedOrigins.includes(origin);
}

/**
 * Validate API key for protected endpoints using constant-time comparison.
 * Returns true if no key is required or if the key matches.
 */
export function validateApiKey(
  providedKey: string | undefined,
  requiredKey: string | undefined
): boolean {
  // If no key is required, allow access
  if (!requiredKey) {
    return true;
  }

  // Key is required but not provided
  if (!providedKey) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  const providedBuffer = Buffer.from(providedKey);
  const requiredBuffer = Buffer.from(requiredKey);

  // If lengths differ, still perform comparison to maintain constant time
  // but return false
  if (providedBuffer.length !== requiredBuffer.length) {
    // Compare against itself to maintain constant time behavior
    crypto.timingSafeEqual(requiredBuffer, requiredBuffer);
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, requiredBuffer);
}
