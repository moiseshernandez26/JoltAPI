import * as vscode from 'vscode';
import type { ICollection, IProxyProfile } from '../models';
import { isPostmanCollection, convertPostmanToCollection } from './importPostman';
import { isInsomniaExport, convertInsomniaToCollection } from './importInsomnia';

export interface IImportResult {
  collection: ICollection;
  /** Proxy profiles bundled with a `.joltapi.json` export (credentials always stripped). */
  proxies: IProxyProfile[];
}

/**
 * Imports a collection from a file.
 * Supports .joltapi.json, Postman Collection v2.1, and Insomnia formats.
 */
export async function importCollection(source: string): Promise<IImportResult | null> {
  const bytes = await vscode.workspace.fs.readFile(vscode.Uri.parse(source));
  const raw = new TextDecoder().decode(bytes);
  let data: unknown;

  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  if (isPostmanCollection(data)) {
    return { collection: convertPostmanToCollection(data), proxies: [] };
  }

  if (isInsomniaExport(data)) {
    return { collection: convertInsomniaToCollection(data), proxies: [] };
  }

  if (isJoltApiExport(data)) {
    const collection = data.collections[0];
    if (!collection) {return null;}
    return { collection, proxies: extractProxies(data.proxies) };
  }

  return null;
}

function isJoltApiExport(
  data: unknown,
): data is { version: string; collections: ICollection[]; proxies?: unknown } {
  const d = data as Record<string, unknown>;
  return !!(d && typeof d.version === 'string' && Array.isArray(d.collections));
}

/**
 * Keeps only entries that actually look like a proxy profile — the file is user-editable
 * and may come from anywhere, so a malformed `proxies` array must not reach storage.
 * Any `auth` present in the file is dropped: imported proxies never carry credentials.
 */
function extractProxies(raw: unknown): IProxyProfile[] {
  if (!Array.isArray(raw)) {return [];}
  return raw
    .filter((p): p is IProxyProfile => {
      const c = p as Record<string, unknown>;
      return !!c && typeof c.id === 'string' && typeof c.name === 'string' &&
        typeof c.host === 'string' && typeof c.port === 'number';
    })
    .map((p) => ({ id: p.id, name: p.name, host: p.host, port: p.port }));
}
