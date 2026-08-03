/**
 * cURL command generation utilities.
 */

import type { IProxyConfig } from '../models';

/**
 * Properly escapes a string for single-quoted shell arguments.
 * Replaces every ' with '\'' (end quote, escaped quote, restart quote).
 */
export function shellEscape(str: string): string {
  return `'${str.replace(/'/g, "'\\''")}'`;
}

/**
 * Builds the `--proxy` / `--proxy-user` flags for a resolved proxy config.
 *
 * A copied command has to reproduce what JoltAPI actually sends: without these, pasting the
 * command into a terminal silently goes direct and "works" (or fails) for reasons that have
 * nothing to do with the request under test. Returns an empty array when there is no proxy.
 */
export function buildCurlProxyFlags(proxy?: IProxyConfig): string[] {
  if (!proxy?.enabled || !proxy.host || !proxy.port) {return [];}

  const flags = [`--proxy ${shellEscape(`http://${proxy.host}:${proxy.port}`)}`];
  if (proxy.auth?.username) {
    flags.push(`--proxy-user ${shellEscape(`${proxy.auth.username}:${proxy.auth.password ?? ''}`)}`);
  }
  return flags;
}

/**
 * Builds a cURL command from a resolved request — useful for debugging and copy-to-clipboard.
 * Uses proper single-quote shell escaping to prevent command injection.
 */
export function buildCurlCommand(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: string,
  proxy?: IProxyConfig,
): string {
  const parts: string[] = ['curl'];

  if (method !== 'GET') {
    parts.push(`-X ${method}`);
  }

  parts.push(...buildCurlProxyFlags(proxy));

  for (const [key, value] of Object.entries(headers)) {
    parts.push(`-H ${shellEscape(`${key}: ${value}`)}`);
  }

  if (body) {
    parts.push(`-d ${shellEscape(body)}`);
  }

  parts.push(shellEscape(url));

  return parts.join(' \\\n  ');
}
