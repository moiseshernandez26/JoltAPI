import { create } from 'zustand';
import type { IProxyProfile } from '../types';

interface ProxyState {
  /** Saved proxy profiles from `.joltapi/proxies.json`, pushed by the host. */
  profiles: IProxyProfile[];
  /**
   * False until the host has answered `loadProxies` at least once. Without this an empty
   * `profiles` array is ambiguous, and a request whose proxy exists would be reported as
   * "deleted" during the startup round trip.
   */
  loaded: boolean;
  setProfiles: (profiles: IProxyProfile[]) => void;
}

export const useProxyStore = create<ProxyState>((set) => ({
  profiles: [],
  loaded: false,
  setProfiles: (profiles) => set({ profiles, loaded: true }),
}));
