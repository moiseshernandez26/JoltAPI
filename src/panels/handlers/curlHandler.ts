import * as vscode from 'vscode';
import type { IHttpRequest, IVariableSet } from '../../models';
import type { HostToWebviewMessage } from '../../models/messages';
import { buildCurlCommand, shellEscape } from '../../services/httpService';
import { interpolateTemplate } from './interpolation';

type PostFn = (message: HostToWebviewMessage) => void;

export async function handleCopyCurl(
  payload: { request: IHttpRequest; variables: IVariableSet },
  postMessage: PostFn,
): Promise<void> {
  const enabledVars = payload.variables.variables.filter((v) => v.enabled && v.key);

  let url = payload.request.url;
  const enabledParams = payload.request.queryParams.filter((p) => p.enabled && p.key);
  if (enabledParams.length > 0) {
    const urlObj = new URL(url);
    for (const param of enabledParams) {
      urlObj.searchParams.append(param.key, param.value);
    }
    url = urlObj.toString();
  }

  if (enabledVars.length > 0) {
    url = interpolateTemplate(url, enabledVars);
  }

  const headers: Record<string, string> = {};
  for (const header of payload.request.headers.filter((h) => h.enabled && h.key)) {
    let value = header.value;
    if (enabledVars.length > 0) {
      value = interpolateTemplate(value, enabledVars);
    }
    headers[interpolateTemplate(header.key, enabledVars)] = value;
  }

  if (payload.request.auth.type === 'bearer' && payload.request.auth.bearerToken) {
    let token = payload.request.auth.bearerToken;
    if (enabledVars.length > 0) {token = interpolateTemplate(token, enabledVars);}
    headers['Authorization'] = `Bearer ${token}`;
  } else if (payload.request.auth.type === 'basic' && payload.request.auth.basicUsername) {
    let username = payload.request.auth.basicUsername;
    let password = payload.request.auth.basicPassword ?? '';
    if (enabledVars.length > 0) {
      username = interpolateTemplate(username, enabledVars);
      password = interpolateTemplate(password, enabledVars);
    }
    const credentials = btoa(`${username}:${password}`);
    headers['Authorization'] = `Basic ${credentials}`;
  } else if (payload.request.auth.type === 'apiKey' && payload.request.auth.apiKeyName && payload.request.auth.apiKeyValue) {
    if (payload.request.auth.apiKeyPlacement !== 'query') {
      let name = payload.request.auth.apiKeyName;
      let value = payload.request.auth.apiKeyValue;
      if (enabledVars.length > 0) {
        name = interpolateTemplate(name, enabledVars);
        value = interpolateTemplate(value, enabledVars);
      }
      headers[name] = value;
    }
  }

  if (
    payload.request.auth.type === 'apiKey' &&
    payload.request.auth.apiKeyPlacement === 'query' &&
    payload.request.auth.apiKeyName &&
    payload.request.auth.apiKeyValue
  ) {
    const urlObj = new URL(url);
    let name = payload.request.auth.apiKeyName;
    let value = payload.request.auth.apiKeyValue;
    if (enabledVars.length > 0) {
      name = interpolateTemplate(name, enabledVars);
      value = interpolateTemplate(value, enabledVars);
    }
    urlObj.searchParams.append(name, value);
    url = urlObj.toString();
  }

  let body: string | undefined;
  const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
  if (payload.request.body.type === 'json' && payload.request.body.jsonBody) {
    if (!hasContentType) {
      headers['Content-Type'] = 'application/json';
    }
    body = payload.request.body.jsonBody;
    if (enabledVars.length > 0) {body = interpolateTemplate(body, enabledVars);}
  } else if (payload.request.body.type === 'raw' && payload.request.body.rawBody) {
    if (!hasContentType && payload.request.body.rawContentType) {
      headers['Content-Type'] = payload.request.body.rawContentType;
    }
    body = payload.request.body.rawBody;
    if (enabledVars.length > 0) {body = interpolateTemplate(body, enabledVars);}
  } else if (payload.request.body.type === 'form-data' && payload.request.body.formData) {
    const enabledFormData = payload.request.body.formData.filter((f) => f.enabled && f.key);
    if (enabledFormData.length > 0) {
      if (payload.request.body.formEncoding === 'multipart') {
        const formParts: string[] = [];
        for (const f of enabledFormData) {
          let key = f.key;
          let value = f.value;
          if (enabledVars.length > 0) {
            key = interpolateTemplate(key, enabledVars);
            value = interpolateTemplate(value, enabledVars);
          }
          formParts.push(`-F ${shellEscape(`${key}=${value}`)}`);
        }
        const headerLines = Object.entries(headers)
          .filter(([k]) => k.toLowerCase() !== 'content-type')
          .map(([k, v]) => `-H ${shellEscape(`${k}: ${v}`)}`);
        const parts: string[] = ['curl'];
        if (payload.request.method !== 'GET') {parts.push(`-X ${payload.request.method}`);}
        parts.push(...headerLines);
        parts.push(...formParts);
        parts.push(shellEscape(url));
        const curl = parts.join(' \\\n  ');
        await vscode.env.clipboard.writeText(curl);
        postMessage({ command: 'curlCopied', payload: undefined });
        return;
      } else {
        if (!hasContentType) {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        const searchParams = new URLSearchParams();
        for (const f of enabledFormData) {
          let key = f.key;
          let value = f.value;
          if (enabledVars.length > 0) {
            key = interpolateTemplate(key, enabledVars);
            value = interpolateTemplate(value, enabledVars);
          }
          searchParams.append(key, value);
        }
        body = searchParams.toString();
      }
    }
  }

  const curl = buildCurlCommand(payload.request.method, url, headers, body);
  await vscode.env.clipboard.writeText(curl);
  postMessage({ command: 'curlCopied', payload: undefined });
}