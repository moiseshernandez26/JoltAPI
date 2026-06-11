import { create } from 'zustand';
import type { IHttpResponse } from '../types';

interface ResponseState {
  currentResponse: IHttpResponse | null;
  setResponse: (response: IHttpResponse) => void;
}

export const useResponseStore = create<ResponseState>((set) => ({
  currentResponse: null,

  setResponse: (response) => set({ currentResponse: response }),
}));
