import { create } from 'zustand';

export interface IRequestTab {
  id: string;
  name: string;
  method: import('../types').HttpMethod;
  url: string;
  fromCollection: boolean;
}

interface TabState {
  tabs: IRequestTab[];
  activeTabIndex: number;
  addTab: () => void;
  addPrepopulatedTab: (name: string, method: import('../types').HttpMethod, url: string) => void;
  removeTab: (index: number) => void;
  setActiveTab: (index: number) => void;
  updateTab: (index: number, tab: Partial<IRequestTab>) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (keepIndex: number) => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

function createDefaultTab(): IRequestTab {
  return {
    id: generateId(),
    name: 'Untitled',
    method: 'GET',
    url: '',
    fromCollection: false,
  };
}

export const useTabStore = create<TabState>((set) => ({
  tabs: [createDefaultTab()],
  activeTabIndex: 0,

  addTab: () =>
    set((state) => {
      if (state.tabs.length >= 10) {return state;}
      const newTab = createDefaultTab();
      return {
        tabs: [...state.tabs, newTab],
        activeTabIndex: state.tabs.length,
      };
    }),

  addPrepopulatedTab: (name: string, method: import('../types').HttpMethod, url: string) =>
    set((state) => {
      if (state.tabs.length >= 10) {return state;}
      const newTab: IRequestTab = { id: generateId(), name, method, url, fromCollection: !!url };
      return {
        tabs: [...state.tabs, newTab],
        activeTabIndex: state.tabs.length,
      };
    }),

  removeTab: (index: number) =>
    set((state) => {
      if (state.tabs.length <= 1) {return state;}
      const newTabs = state.tabs.filter((_, i) => i !== index);
      let newActiveIndex = state.activeTabIndex;
      if (index <= state.activeTabIndex) {
        newActiveIndex = Math.max(0, state.activeTabIndex - 1);
      }
      newActiveIndex = Math.min(newActiveIndex, newTabs.length - 1);
      return { tabs: newTabs, activeTabIndex: newActiveIndex };
    }),

  setActiveTab: (index: number) =>
    set((state) => {
      if (index < 0 || index >= state.tabs.length) {return state;}
      return { activeTabIndex: index };
    }),

  updateTab: (index: number, tab: Partial<IRequestTab>) =>
    set((state) => {
      const newTabs = [...state.tabs];
      newTabs[index] = { ...newTabs[index], ...tab };
      return { tabs: newTabs };
    }),

  closeAllTabs: () =>
    set(() => ({
      tabs: [createDefaultTab()],
      activeTabIndex: 0,
    })),

  closeOtherTabs: (keepIndex: number) =>
    set((state) => ({
      tabs: [state.tabs[keepIndex]],
      activeTabIndex: 0,
    })),
}));