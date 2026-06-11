import { useCallback } from 'react';
import { postMessage } from '../api';
import type { WebviewToHostMessage } from '../types';

/**
 * React hook that provides a typed function to send messages to the extension host.
 * Returns a stable callback reference.
 */
export function useSendMessage(): (message: WebviewToHostMessage) => void {
  return useCallback((message: WebviewToHostMessage) => {
    postMessage(message);
  }, []);
}
