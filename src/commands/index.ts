import * as vscode from 'vscode';
import { registerOpenPanelCommand } from './openPanel';

/**
 * Registers all VS Code commands for JoltAPI.
 * Called once from extension.ts during activation.
 */
export function registerAllCommands(context: vscode.ExtensionContext): void {
  registerOpenPanelCommand(context);
}
