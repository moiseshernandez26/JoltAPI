import * as vscode from 'vscode';
import { randomUUID } from 'crypto';
import {
  loadCollections,
  saveCollection,
  deleteCollection,
} from '../services/storageService';
import type { ICollection, ICollectionRequest, IHttpRequest } from '../models';

export class CollectionsProvider implements vscode.TreeDataProvider<CollectionItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<CollectionItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: CollectionItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: CollectionItem): Promise<CollectionItem[]> {
    if (!element) {
      return this.getCollections();
    }
    if (element.contextValue && element.contextValue.startsWith('collection')) {
      return this.getRequests(element.collection!);
    }
    return [];
  }

  private async getCollections(): Promise<CollectionItem[]> {
    try {
      const collections = await loadCollections();
      return [
        ...collections.map((c) => {
          const collapsed = collections.length > 5
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.Expanded;
          const item = new CollectionItem(
            c.name,
            collapsed,
            c,
          );
          item.contextValue = c.name === 'Default' ? 'collection-default' : 'collection';
          item.iconPath = new vscode.ThemeIcon('folder');
          item.description = `${c.requests.length}`;
          item.tooltip = `${c.requests.length} request(s)`;
          return item;
        }),
      ];
    } catch {
      return [new CollectionItem('Open a workspace folder to use JoltAPI')];
    }
  }

  private getRequests(collection: ICollection): CollectionItem[] {
    return collection.requests.map((req) => {
      const item = new CollectionItem(
        req.name,
        vscode.TreeItemCollapsibleState.None,
        collection,
        req,
      );
      item.contextValue = 'request';
      item.command = {
        command: 'joltapi.openRequest',
        title: 'Open Request',
        arguments: [req.request],
      };
      item.iconPath = new vscode.ThemeIcon('symbol-method');
      item.description = req.request.method;
      item.tooltip = `${req.request.method} ${req.request.url}`;
      return item;
    });
  }
}

export class CollectionItem extends vscode.TreeItem {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    public readonly collection?: ICollection,
    public readonly request?: ICollectionRequest,
  ) {
    super(label, collapsibleState);
  }

  getRequestData(): IHttpRequest | undefined {
    if (this.request) {
      return this.request.request;
    }
    return undefined;
  }
}

// --- Standalone command handlers ---

export async function handleAddCollection(): Promise<void> {
  const name = await vscode.window.showInputBox({
    prompt: 'New collection name',
    placeHolder: 'My Collection',
    validateInput: (v) => v.trim() ? undefined : 'Name is required',
  });
  if (!name) { return; }
  const now = Date.now();
  const collection: ICollection = {
    id: randomUUID(),
    name: name.trim(),
    requests: [],
    createdAt: now,
    updatedAt: now,
  };
  await saveCollection(collection);
  vscode.commands.executeCommand('joltapi.refreshCollections');
}

export async function handleDeleteCollection(item: CollectionItem): Promise<void> {
  if (!item.collection) { return; }
  if (item.collection.name === 'Default') { return; }
  const confirm = await vscode.window.showWarningMessage(
    `Delete collection "${item.collection.name}"?`,
    { modal: true },
    'Delete',
  );
  if (confirm !== 'Delete') { return; }
  await deleteCollection(item.collection.id);
  vscode.commands.executeCommand('joltapi.refreshCollections');
}

export async function handleDeleteRequest(item: CollectionItem): Promise<void> {
  if (!item.collection || !item.request) { return; }
  const confirm = await vscode.window.showWarningMessage(
    `Delete request "${item.request.name}"?`,
    { modal: true },
    'Delete',
  );
  if (confirm !== 'Delete') { return; }
  const collection = item.collection;
  collection.requests = collection.requests.filter((r) => r.id !== item.request!.id);
  collection.updatedAt = Date.now();
  await saveCollection(collection);
  vscode.commands.executeCommand('joltapi.refreshCollections');
}

export async function handleMoveRequest(item: CollectionItem): Promise<void> {
  if (!item.collection || !item.request) { return; }
  const collections = await loadCollections();
  const targets = collections.filter((c) => c.id !== item.collection!.id);
  if (targets.length === 0) {
    vscode.window.showInformationMessage('No other collections to move to.');
    return;
  }
  const picked = await vscode.window.showQuickPick(
    targets.map((c) => ({ label: c.name, id: c.id })),
    { placeHolder: 'Select destination collection' },
  );
  if (!picked) { return; }
  const fromCollection = item.collection;
  const toCollection = collections.find((c) => c.id === picked.id);
  if (!toCollection) { return; }
  const requestIndex = fromCollection.requests.findIndex((r) => r.id === item.request!.id);
  if (requestIndex === -1) { return; }
  const [moved] = fromCollection.requests.splice(requestIndex, 1);
  moved.updatedAt = Date.now();
  toCollection.requests.push(moved);
  fromCollection.updatedAt = Date.now();
  toCollection.updatedAt = Date.now();
  await saveCollection(fromCollection);
  await saveCollection(toCollection);
  vscode.commands.executeCommand('joltapi.refreshCollections');
}
