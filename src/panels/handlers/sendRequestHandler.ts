import { randomUUID } from 'crypto';
import type { IHttpRequest, IVariableSet, IHistoryEntry, IProxyProfile } from '../../models';
import type { HostToWebviewMessage } from '../../models/messages';
import { executeRequest } from '../../services/httpService';
import { extractUnresolved } from './interpolation';
import { resolveHttpRequest } from './resolveRequest';
import { loadCollections, loadProxyProfiles, saveCollection } from '../../services/storageService';
import { generateRequestName } from '../../utils/formatters';
import { logError } from '../../utils/logger';

type PostFn = (message: HostToWebviewMessage) => void;

export async function handleSendRequest(
  payload: { request: IHttpRequest; variables: IVariableSet },
  postMessage: PostFn,
  addToHistory: (entry: IHistoryEntry) => void,
  onChanged?: () => void,
): Promise<void> {
  const enabledVars = payload.variables.variables.filter((v) => v.enabled && v.key);
  const profiles = await loadProxyProfilesSafely();
  const { resolved, rawPieces, missingProxyId } = resolveHttpRequest(
    payload.request,
    enabledVars,
    profiles,
  );

  if (missingProxyId) {
    // Fail loudly instead of sending direct — the user picked a proxy for a reason.
    postMessage({
      command: 'error',
      payload: {
        code: 'PROXY_NOT_FOUND',
        message: 'The proxy saved on this request no longer exists. Pick another one in the Proxy tab, or re-create it in the sidebar\'s Proxies tab.',
      },
    });
    return;
  }

  const unresolved = extractUnresolved(...rawPieces);
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

    autoSaveToDefaultCollection(payload.request, onChanged).catch((err) => {
      console.error('[JoltAPI] autoSave failed:', err);
    });
  } catch (err: unknown) {
    logError('sendRequest failed', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorCode = (err as { code?: string }).code ?? 'UNKNOWN';
    postMessage({ command: 'error', payload: { code: errorCode, message: errorMessage } });
  }
}

/** Proxy profiles live in the workspace — a window with no folder open simply has none. */
async function loadProxyProfilesSafely(): Promise<IProxyProfile[]> {
  try {
    return (await loadProxyProfiles()).profiles;
  } catch {
    return [];
  }
}

async function autoSaveToDefaultCollection(request: IHttpRequest, onChanged?: () => void): Promise<void> {
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

  if (onChanged) { onChanged(); }
}