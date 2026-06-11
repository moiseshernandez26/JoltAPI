import type { ICollection } from '../../models';
import type { HostToWebviewMessage } from '../../models/messages';
import { loadCollections, saveCollection } from '../../services/storageService';
import { importCollection } from '../../services/importService';
import { exportCollection } from '../../services/exportService';
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
    await exportCollection(collection, payload.filePath);
  } catch (err: unknown) {
    logError('exportCollection failed', err);
    postMessage({ command: 'error', payload: { code: 'UNKNOWN', message: err instanceof Error ? err.message : 'Failed to export collection' } });
  }
}

export async function handleImportCollection(
  payload: { filePath: string },
  postMessage: PostFn,
): Promise<void> {
  try {
    const collection = await importCollection(payload.filePath);
    if (!collection) {
      postMessage({ command: 'error', payload: { code: 'PARSE_ERROR', message: 'Failed to parse import file' } });
      return;
    }
    await saveCollection(collection);
    postMessage({ command: 'collectionImported', payload: { collection } });
    const collections = await loadCollections();
    postMessage({ command: 'collectionsLoaded', payload: { collections } });
  } catch (err: unknown) {
    logError('importCollection failed', err);
    postMessage({ command: 'error', payload: { code: 'UNKNOWN', message: err instanceof Error ? err.message : 'Failed to import collection' } });
  }
}