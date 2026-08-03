export interface IParsedProxyHost {
  /** The bare hostname, with any scheme, trailing slash, and `:port` suffix removed. */
  host: string;
  /** Port lifted out of a `host:port` paste, so it can pre-fill the Port field. */
  port?: number;
}

/**
 * Splits what a user typed into the Host field into a bare host + optional port.
 *
 * People paste `http://proxy.corp.example.com:8080/` — every part of that except the
 * hostname breaks the proxy URI the extension host builds (`http://<host>:<port>`), and a
 * broken URI used to mean the request was quietly sent WITHOUT the proxy. A path is
 * deliberately NOT stripped: dropping it would silently change what the user asked for, so
 * `validateProxyHost` rejects it instead and the form shows an error.
 */
export function parseProxyHost(raw: string): IParsedProxyHost {
  const trimmed = raw.trim().replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '').replace(/\/+$/, '');

  // Bracketed IPv6 (`[::1]:8080`) — the colons inside the brackets are part of the address.
  const ipv6 = /^(\[[^\]]*\])(?::(\d{1,5}))?$/.exec(trimmed);
  if (ipv6) {
    return { host: ipv6[1], port: ipv6[2] ? Number(ipv6[2]) : undefined };
  }

  const withPort = /^([^:/\s]+):(\d{1,5})$/.exec(trimmed);
  if (withPort) {
    return { host: withPort[1], port: Number(withPort[2]) };
  }

  return { host: trimmed };
}

/**
 * Validates a already-parsed proxy host. Returns an error message, or `null` when valid.
 */
export function validateProxyHost(host: string): string | null {
  if (!host) {return 'Enter the proxy hostname.';}
  if (/\s/.test(host)) {return 'The host cannot contain spaces.';}
  if (host.includes('/')) {return 'Enter only the hostname — no path.';}
  if (host.includes('@')) {return 'Enter only the hostname — put credentials in the fields below.';}
  if (/^\[[0-9A-Fa-f:.]+\]$/.test(host)) {return null;}
  if (host.includes(':')) {return 'Enter the port in the Port field, not in the host.';}
  if (!/^[A-Za-z0-9]([A-Za-z0-9._-]*[A-Za-z0-9])?$/.test(host)) {
    return 'That is not a valid hostname or IP address.';
  }
  return null;
}

/** True when `port` is a usable TCP port. */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port > 0 && port <= 65535;
}
