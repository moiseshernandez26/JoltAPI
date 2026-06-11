import * as fs from 'fs/promises';
import type { ICollection, IVariableSet } from '../models';

/**
 * Exports a collection to a .joltapi.json file.
 * Optionally bundles variables with the export.
 */
export async function exportCollection(
  collection: ICollection,
  filePath: string,
  variables?: IVariableSet,
): Promise<void> {
  const exportData = {
    version: '0.1.0',
    exportedAt: Date.now(),
    collections: [collection],
    ...(variables && variables.variables.length > 0 ? { variables } : {}),
  };

  const json = JSON.stringify(exportData, null, 2);
  await fs.writeFile(filePath, json, 'utf-8');
}
