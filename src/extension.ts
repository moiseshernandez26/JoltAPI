import * as vscode from 'vscode';
import { registerAllCommands } from './commands';
import { CollectionsProvider, handleAddCollection, handleDeleteCollection, handleDeleteRequest, handleMoveRequest } from './providers/collectionsProvider';
import { HistoryProvider, handleClearHistory } from './providers/historyProvider';
import { VariablesProvider, handleAddVariable, handleEditVariable, handleDeleteVariable } from './providers/variablesProvider';
import { JoltApiPanel } from './panels';
import type { IHttpRequest } from './models';

/**
 * Called when the extension is activated.
 * Registers commands and wires up modules.
 */
export function activate(context: vscode.ExtensionContext): void {
  registerAllCommands(context);

  const collectionsProvider = new CollectionsProvider();
  const historyProvider = new HistoryProvider(context);
  const variablesProvider = new VariablesProvider();


  const collectionsView = vscode.window.createTreeView('joltapi.collections', {
    treeDataProvider: collectionsProvider,
  });
  vscode.window.registerTreeDataProvider('joltapi.history', historyProvider);
  vscode.window.registerTreeDataProvider('joltapi.variables', variablesProvider);
  



  collectionsView.onDidChangeVisibility((e) => {
    if (e.visible) {
      JoltApiPanel.createOrShow(context.extensionUri, context);
    }
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('joltapi.refreshCollections', () => collectionsProvider.refresh()),
    vscode.commands.registerCommand('joltapi.refreshHistory', () => historyProvider.refresh()),
    vscode.commands.registerCommand('joltapi.refreshVariables', () => variablesProvider.refresh()),

    vscode.commands.registerCommand('joltapi.newRequest', () => {
      JoltApiPanel.createOrShow(context.extensionUri, context);
    }),
    vscode.commands.registerCommand('joltapi.addCollection', () => handleAddCollection()),
    vscode.commands.registerCommand('joltapi.collectionDelete', (item) => handleDeleteCollection(item)),
    vscode.commands.registerCommand('joltapi.requestDelete', (item) => handleDeleteRequest(item)),
    vscode.commands.registerCommand('joltapi.requestMove', (item) => handleMoveRequest(item)),

    vscode.commands.registerCommand('joltapi.clearHistory', () => handleClearHistory(context)),

    vscode.commands.registerCommand('joltapi.addVariable', () => handleAddVariable()),
    vscode.commands.registerCommand('joltapi.editVariable', (item) => handleEditVariable(item)),
    vscode.commands.registerCommand('joltapi.deleteVariable', (item) => handleDeleteVariable(item)),

    vscode.commands.registerCommand('joltapi.openRequest', (request: IHttpRequest) => {
      if (!context) { return; }
      JoltApiPanel.createOrShow(context.extensionUri, context);
      JoltApiPanel.sendToWebview({ command: 'openRequest', payload: { request } });
    }),
  );
}

/**
 * Called when the extension is deactivated.
 */
export function deactivate(): void {
  // No cleanup needed — VS Code handles disposal of subscriptions
}
