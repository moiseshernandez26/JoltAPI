import * as vscode from 'vscode';
import { randomUUID } from 'crypto';
import { WEBVIEW } from '../utils/constants';
import type { HostToWebviewMessage, WebviewToHostMessage } from '../models/messages';
import { initMessageHandlers, handleMessage } from './messageHandlers';

/**
 * Creates and manages the JoltAPI Webview panel.
 * Singleton — only one panel instance exists at a time.
 */
export class JoltApiPanel {
  public static currentPanel: JoltApiPanel | undefined;
  private static _extensionContext: vscode.ExtensionContext | undefined;
  private static _pendingMessages: HostToWebviewMessage[] = [];
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, context?: vscode.ExtensionContext): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (JoltApiPanel.currentPanel) {
      JoltApiPanel.currentPanel._panel.reveal(column);
      return;
    }

    if (context) {
      JoltApiPanel._extensionContext = context;
    }

    const panel = vscode.window.createWebviewPanel(
      WEBVIEW.VIEW_TYPE,
      WEBVIEW.TITLE,
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist'),
        ],
      },
    );

    panel.iconPath = vscode.Uri.joinPath(extensionUri, 'JoltIcon.png');

    JoltApiPanel.currentPanel = new JoltApiPanel(panel, extensionUri);
  }

  public static sendToWebview(message: HostToWebviewMessage): void {
    if (JoltApiPanel.currentPanel) {
      JoltApiPanel.currentPanel._panel.webview.postMessage(message);
    } else {
      JoltApiPanel._pendingMessages.push(message);
    }
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    const ctx = JoltApiPanel._extensionContext;
    if (ctx) {
      initMessageHandlers(ctx);
    } else {
      console.warn('[JoltAPI] Extension context not available — history persistence disabled');
    }
    this._panel.webview.html = this._getHtmlContent(extensionUri);
    this._panel.webview.onDidReceiveMessage(
      (msg: WebviewToHostMessage) => {
        this._flushPending();
        handleMessage(msg, (m) => this.postMessage(m));
      },
      this,
      this._disposables,
    );
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  private _flushPending(): void {
    if (JoltApiPanel._pendingMessages.length === 0) { return; }
    for (const msg of JoltApiPanel._pendingMessages) {
      this._panel.webview.postMessage(msg);
    }
    JoltApiPanel._pendingMessages = [];
  }

  private postMessage(message: HostToWebviewMessage): void {
    this._panel.webview.postMessage(message);
  }

  private dispose(): void {
    JoltApiPanel.currentPanel = undefined;
    this._panel.dispose();
    for (const d of this._disposables) {
      d.dispose();
    }
    this._disposables = [];
  }

  private _getHtmlContent(extensionUri: vscode.Uri): string {
    const webview = this._panel.webview;
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist', 'assets', 'main.js'),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist', 'assets', 'style.css'),
    );

    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${webview.cspSource} 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} data:; font-src ${webview.cspSource};">
  <link rel="stylesheet" href="${styleUri}">
  <title>JoltAPI</title>
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
