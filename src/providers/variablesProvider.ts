import * as vscode from 'vscode';
import type { IVariable } from '../models';
import { loadVariables, saveVariables as saveVars } from '../services/storageService';

export class VariablesProvider implements vscode.TreeDataProvider<VariableItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<VariableItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: VariableItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<VariableItem[]> {
    try {
      const data = await loadVariables();
      const enabled = data.variables.filter((v) => v.enabled);
      const disabled = data.variables.filter((v) => !v.enabled);

      const items: VariableItem[] = [];

      for (const v of enabled) {
        const item = new VariableItem(v.key, v);
        item.description = maskValue(v.value);
        item.iconPath = new vscode.ThemeIcon('symbol-variable');
        item.tooltip = `${v.key} = ${v.value}`;
        item.contextValue = 'variable';
        items.push(item);
      }

      for (const v of disabled) {
        const item = new VariableItem(v.key, v);
        item.description = maskValue(v.value);
        item.iconPath = new vscode.ThemeIcon('symbol-variable');
        item.tooltip = `${v.key} = ${v.value} (disabled)`;
        item.contextValue = 'variable-disabled';
        items.push(item);
      }

      return items;
    } catch {
      return [new VariableItem('Open a workspace folder to use JoltAPI')];
    }
  }
}

class VariableItem extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly variable?: IVariable,
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }
}

function maskValue(value: string): string {
  if (!value) { return ''; }
  if (value.length <= 8) { return '*'.repeat(value.length); }
  return value.slice(0, 3) + '*'.repeat(Math.min(value.length - 3, 8));
}

// --- Standalone command handlers ---

export async function handleAddVariable(): Promise<void> {
  const key = await vscode.window.showInputBox({
    prompt: 'Variable name',
    placeHolder: 'base_url',
    validateInput: (v) => v.trim() ? undefined : 'Name is required',
  });
  if (!key) { return; }

  const value = await vscode.window.showInputBox({
    prompt: `Value for "${key}"`,
    placeHolder: 'https://api.example.com',
  });
  if (value === undefined) { return; }

  const data = await loadVariables();
  const existing = data.variables.find((v) => v.key === key.trim());
  if (existing) {
    existing.value = value;
  } else {
    data.variables.push({
      id: crypto.randomUUID(),
      key: key.trim(),
      value,
      enabled: true,
    });
  }
  await saveVars(data);
  vscode.commands.executeCommand('joltapi.refreshVariables');
}

export async function handleEditVariable(item: VariableItem): Promise<void> {
  const variable = item.variable;
  if (!variable) { return; }

  const newKey = await vscode.window.showInputBox({
    prompt: 'Variable name',
    value: variable.key,
    validateInput: (v) => v.trim() ? undefined : 'Name is required',
  });
  if (!newKey) { return; }

  const newValue = await vscode.window.showInputBox({
    prompt: `Value for "${newKey}"`,
    value: variable.value,
  });
  if (newValue === undefined) { return; }

  const data = await loadVariables();
  const existing = data.variables.find((v) => v.id === variable.id);
  if (existing) {
    existing.key = newKey.trim();
    existing.value = newValue;
    await saveVars(data);
    vscode.commands.executeCommand('joltapi.refreshVariables');
  }
}

export async function handleDeleteVariable(item: VariableItem): Promise<void> {
  if (!item.variable) { return; }
  const confirm = await vscode.window.showWarningMessage(
    `Delete variable "${item.variable.key}"?`,
    { modal: true },
    'Delete',
  );
  if (confirm !== 'Delete') { return; }
  const data = await loadVariables();
  data.variables = data.variables.filter((v) => v.id !== item.variable!.id);
  await saveVars(data);
  vscode.commands.executeCommand('joltapi.refreshVariables');
}
