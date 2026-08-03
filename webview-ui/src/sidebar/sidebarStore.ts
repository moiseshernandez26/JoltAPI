import { create } from 'zustand';
import type { ICollection, IHistoryEntry, IProxyProfile, IVariable } from '../types';

export type SidebarTab = 'collections' | 'history' | 'variables' | 'proxies';

interface SidebarState {
  collections: ICollection[];
  history: IHistoryEntry[];
  variables: IVariable[];
  proxies: IProxyProfile[];
  activeTab: SidebarTab;
  expandedCollections: Set<string>;
  isLoading: boolean;
  activeRequestId: string | null;

  setCollections: (collections: ICollection[]) => void;
  setHistory: (entries: IHistoryEntry[]) => void;
  setVariables: (vars: IVariable[]) => void;
  setProxies: (proxies: IProxyProfile[]) => void;
  setActiveTab: (tab: SidebarTab) => void;
  toggleCollection: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
  setActiveRequest: (id: string | null) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collections: [],
  history: [],
  variables: [],
  proxies: [],
  activeTab: 'collections',
  expandedCollections: new Set<string>(),
  isLoading: true,
  activeRequestId: null,

  setCollections: (collections) => set({ collections }),
  setHistory: (history) => set({ history }),
  setVariables: (variables) => set({ variables }),
  setProxies: (proxies) => set({ proxies }),
  setActiveTab: (activeTab) => set({ activeTab }),
  toggleCollection: (id) =>
    set((state) => {
      const next = new Set(state.expandedCollections);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { expandedCollections: next };
    }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setActiveRequest: (activeRequestId) => set({ activeRequestId }),
}));
