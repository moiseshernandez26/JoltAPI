/**
 * Redirect handling.
 *
 * `followRedirects` / `maxRedirects` were part of `IHttpSettings` from v0.1.0 but nothing
 * ever read them — `executeRequest` just let `fetch` follow redirects with its own built-in
 * limit. These helpers are pure so the tricky parts (relative Location, method downgrade,
 * credential stripping) can be unit tested without a server.
 */

export interface IRedirectStep {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

/** Status codes that carry a `Location` header. */
export function isRedirectStatus(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

/**
 * Computes the next request in a redirect chain, or `null` when the response can't be
 * followed (no/invalid `Location`).
 *
 * Two rules matter beyond joining the URL:
 * - **Method downgrade**: 303 always becomes GET; 301/302 become GET for anything that
 *   isn't already GET/HEAD, matching what browsers and curl do. The body is dropped with it.
 * - **Credential stripping**: `Authorization`, `Cookie`, and `Proxy-Authorization` are
 *   removed when the redirect crosses to a different origin. Forwarding them would hand a
 *   bearer token to whatever host the server named — a real exfiltration path, since the
 *   redirect target is chosen by the remote side, not the user.
 */
export function nextRedirectStep(
  current: IRedirectStep,
  status: number,
  location: string | null,
): IRedirectStep | null {
  if (!location) {return null;}

  let nextUrl: URL;
  try {
    nextUrl = new URL(location, current.url);
  } catch {
    return null;
  }

  const sameOrigin = new URL(current.url).origin === nextUrl.origin;
  const headers = sameOrigin ? { ...current.headers } : stripCredentialHeaders(current.headers);

  const downgradeToGet =
    status === 303 ||
    ((status === 301 || status === 302) && current.method !== 'GET' && current.method !== 'HEAD');

  if (downgradeToGet) {
    const { 'Content-Type': _ct, 'content-type': _ct2, ...rest } = headers;
    return { url: nextUrl.toString(), method: 'GET', headers: rest, body: undefined };
  }

  return { url: nextUrl.toString(), method: current.method, headers, body: current.body };
}

const CREDENTIAL_HEADERS = ['authorization', 'cookie', 'proxy-authorization'];

function stripCredentialHeaders(headers: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!CREDENTIAL_HEADERS.includes(key.toLowerCase())) {
      result[key] = value;
    }
  }
  return result;
}
