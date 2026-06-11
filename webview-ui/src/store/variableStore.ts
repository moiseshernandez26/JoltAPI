import { create } from 'zustand';
import type { IVariableSet } from '../types';

interface VariableState {
  variables: IVariableSet['variables'];
  setVariableSet: (variableSet: IVariableSet) => void;
}

export const useVariableStore = create<VariableState>((set) => ({
  variables: [],

  setVariableSet: (variableSet) => set({ variables: variableSet.variables }),
}));
