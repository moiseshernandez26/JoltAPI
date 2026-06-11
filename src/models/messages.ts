import type { IHttpRequest, IHttpSettings, IKeyValuePair, IProxyConfig } from './httpRequest';
import type { IHttpResponse } from './httpResponse';
import type { IVariableSet } from './variable';
import type { ICollection, ICollectionRequest } from './collection';
import type { IHistoryEntry } from './history';

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
  | IMessage<'copyCurl', { request: IHttpRequest; variables: IVariableSet }>;

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
