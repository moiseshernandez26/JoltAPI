import { describe, it, expect } from 'vitest';
import { isValidPort, parseProxyHost, validateProxyHost } from '../src/utils/proxyHost';

describe('parseProxyHost', () => {
  it('leaves a bare hostname alone', () => {
    expect(parseProxyHost('proxy.example.com')).toEqual({ host: 'proxy.example.com' });
  });

  it('strips a scheme and trailing slash', () => {
    expect(parseProxyHost('http://proxy.example.com/')).toEqual({ host: 'proxy.example.com' });
    expect(parseProxyHost('https://proxy.example.com')).toEqual({ host: 'proxy.example.com' });
  });

  // The bug this guards: `host:port` used to be stored verbatim, producing the URI
  // `http://proxy.example.com:8080:8080`, which made the proxy agent fail to build.
  it('lifts a pasted port out of the host', () => {
    expect(parseProxyHost('proxy.example.com:8080')).toEqual({
      host: 'proxy.example.com',
      port: 8080,
    });
    expect(parseProxyHost('http://proxy.example.com:3128/')).toEqual({
      host: 'proxy.example.com',
      port: 3128,
    });
  });

  it('keeps a path so validation can reject it instead of silently dropping it', () => {
    expect(parseProxyHost('proxy.example.com/path').host).toBe('proxy.example.com/path');
  });

  it('handles bracketed IPv6 with and without a port', () => {
    expect(parseProxyHost('[::1]')).toEqual({ host: '[::1]' });
    expect(parseProxyHost('[::1]:8080')).toEqual({ host: '[::1]', port: 8080 });
  });

  it('trims surrounding whitespace', () => {
    expect(parseProxyHost('  proxy.example.com  ')).toEqual({ host: 'proxy.example.com' });
  });
});

describe('validateProxyHost', () => {
  it('accepts hostnames, IPv4, and bracketed IPv6', () => {
    expect(validateProxyHost('proxy.example.com')).toBeNull();
    expect(validateProxyHost('proxy-1.corp.example.com')).toBeNull();
    expect(validateProxyHost('10.0.0.1')).toBeNull();
    expect(validateProxyHost('localhost')).toBeNull();
    expect(validateProxyHost('[::1]')).toBeNull();
  });

  it('rejects empty, spaces, paths, credentials, and leftover colons', () => {
    expect(validateProxyHost('')).toMatch(/Enter the proxy hostname/);
    expect(validateProxyHost('proxy example.com')).toMatch(/spaces/);
    expect(validateProxyHost('proxy.example.com/path')).toMatch(/no path/);
    expect(validateProxyHost('user@proxy.example.com')).toMatch(/credentials/);
    expect(validateProxyHost('proxy.example.com:8080:8080')).toMatch(/Port field/);
  });

  it('rejects hostnames with invalid characters or edge punctuation', () => {
    expect(validateProxyHost('proxy_example!.com')).toMatch(/not a valid hostname/);
    expect(validateProxyHost('-proxy.example.com')).toMatch(/not a valid hostname/);
    expect(validateProxyHost('proxy.example.com-')).toMatch(/not a valid hostname/);
  });
});

describe('isValidPort', () => {
  it('accepts 1..65535 integers only', () => {
    expect(isValidPort(1)).toBe(true);
    expect(isValidPort(8080)).toBe(true);
    expect(isValidPort(65535)).toBe(true);
    expect(isValidPort(0)).toBe(false);
    expect(isValidPort(65536)).toBe(false);
    expect(isValidPort(-1)).toBe(false);
    expect(isValidPort(80.5)).toBe(false);
    expect(isValidPort(NaN)).toBe(false);
  });
});
