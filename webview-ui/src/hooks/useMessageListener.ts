import { useEffect } from 'react';
import { onMessage } from '../api';
import type { HostToWebviewMessage } from '../types';

/**
 * React hook that listens for messages from the extension host.
 * Automatically cleans up the listener on unmount.
 */
export function useMessageListener(
  handler: (message: HostToWebviewMessage) => void,
): void {
  useEffect(() => {
    const cleanup = onMessage(handler);
    return cleanup;
  }, [handler]);
}
