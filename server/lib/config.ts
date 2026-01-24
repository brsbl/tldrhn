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
 * Validate API key for protected endpoints.
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

  return providedKey === requiredKey;
}
