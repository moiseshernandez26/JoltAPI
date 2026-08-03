import * as vscode from 'vscode';
import { randomUUID } from 'crypto';
import type { ICollection, IProxyProfileSet, IVariableSet } from '../models';
import { STORAGE } from '../utils/constants';

/**
 * All persistence goes through `vscode.workspace.fs` rather than Node's `fs`.
 *
 * That is what lets JoltAPI work in a virtual workspace (github.dev, vscode.dev, remote
 * file-system providers), where there is no local path to hand to `fs` at all — `.fsPath`
 * on such a URI is meaningless. Never reintroduce `fs`/`path` here: it would silently
 * re-break virtual workspaces while still appearing to work locally.
 */

function getWorkspaceRoot(): vscode.Uri {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    throw new Error('No workspace folder is open.');
  }
  return folders[0].uri;
}

function joltUri(...segments: string[]): vscode.Uri {
  return vscode.Uri.joinPath(getWorkspaceRoot(), STORAGE.BASE_DIR, ...segments);
}

function isFileNotFound(err: unknown): boolean {
  return err instanceof vscode.FileSystemError && err.code === 'FileNotFound';
}

async function readJsonFile<T>(uri: vscode.Uri): Promise<T | null> {
  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch (err: unknown) {
    if (isFileNotFound(err)) {
      return null;
    }
    throw err;
  }
}

async function writeJsonFile(uri: vscode.Uri, data: unknown): Promise<void> {
  // `writeFile` creates missing parent directories for file-system providers that support
  // it, but not all do — create the folder explicitly so behavior is the same everywhere.
  await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, '..'));
  const json = JSON.stringify(data, null, 2);
  await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(json));
}

// --- Variables ---

const VARIABLES_FILE = 'variables.json';

export async function loadVariables(): Promise<IVariableSet> {
  const data = await readJsonFile<IVariableSet>(joltUri(VARIABLES_FILE));
  return data ?? { variables: [] };
}

export async function saveVariables(variables: IVariableSet): Promise<void> {
  await writeJsonFile(joltUri(VARIABLES_FILE), variables);
}

// --- Proxy profiles ---

const PROXIES_FILE = 'proxies.json';

export async function loadProxyProfiles(): Promise<IProxyProfileSet> {
  const data = await readJsonFile<IProxyProfileSet>(joltUri(PROXIES_FILE));
  return data ?? { profiles: [] };
}

export async function saveProxyProfiles(proxies: IProxyProfileSet): Promise<void> {
  await writeJsonFile(joltUri(PROXIES_FILE), proxies);
}

// --- Collections ---

const COLLECTIONS_DIR = 'collections';

function collectionUri(name: string): vscode.Uri {
  return joltUri(COLLECTIONS_DIR, `${sanitizeFileName(name)}.json`);
}

export async function loadCollections(): Promise<ICollection[]> {
  const dirUri = joltUri(COLLECTIONS_DIR);
  await vscode.workspace.fs.createDirectory(dirUri);

  const entries = await vscode.workspace.fs.readDirectory(dirUri);
  const jsonFiles = entries.filter(
    ([name, type]) => type === vscode.FileType.File && name.endsWith('.json'),
  );

  const collections: ICollection[] = [];
  for (const [name] of jsonFiles) {
    const collection = await readJsonFile<ICollection>(vscode.Uri.joinPath(dirUri, name));
    if (collection) {
      collections.push(collection);
    }
  }

  if (collections.length === 0) {
    const defaultCollection = createDefaultCollection();
    await saveCollection(defaultCollection);
    collections.push(defaultCollection);
  }

  return collections;
}

function createDefaultCollection(): ICollection {
  const now = Date.now();
  return {
    id: randomUUID(),
    name: 'Default',
    requests: [],
    createdAt: now,
    updatedAt: now,
  };
}

export async function saveCollection(collection: ICollection): Promise<void> {
  await writeJsonFile(collectionUri(collection.name), collection);
}

export async function deleteCollection(collectionId: string): Promise<void> {
  const collections = await loadCollections();
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) {return;}

  try {
    await vscode.workspace.fs.delete(collectionUri(collection.name));
  } catch (err: unknown) {
    if (!isFileNotFound(err)) {throw err;}
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
}
