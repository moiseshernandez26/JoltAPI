import type { IProxyConfig } from './httpRequest';

/**
 * A named, reusable proxy configuration shared across requests.
 *
 * Stored once in `.joltapi/proxies.json`; a request only references it by `id`
 * (`IHttpRequest.proxyId`), so editing a profile changes every request using it.
 */
export interface IProxyProfile {
  id: string;
  /** Display name shown in the request's proxy dropdown. */
  name: string;
  /** Hostname only — no scheme, no port. */
  host: string;
  port: number;
  /** Optional proxy authentication. */
  auth?: {
    username: string;
    password: string;
  };
}

/**
 * On-disk shape of `.joltapi/proxies.json`.
 */
export interface IProxyProfileSet {
  profiles: IProxyProfile[];
}

/**
 * Converts a saved profile into the flat config `httpService` consumes.
 * Kept here (dependency-free) so both the resolver and any future caller agree on the shape.
 */
export function proxyProfileToConfig(profile: IProxyProfile): IProxyConfig {
  return {
    enabled: true,
    host: profile.host,
    port: profile.port,
    auth: profile.auth,
  };
}
