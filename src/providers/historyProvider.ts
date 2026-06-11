import * as vscode from 'vscode';
import type { IHistoryEntry } from '../models';

const HISTORY_KEY = 'joltapi.history';

export class HistoryProvider implements vscode.TreeDataProvider<HistoryItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<HistoryItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly _context: vscode.ExtensionContext) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: HistoryItem): vscode.TreeItem {
    return element;
  }

  getChildren(): HistoryItem[] {
    const entries = this._context.globalState.get<IHistoryEntry[]>(HISTORY_KEY) ?? [];
    return entries.map((entry) => {
      const item = new HistoryItem(
        `${entry.request.method} ${truncateUrl(entry.request.url)}`,
        entry,
      );
      item.command = {
        command: 'joltapi.openRequest',
        title: 'Replay Request',
        arguments: [entry.request],
      };
      item.iconPath = new vscode.ThemeIcon('history');
      item.description = new Date(entry.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const status = entry.response.statusCode?.toString() ?? '?';
      item.tooltip = `${entry.request.method} ${entry.request.url}\nStatus: ${status}\nTime: ${entry.response.responseTimeMs}ms`;
      return item;
    });
  }
}

class HistoryItem extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly entry: IHistoryEntry,
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }
}

export async function handleClearHistory(context: vscode.ExtensionContext): Promise<void> {
  const confirm = await vscode.window.showWarningMessage(
    'Clear all request history?',
    { modal: true },
    'Clear',
  );
  if (confirm !== 'Clear') { return; }
  context.globalState.update(HISTORY_KEY, []);
  vscode.commands.executeCommand('joltapi.refreshHistory');
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname.substring(0, 35)}${u.pathname.length > 35 ? '...' : ''}`;
  } catch {
    return url.substring(0, 50);
  }
}
