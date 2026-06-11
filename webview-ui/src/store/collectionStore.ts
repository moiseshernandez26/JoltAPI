import { create } from 'zustand';
import type { ICollection, ICollectionRequest } from '../types';

interface CollectionState {
  collections: ICollection[];
  setCollections: (collections: ICollection[]) => void;
  addRequestToCollection: (collectionId: string, request: ICollectionRequest) => void;
}

export const useCollectionStore = create<CollectionState>((set) => ({
  collections: [],

  setCollections: (collections) => set({ collections }),

  addRequestToCollection: (collectionId, request) =>
    set((state) => {
      const newCollections = state.collections.map((c) => {
        if (c.id === collectionId) {
          return { ...c, requests: [...c.requests, request], updatedAt: Date.now() };
        }
        return c;
      });
      return { collections: newCollections };
    }),
}));
