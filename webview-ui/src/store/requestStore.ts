import { create } from 'zustand';
import type { IHttpRequest, IKeyValuePair } from '../types';

/**
 * Generates a new UUID v4.
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Creates a default empty HTTP request.
 */
export function createDefaultRequest(): IHttpRequest {
  return {
    id: generateId(),
    name: 'Untitled Request',
    method: 'GET',
    url: '',
    headers: [createEmptyPair()],
    queryParams: [],
    body: { type: 'none' },
    auth: { type: 'none' },
    proxyId: undefined,
    settings: {
      timeout: 30000,
      sslVerify: true,
      followRedirects: true,
      maxRedirects: 5,
    },
  };
}

function createEmptyPair(): IKeyValuePair {
  return { id: generateId(), key: '', value: '', enabled: true };
}

interface RequestState {
  currentRequest: IHttpRequest;
  isDirty: boolean;
  activeTab: 'headers' | 'body' | 'params' | 'auth' | 'proxy' | 'settings';
  isSending: boolean;

  setMethod: (method: IHttpRequest['method']) => void;
  setUrl: (url: string) => void;
  setHeaders: (headers: IKeyValuePair[]) => void;
  setQueryParams: (params: IKeyValuePair[]) => void;
  setBody: (body: IHttpRequest['body']) => void;
  setAuth: (auth: IHttpRequest['auth']) => void;
  setProxyId: (proxyId: string | undefined) => void;
  setSettings: (settings: IHttpRequest['settings']) => void;
  setActiveTab: (tab: RequestState['activeTab']) => void;
  setIsSending: (sending: boolean) => void;
  loadRequest: (request: IHttpRequest) => void;
  resetRequest: () => void;
  setName: (name: string) => void;
}

export const useRequestStore = create<RequestState>((set) => ({
  currentRequest: createDefaultRequest(),
  isDirty: false,
  activeTab: 'headers',
  isSending: false,

  setMethod: (method) =>
    set((state) => ({
      currentRequest: { ...state.currentRequest, method },
      isDirty: true,
    })),

  setUrl: (url) =>
    set((state) => ({
      currentRequest: { ...state.currentRequest, url },
      isDirty: true,
    })),

  setHeaders: (headers) =>
    set((state) => ({
      currentRequest: { ...state.currentRequest, headers },
      isDirty: true,
    })),

  setQueryParams: (queryParams) =>
    set((state) => {
      const url = rebuildUrl(state.currentRequest.url, queryParams);
      return {
        currentRequest: { ...state.currentRequest, queryParams, url },
        isDirty: true,
      };
    }),

  setBody: (body) =>
    set((state) => ({
      currentRequest: { ...state.currentRequest, body },
      isDirty: true,
    })),

  setAuth: (auth) =>
    set((state) => ({
      currentRequest: { ...state.currentRequest, auth },
      isDirty: true,
    })),

  // Selecting a proxy also drops any legacy inline `proxy` object so the two can't disagree.
  setProxyId: (proxyId) =>
    set((state) => ({
      currentRequest: { ...state.currentRequest, proxyId, proxy: undefined },
      isDirty: true,
    })),

  setSettings: (settings) =>
    set((state) => ({
      currentRequest: { ...state.currentRequest, settings },
      isDirty: true,
    })),

  setActiveTab: (activeTab) => set({ activeTab }),

  setIsSending: (isSending) => set({ isSending }),

  loadRequest: (request) =>
    set({
      currentRequest: request,
      isDirty: false,
    }),

  resetRequest: () =>
    set({
      currentRequest: createDefaultRequest(),
      isDirty: false,
    }),

  setName: (name) =>
    set((state) => ({
      currentRequest: { ...state.currentRequest, name },
      isDirty: false,
    })),
}));

/**
 * Rebuilds a URL with the given query params.
 * Preserves the base URL (path + existing non-param parts) and replaces query string.
 */
function rebuildUrl(url: string, queryParams: IKeyValuePair[]): string {
  if (!url) {return url;}

  let baseUrl: string;
  try {
    const u = new URL(url);
    // Clear existing search params, we'll rebuild from the editor
    u.search = '';
    baseUrl = u.toString().replace(/\?$/, '');
  } catch {
    // Invalid URL — just append ?key=value
    baseUrl = url.split('?')[0];
  }

  const enabled = queryParams.filter((p) => p.enabled && p.key);
  if (enabled.length === 0) {return baseUrl;}

  const params = new URLSearchParams();
  for (const p of enabled) {
    params.append(p.key, p.value);
  }

  return `${baseUrl}?${params.toString()}`;
}
