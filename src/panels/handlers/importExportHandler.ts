import type { ICollection, IProxyProfile } from '../../models';
import type { HostToWebviewMessage } from '../../models/messages';
import {
  loadCollections,
  loadProxyProfiles,
  saveCollection,
  saveProxyProfiles,
} from '../../services/storageService';
import { importCollection } from '../../services/importService';
import { collectReferencedProxies, exportCollection } from '../../services/exportService';
import { logError } from '../../utils/logger';

type PostFn = (message: HostToWebviewMessage) => void;

export async function handleExportCollection(
  payload: { collectionId: string; filePath: string },
  postMessage: PostFn,
): Promise<void> {
  try {
    const collections = await loadCollections();
    const collection = collections.find((c) => c.id === payload.collectionId);
    if (!collection) {
      postMessage({ command: 'error', payload: { code: 'UNKNOWN', message: 'Collection not found' } });
      return;
    }
    const { profiles } = await loadProxyProfiles();
    await exportCollection(
      collection,
      payload.filePath,
      undefined,
      collectReferencedProxies(collection, profiles),
    );
  } catch (err: unknown) {
    logError('exportCollection failed', err);
    postMessage({ command: 'error', payload: { code: 'UNKNOWN', message: err instanceof Error ? err.message : 'Failed to export collection' } });
  }
}

/**
 * Adds imported proxy profiles that this workspace doesn't already have, so the imported
 * requests' `proxyId`s resolve instead of failing as "proxy no longer exists". Existing
 * ids are left untouched — a local profile (which may have credentials) always wins over
 * the credential-less copy from the file.
 */
async function mergeImportedProxies(imported: IProxyProfile[]): Promise<void> {
  if (imported.length === 0) {return;}

  const { profiles } = await loadProxyProfiles();
  const knownIds = new Set(profiles.map((p) => p.id));
  const missing = imported.filter((p) => !knownIds.has(p.id));
  if (missing.length === 0) {return;}

  await saveProxyProfiles({ profiles: [...profiles, ...missing] });
}

export async function handleImportCollection(
  payload: { filePath: string },
  postMessage: PostFn,
): Promise<void> {
  try {
    const result = await importCollection(payload.filePath);
    if (!result) {
      postMessage({ command: 'error', payload: { code: 'PARSE_ERROR', message: 'Failed to parse import file' } });
      return;
    }
    const { collection } = result;
    await saveCollection(collection);
    await mergeImportedProxies(result.proxies);
    postMessage({ command: 'collectionImported', payload: { collection } });
    const collections = await loadCollections();
    postMessage({ command: 'collectionsLoaded', payload: { collections } });
  } catch (err: unknown) {
    logError('importCollection failed', err);
    postMessage({ command: 'error', payload: { code: 'UNKNOWN', message: err instanceof Error ? err.message : 'Failed to import collection' } });
  }
}