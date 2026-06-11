import * as vscode from 'vscode';
import { registerAllCommands } from './commands';
import { SidebarProvider } from './providers/sidebarProvider';
import { JoltApiPanel } from './panels';
import { setBroadcastRefresh } from './panels/messageHandlers';
import { loadCollections, loadVariables } from './services/storageService';
import { loadHistory } from './panels/handlers/historyHandler';
import type { IHttpRequest } from './models';

export function activate(context: vscode.ExtensionContext): void {
  registerAllCommands(context);

  const sidebarProvider = new SidebarProvider(context.extensionUri, context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebarProvider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );

  setBroadcastRefresh(async () => {
    try {
      const collections = await loadCollections();
      const msg = { command: 'collectionsLoaded' as const, payload: { collections } };
      SidebarProvider.sendToSidebar(msg);
      JoltApiPanel.sendToWebview(msg);
    } catch { /* workspace may not be open */ }

    try {
      const variables = await loadVariables();
      const msg = { command: 'variablesLoaded' as const, payload: { variables } };
      SidebarProvider.sendToSidebar(msg);
      JoltApiPanel.sendToWebview(msg);
    } catch { /* workspace may not be open */ }

    try {
      const history = loadHistory(context);
      SidebarProvider.sendToSidebar({
        command: 'historyLoaded',
        payload: { entries: history },
      });
    } catch { /* workspace may not be open */ }
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('joltapi.newRequest', () => {
      JoltApiPanel.createOrShow(context.extensionUri, context);
    }),

    vscode.commands.registerCommand('joltapi.openRequest', (request: IHttpRequest) => {
      JoltApiPanel.createOrShow(context.extensionUri, context);
      JoltApiPanel.sendToWebview({ command: 'openRequest', payload: { request } });
    }),
  );
}

export function deactivate(): void {
  // No cleanup needed — VS Code handles disposal of subscriptions
}
