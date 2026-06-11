import type { IVariableSet } from '../../models';
import type { HostToWebviewMessage } from '../../models/messages';
import { loadVariables, saveVariables } from '../../services/storageService';
import { logError } from '../../utils/logger';

type PostFn = (message: HostToWebviewMessage) => void;

export async function handleLoadVariables(postMessage: PostFn): Promise<void> {
  try {
    const variables = await loadVariables();
    postMessage({ command: 'variablesLoaded', payload: { variables } });
  } catch (err: unknown) {
    logError('loadVariables failed', err);
    postMessage({ command: 'error', payload: { code: 'UNKNOWN', message: err instanceof Error ? err.message : 'Failed to load variables' } });
  }
}

export async function handleSaveVariables(
  payload: { variables: IVariableSet },
  postMessage: PostFn,
): Promise<void> {
  try {
    await saveVariables(payload.variables);
  } catch (err: unknown) {
    logError('saveVariables failed', err);
    postMessage({ command: 'error', payload: { code: 'UNKNOWN', message: err instanceof Error ? err.message : 'Failed to save variables' } });
  }
}