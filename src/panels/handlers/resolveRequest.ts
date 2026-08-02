import type { IHttpRequest, IResolvedHttpRequest } from '../../models';
import { interpolateTemplate } from './interpolation';

/**
 * Resolves a request template into the exact payload sent to `httpService`.
 *
 * All variable interpolation happens here, per-field, BEFORE any value is placed into a
 * `URLSearchParams` (query params, apiKey-in-query). `URLSearchParams` percent-encodes
 * `{` and `}`, so interpolating the assembled URL afterward would never match `{{name}}`
 * against the now-encoded `%7B%7Bname%7D%7D` — variables in query params would silently
 * fail to resolve and never be reported as unresolved.
 *
 * Kept dependency-free (no `vscode` import, directly or transitively) so it can be
 * unit tested with plain `mocha`/`node` outside the extension host.
 */
export function resolveHttpRequest(
  request: IHttpRequest,
  variables: { key: string; value: string; enabled: boolean }[],
): { resolved: IResolvedHttpRequest; rawPieces: string[] } {
  const rawPieces: string[] = [];
  const interp = (text: string): string => {
    const result = variables.length > 0 ? interpolateTemplate(text, variables) : text;
    rawPieces.push(result);
    return result;
  };

  let url = interp(request.url);

  const enabledParams = request.queryParams.filter((p) => p.enabled && p.key);
  if (enabledParams.length > 0) {
    const urlObj = new URL(url);
    for (const param of enabledParams) {
      urlObj.searchParams.append(interp(param.key), interp(param.value));
    }
    url = urlObj.toString();
  }

  const headers: Record<string, string> = {};
  for (const header of request.headers.filter((h) => h.enabled && h.key)) {
    headers[interp(header.key)] = interp(header.value);
  }

  if (request.auth.type === 'bearer' && request.auth.bearerToken) {
    headers['Authorization'] = `Bearer ${interp(request.auth.bearerToken)}`;
  } else if (request.auth.type === 'basic' && request.auth.basicUsername) {
    const username = interp(request.auth.basicUsername);
    const password = interp(request.auth.basicPassword ?? '');
    headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
  } else if (request.auth.type === 'apiKey' && request.auth.apiKeyName && request.auth.apiKeyValue) {
    if (request.auth.apiKeyPlacement !== 'query') {
      headers[interp(request.auth.apiKeyName)] = interp(request.auth.apiKeyValue);
    }
  }

  if (
    request.auth.type === 'apiKey' &&
    request.auth.apiKeyPlacement === 'query' &&
    request.auth.apiKeyName &&
    request.auth.apiKeyValue
  ) {
    const urlObj = new URL(url);
    urlObj.searchParams.append(interp(request.auth.apiKeyName), interp(request.auth.apiKeyValue));
    url = urlObj.toString();
  }

  let body: string | undefined;
  const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
  if (request.body.type === 'json' && request.body.jsonBody) {
    if (!hasContentType) {
      headers['Content-Type'] = 'application/json';
    }
    body = interp(request.body.jsonBody);
  } else if (request.body.type === 'raw' && request.body.rawBody) {
    if (!hasContentType && request.body.rawContentType) {
      headers['Content-Type'] = request.body.rawContentType;
    }
    body = interp(request.body.rawBody);
  } else if (request.body.type === 'form-data' && request.body.formData) {
    const enabledFormData = request.body.formData.filter((f) => f.enabled && f.key);
    if (enabledFormData.length > 0) {
      if (request.body.formEncoding === 'multipart') {
        const boundary = `----JoltAPI${Date.now()}`;
        headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
        const parts: string[] = [];
        for (const f of enabledFormData) {
          const key = interp(f.key);
          const value = interp(f.value);
          parts.push(`--${boundary}`);
          parts.push(`Content-Disposition: form-data; name="${key}"`);
          parts.push('');
          parts.push(value);
        }
        parts.push(`--${boundary}--`);
        body = parts.join('\r\n');
      } else {
        if (!hasContentType) {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        const searchParams = new URLSearchParams();
        for (const f of enabledFormData) {searchParams.append(interp(f.key), interp(f.value));}
        body = searchParams.toString();
      }
    }
  }

  return {
    resolved: {
      method: request.method, url, headers, body,
      proxy: request.proxy.enabled ? request.proxy : undefined,
      timeout: request.settings.timeout,
      sslVerify: request.settings.sslVerify,
    },
    rawPieces,
  };
}
