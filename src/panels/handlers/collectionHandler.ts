import type { ICollection } from '../../models';
import type { HostToWebviewMessage } from '../../models/messages';
import { loadCollections, saveCollection, deleteCollection } from '../../services/storageService';
import { logError } from '../../utils/logger';

type PostFn = (message: HostToWebviewMessage) => void;

export async function handleLoadCollections(postMessage: PostFn): Promise<void> {
  try {
    const collections = await loadCollections();
    postMessage({ command: 'collectionsLoaded', payload: { collections } });
  } catch (err: unknown) {
    logError('loadCollections failed', err);
    postMessage({ command: 'error', payload: { code: 'UNKNOWN', message: err instanceof Error ? err.message : 'Failed to load collections' } });
  }
}

export async function handleSaveCollection(
  payload: { collection: ICollection },
  postMessage: PostFn,
): Promise<void> {
  try {
    await saveCollection(payload.collection);
    await handleLoadCollections(postMessage);
  } catch (err: unknown) {
    logError('saveCollection failed', err);
    postMessage({ command: 'error', payload: { code: 'UNKNOWN', message: err instanceof Error ? err.message : 'Failed to save collection' } });
  }
}

export async function handleDeleteRequest(
  payload: { collectionId: string; requestId: string },
  postMessage: PostFn,
): Promise<void> {
  try {
    const collections = await loadCollections();
    const collection = collections.find((c) => c.id === payload.collectionId);
    if (collection) {
      collection.requests = collection.requests.filter((r) => r.id !== payload.requestId);
      collection.updatedAt = Date.now();
      await saveCollection(collection);
    }
    await handleLoadCollections(postMessage);
  } catch (err: unknown) {
    logError('deleteRequest failed', err);
    postMessage({ command: 'error', payload: { code: 'UNKNOWN', message: err instanceof Error ? err.message : 'Failed to delete request' } });
  }
}

export async function handleDeleteCollection(
  payload: { collectionId: string },
  postMessage: PostFn,
): Promise<void> {
  try {
    await deleteCollection(payload.collectionId);
    await handleLoadCollections(postMessage);
  } catch (err: unknown) {
    logError('deleteCollection failed', err);
    postMessage({ command: 'error', payload: { code: 'UNKNOWN', message: err instanceof Error ? err.message : 'Failed to delete collection' } });
  }
}

export async function handleRenameRequest(
  payload: { collectionId: string; requestId: string; newName: string },
  postMessage: PostFn,
): Promise<void> {
  try {
    const collections = await loadCollections();
    const collection = collections.find((c) => c.id === payload.collectionId);
    if (collection) {
      const request = collection.requests.find((r) => r.id === payload.requestId);
      if (request) {
        request.name = payload.newName;
        request.updatedAt = Date.now();
        collection.updatedAt = Date.now();
        await saveCollection(collection);
      }
    }
    await handleLoadCollections(postMessage);
  } catch (err: unknown) {
    logError('renameRequest failed', err);
    postMessage({ command: 'error', payload: { code: 'UNKNOWN', message: err instanceof Error ? err.message : 'Failed to rename request' } });
  }
}

export async function handleSaveRequest(
  payload: { collectionId: string; request: import('../../models').ICollectionRequest },
  postMessage: PostFn,
): Promise<void> {
  try {
    const collections = await loadCollections();
    const collection = collections.find((c) => c.id === payload.collectionId);
    if (collection) {
      collection.requests.push(payload.request);
      collection.updatedAt = Date.now();
      await saveCollection(collection);
    }
    await handleLoadCollections(postMessage);
  } catch (err: unknown) {
    logError('saveRequest failed', err);
    postMessage({ command: 'error', payload: { code: 'UNKNOWN', message: err instanceof Error ? err.message : 'Failed to save request' } });
  }
}

export async function handleMoveRequest(
  payload: { fromCollectionId: string; toCollectionId: string; requestId: string },
  postMessage: PostFn,
): Promise<void> {
  try {
    const collections = await loadCollections();
    const fromCollection = collections.find((c) => c.id === payload.fromCollectionId);
    const toCollection = collections.find((c) => c.id === payload.toCollectionId);

    if (fromCollection && toCollection) {
      const requestIndex = fromCollection.requests.findIndex((r) => r.id === payload.requestId);
      if (requestIndex !== -1) {
        const [request] = fromCollection.requests.splice(requestIndex, 1);
        request.updatedAt = Date.now();
        toCollection.requests.push(request);
        fromCollection.updatedAt = Date.now();
        toCollection.updatedAt = Date.now();
        await saveCollection(fromCollection);
        await saveCollection(toCollection);
      }
    }
    await handleLoadCollections(postMessage);
  } catch (err: unknown) {
    logError('moveRequest failed', err);
    postMessage({ command: 'error', payload: { code: 'UNKNOWN', message: err instanceof Error ? err.message : 'Failed to move request' } });
  }
}