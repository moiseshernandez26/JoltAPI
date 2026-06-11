import * as fs from 'fs/promises';
import type { ICollection } from '../models';
import { isPostmanCollection, convertPostmanToCollection } from './importPostman';
import { isInsomniaExport, convertInsomniaToCollection } from './importInsomnia';

/**
 * Imports a collection from a file.
 * Supports .joltapi.json, Postman Collection v2.1, and Insomnia formats.
 */
export async function importCollection(filePath: string): Promise<ICollection | null> {
  const raw = await fs.readFile(filePath, 'utf-8');
  let data: unknown;

  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  if (isPostmanCollection(data)) {
    return convertPostmanToCollection(data, filePath);
  }

  if (isInsomniaExport(data)) {
    return convertInsomniaToCollection(data);
  }

  if (isJoltApiExport(data)) {
    return (data as { collections: ICollection[] }).collections[0] ?? null;
  }

  return null;
}

function isJoltApiExport(data: unknown): data is { version: string; collections: ICollection[] } {
  const d = data as Record<string, unknown>;
  return !!(d && typeof d.version === 'string' && Array.isArray(d.collections));
}
