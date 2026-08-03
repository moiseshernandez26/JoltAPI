import * as vscode from 'vscode';
import type { HostToWebviewMessage } from '../../models/messages';

type PostFn = (message: HostToWebviewMessage) => void;

export function handleGetSettings(postMessage: PostFn): void {
  const config = vscode.workspace.getConfiguration('joltapi');
  postMessage({
    command: 'settingsLoaded',
    payload: {
      settings: {
        timeout: config.get<number>('timeout', 30000),
        sslVerify: config.get<boolean>('sslVerify', true),
        followRedirects: config.get<boolean>('followRedirects', true),
        maxRedirects: config.get<number>('maxRedirects', 5),
      },
      proxy: {
        enabled: false,
        host: config.get<string>('proxy.host', ''),
        port: config.get<number>('proxy.port', 0),
      },
      defaultHeaders: (config.get<{ key: string; value: string }[]>('defaultHeaders', [])).map(
        (h, i) => ({ id: `default-${i}`, key: h.key, value: h.value, enabled: true }),
      ),
    },
  });
}

export async function handleShowOpenDialog(
  payload: { filters: Record<string, string[]> },
  postMessage: PostFn,
): Promise<void> {
  const result = await vscode.window.showOpenDialog({
    canSelectFiles: true, canSelectFolders: false, canSelectMany: false, filters: payload.filters,
  });
  if (result && result.length > 0) {
    // A URI string, not `.fsPath`: in a virtual workspace the selection may live behind a
    // file-system provider that has no local path. The webview treats it as an opaque token.
    postMessage({ command: 'filePathSelected', payload: { filePath: result[0].toString() } });
  }
}

export async function handleShowSaveDialog(
  payload: { defaultUri?: string; filters: Record<string, string[]> },
  postMessage: PostFn,
): Promise<void> {
  const result = await vscode.window.showSaveDialog({
    defaultUri: payload.defaultUri ? parseDefaultUri(payload.defaultUri) : undefined,
    filters: payload.filters,
  });
  if (result) {
    postMessage({ command: 'filePathSelected', payload: { filePath: result.toString() } });
  }
}

/**
 * The webview may echo back a URI string we sent it, or supply a bare file name as a
 * suggestion — `Uri.parse` would read the latter's leading segment as a scheme.
 */
function parseDefaultUri(value: string): vscode.Uri {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value) ? vscode.Uri.parse(value) : vscode.Uri.file(value);
}