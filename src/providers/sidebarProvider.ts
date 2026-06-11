import * as vscode from 'vscode';
import { randomUUID } from 'crypto';
import type { HostToWebviewMessage, WebviewToHostMessage } from '../models/messages';
import { handleMessage, initMessageHandlers } from '../panels/messageHandlers';
import { JoltApiPanel } from '../panels';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'joltapi.sidebar';
  private static _instance: SidebarProvider | undefined;
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri, private readonly _context: vscode.ExtensionContext) {
    SidebarProvider._instance = this;
    initMessageHandlers(_context);
  }

  public static sendToSidebar(message: HostToWebviewMessage): void {
    SidebarProvider._instance?._view?.webview.postMessage(message);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _resolveContext: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist'),
      ],
    };

    webviewView.webview.html = this._getHtmlContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message: WebviewToHostMessage) => {
      if (message.command === 'openInPanel') {
        JoltApiPanel.createOrShow(this._extensionUri, this._context);
        JoltApiPanel.sendToWebview({
          command: 'openRequest',
          payload: { request: message.payload!.request },
        });
        return;
      }

      await handleMessage(message, (response) => {
        this._view?.webview.postMessage(response);
      });
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        JoltApiPanel.createOrShow(this._extensionUri, this._context);
      }
    });
  }

  private _getHtmlContent(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist', 'assets', 'sidebar.js'),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist', 'assets', 'style.css'),
    );

    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${webview.cspSource} 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} data:; font-src ${webview.cspSource};">
  <link rel="stylesheet" href="${styleUri}">
  <title>JoltAPI Sidebar</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  return randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
}
