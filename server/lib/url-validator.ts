export function isValidPublicUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Block localhost and common internal hostnames
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      return false;
    }

    // Block private IP ranges
    const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipPattern);
    if (match) {
      const [, a, b] = match.map(Number);
      // 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 169.254.x.x
      if (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) ||
          (a === 192 && b === 168) || (a === 169 && b === 254)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
