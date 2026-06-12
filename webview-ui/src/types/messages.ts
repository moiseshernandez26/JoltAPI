export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type BodyType = 'none' | 'json' | 'form-data' | 'raw';
export type RawContentType =
  | 'text/plain'
  | 'application/json'
  | 'application/xml'
  | 'text/xml'
  | 'text/html'
  | 'application/javascript';
export type AuthType = 'none' | 'bearer' | 'basic' | 'apiKey';

export interface IKeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface IRequestBody {
  type: BodyType;
  jsonBody?: string;
  formData?: IKeyValuePair[];
  formEncoding?: 'urlencoded' | 'multipart';
  rawBody?: string;
  rawContentType?: RawContentType;
}

export interface IAuthConfig {
  type: AuthType;
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyPlacement?: 'header' | 'query';
}

export interface IProxyConfig {
  enabled: boolean;
  host: string;
  port: number;
  auth?: { username: string; password: string };
}

export interface IHttpSettings {
  timeout: number;
  sslVerify: boolean;
  followRedirects: boolean;
  maxRedirects: number;
}

export interface IHttpRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: IKeyValuePair[];
  queryParams: IKeyValuePair[];
  body: IRequestBody;
  auth: IAuthConfig;
  proxy: IProxyConfig;
  settings: IHttpSettings;
}

export interface IHttpResponseHeader {
  name: string;
  value: string;
}

export interface IHttpResponse {
  statusCode: number;
  statusText: string;
  headers: IHttpResponseHeader[];
  body: string;
  contentType: string;
  responseTimeMs: number;
  responseSizeBytes: number;
  requestUrl: string;
  requestMethod: HttpMethod;
  timestamp: number;
}

export interface IVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface IVariableSet {
  variables: IVariable[];
}

export interface ICollectionRequest {
  id: string;
  name: string;
  request: IHttpRequest;
  createdAt: number;
  updatedAt: number;
}

export interface ICollection {
  id: string;
  name: string;
  requests: ICollectionRequest[];
  createdAt: number;
  updatedAt: number;
}

export interface IHistoryEntry {
  id: string;
  request: IHttpRequest;
  response: IHttpResponse;
  createdAt: number;
}

// --- Message types ---

export interface IMessage<T extends string, P = void> {
  command: T;
  payload: P extends void ? undefined : P;
}

export type WebviewToHostMessage =
  | IMessage<'sendRequest', { request: IHttpRequest; variables: IVariableSet }>
  | IMessage<'saveRequest', { collectionId: string; request: ICollectionRequest }>
  | IMessage<'loadCollections'>
  | IMessage<'saveCollection', { collection: ICollection }>
  | IMessage<'deleteRequest', { collectionId: string; requestId: string }>
  | IMessage<'deleteCollection', { collectionId: string }>
  | IMessage<'renameRequest', { collectionId: string; requestId: string; newName: string }>
  | IMessage<'moveRequest', { fromCollectionId: string; toCollectionId: string; requestId: string }>
  | IMessage<'loadVariables'>
  | IMessage<'saveVariables', { variables: IVariableSet }>
  | IMessage<'getHistory'>
  | IMessage<'clearHistory'>
  | IMessage<'exportCollection', { collectionId: string; filePath: string }>
  | IMessage<'importCollection', { filePath: string }>
  | IMessage<'getSettings'>
  | IMessage<'showOpenDialog', { filters: Record<string, string[]> }>
  | IMessage<'showSaveDialog', { defaultUri?: string; filters: Record<string, string[]> }>
  | IMessage<'copyToClipboard', { text: string }>
  | IMessage<'copyCurl', { request: IHttpRequest; variables: IVariableSet }>
  | IMessage<'openInPanel', { request: IHttpRequest }>;

export type HostToWebviewMessage =
  | IMessage<'responseReceived', { requestId: string; response: IHttpResponse }>
  | IMessage<'collectionsLoaded', { collections: ICollection[] }>
  | IMessage<'variablesLoaded', { variables: IVariableSet }>
  | IMessage<'historyLoaded', { entries: IHistoryEntry[] }>
  | IMessage<'settingsLoaded', { settings: IHttpSettings; proxy: IProxyConfig; defaultHeaders: IKeyValuePair[] }>
  | IMessage<'collectionImported', { collection: ICollection }>
  | IMessage<'filePathSelected', { filePath: string }>
  | IMessage<'curlCopied'>
  | IMessage<'openRequest', { request: IHttpRequest }>
  | IMessage<'error', { code: string; message: string; details?: unknown }>;
