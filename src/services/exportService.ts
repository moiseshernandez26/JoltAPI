import * as vscode from 'vscode';
import type { ICollection, IProxyProfile, IVariableSet } from '../models';

export { collectReferencedProxies } from './exportUtils';

/**
 * Exports a collection to a .joltapi.json file.
 * Optionally bundles variables and the proxy profiles the collection's requests reference.
 *
 * `target` is a URI string (from `showSaveDialog`), not a path — in a virtual workspace the
 * destination may live behind a file-system provider with no local path at all.
 */
export async function exportCollection(
  collection: ICollection,
  target: string,
  variables?: IVariableSet,
  proxies?: IProxyProfile[],
): Promise<void> {
  const exportData = {
    version: '0.1.0',
    exportedAt: Date.now(),
    collections: [collection],
    ...(variables && variables.variables.length > 0 ? { variables } : {}),
    ...(proxies && proxies.length > 0 ? { proxies } : {}),
  };

  const json = JSON.stringify(exportData, null, 2);
  await vscode.workspace.fs.writeFile(vscode.Uri.parse(target), new TextEncoder().encode(json));
}
