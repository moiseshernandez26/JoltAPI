import { getOutputChannel } from './outputChannel';

export function logError(context: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(`[JoltAPI] ${context}: ${message}`);
  if (stack) {console.error(`[JoltAPI] Stack trace:\n${stack}`);}
  getOutputChannel().appendLine(`[Error] ${context}: ${message}`);
}
