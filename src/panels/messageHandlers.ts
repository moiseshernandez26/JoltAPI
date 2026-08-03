import * as vscode from 'vscode';
import type { IHistoryEntry, WebviewToHostMessage, HostToWebviewMessage } from '../models';
import { handleSendRequest } from './handlers/sendRequestHandler';
import {
  handleLoadCollections,
  handleSaveCollection,
  handleDeleteRequest,
  handleDeleteCollection,
  handleRenameRequest,
  handleSaveRequest,
  handleMoveRequest,
} from './handlers/collectionHandler';
import { handleLoadVariables, handleSaveVariables } from './handlers/variableHandler';
import { handleLoadProxies, handleSaveProxies } from './handlers/proxyHandler';
import { handleExportCollection, handleImportCollection } from './handlers/importExportHandler';
import { handleGetSettings, handleShowOpenDialog, handleShowSaveDialog } from './handlers/settingsHandler';
import {
  handleGetHistory,
  handleClearHistory,
  addToHistory,
  loadHistory,
} from './handlers/historyHandler';
import { handleCopyCurl } from './handlers/curlHandler';

type PostFn = (message: HostToWebviewMessage) => void;

interface HandlerContext {
  context: vscode.ExtensionContext;
  history: IHistoryEntry[];
}

let handlerCtx: HandlerContext | null = null;

let broadcastRefresh: (() => void) | null = null;

export function setBroadcastRefresh(fn: () => void): void {
  broadcastRefresh = fn;
}

function notifyChanged(): void {
  if (broadcastRefresh) {
    broadcastRefresh();
  }
}

export function initMessageHandlers(context: vscode.ExtensionContext): void {
  handlerCtx = {
    context,
    history: loadHistory(context),
  };
}

export async function handleMessage(
  message: WebviewToHostMessage,
  postMessage: PostFn,
): Promise<void> {
  if (!handlerCtx) {
    console.error('[JoltAPI] Message handlers not initialized. Call initMessageHandlers first.');
    return;
  }

  const { context } = handlerCtx;
  console.log(`[JoltAPI] Received message: ${message.command}`);

  switch (message.command) {
    case 'sendRequest':
      await handleSendRequest(
        message.payload,
        postMessage,
        (entry) => {
          handlerCtx!.history = addToHistory(context, entry);
          notifyChanged();
        },
        notifyChanged,
      );
      break;
    case 'loadCollections':
      await handleLoadCollections(postMessage);
      break;
    case 'saveCollection':
      await handleSaveCollection(message.payload, postMessage);
      notifyChanged();
      break;
    case 'saveRequest':
      await handleSaveRequest(message.payload, postMessage);
      notifyChanged();
      break;
    case 'deleteRequest':
      await handleDeleteRequest(message.payload, postMessage);
      notifyChanged();
      break;
    case 'deleteCollection':
      await handleDeleteCollection(message.payload, postMessage);
      notifyChanged();
      break;
    case 'renameRequest':
      await handleRenameRequest(message.payload, postMessage);
      notifyChanged();
      break;
    case 'moveRequest':
      await handleMoveRequest(message.payload, postMessage);
      notifyChanged();
      break;
    case 'loadVariables':
      await handleLoadVariables(postMessage);
      break;
    case 'saveVariables':
      await handleSaveVariables(message.payload, postMessage);
      notifyChanged();
      break;
    case 'loadProxies':
      await handleLoadProxies(postMessage, context);
      break;
    case 'saveProxies':
      await handleSaveProxies(message.payload, postMessage);
      notifyChanged();
      break;
    case 'getHistory':
      handleGetHistory(handlerCtx.history, postMessage);
      break;
    case 'clearHistory':
      handleClearHistory(context, postMessage);
      handlerCtx.history = [];
      notifyChanged();
      break;
    case 'exportCollection':
      await handleExportCollection(message.payload, postMessage);
      break;
    case 'importCollection':
      await handleImportCollection(message.payload, postMessage);
      notifyChanged();
      break;
    case 'getSettings':
      handleGetSettings(postMessage);
      break;
    case 'showOpenDialog':
      await handleShowOpenDialog(message.payload, postMessage);
      break;
    case 'showSaveDialog':
      await handleShowSaveDialog(message.payload, postMessage);
      break;
    case 'copyToClipboard':
      await vscode.env.clipboard.writeText(message.payload.text);
      break;
    case 'copyCurl':
      await handleCopyCurl(message.payload, postMessage);
      break;
    case 'openInPanel':
      break;
    default:
      console.warn(`[JoltAPI] Unknown message command: ${(message as { command: string }).command}`);
  }
}
