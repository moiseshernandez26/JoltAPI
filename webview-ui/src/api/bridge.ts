import type { HostToWebviewMessage, WebviewToHostMessage } from '../types';

/**
 * Access to the VS Code Webview API.
 * Available globally in the webview context.
 */
const vscodeApi = acquireVsCodeApi();

/**
 * Buffer for messages that arrive before React registers a handler.
 */
let _handler: ((message: HostToWebviewMessage) => void) | null = null;
const _pending: HostToWebviewMessage[] = [];

// Register listener at module level so no message is ever lost.
window.addEventListener('message', (event: MessageEvent<HostToWebviewMessage>): void => {
  if (!event.origin.startsWith('vscode-webview://')) {
    return;
  }
  if (!event.data || typeof event.data.command !== 'string') {
    return;
  }
  const msg = event.data;
  if (_handler) {
    _handler(msg);
  } else {
    _pending.push(msg);
  }
});

/**
 * Sends a typed message to the extension host.
 */
export function postMessage<T extends WebviewToHostMessage>(message: T): void {
  vscodeApi.postMessage(message);
}

/**
 * Registers a handler for messages from the extension host.
 * If messages were buffered before registration, they are flushed immediately.
 * @returns A cleanup function to remove the handler.
 */
export function onMessage(handler: (message: HostToWebviewMessage) => void): () => void {
  _handler = handler;
  if (_pending.length > 0) {
    for (const msg of _pending) {
      handler(msg);
    }
    _pending.length = 0;
  }
  return () => {
    _handler = null;
  };
}

/**
 * Declares the acquireVsCodeApi function available in the VS Code webview sandbox.
 */
declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};
