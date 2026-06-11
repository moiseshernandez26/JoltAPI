import { randomUUID } from 'crypto';
import type { IHttpRequest, IResolvedHttpRequest, IVariableSet, IHistoryEntry } from '../../models';
import type { HostToWebviewMessage } from '../../models/messages';
import { executeRequest } from '../../services/httpService';
import { interpolateTemplate, extractUnresolved } from './interpolation';
import { loadCollections, saveCollection } from '../../services/storageService';
import { generateRequestName } from '../../utils/formatters';
import { logError } from '../../utils/logger';

type PostFn = (message: HostToWebviewMessage) => void;

export async function handleSendRequest(
  payload: { request: IHttpRequest; variables: IVariableSet },
  postMessage: PostFn,
  addToHistory: (entry: IHistoryEntry) => void,
  onChanged?: () => void,
): Promise<void> {
  let resolved = resolveHttpRequest(payload.request);

  if (payload.variables.variables.length > 0) {
    const enabledVars = payload.variables.variables.filter((v) => v.enabled && v.key);
    if (enabledVars.length > 0) {
      resolved.url = interpolateTemplate(resolved.url, enabledVars);
      for (const [key, value] of Object.entries(resolved.headers)) {
        resolved.headers[interpolateTemplate(key, enabledVars)] =
          interpolateTemplate(value, enabledVars);
      }
      if (resolved.body) {
        resolved.body = interpolateTemplate(resolved.body, enabledVars);
      }
    }
  }

  const textsToCheck: string[] = [resolved.url];
  for (const [key, value] of Object.entries(resolved.headers)) {
    textsToCheck.push(key, value);
  }
  if (resolved.body) {
    textsToCheck.push(resolved.body);
  }
  const unresolved = extractUnresolved(...textsToCheck);
  if (unresolved.length > 0) {
    const names = unresolved.join(', ');
    postMessage({
      command: 'error',
      payload: {
        code: 'UNRESOLVED_VARIABLE',
        message: `Unresolved variable(s): ${names}. Add them in the Variables tab or fix the URL.`,
      },
    });
    return;
  }

  try {
    const response = await executeRequest(resolved);
    const truncatedResponse = { ...response, body: response.body.slice(0, 10000) + (response.body.length > 10000 ? '...[truncated]' : '') };
    const historyEntry: IHistoryEntry = {
      id: randomUUID(),
      request: payload.request,
      response: truncatedResponse,
      createdAt: Date.now(),
    };
    addToHistory(historyEntry);
    postMessage({
      command: 'responseReceived',
      payload: { requestId: payload.request.id, response },
    });

    autoSaveToDefaultCollection(payload.request, postMessage, onChanged).catch((err) => {
      console.error('[JoltAPI] autoSave failed:', err);
    });
  } catch (err: unknown) {
    logError('sendRequest failed', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorCode = (err as { code?: string }).code ?? 'UNKNOWN';
    postMessage({ command: 'error', payload: { code: errorCode, message: errorMessage } });
  }
}

async function autoSaveToDefaultCollection(request: IHttpRequest, postMessage: PostFn, onChanged?: () => void): Promise<void> {
  const collections = await loadCollections();
  const defaultCollection = collections.find((c) => c.name === 'Default');
  if (!defaultCollection) {return;}

  if (!request.url) {return;}

  const name = generateRequestName(request);
  const alreadySaved = defaultCollection.requests.some((r) => {
    return r.request.url === request.url &&
      r.request.method === request.method &&
      r.name === name;
  });
  if (alreadySaved) {return;}

  const now = Date.now();
  defaultCollection.requests.push({
    id: randomUUID(),
    name,
    request: { ...request },
    createdAt: now,
    updatedAt: now,
  });
  defaultCollection.updatedAt = now;
  await saveCollection(defaultCollection);

  const updated = await loadCollections();
  postMessage({ command: 'collectionsLoaded', payload: { collections: updated } });
  if (onChanged) { onChanged(); }
}

function resolveHttpRequest(request: IHttpRequest): IResolvedHttpRequest {
  let url = request.url;

  const enabledParams = request.queryParams.filter((p) => p.enabled && p.key);
  if (enabledParams.length > 0) {
    const urlObj = new URL(url);
    for (const param of enabledParams) {
      urlObj.searchParams.append(param.key, param.value);
    }
    url = urlObj.toString();
  }

  const headers: Record<string, string> = {};
  for (const header of request.headers.filter((h) => h.enabled && h.key)) {
    headers[header.key] = header.value;
  }

  if (request.auth.type === 'bearer' && request.auth.bearerToken) {
    headers['Authorization'] = `Bearer ${request.auth.bearerToken}`;
  } else if (request.auth.type === 'basic' && request.auth.basicUsername) {
    const credentials = btoa(`${request.auth.basicUsername}:${request.auth.basicPassword ?? ''}`);
    headers['Authorization'] = `Basic ${credentials}`;
  } else if (request.auth.type === 'apiKey' && request.auth.apiKeyName && request.auth.apiKeyValue) {
    if (request.auth.apiKeyPlacement !== 'query') {
      headers[request.auth.apiKeyName] = request.auth.apiKeyValue;
    }
  }

  if (
    request.auth.type === 'apiKey' &&
    request.auth.apiKeyPlacement === 'query' &&
    request.auth.apiKeyName &&
    request.auth.apiKeyValue
  ) {
    const urlObj = new URL(url);
    urlObj.searchParams.append(request.auth.apiKeyName, request.auth.apiKeyValue);
    url = urlObj.toString();
  }

  let body: string | undefined;
  const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
  if (request.body.type === 'json' && request.body.jsonBody) {
    if (!hasContentType) {
      headers['Content-Type'] = 'application/json';
    }
    body = request.body.jsonBody;
  } else if (request.body.type === 'raw' && request.body.rawBody) {
    if (!hasContentType && request.body.rawContentType) {
      headers['Content-Type'] = request.body.rawContentType;
    }
    body = request.body.rawBody;
  } else if (request.body.type === 'form-data' && request.body.formData) {
    const enabledFormData = request.body.formData.filter((f) => f.enabled && f.key);
    if (enabledFormData.length > 0) {
      if (request.body.formEncoding === 'multipart') {
        const boundary = `----JoltAPI${Date.now()}`;
        headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
        const parts: string[] = [];
        for (const f of enabledFormData) {
          parts.push(`--${boundary}`);
          parts.push(`Content-Disposition: form-data; name="${f.key}"`);
          parts.push('');
          parts.push(f.value);
        }
        parts.push(`--${boundary}--`);
        body = parts.join('\r\n');
      } else {
        if (!hasContentType) {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        const searchParams = new URLSearchParams();
        for (const f of enabledFormData) {searchParams.append(f.key, f.value);}
        body = searchParams.toString();
      }
    }
  }

  return {
    method: request.method, url, headers, body,
    proxy: request.proxy.enabled ? request.proxy : undefined,
    timeout: request.settings.timeout,
    sslVerify: request.settings.sslVerify,
  };
}