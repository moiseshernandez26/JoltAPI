import * as vscode from 'vscode';
import type { IHttpRequest, IVariableSet } from '../../models';
import type { HostToWebviewMessage } from '../../models/messages';
import { buildCurlCommand, shellEscape } from '../../services/httpService';
import { interpolateTemplate } from './interpolation';
import { resolveHttpRequest } from './resolveRequest';

type PostFn = (message: HostToWebviewMessage) => void;

/**
 * "Copy as cURL" shares its URL/header/auth/body resolution with `resolveHttpRequest`
 * (same interpolate-before-encode ordering) so the copied command matches what actually
 * gets sent. Multipart form-data is the one exception: curl builds its own multipart body
 * from `-F key=value` flags, so that case is handled separately instead of using the raw
 * multipart body `resolveHttpRequest` builds for the real HTTP request.
 */
export async function handleCopyCurl(
  payload: { request: IHttpRequest; variables: IVariableSet },
  postMessage: PostFn,
): Promise<void> {
  const enabledVars = payload.variables.variables.filter((v) => v.enabled && v.key);
  const { resolved } = resolveHttpRequest(payload.request, enabledVars);

  const enabledFormData = payload.request.body.type === 'form-data'
    ? (payload.request.body.formData ?? []).filter((f) => f.enabled && f.key)
    : [];
  const isMultipart = payload.request.body.type === 'form-data' &&
    payload.request.body.formEncoding === 'multipart' &&
    enabledFormData.length > 0;

  if (isMultipart) {
    const formParts = enabledFormData.map((f) => {
      const key = enabledVars.length > 0 ? interpolateTemplate(f.key, enabledVars) : f.key;
      const value = enabledVars.length > 0 ? interpolateTemplate(f.value, enabledVars) : f.value;
      return `-F ${shellEscape(`${key}=${value}`)}`;
    });
    const headerLines = Object.entries(resolved.headers)
      .filter(([k]) => k.toLowerCase() !== 'content-type')
      .map(([k, v]) => `-H ${shellEscape(`${k}: ${v}`)}`);
    const parts: string[] = ['curl'];
    if (resolved.method !== 'GET') {parts.push(`-X ${resolved.method}`);}
    parts.push(...headerLines);
    parts.push(...formParts);
    parts.push(shellEscape(resolved.url));
    const curl = parts.join(' \\\n  ');
    await vscode.env.clipboard.writeText(curl);
    postMessage({ command: 'curlCopied', payload: undefined });
    return;
  }

  const curl = buildCurlCommand(resolved.method, resolved.url, resolved.headers, resolved.body);
  await vscode.env.clipboard.writeText(curl);
  postMessage({ command: 'curlCopied', payload: undefined });
}
