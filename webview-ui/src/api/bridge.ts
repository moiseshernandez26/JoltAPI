import type { HostToWebviewMessage, WebviewToHostMessage } from '../types';

/**
 * Access to the VS Code Webview API.
 * Available globally in the webview context.
 */
const vscodeApi = acquireVsCodeApi();

/**
 * Sends a typed message to the extension host.
 */
export function postMessage<T extends WebviewToHostMessage>(message: T): void {
  vscodeApi.postMessage(message);
}

/**
 * Registers a listener for messages from the extension host.
 * Validates the message origin for defense-in-depth.
 * @param handler - Callback invoked when a valid message is received.
 * @returns A cleanup function to remove the listener.
 */
export function onMessage(handler: (message: HostToWebviewMessage) => void): () => void {
  const listener = (event: MessageEvent<HostToWebviewMessage>): void => {
    // Validate origin: must be from the VS Code webview sandbox
    // VS Code webview origins look like: vscode-webview://<id>
    if (!event.origin.startsWith('vscode-webview://')) {
      return;
    }
    // Runtime type guard: ensure the message has a known command
    if (!event.data || typeof event.data.command !== 'string') {
      return;
    }
    handler(event.data);
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}

/**
 * Declares the acquireVsCodeApi function available in the VS Code webview sandbox.
 */
declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};
