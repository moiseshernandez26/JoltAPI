/**
 * cURL command generation utilities.
 */

/**
 * Properly escapes a string for single-quoted shell arguments.
 * Replaces every ' with '\'' (end quote, escaped quote, restart quote).
 */
export function shellEscape(str: string): string {
  return `'${str.replace(/'/g, "'\\''")}'`;
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
): string {
  const parts: string[] = ['curl'];

  if (method !== 'GET') {
    parts.push(`-X ${method}`);
  }

  for (const [key, value] of Object.entries(headers)) {
    parts.push(`-H ${shellEscape(`${key}: ${value}`)}`);
  }

  if (body) {
    parts.push(`-d ${shellEscape(body)}`);
  }

  parts.push(shellEscape(url));

  return parts.join(' \\\n  ');
}
