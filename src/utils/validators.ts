/**
 * Validates that a string is a well-formed absolute URL.
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates that a string is valid JSON.
 * @returns The parsed object if valid, or null if invalid.
 */
export function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Validates that a variable name is suitable for {{ }} interpolation.
 * Must be non-empty and contain only alphanumeric characters, underscores, and hyphens.
 */
export function isValidVariableName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name);
}

/**
 * Validates that a port number is in the valid range.
 */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port > 0 && port <= 65535;
}
