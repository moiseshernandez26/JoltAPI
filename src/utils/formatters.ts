/**
 * Formats a response time in milliseconds to a human-readable string.
 * @param ms - Time in milliseconds.
 * @returns Formatted string like "123ms", "1.2s", or "1m 5s".
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1) {
    return '<1ms';
  }
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Formats a byte size to a human-readable string.
 * @param bytes - Size in bytes.
 * @returns Formatted string like "123B", "1.2KB", or "3.5MB".
 */
export function formatResponseSize(bytes: number): string {
  if (bytes === 0) {
    return '0B';
  }
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Pretty-prints a JSON string for display.
 * @returns The formatted JSON string, or the original string if it is not valid JSON.
 */
export function prettyPrintJson(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
}

/**
 * Generates a descriptive request name from an IHttpRequest.
 * Format: {METHOD} {hostname} {path} {params?}
 * Examples: "GET api.github.com /users", "POST httpbin.org /post ?test=1"
 */
export function generateRequestName(request: import('../models').IHttpRequest): string {
  const method = request.method;
  let hostname = '';

  try {
    const url = new URL(request.url);
    hostname = url.hostname.replace(/\./g, '_');
  } catch {
    hostname = request.url.split('/')[2]?.replace(/\./g, '_') || 'unknown';
  }

  return `${hostname}_${method}`;
}
