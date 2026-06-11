import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';
import type { ICollection, IVariableSet } from '../models';
import { STORAGE } from '../utils/constants';

function getWorkspaceRoot(): vscode.Uri {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    throw new Error('No workspace folder is open.');
  }
  return folders[0].uri;
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, json, 'utf-8');
}

// --- Variables ---

const VARIABLES_FILE = 'variables.json';

export async function loadVariables(): Promise<IVariableSet> {
  const root = getWorkspaceRoot();
  const filePath = path.join(root.fsPath, STORAGE.BASE_DIR, VARIABLES_FILE);
  const data = await readJsonFile<IVariableSet>(filePath);
  return data ?? { variables: [] };
}

export async function saveVariables(variables: IVariableSet): Promise<void> {
  const root = getWorkspaceRoot();
  const filePath = path.join(root.fsPath, STORAGE.BASE_DIR, VARIABLES_FILE);
  await writeJsonFile(filePath, variables);
}

// --- Collections ---

export async function loadCollections(): Promise<ICollection[]> {
  const root = getWorkspaceRoot();
  const collectionsDir = path.join(root.fsPath, STORAGE.COLLECTIONS_DIR);
  await ensureDir(collectionsDir);

  const entries = await fs.readdir(collectionsDir, { withFileTypes: true });
  const jsonFiles = entries.filter((e) => e.isFile() && e.name.endsWith('.json'));

  const collections: ICollection[] = [];
  for (const file of jsonFiles) {
    const collection = await readJsonFile<ICollection>(
      path.join(collectionsDir, file.name),
    );
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
  const root = getWorkspaceRoot();
  const filePath = path.join(
    root.fsPath,
    STORAGE.COLLECTIONS_DIR,
    `${sanitizeFileName(collection.name)}.json`,
  );
  await writeJsonFile(filePath, collection);
}

export async function deleteCollection(collectionId: string): Promise<void> {
  const collections = await loadCollections();
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) {return;}
  const root = getWorkspaceRoot();
  const filePath = path.join(
    root.fsPath,
    STORAGE.COLLECTIONS_DIR,
    `${sanitizeFileName(collection.name)}.json`,
  );
  try {
    await fs.unlink(filePath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {throw err;}
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
}
