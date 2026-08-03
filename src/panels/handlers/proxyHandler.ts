import * as vscode from 'vscode';
import { randomUUID } from 'crypto';
import type { IProxyProfile, IProxyProfileSet } from '../../models';
import type { HostToWebviewMessage } from '../../models/messages';
import { loadProxyProfiles, saveProxyProfiles } from '../../services/storageService';
import { logError } from '../../utils/logger';

type PostFn = (message: HostToWebviewMessage) => void;

/** Set once per workspace after the `joltapi.proxy.*` settings have been offered as a profile. */
const SEEDED_KEY = 'joltapi.proxySettingsSeeded';

export async function handleLoadProxies(
  postMessage: PostFn,
  context?: vscode.ExtensionContext,
): Promise<void> {
  try {
    let proxies = await loadProxyProfiles();
    proxies = await seedFromSettings(proxies, context);
    postMessage({ command: 'proxiesLoaded', payload: { proxies } });
  } catch (err: unknown) {
    logError('loadProxies failed', err);
    postMessage({ command: 'error', payload: { code: 'UNKNOWN', message: err instanceof Error ? err.message : 'Failed to load proxies' } });
  }
}

/**
 * Turns the legacy `joltapi.proxy.*` settings into a real saved profile, once.
 *
 * Those settings shipped in v0.1.0 and were read by `handleGetSettings`, but nothing ever
 * consumed the result — configuring them did literally nothing. Rather than silently
 * dropping them (people have them set) they become a visible, editable profile the user can
 * pick, rename, or delete. The `SEEDED_KEY` flag is what makes it one-shot: without it, a
 * deleted seed profile would reappear on the next webview mount.
 */
async function seedFromSettings(
  proxies: IProxyProfileSet,
  context?: vscode.ExtensionContext,
): Promise<IProxyProfileSet> {
  if (!context || context.workspaceState.get<boolean>(SEEDED_KEY)) {return proxies;}

  const config = vscode.workspace.getConfiguration('joltapi');
  const host = config.get<string>('proxy.host', '').trim();
  const port = config.get<number>('proxy.port', 0);
  if (!host || !port) {
    // Nothing worth importing — mark as done so this check stops running every mount.
    await context.workspaceState.update(SEEDED_KEY, true);
    return proxies;
  }

  const alreadyThere = proxies.profiles.some((p) => p.host === host && p.port === port);
  if (alreadyThere) {
    await context.workspaceState.update(SEEDED_KEY, true);
    return proxies;
  }

  const username = config.get<string>('proxy.username', '').trim();
  const seeded: IProxyProfile = {
    id: randomUUID(),
    name: 'Workspace default',
    host,
    port,
    // There is no `joltapi.proxy.password` setting by design — the user fills it in the form.
    ...(username ? { auth: { username, password: '' } } : {}),
  };

  const updated: IProxyProfileSet = { profiles: [...proxies.profiles, seeded] };
  await saveProxyProfiles(updated);
  await context.workspaceState.update(SEEDED_KEY, true);
  console.log('[JoltAPI] Imported joltapi.proxy.* settings into a saved proxy profile.');
  return updated;
}

export async function handleSaveProxies(
  payload: { proxies: IProxyProfileSet },
  postMessage: PostFn,
): Promise<void> {
  try {
    await saveProxyProfiles(payload.proxies);
  } catch (err: unknown) {
    logError('saveProxies failed', err);
    postMessage({ command: 'error', payload: { code: 'UNKNOWN', message: err instanceof Error ? err.message : 'Failed to save proxies' } });
  }
}
