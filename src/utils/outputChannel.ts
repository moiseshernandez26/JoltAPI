import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

/**
 * Lazily-created singleton "JoltAPI" Output Channel (View > Output > JoltAPI).
 * `extension.ts` pushes this into `context.subscriptions` on activation so it's disposed
 * with the extension; calling this before activation still works, it just creates the
 * channel on first use.
 */
export function getOutputChannel(): vscode.OutputChannel {
  if (!channel) {
    channel = vscode.window.createOutputChannel('JoltAPI');
  }
  return channel;
}
