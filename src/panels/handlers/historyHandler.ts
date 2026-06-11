import * as vscode from 'vscode';
import type { IHistoryEntry } from '../../models';
import type { HostToWebviewMessage } from '../../models/messages';

type PostFn = (message: HostToWebviewMessage) => void;

const HISTORY_KEY = 'joltapi.history';

export function handleGetHistory(
  history: IHistoryEntry[],
  postMessage: PostFn,
): void {
  postMessage({ command: 'historyLoaded', payload: { entries: history } });
}

export function handleClearHistory(
  context: vscode.ExtensionContext,
  postMessage: PostFn,
): void {
  context.globalState.update(HISTORY_KEY, []);
  postMessage({ command: 'historyLoaded', payload: { entries: [] } });
}

export function addToHistory(
  context: vscode.ExtensionContext,
  entry: IHistoryEntry,
): IHistoryEntry[] {
  const limit = vscode.workspace.getConfiguration('joltapi').get<number>('historyLimit', 50);
  const existing = context.globalState.get<IHistoryEntry[]>(HISTORY_KEY) ?? [];
  const updated = [entry, ...existing].slice(0, limit);
  context.globalState.update(HISTORY_KEY, updated);
  return updated;
}

export function loadHistory(context: vscode.ExtensionContext): IHistoryEntry[] {
  return context.globalState.get<IHistoryEntry[]>(HISTORY_KEY) ?? [];
}