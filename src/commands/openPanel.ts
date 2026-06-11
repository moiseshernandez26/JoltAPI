import * as vscode from 'vscode';
import { JoltApiPanel } from '../panels';
import { COMMANDS } from '../utils/constants';

/**
 * Registers the "joltapi.open" command to open the JoltAPI Webview panel.
 */
export function registerOpenPanelCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(COMMANDS.OPEN, () => {
    JoltApiPanel.createOrShow(context.extensionUri, context);
  });
  context.subscriptions.push(disposable);
}
