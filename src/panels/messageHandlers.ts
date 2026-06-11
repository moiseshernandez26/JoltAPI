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

function refreshAll(): void {
  vscode.commands.executeCommand('joltapi.refreshCollections');
  vscode.commands.executeCommand('joltapi.refreshHistory');
  vscode.commands.executeCommand('joltapi.refreshVariables');
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
          vscode.commands.executeCommand('joltapi.refreshHistory');
        },
      );
      break;
    case 'loadCollections':
      await handleLoadCollections(postMessage);
      break;
    case 'saveCollection':
      await handleSaveCollection(message.payload, postMessage);
      vscode.commands.executeCommand('joltapi.refreshCollections');
      break;
    case 'saveRequest':
      await handleSaveRequest(message.payload, postMessage);
      vscode.commands.executeCommand('joltapi.refreshCollections');
      break;
    case 'deleteRequest':
      await handleDeleteRequest(message.payload, postMessage);
      vscode.commands.executeCommand('joltapi.refreshCollections');
      break;
    case 'deleteCollection':
      await handleDeleteCollection(message.payload, postMessage);
      vscode.commands.executeCommand('joltapi.refreshCollections');
      break;
    case 'renameRequest':
      await handleRenameRequest(message.payload, postMessage);
      vscode.commands.executeCommand('joltapi.refreshCollections');
      break;
    case 'moveRequest':
      await handleMoveRequest(message.payload, postMessage);
      vscode.commands.executeCommand('joltapi.refreshCollections');
      break;
    case 'loadVariables':
      await handleLoadVariables(postMessage);
      break;
    case 'saveVariables':
      await handleSaveVariables(message.payload, postMessage);
      vscode.commands.executeCommand('joltapi.refreshVariables');
      break;
    case 'getHistory':
      handleGetHistory(handlerCtx.history, postMessage);
      break;
    case 'clearHistory':
      handleClearHistory(context, postMessage);
      handlerCtx.history = [];
      vscode.commands.executeCommand('joltapi.refreshHistory');
      break;
    case 'exportCollection':
      await handleExportCollection(message.payload, postMessage);
      break;
    case 'importCollection':
      await handleImportCollection(message.payload, postMessage);
      vscode.commands.executeCommand('joltapi.refreshCollections');
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
    default:
      console.warn(`[JoltAPI] Unknown message command: ${(message as { command: string }).command}`);
  }
}