import type { IHttpRequest, IVariable, IKeyValuePair, IHttpResponseHeader } from '../types';

export const HEADER_SUGGESTIONS = [
  { label: 'Accept', value: '*/*' },
  { label: 'Accept-Encoding', value: 'gzip, deflate, br' },
  { label: 'Accept-Language' },
  { label: 'Authorization', value: 'Bearer <token>' },
  { label: 'Cache-Control', value: 'no-cache' },
  { label: 'Content-Type', value: 'application/json' },
  { label: 'Cookie' },
  { label: 'Host' },
  { label: 'Origin' },
  { label: 'Referer' },
  { label: 'User-Agent' },
];

export const HEADER_VALUE_SUGGESTIONS: Record<string, { label: string; value?: string }[]> = {
  'content-type': [
    { label: 'application/json' },
    { label: 'application/xml' },
    { label: 'application/x-www-form-urlencoded' },
    { label: 'multipart/form-data' },
    { label: 'text/plain' },
    { label: 'text/html' },
    { label: 'application/octet-stream' },
  ],
  accept: [
    { label: '*/*' },
    { label: 'application/json' },
    { label: 'text/html' },
    { label: 'application/xml' },
    { label: 'text/plain' },
  ],
  'accept-encoding': [
    { label: 'gzip, deflate, br' },
    { label: 'gzip, deflate' },
    { label: 'identity' },
  ],
  'cache-control': [
    { label: 'no-cache' },
    { label: 'no-store' },
    { label: 'max-age=0' },
    { label: 'max-age=3600' },
    { label: 'public, max-age=86400' },
  ],
  authorization: [
    { label: 'Bearer ' },
    { label: 'Basic ' },
  ],
};

export function formatRequestHeaders(request: IHttpRequest, variables: IVariable[]): IHttpResponseHeader[] {
  const result: IHttpResponseHeader[] = [];

  const interpolate = (text: string): string => {
    if (!text) {return text;}
    return text.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_-]*)\}\}/g, (_m, name: string) => {
      const v = variables.find((x) => x.key === name && x.enabled);
      return v ? v.value : _m;
    });
  };

  try {
    const url = new URL(interpolate(request.url) || 'https://localhost');
    result.push({ name: 'Host', value: url.host });
  } catch {
    // Invalid URL — skip
  }

  for (const h of request.headers) {
    if (h.enabled && h.key) {
      result.push({ name: interpolate(h.key), value: interpolate(h.value) });
    }
  }

  if (request.auth.type === 'bearer' && request.auth.bearerToken) {
    result.push({ name: 'Authorization', value: 'Bearer ***' });
  } else if (request.auth.type === 'basic' && request.auth.basicUsername) {
    result.push({ name: 'Authorization', value: 'Basic ***' });
  } else if (request.auth.type === 'apiKey' && request.auth.apiKeyName && request.auth.apiKeyValue) {
    if (request.auth.apiKeyPlacement !== 'query') {
      result.push({ name: interpolate(request.auth.apiKeyName), value: '***' });
    }
  }

  if (request.body.type === 'json' && request.body.jsonBody) {
    if (!result.some((h) => h.name.toLowerCase() === 'content-type')) {
      result.push({ name: 'Content-Type', value: 'application/json' });
    }
  } else if (request.body.type === 'raw' && request.body.rawBody && request.body.rawContentType) {
    if (!result.some((h) => h.name.toLowerCase() === 'content-type')) {
      result.push({ name: 'Content-Type', value: request.body.rawContentType });
    }
  } else if (request.body.type === 'form-data' && request.body.formData?.some((f) => f.enabled && f.key)) {
    if (!result.some((h) => h.name.toLowerCase() === 'content-type')) {
      result.push({ name: 'Content-Type', value: 'application/x-www-form-urlencoded' });
    }
  }

  if (!result.some((h) => h.name.toLowerCase() === 'user-agent')) {
    result.push({ name: 'User-Agent', value: 'JoltAPI (Node.js fetch)' });
  }
  if (!result.some((h) => h.name.toLowerCase() === 'accept')) {
    result.push({ name: 'Accept', value: '*/*' });
  }
  if (!result.some((h) => h.name.toLowerCase() === 'accept-encoding')) {
    result.push({ name: 'Accept-Encoding', value: 'gzip, deflate, br' });
  }
  if (!result.some((h) => h.name.toLowerCase() === 'connection')) {
    result.push({ name: 'Connection', value: 'keep-alive' });
  }

  return result;
}
