/**
 * HTTP error classification and URL utilities.
 */

/**
 * Error thrown when an HTTP request cannot be completed.
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public code: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Builds the full URL with https:// scheme if missing.
 */
export function buildUrl(baseUrl: string): string {
  let url = baseUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

/**
 * Redacts query parameter values from a URL for safe logging.
 * Replaces all query param values with `***` to prevent leaking API keys/tokens.
 */
export function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const key of u.searchParams.keys()) {
      u.searchParams.set(key, '***');
    }
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Classifies a fetch error into a typed HttpError.
 */
export function classifyFetchError(err: unknown, timeoutMs: number): HttpError {
  if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
    return new HttpError(
      `Request timed out after ${timeoutMs}ms`,
      'TIMEOUT',
      err,
    );
  }

  if (err instanceof Error) {
    const message = err.message.toLowerCase();
    const cause = (err as { cause?: Error }).cause;
    const causeMsg = cause?.message?.toLowerCase() ?? '';

    if (
      message.includes('ssl') ||
      message.includes('certificate') ||
      message.includes('unsafe') ||
      causeMsg.includes('certificate') ||
      causeMsg.includes('ssl') ||
      causeMsg.includes('tls')
    ) {
      return new HttpError('SSL certificate verification failed. Disable SSL in settings if using self-signed certificates.', 'SSL_ERROR', err);
    }

    if (
      message.includes('dns') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('network') ||
      message.includes('fetch failed') ||
      causeMsg.includes('enotfound') ||
      causeMsg.includes('econnrefused') ||
      causeMsg.includes('dns')
    ) {
      return new HttpError(
        'Could not connect to the server. Check that the URL is correct and the server is reachable.',
        'NETWORK_ERROR',
        err,
      );
    }

    if (message.includes('url') || message.includes('invalid') || message.includes('parse')) {
      return new HttpError('The URL is not valid. Make sure it starts with http:// or https://.', 'INVALID_URL', err);
    }

    return new HttpError(`Request failed: ${err.message}`, 'UNKNOWN', err);
  }

  return new HttpError(
    err instanceof Error ? err.message : 'An unexpected error occurred',
    'UNKNOWN',
    err,
  );
}
